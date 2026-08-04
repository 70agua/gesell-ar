// ============================================================
//  src/lib/cupopacks.js
//  Cupopacks = selecciones curadas de cupones que arma el superadmin.
//
//  Dos usos, y conviene tener clara la diferencia porque el mismo Cupopack
//  sirve para los dos según quién lo mire:
//
//   1. SIN Pase — es un lote de cupones sueltos que se compran juntos. Precio,
//      checkout, todo lo de siempre.
//
//   2. CON Pase activo — es una PLANTILLA DE ELECCIONES (§5 del reset): sus
//      cupones premium llenan de un tap los slots que el turista ya pagó. Ahí
//      no hay precio ni compra: elegir un premium con el Pase es gratis, el
//      Pase ya está pago. Y es reversible hasta el canje.
//
//  Lo de §2 es lo que vive de la mitad para abajo de este archivo.
// ============================================================

import { supabase } from './supabase';
import { elegirPremium, quitarPremium, nivelEnPase } from './pases';

// Devuelve todos los Cupopacks con los ids de sus cupones.
export async function listarCupopacks() {
  const { data, error } = await supabase
    .from('cuponeras_locales')
    .select('*, cuponeras_locales_cupones(promocion_id)')
    .order('creado_en', { ascending: false });
  if (error) return { data: [], error };
  const filas = (data || []).map(c => ({
    ...c,
    promocionIds: (c.cuponeras_locales_cupones || []).map(x => x.promocion_id),
  }));
  return { data: filas, error: null };
}

// `familia` es la categoría con la que se filtra en "Packs todo incluido"
// (ids en lib/familiasPack.js). Se puede fijar desde el alta: antes sólo se
// podía después, entrando a editar, y por eso quedaban todas sin categoría.
export async function crearCupopack({ nombre, descripcion = null, badge = null, imagen_url = null, beneficio_adicional = null, beneficio_icono = null, beneficio_tipo = null, beneficio_valor = null, localidad = null, familia = null, estado = 'activa' }) {
  return supabase.from('cuponeras_locales').insert({ nombre, descripcion, badge, imagen_url, beneficio_adicional, beneficio_icono, beneficio_tipo, beneficio_valor, localidad, familia, estado }).select().single();
}

export async function actualizarCupopack(id, campos) {
  return supabase.from('cuponeras_locales').update(campos).eq('id', id).select().single();
}

export async function eliminarCupopack(id) {
  return supabase.from('cuponeras_locales').delete().eq('id', id);
}

// Agrega/quita un cupón del Cupopack.
// Ojo: las columnas y tablas siguen con el nombre viejo (`cuponeras_locales*`,
// `cuponera_local_id`) — la Fase 2 renombra vocabulario, no el esquema.
export async function agregarCuponASet(cupopackId, promocionId) {
  return supabase.from('cuponeras_locales_cupones').insert({ cuponera_local_id: cupopackId, promocion_id: promocionId });
}

export async function quitarCuponDeSet(cupopackId, promocionId) {
  return supabase.from('cuponeras_locales_cupones').delete()
    .eq('cuponera_local_id', cupopackId).eq('promocion_id', promocionId);
}

// ════════════════════════════════════════════════════════════
//  §plantilla · El Cupopack como llenado de slots del Pase
// ════════════════════════════════════════════════════════════

// Los cupones del Cupopack que pueden ocupar un slot. Sólo premium: los
// regulares ya vienen ilimitados con el Pase, así que meterlos en un slot no
// le daría al turista nada que no tenga (§5 de 3-cupopacks.md).
//
// Un Cupopack puede tener de los dos —para el que no tiene Pase son cupones
// comprables igual—, así que esto FILTRA, no valida. Un pack sin premium
// simplemente no se ofrece para llenar slots.
export function premiumDeCupopack(cupones = []) {
  return (cupones || []).filter(c =>
    nivelEnPase(c) === 'premium'
    // Las de fecha a confirmar quedan afuera: no se eligen, se PIDEN, y la RPC
    // las rechaza con `requiere_solicitud`. Un Cupopack es un tap; una
    // solicitud es una conversación de 72h con el socio. No entran en el
    // mismo gesto, y meterlas haría fallar el pack entero por una.
    && !c.requiereFecha);
}

// Cuántos de este Cupopack entrarían en los slots que quedan libres, y cuáles
// se quedan afuera. Se corta por `libres` y no se ofrece de a partes sueltas:
// "3 de los 4" es una oferta honesta, "elegí vos cuáles 3" ya es la pantalla
// de elección manual, que existe aparte.
export function encajeEnPase(cupones, libres) {
  const premium = premiumDeCupopack(cupones);
  const entran  = premium.slice(0, Math.max(0, libres));
  return { premium, entran, sobran: premium.length - entran.length };
}

