// ============================================================
//  src/lib/impulso.js
//  "Impulsá tu oferta": el socio asigna créditos publicitarios
//  (de su saldo socio_tokens) para que la oferta se vea más.
//  El presupuesto se descuenta con cada acceso y cada venta.
// ============================================================
import { supabase } from './supabase';
import { descontarCreditos } from './cobros';

// Tarifas de consumo de referencia (en créditos), para una campaña de DIAS_REF
// días. Elegir menos días acelera el ritmo de gasto: el mismo presupuesto tiene
// que alcanzar en una ventana más corta, así que el costo por evento sube.
// Tres niveles del funnel, como en las plataformas de ads (Meta, etc.):
export const COSTO_ACCESO    = 0.02; // CPV — cada vez que se abre el detalle del cupón
                                      // (evento real: 'acceso', ver OfertaDetailView).
export const COSTO_VENTA     = 0.5;  // CPC — cada vez que se compra/adquiere el cupón
                                      // (evento real: 'venta', ver CheckoutView; ya sólo
                                      // se dispara si la oferta está impulsada).
export const COSTO_RESULTADO = 1;    // CPR — cada canje real "en mostrador". Hoy la app no
                                      // tiene forma de confirmar ese canje físico (no hay QR
                                      // ni botón de "marcar como canjeado" en el panel), así
                                      // que este valor es sólo de referencia para la simulación
                                      // — y a propósito el más caro: puede pasar mucho tiempo
                                      // entre la compra y el canje, o no pasar nunca.
export const DIAS_REF    = 30; // duración de referencia — a esta duración, el costo es el de siempre
export const DIAS_MAX    = 90; // tope de días que se puede pujar de una vez
export const CREDITOS_MIN = 5;
export const CREDITOS_MAX = 30;
// Descuento por volumen: invertir más créditos abarata cada evento (hasta un 40% en
// el tope de 30 créd.) — recompensa presupuestos grandes, igual que un "precio mayorista".
export const DESCUENTO_MAX_VOLUMEN = 0.4;

// Escala un costo base según dos factores independientes:
// - Duración: a DIAS_REF es el costo de referencia; a menos días, sube proporcionalmente
//   (mismo presupuesto, ventana más corta = ritmo de gasto más intenso).
// - Volumen de créditos: a CREDITOS_MIN es el costo de referencia; a más créditos,
//   baja hasta DESCUENTO_MAX_VOLUMEN (mismo mecanismo que un descuento por cantidad).
// Los dos factores son independientes y se multiplican entre sí.
function escalarCosto(costoBase, dias, creditos) {
  const factorDias = DIAS_REF / Math.max(1, Number(dias) || DIAS_REF);
  const c = Math.min(CREDITOS_MAX, Math.max(CREDITOS_MIN, Number(creditos) || CREDITOS_MIN));
  const factorVolumen = 1 - DESCUENTO_MAX_VOLUMEN * (c - CREDITOS_MIN) / (CREDITOS_MAX - CREDITOS_MIN);
  return costoBase * factorDias * factorVolumen;
}
export function costoPorAcceso(dias = DIAS_REF, creditos = CREDITOS_MIN)    { return escalarCosto(COSTO_ACCESO, dias, creditos); }
export function costoPorVenta(dias = DIAS_REF, creditos = CREDITOS_MIN)     { return escalarCosto(COSTO_VENTA, dias, creditos); }
export function costoPorResultado(dias = DIAS_REF, creditos = CREDITOS_MIN) { return escalarCosto(COSTO_RESULTADO, dias, creditos); }

// Estimación para el copy del modal: cuántos accesos/ventas ~cubre un presupuesto
// en la duración elegida (por defecto, la de referencia).
export function estimarAccesos(creditos, dias = DIAS_REF) {
  return Math.round((Number(creditos) || 0) / costoPorAcceso(dias, creditos));
}
export function estimarVentas(creditos, dias = DIAS_REF) {
  return Math.floor((Number(creditos) || 0) / costoPorVenta(dias, creditos));
}

// ─── Asignar presupuesto de impulso a una oferta ──────────────
// Mueve `creditos` (enteros) del saldo del socio al presupuesto de la oferta.
// Devuelve { ok, error, restante }.
export async function impulsarOferta(promocionId, negocioId, creditos) {
  const n = Math.floor(Number(creditos) || 0);
  if (n <= 0) return { ok: false, error: 'Elegí cuántos créditos querés poner.' };

  // Descontar del saldo del socio (falla si no alcanza, sin tocar nada).
  const okSaldo = await descontarCreditos(negocioId, n);
  if (!okSaldo) return { ok: false, error: 'No te alcanzan los créditos disponibles.' };

  // Sumar al presupuesto de la oferta (read-modify-write; asignación puntual).
  const { data: actual } = await supabase
    .from('promociones')
    .select('impulso_creditos_total, impulso_creditos_restante')
    .eq('id', promocionId)
    .single();

  const total    = Number(actual?.impulso_creditos_total || 0) + n;
  const restante = Number(actual?.impulso_creditos_restante || 0) + n;

  const { error } = await supabase
    .from('promociones')
    .update({
      impulso_activo:            true,
      impulso_creditos_total:    total,
      impulso_creditos_restante: restante,
      impulso_actualizado_en:    new Date().toISOString(),
    })
    .eq('id', promocionId);

  if (error) return { ok: false, error: 'No se pudo activar el impulso.' };
  return { ok: true, restante };
}

// ─── Consumir presupuesto (atómico vía RPC) ───────────────────
// tipo: 'acceso' | 'venta'. No-op si la oferta no está impulsada.
export async function consumirImpulso(promocionId, tipo = 'acceso') {
  if (!promocionId) return;
  const costo = tipo === 'venta' ? COSTO_VENTA : COSTO_ACCESO;
  try {
    await supabase.rpc('consumir_impulso', { p_promocion_id: promocionId, p_costo: costo });
  } catch { /* el impulso es best-effort; no interrumpe el flujo del turista */ }
}
