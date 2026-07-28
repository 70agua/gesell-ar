// ============================================================
//  src/lib/pases.js
//  Cuponera Gesell — lógica de negocio del Pase (Brief 1).
//
//  Naming genérico: el producto es un `pase` multi-destino. El
//  destino ('gesell') es SIEMPRE un parámetro de dato, nunca se
//  hardcodea la lógica a un destino puntual.
//
//  Capas (derivadas en vivo del ahorro declarado — no hay columna
//  de "tramo", la comisión se calcula en cobros.js):
//    · base    = comisión 25% / 20%  → ahorro declarado <= $15.000
//    · premium = comisión 15/10/7    → ahorro declarado >  $15.000
//  Ambas: Salidas + Aventura & Relax, uso libre durante los N días.
//
//  Aparte va el DESCUENTO DE ESTADÍA (alojamiento): un uso por pase, y
//  utilizable con el pase todavía sin activar, para que el turista reserve
//  con descuento antes de viajar sin quemar los días. Los pases-regalo de
//  hotelero no lo incluyen.
//
//  Pagos: MOCK (mismo patrón que el resto de la app). Las refs de
//  MercadoPago se guardan como texto libre; no hay webhook real.
// ============================================================

import { supabase } from './supabase';
import { normalizePromo } from './datos';
import { acreditarPuntos } from './gamificacion';

// ─── Parámetros de negocio ────────────────────────────────────
export const DESTINO_DEFAULT       = 'gesell';
export const AHORRO_BASE_MAX       = 15000;   // frontera base/premium
export const LIMITE_REGALO_FREE    = 10;      // pases-regalo/mes (Free)
export const UPGRADE_PACK_MIN      = 10;      // compra mayorista mínima
export const UPGRADE_PACK_PRECIO   = 6000;    // $ por upgrade (50% de $12.000)
export const VENTANA_ACTIVACION_MESES = 12;   // tope para activar un pase comprado

// Puntos bajo pase (no aplica la tabla por tramo). Solo el pagador gana.
export const PUNTOS_PASE = { compra: 500, upgrade: 300, canje: 100 };

const TIPOS_ALOJAMIENTO = new Set([
  'alojamiento', 'Hotel', 'Cabaña', 'Departamento',
  'Domo', 'Dormi', 'Carpa', 'Casa', 'Hostel', 'Glamping',
]);

const esAlojamiento = (promo) => TIPOS_ALOJAMIENTO.has(promo.negocioTipo || '');

// El pase tiene DOS mitades, con relojes distintos:
//   · estadía  = alojamiento. UN uso por pase, y se puede usar con el pase
//                todavía sin activar → el turista reserva con descuento
//                meses antes sin quemar los días.
//   · libres   = Salidas + Aventura & Relax. Uso libre (1 por comercio)
//                durante los N días, desde que activa el pase.
export const esOfertaEstadia = (promo) => esAlojamiento(promo);
export const esOfertaLibre   = (promo) => !esAlojamiento(promo);

// Todo el catálogo entra al pase. Único lugar donde vive la regla — la
// consume también usePaseStats para el catálogo vivo del hero.
export const esCategoriaPase = () => true;

const esBase        = (promo) => (promo.ahorroEstimado || 0) <= AHORRO_BASE_MAX;
const esPremium     = (promo) => (promo.ahorroEstimado || 0) >  AHORRO_BASE_MAX;

// Flag de upsell (Brief 6): true si la oferta entra "gratis" con el pase.
// Alojamiento entra siempre (vía descuento de estadía); el resto, si está
// en la capa base. Lo consume el detalle de oferta: "esto lo tenías incluido".
export function incluidaEnPase(promo) {
  return esAlojamiento(promo) || esBase(promo);
}

// ═══════════════════════════════════════════════════════════
//  Catálogo del pase
// ═══════════════════════════════════════════════════════════
// Todos los pases vigentes de un destino, del más corto al más largo. Hoy son
// dos duraciones (3 y 7 días); el hero y el checkout leen los precios de acá,
// así no quedan hardcodeados en la UI.
export async function getPasesDestino(destino = DESTINO_DEFAULT) {
  const { data } = await supabase
    .from('pases')
    .select('*')
    .eq('destino_slug', destino)
    .eq('activo', true)
    .order('duracion_dias', { ascending: true });
  return data || [];
}

