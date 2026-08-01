// ============================================================
//  src/lib/tracking.js
//  Lo que se mide del lado del turista, para que el panel del socio tenga
//  algo real que mostrar.
//
//  Todo pasa por la RPC `registrar_evento` (SECURITY DEFINER): el visitante
//  suele ser anónimo y no se le puede dar permiso de escritura sobre las
//  tablas de métricas de todos los socios.
//
//  Dos cosas que la RPC resuelve del lado del servidor y no acá:
//   · el `negocio_id` sale de la oferta, no lo elige el cliente;
//   · el socio mirando su propia ficha no cuenta como visita.
//
//  NO se mide "click a contacto": ese botón se eliminó en la Fase 2b. El
//  contacto pasa a ser el flujo de solicitudes de fecha (5b) y se medirá
//  contra su propia tabla.
// ============================================================
import { supabase } from './supabase';

// Anti-doble-conteo. Un `useEffect` que se re-ejecuta, un StrictMode en dev o
// el usuario volviendo atrás no son visitas nuevas: dentro de la misma
// pestaña, cada cosa se cuenta una sola vez.
const VISTO = new Set();

function yaVisto(clave) {
  if (VISTO.has(clave)) return true;
  VISTO.add(clave);
  try {
    const previas = JSON.parse(sessionStorage.getItem('cuponear_tracking') || '[]');
    if (previas.includes(clave)) return true;
    sessionStorage.setItem('cuponear_tracking', JSON.stringify([...previas, clave].slice(-200)));
  } catch { /* sin sessionStorage: alcanza con el Set en memoria */ }
  return false;
}

// El tracking nunca puede romper la navegación: si falla, se descarta.
async function enviar(tipo, { negocioId = null, promocionId = null } = {}) {
  try {
    await supabase.rpc('registrar_evento', {
      p_tipo: tipo, p_negocio_id: negocioId, p_promocion_id: promocionId,
    });
  } catch { /* silencioso a propósito */ }
}

// ─── Vista de la ficha de un negocio ──────────────────────────
export function trackVistaFicha(negocioId) {
  if (!negocioId || yaVisto(`ficha:${negocioId}`)) return;
  enviar('vista_ficha', { negocioId });
}

// ─── Vista de una oferta ──────────────────────────────────────
export function trackVistaOferta(promocionId) {
  if (!promocionId || yaVisto(`oferta:${promocionId}`)) return;
  enviar('vista_oferta', { promocionId });
}

// ─── Agregado al carrito ──────────────────────────────────────
// Esta sí se cuenta cada vez: agregar dos veces son dos intenciones de compra.
export function trackAgregarCarrito(promocionId) {
  if (!promocionId) return;
  enviar('carrito', { promocionId });
}

// ─── Lectura para el panel del socio ──────────────────────────
export async function getStatsNegocio(negocioId, dias = 30) {
  if (!negocioId) return null;
  const { data, error } = await supabase.rpc('stats_negocio', {
    p_negocio_id: negocioId, p_dias: dias,
  });
  if (error) { console.error('getStatsNegocio', error); return null; }
  if (!data?.ok) return null;
  return data;
}
