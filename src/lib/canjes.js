// ============================================================
//  src/lib/canjes.js
//  El canje, unificado.
//
//  UN SOLO MECANISMO para el cupón comprado y para el Pase. Antes el Pase
//  escribía `pase_canjes` (sólo alcanzable desde PaseDebugView) y el cupón
//  comprado no tenía canje. Ahora los dos escriben `canjes` y pasan por la
//  misma RPC.
//
//  El QR es ESTÁTICO POR SOCIO. El comercio es pasivo: no escanea, no valida
//  y no necesita pantalla. El turista escanea, ve lo que puede usar ahí,
//  elige, confirma y muestra el comprobante en el mostrador.
// ============================================================
import { supabase } from './supabase';

// La URL que codifica el QR del socio. Estática: se imprime una vez.
export function urlQrSocio(negocioId) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://gesell.ar';
  return `${base}/?canjear=${negocioId}`;
}

// ─── Qué puede canjear el turista en este negocio ─────────────
// Devuelve { ok, negocio, items[] } donde cada item es
// { tipo: 'cupon'|'pase', ref, titulo, ahorro, ... }. El front no distingue
// caminos: los pinta iguales.
// El comercio por su código de 6. Es el mismo destino que el QR —que codifica
// el UUID— pero en un formato que se puede cantar en un mostrador. Sin esto el
// turista sin cámara (permiso denegado, lente roto, mostrador oscuro) se queda
// sin canjear.
export async function buscarNegocioPorCodigo(codigo) {
  // Mismo alfabeto que el código de cupón: sin 0/O, 1/I/L ni A/E. Se normaliza
  // a mayúsculas porque nadie tipea en mayúscula si no se lo obligan.
  const limpio = String(codigo || '').toUpperCase().replace(/[^23456789BCDFGHJKMNPQRSTVWXYZ]/g, '');
  if (limpio.length !== 8) return { ok: false, error: 'codigo_invalido' };
  const { data } = await supabase
    .from('negocios').select('id, nombre, localidad')
    .eq('codigo_canje', limpio).maybeSingle();
  if (!data) return { ok: false, error: 'negocio_no_encontrado' };
  return { ok: true, negocio: data };
}

export async function beneficiosEnNegocio(negocioId) {
  const { data, error } = await supabase.rpc('beneficios_en_negocio', { p_negocio_id: negocioId });
  if (error)     return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error || 'error_desconocido' };
  return { ok: true, negocio: data.negocio, items: data.items || [] };
}

// ─── Canjear ──────────────────────────────────────────────────
export async function canjearBeneficio({ tipo, ref }) {
  const { data, error } = await supabase.rpc('canjear_beneficio', { p_tipo: tipo, p_ref: ref });
  if (error)     return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error || 'error_desconocido' };
  return {
    ok: true,
    canjeId:     data.canje_id,
    comprobante: data.comprobante,
    ahorro:      Number(data.ahorro) || 0,
    titulo:      data.titulo,
    negocio:     data.negocio,
  };
}

// ─── Fallback sin QR: el código de 8 del cupón ────────────────
// Si el turista no puede escanear (sin cámara, QR gastado), tipea el código
// que ya tiene en "Mis cupones". Resuelve a qué negocio pertenece.
export async function buscarCuponPorCodigo(codigo) {
  const limpio = (codigo || '').trim().toUpperCase();
  if (limpio.length < 6) return { ok: false, error: 'codigo_corto' };

  const { data, error } = await supabase
    .from('cupones_usuario')
    .select('id, codigo, estado, vence_el, negocio_id, titulo, ahorro, negocios(nombre)')
    .eq('codigo', limpio)
    .maybeSingle();

  if (error)  return { ok: false, error: error.message };
  if (!data)  return { ok: false, error: 'codigo_inexistente' };
  return { ok: true, cupon: data };
}

// ─── Mensajes de error, en criollo ────────────────────────────
export const ERRORES_CANJE = {
  codigo_invalido:      'El código del comercio son 8 caracteres.',
  negocio_no_encontrado:'No encontramos ese comercio. Revisá el código.',
  no_auth:                     'Iniciá sesión para usar tus cupones.',
  negocio_no_encontrado:       'No encontramos ese comercio.',
  cupon_no_encontrado:         'Ese cupón no es tuyo o no existe.',
  cupon_no_activo:             'Ese cupón ya fue usado.',
  cupon_vencido:               'Ese cupón venció.',
  cupon_ya_canjeado:           'Ese cupón ya fue usado.',
  promo_no_disponible:         'Esa oferta ya no está disponible.',
  sin_pase_activo:             'No tenés un Pase activo.',
  premium_no_elegida:          'Todavía no elegiste este beneficio PREMIUM en tu Pase.',
  estadia_no_incluida:         'Tu Pase no incluye descuento de alojamiento.',
  estadia_ya_usada:            'Ya usaste el descuento de alojamiento de este Pase.',
  ya_canjeado_en_este_comercio:'Ya usaste tu Pase en este comercio.',
  codigo_inexistente:          'No encontramos ningún cupón con ese código.',
  codigo_corto:                'El código tiene 8 caracteres.',
};

export const textoError = e => ERRORES_CANJE[e] || 'No pudimos completar el canje. Probá de nuevo.';

// ─── Panel del socio: sus canjes ──────────────────────────────
export async function getCanjesDeNegocio(negocioId, { limite = 50 } = {}) {
  if (!negocioId) return [];
  const { data, error } = await supabase
    .from('canjes')
    .select('*, promociones(titulo)')
    .eq('negocio_id', negocioId)
    .order('canjeado_el', { ascending: false })
    .limit(limite);
  if (error) { console.error('getCanjesDeNegocio', error); return []; }
  return data || [];
}

// El socio no anula: reporta. La anulación es del superadmin, porque un canje
// anulado es un error operativo y necesita alguien que lo verifique.
export async function reportarCanjeErroneo(canjeId, motivo) {
  const { data, error } = await supabase.rpc('reportar_canje_erroneo', {
    p_canje_id: canjeId, p_motivo: motivo,
  });
  if (error)     return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error || 'error_desconocido' };
  return { ok: true };
}

// ─── Superadmin ───────────────────────────────────────────────
export async function getCanjesReportados() {
  const { data, error } = await supabase
    .from('canjes')
    .select('*, promociones(titulo), negocios(nombre)')
    .eq('reporte_estado', 'pendiente')
    .order('reportado_el', { ascending: false });
  if (error) { console.error('getCanjesReportados', error); return []; }
  return data || [];
}

export async function anularCanje(canjeId, motivo) {
  const { data, error } = await supabase.rpc('anular_canje', { p_canje_id: canjeId, p_motivo: motivo });
  if (error)     return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error || 'error_desconocido' };
  return { ok: true };
}

export async function descartarReporteCanje(canjeId) {
  const { data, error } = await supabase.rpc('descartar_reporte_canje', { p_canje_id: canjeId });
  if (error)     return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error || 'error_desconocido' };
  return { ok: true };
}