// Un pase puntual. Sin `dias` devuelve el más largo, que es el histórico.
export async function getPaseDestino(destino = DESTINO_DEFAULT, dias = null) {
  const pases = await getPasesDestino(destino);
  if (!pases.length) return null;
  if (dias == null) return pases[pases.length - 1];
  return pases.find(p => p.duracion_dias === dias) || null;
}

// ═══════════════════════════════════════════════════════════
//  Compra sin cuenta (MOCK de pago)
//  El turista paga dejando mail y teléfono; el alta como turista viene
//  después. La compra queda en `pase_compras` hasta que se registre.
// ═══════════════════════════════════════════════════════════
export async function comprarPaseAnonimo({ paseId, precio, email, telefono = null, nombre = null, apellido = null, pagoRef = null }) {
  if (!paseId || !email) return { ok: false, error: 'datos_incompletos' };
  const { data, error } = await supabase
    .from('pase_compras')
    .insert({
      pase_id:  paseId,
      email:    email.trim().toLowerCase(),
      telefono: telefono?.trim() || null,
      // Solo vienen cuando el comprador todavía no tiene cuenta; el que ya la
      // tiene los trae en su perfil.
      nombre:   nombre?.trim() || null,
      apellido: apellido?.trim() || null,
      precio,
      // Sin pasarela real: la referencia es un mock, igual que el resto de la app.
      pago_ref: pagoRef || `mock-${Date.now()}`,
      estado:   'pagado',
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, compra: data };
}

// Al terminar el registro, las compras hechas con ese mail se convierten en
// pases del usuario. Es idempotente: una compra ya vinculada no se toca.
export async function vincularComprasPase(userId, email) {
  if (!userId || !email) return { ok: false, vinculadas: 0 };

  const { data: compras } = await supabase
    .from('pase_compras')
    .select('*')
    .eq('estado', 'pagado')
    .is('user_id', null)
    .ilike('email', email.trim());

  if (!compras?.length) return { ok: true, vinculadas: 0 };

  let vinculadas = 0;
  for (const compra of compras) {
    const { data: up, error } = await supabase
      .from('usuario_pases')
      .insert({
        pase_id:       compra.pase_id,
        user_id:       userId,
        tipo:          'comprado',
        estado:        'pendiente',
        pago_ref_pase: compra.pago_ref,
      })
      .select()
      .single();
    if (error) continue;

    await supabase
      .from('pase_compras')
      .update({ estado: 'vinculada', user_id: userId, vinculada_en: new Date().toISOString() })
      .eq('id', compra.id);

    await acreditarPuntos(userId, PUNTOS_PASE.compra, 'pase_compra', 'Compra del Pase', up.id);
    vinculadas += 1;
  }
  return { ok: true, vinculadas };
}

// ═══════════════════════════════════════════════════════════
//  Capa base — query dinámica en vivo (refleja altas/bajas al toque)
// ═══════════════════════════════════════════════════════════
export async function getOfertasBase() {
  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, categoria, localidad, zona, foto_perfil, imagen_url, activo)')
    .eq('activa', true)
    .eq('aprobada', true)
    .order('creado_en', { ascending: false });

  return (data || [])
    .filter(p => p.negocios?.activo !== false)
    .map(normalizePromo)
    .filter(p => !esAlojamiento(p) && esBase(p));
}

// ═══════════════════════════════════════════════════════════
//  Capa premium — mismas categorías, tramos 15/10/7, con cupo
//  mensual disponible por socio (usos del mes vía RPC agregada).
// ═══════════════════════════════════════════════════════════
export async function getOfertasPremium({ soloConCupo = true } = {}) {
  const [{ data: promos }, { data: usos }] = await Promise.all([
    supabase
      .from('promociones')
      .select('*, negocios(nombre, tipo, categoria, localidad, zona, foto_perfil, imagen_url, activo)')
      .eq('activa', true)
      .eq('aprobada', true)
      .order('creado_en', { ascending: false }),
    supabase.rpc('pase_premium_usos_mes'),
  ]);

  const usadosPorPromo = new Map((usos || []).map(u => [u.promocion_id, Number(u.usados) || 0]));

  return (promos || [])
    .filter(p => p.negocios?.activo !== false)
    .map(p => {
      const norm  = normalizePromo(p);
      const cupo  = p.cupo_mensual_premium;
      const usados = usadosPorPromo.get(p.id) || 0;
      return {
        ...norm,
        cupoMensualPremium: cupo,
        cupoRestante: cupo != null ? Math.max(0, cupo - usados) : null,
      };
    })
    .filter(p => !esAlojamiento(p) && esPremium(p))
    .filter(p => (p.cupoMensualPremium || 0) > 0)          // el socio habilitó premium
    .filter(p => !soloConCupo || (p.cupoRestante || 0) > 0);
}