const ERRORES = {
  no_auth:             'Iniciá sesión para usar tu Pase.',
  pase_no_encontrado:  'No encontramos tu Pase.',
  pase_no_activo:      'Activá tu Pase para elegir beneficios PREMIUM.',
  sin_premium:         'Tu Pase de regalo no incluye beneficios PREMIUM.',
  max_elecciones:      'Ya no te quedan beneficios PREMIUM disponibles.',
  promo_no_disponible: 'Esta oferta dejó de estar disponible.',
  no_es_premium:       'Esta oferta ya viene incluida: no gasta elección.',
  sin_cupo:            'El comercio no tiene lugar este mes.',
  cupo_agotado:        'El comercio agotó su lugar de este mes.',
  ya_elegida:          'Ya la tenías elegida.',
  requiere_solicitud:  'Esta oferta necesita que pidas fecha desde tu Pase.',
};
export const textoErrorEleccion = (e) => ERRORES[e] || 'No pudimos elegir este beneficio.';

// Aplica el Cupopack: ocupa un slot por cada premium que entre.
//
// Va de a una y no en lote porque no hay RPC que tome varias: `elegir_premium_pase`
// valida por oferta (tope del pase, cupo mensual del socio, duplicado) y
// devuelve su propio motivo. Eso NO es atómico, y es a propósito: si el tercer
// cupón se quedó sin cupo del comercio, los dos primeros son elecciones
// perfectamente válidas y tirarlas atrás no le sirve a nadie. Por eso devuelve
// las dos listas y la UI cuenta lo que pasó de verdad.
export async function aplicarCupopack(usuarioPaseId, cupones, libres) {
  const { entran, sobran } = encajeEnPase(cupones, libres);
  const aplicados = [];
  const fallidos  = [];

  for (const cupon of entran) {
    const r = await elegirPremium(usuarioPaseId, cupon.id);
    // `ya_elegida` no es una falla: el slot quedó como el turista quería.
    if (r?.ok || r?.error === 'ya_elegida') aplicados.push(cupon);
    else fallidos.push({ cupon, error: r?.error, texto: textoErrorEleccion(r?.error) });
  }
  return { aplicados, fallidos, sobran };
}

// Deshace el Cupopack. Sólo suelta lo que sigue elegido —si el turista ya
// cambió alguna a mano, esa no es del pack y no se toca—, y lo ya canjeado lo
// frena la propia RPC, que es donde tiene que frenarse.
export async function deshacerCupopack(usuarioPaseId, cupones, elegidasIds = []) {
  const elegidas = new Set(elegidasIds);
  const premium  = premiumDeCupopack(cupones).filter(c => elegidas.has(c.id));
  const quitados = [];
  const fallidos = [];

  for (const cupon of premium) {
    const r = await quitarPremium(usuarioPaseId, cupon.id);
    if (r?.ok) quitados.push(cupon);
    else fallidos.push({ cupon, error: r?.error });
  }
  return { quitados, fallidos };
}

// ¿Está este Cupopack puesto en el Pase? Sirve para decidir si el botón ofrece
// aplicarlo o deshacerlo. Alcanza con que TODOS sus premium que entran estén
// elegidos: si el turista sacó uno a mano, el pack dejó de estar puesto entero
// y vuelve a ofrecerse completar.
export function cupopackAplicado(cupones, elegidasIds = [], libres = Infinity) {
  const { entran } = encajeEnPase(cupones, libres);
  if (!entran.length) return false;
  const elegidas = new Set(elegidasIds);
  return entran.every(c => elegidas.has(c.id));
}

// Los premium del Cupopack que NO entran en los slots libres. §3 del doc: con
// Pase y slots insuficientes, el turista paga sólo estos, a precio individual
// y sin beneficio adicional ni descuento — el beneficio compensa pagar el pack
// completo, y acá no lo está pagando.
export function sobrantesDeCupopack(cupones, libres) {
  return premiumDeCupopack(cupones).slice(Math.max(0, libres));
}

// Precio de los sobrantes: la suma de sus precios individuales. Sin pasar por
// `aplicarBeneficioCupopack` a propósito — esa función existe para el pack
// completo y aplicarla acá metería el descuento del beneficio adicional, que
// justamente no corresponde.
export const precioSobrantes = (sobrantes = []) =>
  sobrantes.reduce((s, c) => s + (Number(c.precio_activacion) || 0), 0);

// Un cupón del Cupopack traducido a lo que espera el carrito. Hace falta porque
// los cupones del pack se normalizan distinto (`ahorro_estimado` en snake) y
// `ofertaToCupon` lee `ahorroEstimado`: pasarlos crudos daba ahorro 0 y, con
// eso, precio 0.
export const cuponAOferta = (c) => ({
  id: c.id,
  title: c.titulo,
  badge: c.badge,
  ahorroEstimado: Number(c.ahorro_estimado) || 0,
  proveedorNombre: c.socio,
  categoria: c.categoria,
  image: c.imagen,
});
