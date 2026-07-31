// ============================================================
//  src/lib/cobros.js
//  CRÉDITOS PUBLICITARIOS del socio — la moneda del lado comercial.
//
//  No confundir con los PUNTOS del turista, que viven en `usuario_tokens` y
//  se manejan en lib/gamificacion.js. Cuatro tablas dicen "token" y son DOS
//  monedas distintas:
//    · socio_tokens       = saldo de CRÉDITOS PUBLICITARIOS del socio
//    · token_compras      = sus compras de créditos
//    · usuario_tokens     = saldo de PUNTOS del turista
//    · token_movimientos  = historial de PUNTOS del turista
//  Los nombres son históricos y NO se renombran todavía (Fase 2 renombra
//  vocabulario, no esquema).
//
//  Modelo de cobros:
//  - NINGÚN socio paga por publicar ni por canjear, tenga plan o no.
//  - Los créditos publicitarios sólo se gastan en lo que el socio elige
//    comprar: el impulso de una oferta.
//  - Lo que sí se cobra es al TURISTA, por activar un cupón
//    (`precioActivacionARS`). Eso es la venta, no un cargo al socio.
// ============================================================

import { supabase } from './supabase';

export const CREDITO_PRECIO = 2000;
export const CREDITO_IVA    = 420;
export const CREDITO_TOTAL  = CREDITO_PRECIO + CREDITO_IVA;

// Tabla escalonada: ahorro declarado → precio del cupón (con IVA incluido)
// Techo absoluto: $14.520 ARS. El precio final se redondea a la centena
// (última decena en 00): desde 50 hacia arriba, debajo de 50 hacia abajo.
export function calcularPrecioCupon(ahorroDeclarado) {
  if (!ahorroDeclarado || ahorroDeclarado <= 0) return 0;
  let comision;
  if (ahorroDeclarado <= 5000)        comision = 0.25;
  else if (ahorroDeclarado <= 15000)  comision = 0.20;
  else if (ahorroDeclarado <= 40000)  comision = 0.15;
  else if (ahorroDeclarado <= 100000) comision = 0.10;
  else                                comision = 0.07;
  const conIva = Math.min(ahorroDeclarado * comision * 1.21, 14520);
  return Math.round(conIva / 100) * 100;
}

// ─── Fuente única del precio de activación de un cupón ────────
// Devuelve el precio en pesos (IVA incl.) que ve/paga el turista.
// SIEMPRE aplica la tabla escalonada sobre el ahorro declarado; sólo
// cae a `tokensCosto × crédito` como respaldo legacy (mock/sin ahorro),
// y a 0 cuando el cupón es de regalo (tokensCosto === 0).
export function precioActivacionARS({ ahorro = 0, tokensCosto = null, precioManual = null } = {}) {
  // Precio fijado a mano tiene prioridad (0 sigue significando "regalo").
  if (precioManual != null && precioManual !== '') return Number(precioManual) || 0;
  if (tokensCosto === 0) return 0;
  if (ahorro > 0) return calcularPrecioCupon(ahorro);
  return (Number(tokensCosto) || 0) * CREDITO_TOTAL;
}

// Créditos equivalentes (enteros) — sólo para la vista de socio Plus/superadmin.
export function creditosActivacion(args) {
  const precio = precioActivacionARS(args);
  return precio <= 0 ? 0 : Math.max(1, Math.round(precio / CREDITO_TOTAL));
}

// Packs de créditos con descuento
export const TOKEN_PACKS = [
  { cantidad: 5,  descuento: 0,  label: '5 créditos',  desc: 'Para impulsar tus ofertas' },
  { cantidad: 10, descuento: 15, label: '10 créditos', desc: '15% de descuento' },
  { cantidad: 20, descuento: 20, label: '20 créditos', desc: '20% de descuento' },
];

// Descuento adicional por pago en efectivo en la oficina
export const DESCUENTO_EFECTIVO_PCT = 15;

export function calcularPrecio(cantidad, descuentoPct = 0) {
  const sinDescuento = cantidad * CREDITO_PRECIO;
  const conDescuento = sinDescuento * (1 - descuentoPct / 100);
  return {
    sinIva:   Math.round(conDescuento),
    iva:      Math.round(conDescuento * 0.21),
    total:    Math.round(conDescuento * 1.21),
    ahorro:   Math.round(sinDescuento - conDescuento),
  };
}

// NINGÚN socio paga por publicar ni por canjear (Fase 1b). Acá vivían
// `debeUsarTokens()` —que hacía que un alojamiento sin plan pagara créditos
// para publicar— y `descontarToken()`, su cobro. Se eliminaron: castigaban
// justo al canal de distribución del pase-regalo, y el control de calidad ya
// lo da la aprobación de ofertas.
//
// Los créditos publicitarios siguen existiendo, pero SOLO para lo que se
// compra por voluntad propia: el impulso de una oferta (`impulso.js`, vía
// `descontarCreditos`). El plan compra visibilidad, no funcionalidad básica.

