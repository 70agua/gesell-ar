// ============================================================
//  src/lib/cuponerasRegalo.js
//  Cuponeras regalo: plantillas armadas por un socio Plus que sus
//  huéspedes activan con el alias del socio. El costo en créditos
//  se paga una sola vez al armar/modificar la plantilla (Fase 2A/2B
//  del brief) — activaciones y canjes del huésped no cuestan nada más.
// ============================================================

import { supabase } from './supabase';
import { calcularPrecioCupon, CREDITO_TOTAL, descontarCreditos, acreditarTokens } from './cobros';
import { TIPOS_ALOJ } from './datos';

// ─── Costo en créditos de un cupón, según su ahorro declarado ─
export function costoCreditosDePromo(promocion) {
  const precio = calcularPrecioCupon(promocion?.ahorro_estimado || 0);
  return Math.max(1, Math.ceil(precio / CREDITO_TOTAL));
}

// ─── Listado de cuponeras regalo de un socio, con sus cupones ─
export async function getCuponerasRegalo(negocioId) {
  const { data, error } = await supabase
    .from('cuponeras_regalo')
    .select('*, cuponeras_regalo_cupones(*, promociones(id, titulo, badge, imagen_url, ahorro_estimado, negocios(nombre)))')
    .eq('negocio_id', negocioId)
    .order('creado_en', { ascending: false });
  if (error) return [];
  return data;
}

// ─── Crear una cuponera nueva (arranca en borrador) ───────────
export async function crearCuponeraRegalo(negocioId, nombre) {
  return supabase
    .from('cuponeras_regalo')
    .insert({ negocio_id: negocioId, nombre })
    .select()
    .single();
}

export async function renombrarCuponera(cuponeraId, nombre) {
  const { error } = await supabase
    .from('cuponeras_regalo')
    .update({ nombre, actualizado_en: new Date().toISOString() })
    .eq('id', cuponeraId);
  return { error };
}

export async function cambiarEstadoCuponera(cuponeraId, estado) {
  const { error } = await supabase
    .from('cuponeras_regalo')
    .update({ estado, actualizado_en: new Date().toISOString() })
    .eq('id', cuponeraId);
  return { error };
}

export async function toggleModoInteligente(cuponeraId, modoInteligente) {
  const { error } = await supabase
    .from('cuponeras_regalo')
    .update({ modo_inteligente: modoInteligente, actualizado_en: new Date().toISOString() })
    .eq('id', cuponeraId);
  return { error };
}

// Reintegra los créditos de todos los cupones antes de borrar la plantilla —
// borrar una cuponera libera la "capacidad" que tenía asignada.
export async function eliminarCuponeraRegalo(negocioId, cuponeraId) {
  const { data: cupones } = await supabase.from('cuponeras_regalo_cupones').select('costo_creditos').eq('cuponera_regalo_id', cuponeraId);
  const total = (cupones || []).reduce((sum, c) => sum + c.costo_creditos, 0);
  if (total > 0) await acreditarTokens(negocioId, total);

  const { error } = await supabase.from('cuponeras_regalo').delete().eq('id', cuponeraId);
  return { error };
}

// ─── Agregar un cupón: debita créditos del socio y lo inserta ─
export async function agregarCupon(negocioId, cuponeraId, promocion, ordenActual = 0) {
  const costo = costoCreditosDePromo(promocion);
  const debitado = await descontarCreditos(negocioId, costo);
  if (!debitado) return { error: 'No tenés créditos suficientes' };

  const { data, error } = await supabase
    .from('cuponeras_regalo_cupones')
    .insert({ cuponera_regalo_id: cuponeraId, promocion_id: promocion.id, costo_creditos: costo, orden: ordenActual })
    .select()
    .single();

  if (error) {
    // no se pudo insertar (ej: ya estaba agregado) → devolver los créditos debitados
    await acreditarTokens(negocioId, costo);
    return { error: error.message };
  }

  await recalcularCostoCache(cuponeraId);
  return { data };
}

// ─── Quitar un cupón: devuelve créditos al socio ──────────────
export async function quitarCupon(negocioId, cuponeraCuponId) {
  const { data: fila } = await supabase
    .from('cuponeras_regalo_cupones')
    .select('id, cuponera_regalo_id, costo_creditos')
    .eq('id', cuponeraCuponId)
    .single();
  if (!fila) return { error: 'Cupón no encontrado' };

  const { error } = await supabase.from('cuponeras_regalo_cupones').delete().eq('id', cuponeraCuponId);
  if (error) return { error: error.message };

  await acreditarTokens(negocioId, fila.costo_creditos);
  await recalcularCostoCache(fila.cuponera_regalo_id);
  return { error: null };
}

async function recalcularCostoCache(cuponeraId) {
  const { data } = await supabase.from('cuponeras_regalo_cupones').select('costo_creditos').eq('cuponera_regalo_id', cuponeraId);
  const total = (data || []).reduce((sum, c) => sum + c.costo_creditos, 0);
  await supabase.from('cuponeras_regalo').update({ costo_creditos: total }).eq('id', cuponeraId);
}

// ─── Buscador de cupones disponibles para el constructor ──────
export async function buscarPromosDisponibles({ categoria, localidad, texto } = {}) {
  let query = supabase
    .from('promociones')
    .select('id, titulo, badge, imagen_url, ahorro_estimado, negocio_id, negocios(nombre, tipo, categoria, localidad, plan)')
    .eq('aprobada', true)
    .eq('activa', true)
    .limit(40);

  if (texto) query = query.ilike('titulo', `%${texto}%`);

  const { data, error } = await query;
  if (error) return [];

  // categoria/localidad viven en negocios — se filtran en el cliente tras el join.
  // categoria es un string con hasta 2 valores unidos ("Restaurantes / Bares"), por
  // eso se compara con includes en vez de igualdad exacta.
  return (data || []).filter(p => {
    if (categoria && !(p.negocios?.categoria || '').includes(categoria)) return false;
    if (localidad && p.negocios?.localidad !== localidad) return false;
    return true;
  });
}

// ─── Sugerencia automática de cupones para armar la cuponera ──
// Nunca sugiere cupones de alojamientos (no tiene sentido que un
// alojamiento regale la estadía de otro) y prioriza ~70% socios Plus
// para fortalecer a quienes pagan el abono fijo.
export async function sugerirCupones(localidad, { excluirIds = [], cantidad = 8 } = {}) {
  const candidatos = await buscarPromosDisponibles({ localidad });
  const disponibles = candidatos.filter(p => !TIPOS_ALOJ.has(p.negocios?.tipo) && !excluirIds.includes(p.id));

  const plus  = disponibles.filter(p => p.negocios?.plan === 'plus');
  const free  = disponibles.filter(p => p.negocios?.plan !== 'plus');
  const metaPlus = Math.round(cantidad * 0.7);

  const elegidos = [
    ...mezclar(plus).slice(0, metaPlus),
    ...mezclar(free).slice(0, cantidad - metaPlus),
  ];
  // Si un grupo no alcanza la cuota, completar con el otro
  const faltan = cantidad - elegidos.length;
  if (faltan > 0) {
    const usados = new Set(elegidos.map(p => p.id));
    const resto = mezclar(disponibles.filter(p => !usados.has(p.id))).slice(0, faltan);
    elegidos.push(...resto);
  }

  return mezclar(elegidos);
}

function mezclar(arr) {
  const copia = [...arr];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
