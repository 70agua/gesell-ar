// ============================================================
//  src/lib/cobros.js
//  Modelo de cobros definitivo:
//  - Salidas y Aventura & Relax: NUNCA pagan nada
//  - Alojamientos FREE: pagan tokens ANTES de publicar
//  - Alojamientos PLUS: pagan solo al canjear
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
export function precioActivacionARS({ ahorro = 0, tokensCosto = null } = {}) {
  if (tokensCosto === 0) return 0;
  if (ahorro > 0) return calcularPrecioCupon(ahorro);
  return (Number(tokensCosto) || 0) * CREDITO_TOTAL;
}

// Créditos equivalentes (enteros) — sólo para la vista de socio Plus/superadmin.
export function creditosActivacion(args) {
  const precio = precioActivacionARS(args);
  return precio <= 0 ? 0 : Math.max(1, Math.round(precio / CREDITO_TOTAL));
}

const TIPOS_ALOJAMIENTO = ['Hotel','Cabaña','Departamento','Domo','Dormi','Carpa'];

// Packs de créditos con descuento
export const TOKEN_PACKS = [
  { cantidad: 5,  descuento: 0,  label: '5 créditos',  desc: 'Publicá hasta 5 ofertas' },
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

// ─── Verificar si el socio debe pagar tokens ─────────────────
export function debeUsarTokens(tipo, plan) {
  const esAlojamiento = TIPOS_ALOJAMIENTO.includes(tipo);
  return esAlojamiento && plan === 'free';
}

// ─── Obtener saldo de tokens ──────────────────────────────────
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

// ─── Descontar 1 token al publicar ───────────────────────────
export async function descontarToken(negocioId) {
  const saldo = await getSaldo(negocioId);
  if (saldo < 1) return false;

  // onConflict: 'negocio_id' es imprescindible — la PK real de la tabla es `id`
  // (autogenerado), así que sin esto el upsert intenta insertar una fila nueva
  // y choca contra el unique constraint de negocio_id en cualquier fila ya existente.
  const { error } = await supabase
    .from('socio_tokens')
    .upsert({ negocio_id: negocioId, saldo: saldo - 1, updated_at: new Date().toISOString() }, { onConflict: 'negocio_id' });

  return !error;
}

// ─── Descontar N créditos (armado de cuponeras regalo) ───────
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

// ─── Acreditar tokens después de una compra ──────────────────
export async function acreditarTokens(negocioId, cantidad) {
  const saldo = await getSaldo(negocioId);
  const { error } = await supabase
    .from('socio_tokens')
    .upsert({ negocio_id: negocioId, saldo: saldo + cantidad, updated_at: new Date().toISOString() }, { onConflict: 'negocio_id' });
  if (error) console.error('acreditarTokens error:', error);
}

// ─── Registrar compra de tokens ──────────────────────────────
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
      estado:          formaPago === 'efectivo' ? 'pendiente' : 'pendiente',
    })
    .select()
    .single();

  if (!error && data) {
    // Si es transferencia o efectivo → pendiente hasta confirmar
    // Si es MP o tarjeta → se confirma via webhook (por ahora simulamos)
    if (formaPago === 'mercadopago' || formaPago === 'tarjeta') {
      await confirmarCompra(data.id, negocioId, cantidad);
    }
  }
  return { data, error };
}

// ─── Confirmar compra y acreditar tokens ─────────────────────
export async function confirmarCompra(compraId, negocioId, cantidad) {
  await supabase
    .from('token_compras')
    .update({ estado: 'pagada', pagado_en: new Date().toISOString() })
    .eq('id', compraId);
  await acreditarTokens(negocioId, cantidad);
}

// ─── Al canjear oferta PLUS ───────────────────────────────────
export async function onCanjeAlojamiento({ negocioId, promocionId }) {
  // PLUS → 1 crédito por canje
  await generarOrdenCanje({ negocioId, promocionId });
}

async function generarOrdenCanje({ negocioId, promocionId }) {
  await supabase.from('ordenes_cobro').insert({
    negocio_id:   negocioId,
    promocion_id: promocionId,
    tipo:         'canje',
    tokens:       1,
    monto:        CREDITO_PRECIO,
    monto_iva:    CREDITO_IVA,
    estado:       'pendiente',
  });
}

// ─── Obtener órdenes pendientes ───────────────────────────────
export async function getOrdenesPendientes(negocioId) {
  const { data } = await supabase
    .from('ordenes_cobro')
    .select('*, promociones(titulo, badge, imagen_url)')
    .eq('negocio_id', negocioId)
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: false });
  return data || [];
}

// ─── Obtener compras de tokens ────────────────────────────────
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
// Combina compras de créditos (token_compras) y cobros por canje
// (ordenes_cobro) en la forma que espera <MovRow> del panel.
export async function getMovimientos(negocioId) {
  if (!negocioId) return [];
  const [compras, ordenes] = await Promise.all([
    supabase.from('token_compras').select('*').eq('negocio_id', negocioId),
    supabase.from('ordenes_cobro').select('*, promociones(titulo)').eq('negocio_id', negocioId),
  ]);

  const movs = [];

  (compras.data || []).forEach(c => {
    const pagada = c.estado === 'pagada';
    movs.push({
      kind:  'pesos',
      title: `Compra de ${c.cantidad} crédito${c.cantidad !== 1 ? 's' : ''}${pagada ? '' : ' · pendiente'}`,
      _ts:   c.creado_en,
      cred:  pagada ? c.cantidad : null,
      pesos: c.total_con_iva != null ? -Number(c.total_con_iva) : null,
    });
  });

  (ordenes.data || []).forEach(o => {
    const tokens = o.tokens ?? o.creditos ?? 0;
    const oferta = o.promociones?.titulo;
    movs.push({
      kind:  'cred-out',
      title: oferta ? `Canje: ${oferta}` : 'Canje de una de tus ofertas',
      _ts:   o.creado_en,
      cred:  tokens ? -tokens : null,
      pesos: null,
    });
  });

  return movs
    .filter(m => m._ts)
    .sort((a, b) => new Date(b._ts) - new Date(a._ts))
    .map(m => ({ ...m, date: formatFechaMov(m._ts) }));
}