// ─── Obtener saldo de créditos publicitarios ─────────────────
export async function getSaldo(negocioId) {
  // Sin .single()/.maybeSingle(): esos piden un objeto único (header especial) y Postgrest
  // responde 406 igual cuando hay 0 filas (un negocio sin créditos comprados todavía es normal).
  // limit(1) + array evita el 406 por completo: 0 filas → [] con 200 OK.
  const { data } = await supabase
    .from('socio_tokens')
    .select('saldo')
    .eq('negocio_id', negocioId)
    .limit(1);
  return data?.[0]?.saldo || 0;
}

// ─── Descontar N créditos publicitarios (impulso de una oferta) ──
// Devuelve false si no alcanza el saldo (sin descontar nada).
export async function descontarCreditos(negocioId, n) {
  if (!n || n <= 0) return true;
  const saldo = await getSaldo(negocioId);
  if (saldo < n) return false;

  const { error } = await supabase
    .from('socio_tokens')
    .upsert({ negocio_id: negocioId, saldo: saldo - n, updated_at: new Date().toISOString() }, { onConflict: 'negocio_id' });

  return !error;
}

// ─── Acreditar créditos después de una compra ────────────────
export async function acreditarTokens(negocioId, cantidad) {
  const saldo = await getSaldo(negocioId);
  const { error } = await supabase
    .from('socio_tokens')
    .upsert({ negocio_id: negocioId, saldo: saldo + cantidad, updated_at: new Date().toISOString() }, { onConflict: 'negocio_id' });
  if (error) console.error('acreditarTokens error:', error);
}

// ─── Registrar compra de créditos ────────────────────────────
// Los créditos se acreditan SIEMPRE en el acto, sea cual sea la forma de pago.
// No hay aprobación de por medio: el socio compra y los tiene. Para
// transferencia y efectivo la conciliación es un tema contable aparte
// (el superadmin las ve en su tab de créditos), nunca una traba para el socio.
export async function registrarCompra({ negocioId, cantidad, descuentoPct, formaPago }) {
  const precios = calcularPrecio(cantidad, descuentoPct);
  const { data, error } = await supabase
    .from('token_compras')
    .insert({
      negocio_id:      negocioId,
      cantidad,
      precio_unitario: CREDITO_PRECIO,
      descuento_pct:   descuentoPct,
      total_sin_iva:   precios.sinIva,
      total_con_iva:   precios.total,
      forma_pago:      formaPago,
      estado:          'pagada',
      pagado_en:       new Date().toISOString(),
    })
    .select()
    .single();

  if (!error && data) await acreditarTokens(negocioId, cantidad);
  return { data, error };
}

// El cobro por canje al alojamiento se eliminó (Fase 1). Cobrarle al socio por
// el turista que se le deriva no escala —convierte a cada socio en una
// negociación aparte— y genera conflicto de interés con el orden del listado.
// Con eso se fueron onCanjeAlojamiento(), generarOrdenCanje(),
// getOrdenesPendientes() y la tabla `ordenes_cobro`.

// ─── Obtener compras de créditos ──────────────────────────────
export async function getComprasTokens(negocioId) {
  const { data } = await supabase
    .from('token_compras')
    .select('*')
    .eq('negocio_id', negocioId)
    .order('creado_en', { ascending: false });
  return data || [];
}

// ─── Fecha legible para el historial de movimientos ───────────
function formatFechaMov(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  if (isNaN(d)) return '';
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const hoy = new Date();
  const ayer = new Date(); ayer.setDate(hoy.getDate() - 1);
  if (d.toDateString() === hoy.toDateString())  return `Hoy · ${hora}`;
  if (d.toDateString() === ayer.toDateString()) return `Ayer · ${hora}`;
  return `${d.getDate()} ${meses[d.getMonth()]}`;
}

// ─── Historial real de movimientos de la billetera del socio ──
// Hoy sólo compras de créditos: el cobro por canje ya no existe.
export async function getMovimientos(negocioId) {
  if (!negocioId) return [];
  const { data: compras } = await supabase
    .from('token_compras').select('*').eq('negocio_id', negocioId);

  const movs = (compras || []).map(c => ({
    kind:  'pesos',
    title: `Compra de ${c.cantidad} crédito${c.cantidad !== 1 ? 's' : ''}`,
    _ts:   c.creado_en,
    cred:  c.cantidad,
    pesos: c.total_con_iva != null ? -Number(c.total_con_iva) : null,
  }));

  return movs
    .filter(m => m._ts)
    .sort((a, b) => new Date(b._ts) - new Date(a._ts))
    .map(m => ({ ...m, date: formatFechaMov(m._ts) }));
}