// ═══════════════════════════════════════════════════════════
//  Descuento de estadía — el alojamiento del pase.
//  Sin capas base/premium: cualquier oferta de alojamiento vigente,
//  una sola vez por pase.
// ═══════════════════════════════════════════════════════════
export async function getOfertasEstadia() {
  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, categoria, localidad, zona, foto_perfil, imagen_url, activo)')
    .eq('activa', true)
    .eq('aprobada', true)
    .order('creado_en', { ascending: false });

  return (data || [])
    .filter(p => p.negocios?.activo !== false)
    .map(normalizePromo)
    .filter(esOfertaEstadia);
}

// Estado del descuento de estadía de un pase, para la UI.
//   disponible → se puede usar ahora (incluso con el pase sin activar)
export function estadoEstadia(usuarioPase) {
  if (!usuarioPase)                     return { disponible: false, motivo: 'sin_pase' };
  if (!usuarioPase.incluye_estadia)     return { disponible: false, motivo: 'no_incluida' };
  if (usuarioPase.estadia_usada_el)     return { disponible: false, motivo: 'ya_usada', usadaEl: usuarioPase.estadia_usada_el };
  if (usuarioPase.estado === 'vencido') return { disponible: false, motivo: 'pase_vencido' };
  return { disponible: true, motivo: null };
}

// ═══════════════════════════════════════════════════════════
//  Pases del usuario
// ═══════════════════════════════════════════════════════════
export async function getMisPases(userId) {
  if (!userId) return [];
  const { data } = await supabase
    .from('usuario_pases')
    .select('*, pases(*)')
    .eq('user_id', userId)
    .order('creado_en', { ascending: false });
  return data || [];
}

// ═══════════════════════════════════════════════════════════
//  Compra B2C (MOCK) → pase 'pendiente' + 500 puntos al pagador
// ═══════════════════════════════════════════════════════════
export async function comprarPase({ userId, destino = DESTINO_DEFAULT, pagoRef = null }) {
  if (!userId) return { ok: false, error: 'no_auth' };
  const pase = await getPaseDestino(destino);
  if (!pase) return { ok: false, error: 'pase_inexistente' };

  const { data, error } = await supabase
    .from('usuario_pases')
    .insert({
      pase_id:       pase.id,
      user_id:       userId,
      tipo:          'comprado',
      estado:        'pendiente',
      pago_ref_pase: pagoRef,
    })
    .select()
    .single();
  if (error) return { ok: false, error: error.message };

  await acreditarPuntos(userId, PUNTOS_PASE.compra, 'pase_compra', 'Compra del Pase', data.id);
  return { ok: true, usuarioPase: data };
}

// ═══════════════════════════════════════════════════════════
//  Activación de un pase comprado (1 tap)
//  Valida la ventana de 12 meses; si expiró → vencido + devolución.
// ═══════════════════════════════════════════════════════════
export async function activarPase(usuarioPaseId) {
  const { data: up, error } = await supabase
    .from('usuario_pases')
    .select('*, pases(*)')
    .eq('id', usuarioPaseId)
    .single();
  if (error || !up) return { ok: false, error: 'pase_no_encontrado' };
  if (up.estado === 'activo') return { ok: true, usuarioPase: up };
  if (up.estado !== 'pendiente') return { ok: false, error: 'estado_invalido' };

  const compra = new Date(up.fecha_compra).getTime();
  const limite = compra + VENTANA_ACTIVACION_MESES * 30 * 24 * 3600 * 1000;
  if (Date.now() > limite) {
    await supabase.from('usuario_pases').update({ estado: 'vencido' }).eq('id', usuarioPaseId);
    // Devolución automática del precio en puntos (solo pases comprados)
    if (up.tipo === 'comprado' && up.pases?.precio_final) {
      await acreditarPuntos(up.user_id, Math.round(up.pases.precio_final),
        'pase_devolucion', 'Devolución de Pase no activado', usuarioPaseId);
    }
    return { ok: false, error: 'ventana_vencida' };
  }

  const dias   = up.pases?.duracion_dias || 7;
  const venceEl = new Date(Date.now() + dias * 24 * 3600 * 1000).toISOString();
  const { data, error: e2 } = await supabase
    .from('usuario_pases')
    .update({ estado: 'activo', fecha_activacion: new Date().toISOString(), vence_el: venceEl })
    .eq('id', usuarioPaseId)
    .select('*, pases(*)')
    .single();
  if (e2) return { ok: false, error: e2.message };
  return { ok: true, usuarioPase: data };
}

