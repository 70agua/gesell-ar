// ============================================================
//  src/lib/avisos.js
//  Avisos del usuario — canal in-app.
//
//  Los avisos NO se crean desde acá: los escribe el servidor (triggers sobre
//  solicitudes_fecha y promociones, y dos crons). El cliente sólo lee los
//  suyos y los marca leídos; la RLS no le permite otra cosa. Ver §Fase 9.
//
//  El TEXTO se arma acá y no se guarda redactado en la base: así cambiar un
//  copy no obliga a migrar el histórico, y el mismo evento puede leerse
//  distinto en la app y en el mail.
// ============================================================
import { supabase } from './supabase';

const fecha = (d) => d ? new Date(d).toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }) : '';

// Cuánto falta, en palabras. "en 3 días" es más accionable que una fecha:
// el que recibe el aviso quiere saber si tiene que moverse hoy.
function enCuanto(iso) {
  if (!iso) return '';
  const hs = Math.round((new Date(iso) - Date.now()) / 36e5);
  if (hs <= 1)  return 'en menos de una hora';
  if (hs < 24)  return `en ${hs} horas`;
  const d = Math.round(hs / 24);
  return d === 1 ? 'mañana' : `en ${d} días`;
}

// Un aviso por tipo. `p` es el payload congelado al momento del evento.
const TEXTOS = {
  solicitud_recibida: p => ({
    titulo: 'Te pidieron una fecha',
    cuerpo: `${p.personas || 1} persona${p.personas > 1 ? 's' : ''} para ${p.oferta}, el ${fecha(p.fecha_pedida)}. Tenés 72 horas para responder.`,
  }),
  solicitud_por_vencer: p => ({
    titulo: 'Una solicitud está por vencer',
    cuerpo: `La de ${p.oferta} (${fecha(p.fecha_pedida)}) vence ${enCuanto(p.expira_at)}. Si no respondés, el turista pierde el beneficio.`,
    urgente: true,
  }),
  solicitud_aceptada: p => ({
    titulo: '¡Te confirmaron la fecha!',
    cuerpo: `${p.negocio || 'El comercio'} aceptó tu pedido para ${p.oferta} el ${fecha(p.fecha_pedida)}.`,
  }),
  solicitud_rechazada: p => ({
    titulo: 'No pudieron con esa fecha',
    cuerpo: `${p.negocio || 'El comercio'} no puede el ${fecha(p.fecha_pedida)} para ${p.oferta}. Tu beneficio PREMIUM quedó libre.`,
  }),
  solicitud_contrapropuesta: p => ({
    titulo: 'Te proponen otra fecha',
    cuerpo: `Para ${p.oferta}: ${fecha(p.fecha_propuesta)} en vez del ${fecha(p.fecha_pedida)}.`,
  }),
  solicitud_vencida: p => ({
    titulo: 'La solicitud venció',
    cuerpo: `${p.negocio || 'El comercio'} no respondió a tiempo por ${p.oferta}. Tu beneficio PREMIUM quedó libre.`,
  }),
  oferta_aprobada: p => ({
    titulo: 'Tu oferta ya está publicada',
    cuerpo: `${p.oferta} pasó la revisión y los turistas ya pueden verla.`,
  }),
  oferta_rechazada: p => ({
    titulo: 'Tu oferta necesita cambios',
    cuerpo: `${p.oferta} no pasó la revisión. Entrá a tu panel para corregirla.`,
  }),
  pase_por_vencer: p => ({
    titulo: 'Tu Pase está por vencer',
    cuerpo: `Vence ${enCuanto(p.vence_el)}. Usá los beneficios que te queden antes de esa fecha.`,
    urgente: true,
  }),
  cupon_por_vencer: p => ({
    titulo: 'Un cupón tuyo está por vencer',
    cuerpo: `${p.oferta} vence ${enCuanto(p.vence_el)}.`,
  }),
};

// Un aviso de un tipo que esta versión del cliente no conoce igual se muestra
// —con su tipo crudo— en vez de desaparecer: perder un aviso es peor que
// mostrarlo feo, y pasa cada vez que el server va adelante del front.
export function textoAviso(aviso) {
  const armar = TEXTOS[aviso.tipo];
  const base = armar ? armar(aviso.payload || {}) : { titulo: 'Novedad', cuerpo: aviso.tipo };
  return { ...base, leido: !!aviso.leido_el, destino: aviso.destino, id: aviso.id, creadoEn: aviso.creado_en };
}

export async function getAvisos(limite = 30) {
  const { data, error } = await supabase
    .from('avisos').select('*')
    .order('creado_en', { ascending: false })
    .limit(limite);
  if (error) return [];
  return (data || []).map(textoAviso);
}

export async function contarNoLeidos() {
  const { count } = await supabase
    .from('avisos').select('id', { count: 'exact', head: true })
    .is('leido_el', null);
  return count || 0;
}

export async function marcarLeido(id) {
  return supabase.from('avisos').update({ leido_el: new Date().toISOString() }).eq('id', id);
}

export async function marcarTodosLeidos() {
  return supabase.from('avisos').update({ leido_el: new Date().toISOString() }).is('leido_el', null);
}
