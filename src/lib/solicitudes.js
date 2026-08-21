// ============================================================
//  src/lib/solicitudes.js
//  Solicitudes de fecha — el premium que necesita confirmación.
//
//  Es un atributo de la OFERTA (`promociones.requiere_fecha`), no del plan:
//  un spa, una excursión o una noche de hotel no se pueden canjear cayendo
//  de sorpresa. El socio marca "requiere confirmación" al publicarla.
//
//  ─── Cómo se ocupa el slot ───
//    enviada        → EN SUSPENSO
//    aceptada       → CONSUMIDO (se crea la elección premium: recién ahí la
//                     oferta se vuelve canjeable)
//    rechazada / contrapropuesta / cancelada / vencida → LIBERADO
//
//  ⚠️ COPY — no negociable. Cuponear TRANSMITE una solicitud, no reserva ni
//  confirma nada: intermediar en reservas de servicios turísticos es
//  actividad reservada a las agencias (Ley 18.829).
//    ❌ "reservá" · "tu reserva está confirmada" · "disponibilidad"
//    ✅ "enviar solicitud" · "el comercio te va a responder"
// ============================================================
import { supabase } from './supabase';

export const ESTADOS = {
  enviada:         { label: 'Esperando respuesta', color: '#B45309', bg: '#FFF7E5' },
  aceptada:        { label: 'Confirmada',          color: '#10A36B', bg: '#ECFDF5' },
  rechazada:       { label: 'No pudo ser',         color: '#DC2626', bg: '#FEF2F2' },
  contrapropuesta: { label: 'Te proponen otra fecha', color: '#475BE1', bg: '#EEF0FD' },
  cancelada:       { label: 'Cancelada',           color: '#64748B', bg: '#F1F5F9' },
  vencida:         { label: 'Sin respuesta a tiempo', color: '#64748B', bg: '#F1F5F9' },
};

const ERRORES = {
  falta_horario:        'Elegí un horario.',
  no_auth:                  'Iniciá sesión para pedir una fecha.',
  sin_pase:                 'Necesitás un Pase para pedir fechas.',
  sin_slots:                'No te quedan beneficios PREMIUM disponibles.',
  ya_tenes_una_pendiente:   'Ya pediste fecha para este beneficio y estás esperando respuesta.',
  fecha_pasada:             'Elegí una fecha de hoy en adelante.',
  fecha_fuera_de_vigencia:  'Esa fecha queda fuera de los días de tu Pase.',
  personas_invalidas:       'Decinos para cuántas personas.',
  oferta_no_disponible:     'Esa oferta ya no está disponible.',
  no_requiere_fecha:        'Este beneficio no necesita confirmación: lo usás directo.',
  no_cancelable:            'Esa solicitud ya no se puede cancelar.',
  ya_resuelta:              'Esa solicitud ya fue respondida.',
  no_autorizado:            'No podés responder esa solicitud.',
  fuera_de_vigencia_del_turista: 'Esa fecha queda fuera de los días del Pase del viajero. Proponé una anterior.',
  fecha_propuesta_invalida: 'Elegí una fecha válida.',
};
export const textoError = e => ERRORES[e] || 'No pudimos completar la acción. Probá de nuevo.';

// ─── Turista ──────────────────────────────────────────────────
// Cada campo va en null cuando la oferta no lo pregunta: el formulario muestra
// sólo lo que el socio necesita saber, y lo que no se preguntó no se inventa.
//
// El TOTAL de personas no se manda: lo calcula la RPC desde el desglose. Si
// viniera del cliente, un formulario desactualizado podría mandar un total que
// no coincide con lo que el socio ve.
export async function enviarSolicitud({ promocionId, fecha, origenId = null, hora = null, adultos = null, ninos = null, bebes = null, mascotas = null }) {
  const { data, error } = await supabase.rpc('enviar_solicitud_fecha', {
    p_promocion_id: promocionId, p_fecha: fecha, p_origen_id: origenId,
    p_hora: hora || null, p_adultos: adultos, p_ninos: ninos, p_bebes: bebes, p_mascotas: mascotas,
  });
  if (error) return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error, total: data?.total, venceEl: data?.vence_el };
  return { ok: true, solicitudId: data.solicitud_id, expiraAt: data.expira_at, premium: data.premium, personas: data.personas };
}

export async function cancelarSolicitud(solicitudId) {
  const { data, error } = await supabase.rpc('cancelar_solicitud_fecha', { p_solicitud_id: solicitudId });
  if (error) return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error };
  return { ok: true };
}

export async function getMisSolicitudes(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('solicitudes_fecha')
    .select('*, promociones(titulo, imagen_url), negocios(nombre, localidad)')
    .eq('usuario_id', userId)
    .order('enviada_at', { ascending: false });
  if (error) { console.error('getMisSolicitudes', error); return []; }
  return data || [];
}

// ─── Socio ────────────────────────────────────────────────────
export async function getSolicitudesDeNegocio(negocioId) {
  if (!negocioId) return [];
  const { data, error } = await supabase
    .from('solicitudes_fecha')
    .select('*, promociones(titulo)')
    .eq('socio_id', negocioId)
    .order('enviada_at', { ascending: false })
    .limit(100);
  if (error) { console.error('getSolicitudesDeNegocio', error); return []; }
  return data || [];
}

// respuesta: 'aceptar' | 'rechazar' | 'proponer'. Sin texto libre: el socio
// elige entre tres botones y, si propone, una fecha.
export async function responderSolicitud({ solicitudId, respuesta, fechaPropuesta = null }) {
  const { data, error } = await supabase.rpc('responder_solicitud_fecha', {
    p_solicitud_id: solicitudId, p_respuesta: respuesta, p_fecha_propuesta: fechaPropuesta,
  });
  if (error) return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error, hasta: data?.hasta };
  return { ok: true, estado: data.estado, proponerActivacion: !!data.proponer_activacion, fecha: data.fecha };
}

// ─── Consultas generales (lo otro que ve el socio en su bandeja) ──
export async function getConsultasDeNegocio(negocioId) {
  if (!negocioId) return [];
  const { data, error } = await supabase
    .from('consultas')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('creado_en', { ascending: false })
    .limit(100);
  if (error) { console.error('getConsultasDeNegocio', error); return []; }
  return data || [];
}

export async function marcarConsultaLeida(id) {
  const { error } = await supabase.from('consultas').update({ leida: true }).eq('id', id);
  return { ok: !error };
}