// ═══════════════════════════════════════════════════════════
//  Upgrade B2C (MOCK): solo sobre pase 'regalo' activo sin upgrade.
//  +300 puntos al pagador (turista). Habilita las 2 elecciones.
// ═══════════════════════════════════════════════════════════
export async function upgradePaseB2C({ usuarioPaseId, userId, pagoRef = null }) {
  const { data: up } = await supabase
    .from('usuario_pases').select('*').eq('id', usuarioPaseId).single();
  if (!up) return { ok: false, error: 'pase_no_encontrado' };
  if (up.tipo !== 'regalo')       return { ok: false, error: 'no_es_regalo' };
  if (up.upgrade_aplicado)        return { ok: false, error: 'ya_upgradeado' };
  if (up.estado !== 'activo')     return { ok: false, error: 'pase_no_activo' };

  const { error } = await supabase
    .from('usuario_pases')
    .update({ upgrade_aplicado: true, pago_ref_upgrade: pagoRef })
    .eq('id', usuarioPaseId);
  if (error) return { ok: false, error: error.message };

  await acreditarPuntos(userId, PUNTOS_PASE.upgrade, 'pase_upgrade', 'Upgrade del Pase', usuarioPaseId);
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════
//  Activación de pase-regalo (turista abre link/QR del hotel).
//  Vía RPC: valida cupo mensual Free (10) atómicamente. Sin puntos.
// ═══════════════════════════════════════════════════════════
export async function activarRegalo({ destino = DESTINO_DEFAULT, origenNegocioId }) {
  const { data, error } = await supabase.rpc('activar_regalo_pase', {
    p_destino: destino,
    p_origen_negocio: origenNegocioId,
  });
  if (error) return { ok: false, error: error.message };
  return data; // { ok, usuario_pase_id } | { ok:false, error }
}

// ═══════════════════════════════════════════════════════════
//  Elección premium (máx = pase.elecciones_premium). Vía RPC
//  SECURITY DEFINER: valida régimen, tope, elegibilidad y cupo.
// ═══════════════════════════════════════════════════════════
export async function elegirPremium(usuarioPaseId, promocionId) {
  const { data, error } = await supabase.rpc('elegir_premium_pase', {
    p_usuario_pase: usuarioPaseId,
    p_promocion:    promocionId,
  });
  if (error) return { ok: false, error: error.message };
  return data; // { ok } | { ok:false, error }
}

export async function getElecciones(usuarioPaseId) {
  const { data } = await supabase
    .from('pase_elecciones')
    .select('*, promociones(*, negocios(nombre, tipo, localidad, foto_perfil, imagen_url, activo))')
    .eq('usuario_pase_id', usuarioPaseId);
  return (data || []).map(e => ({
    ...e,
    promo: e.promociones ? normalizePromo(e.promociones) : null,
  }));
}

// ═══════════════════════════════════════════════════════════
//  Canje (flujo QR en el comercio). 1 por comercio por pase.
//  Elegibilidad: base por tramo/categoría, o premium ya elegida.
//  Snapshot de ahorro. +100 puntos si comprado o upgradeado.
// ═══════════════════════════════════════════════════════════
export async function canjearPase({ usuarioPaseId, userId, promocionId }) {
  const { data: up } = await supabase
    .from('usuario_pases').select('*').eq('id', usuarioPaseId).single();
  if (!up) return { ok: false, error: 'pase_no_encontrado' };

  // Alojamiento va por la ruta de estadía: no exige el pase activado ni
  // consume días. Se resuelve antes del chequeo de estado.
  const { data: rawAloj } = await supabase
    .from('promociones')
    .select('id, negocios(tipo)')
    .eq('id', promocionId)
    .single();
  if (TIPOS_ALOJAMIENTO.has(rawAloj?.negocios?.tipo || '')) {
    return canjearEstadia({ usuarioPaseId, userId, promocionId, usuarioPase: up });
  }

  if (up.estado !== 'activo') return { ok: false, error: 'pase_no_activo' };
  if (up.vence_el && new Date(up.vence_el).getTime() < Date.now()) {
    await supabase.from('usuario_pases').update({ estado: 'vencido' }).eq('id', usuarioPaseId);
    return { ok: false, error: 'pase_vencido' };
  }

  const { data: rawPromo } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, localidad, zona, foto_perfil, imagen_url, activo)')
    .eq('id', promocionId)
    .single();
  if (!rawPromo || rawPromo.activa !== true) return { ok: false, error: 'promo_no_disponible' };
  const promo = normalizePromo(rawPromo);

  // Elegibilidad: base (tramo 25/20) directa; premium (15/10/7) sólo si fue elegida
  let elegible = esBase(promo);
  if (!elegible && esPremium(promo)) {
    const { data: el } = await supabase
      .from('pase_elecciones')
      .select('id')
      .eq('usuario_pase_id', usuarioPaseId)
      .eq('promocion_id', promocionId)
      .maybeSingle();
    elegible = !!el;
  }
  if (!elegible) return { ok: false, error: 'no_elegible' };

  const ahorro = promo.ahorroEstimado || 0;
  const { error } = await supabase.from('pase_canjes').insert({
    usuario_pase_id: usuarioPaseId,
    promocion_id:    promocionId,
    negocio_id:      promo.negocioId,
    ahorro_monto:    ahorro,
  });
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'ya_canjeado_comercio' };
    return { ok: false, error: error.message };
  }

  // Puntos: solo pase comprado o upgradeado. Regalo sin upgrade = 0.
  if (up.tipo === 'comprado' || up.upgrade_aplicado) {
    await acreditarPuntos(userId, PUNTOS_PASE.canje, 'pase_canje', 'Canje con el Pase', usuarioPaseId);
  }
  return { ok: true, ahorro };
}

// ═══════════════════════════════════════════════════════════
//  Canje del descuento de estadía (alojamiento).
//  Es el que se puede usar ANTES de viajar: acepta el pase en
//  'pendiente' (dentro de la ventana de activación) y no toca
//  fecha_activacion ni vence_el — los días del pase no arrancan acá.
// ═══════════════════════════════════════════════════════════
export async function canjearEstadia({ usuarioPaseId, userId, promocionId, usuarioPase = null }) {
  const up = usuarioPase || (await supabase
    .from('usuario_pases').select('*').eq('id', usuarioPaseId).single()).data;
  if (!up) return { ok: false, error: 'pase_no_encontrado' };
  // Los pases-regalo del hotelero vienen sin estadía (no financia la
  // reserva de la competencia). Legacy sin la columna → se asume incluida.
  if (up.incluye_estadia === false) return { ok: false, error: 'estadia_no_incluida' };
  if (up.estadia_usada_el) return { ok: false, error: 'estadia_ya_usada' };

  // Pendiente: vale mientras no se pase la ventana de 12 meses desde la
  // compra. Activo: vale mientras el pase no haya vencido.
  if (up.estado === 'pendiente') {
    const limite = new Date(up.fecha_compra).getTime() + VENTANA_ACTIVACION_MESES * 30 * 24 * 3600 * 1000;
    if (Date.now() > limite) return { ok: false, error: 'ventana_vencida' };
  } else if (up.estado === 'activo') {
    if (up.vence_el && new Date(up.vence_el).getTime() < Date.now()) {
      await supabase.from('usuario_pases').update({ estado: 'vencido' }).eq('id', usuarioPaseId);
      return { ok: false, error: 'pase_vencido' };
    }
  } else {
    return { ok: false, error: 'pase_no_activo' };
  }

  const { data: rawPromo } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, localidad, zona, foto_perfil, imagen_url, activo)')
    .eq('id', promocionId)
    .single();
  if (!rawPromo || rawPromo.activa !== true) return { ok: false, error: 'promo_no_disponible' };
  const promo = normalizePromo(rawPromo);
  if (!esOfertaEstadia(promo)) return { ok: false, error: 'no_es_estadia' };

  const ahorro = promo.ahorroEstimado || 0;
  const { error } = await supabase.from('pase_canjes').insert({
    usuario_pase_id: usuarioPaseId,
    promocion_id:    promocionId,
    negocio_id:      promo.negocioId,
    ahorro_monto:    ahorro,
  });
  if (error) {
    if (error.code === '23505') return { ok: false, error: 'ya_canjeado_comercio' };
    return { ok: false, error: error.message };
  }

  const { error: e2 } = await supabase
    .from('usuario_pases')
    .update({ estadia_usada_el: new Date().toISOString(), estadia_promocion_id: promocionId })
    .eq('id', usuarioPaseId);
  if (e2) return { ok: false, error: e2.message };

  if (up.tipo === 'comprado' || up.upgrade_aplicado) {
    await acreditarPuntos(userId, PUNTOS_PASE.canje, 'pase_canje', 'Descuento de estadía', usuarioPaseId);
  }
  return { ok: true, ahorro, estadia: true };
}

export async function getCanjes(usuarioPaseId) {
  const { data } = await supabase
    .from('pase_canjes')
    .select('*, promociones(titulo), negocios(nombre)')
    .eq('usuario_pase_id', usuarioPaseId)
    .order('canjeado_el', { ascending: false });
  return data || [];
}

// Contador de ahorro del viaje ("Ahorraste $X este viaje").
export async function getAhorroPase(usuarioPaseId) {
  const { data } = await supabase
    .from('pase_canjes')
    .select('ahorro_monto')
    .eq('usuario_pase_id', usuarioPaseId);
  return (data || []).reduce((acc, c) => acc + (Number(c.ahorro_monto) || 0), 0);
}

// ═══════════════════════════════════════════════════════════
//  Cupos de regalo del socio (para el panel del negocio)
// ═══════════════════════════════════════════════════════════
export async function getCupoRegaloMes(negocioId) {
  const mes = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
  const { data } = await supabase
    .from('pase_cupos_regalo')
    .select('usados')
    .eq('negocio_id', negocioId)
    .eq('mes', mes)
    .maybeSingle();
  const usados = data?.usados || 0;
  return { mes, usados, limiteFree: LIMITE_REGALO_FREE, restanteFree: Math.max(0, LIMITE_REGALO_FREE - usados) };
}

// ═══════════════════════════════════════════════════════════
//  Packs de upgrades mayoristas (hotel Plus)
// ═══════════════════════════════════════════════════════════
export async function getSaldoPacks(negocioId) {
  const { data } = await supabase
    .from('negocio_upgrade_packs')
    .select('*')
    .eq('negocio_id', negocioId)
    .maybeSingle();
  const comprados = data?.comprados || 0;
  const usados    = data?.usados || 0;
  return { comprados, usados, saldo: comprados - usados };
}

export async function comprarUpgradePack({ negocioId, cantidad, pagoRef = null }) {
  if (!cantidad || cantidad < UPGRADE_PACK_MIN) {
    return { ok: false, error: `minimo_${UPGRADE_PACK_MIN}` };
  }
  // Solo Plus
  const { data: negocio } = await supabase
    .from('negocios').select('plan').eq('id', negocioId).single();
  if (negocio?.plan !== 'plus') return { ok: false, error: 'requiere_plus' };

  const { data: actual } = await supabase
    .from('negocio_upgrade_packs').select('*').eq('negocio_id', negocioId).maybeSingle();

  if (actual) {
    const { error } = await supabase
      .from('negocio_upgrade_packs')
      .update({ comprados: actual.comprados + cantidad, pago_ref: pagoRef, updated_at: new Date().toISOString() })
      .eq('negocio_id', negocioId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from('negocio_upgrade_packs')
      .insert({ negocio_id: negocioId, comprados: cantidad, usados: 0, pago_ref: pagoRef });
    if (error) return { ok: false, error: error.message };
  }
  return { ok: true, ...(await getSaldoPacks(negocioId)) };
}

// El hotel asigna un upgrade de su saldo a un pase-regalo propio.
export async function asignarUpgradePack({ usuarioPaseId, negocioId }) {
  const saldo = await getSaldoPacks(negocioId);
  if (saldo.saldo <= 0) return { ok: false, error: 'sin_saldo' };

  const { data: up } = await supabase
    .from('usuario_pases').select('*').eq('id', usuarioPaseId).single();
  if (!up) return { ok: false, error: 'pase_no_encontrado' };
  if (up.origen_negocio_id !== negocioId) return { ok: false, error: 'no_es_tu_regalo' };
  if (up.tipo !== 'regalo')  return { ok: false, error: 'no_es_regalo' };
  if (up.upgrade_aplicado)   return { ok: false, error: 'ya_upgradeado' };

  const { error } = await supabase
    .from('usuario_pases')
    .update({ upgrade_aplicado: true, pago_ref_upgrade: `pack:${negocioId}` })
    .eq('id', usuarioPaseId);
  if (error) return { ok: false, error: error.message };

  await supabase
    .from('negocio_upgrade_packs')
    .update({ usados: saldo.usados + 1, updated_at: new Date().toISOString() })
    .eq('negocio_id', negocioId);
  // Sin puntos: el pagador es el hotel, no el turista (los puntos son moneda del turista).
  return { ok: true };
}
