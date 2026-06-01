// ============================================================
//  src/lib/cobros.js
//  Modelo de cobros definitivo:
//  - Gastronómicos y experiencias: NUNCA pagan nada
//  - Alojamientos FREE: pagan tokens ANTES de publicar
//  - Alojamientos PLUS/BLACK: pagan solo al canjear
// ============================================================

import { supabase } from './supabase';

export const CREDITO_PRECIO = 2000;
export const CREDITO_IVA    = 420;
export const CREDITO_TOTAL  = CREDITO_PRECIO + CREDITO_IVA;

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
  const { data } = await supabase
    .from('socio_tokens')
    .select('saldo')
    .eq('negocio_id', negocioId)
    .single();
  return data?.saldo || 0;
}

// ─── Descontar 1 token al publicar ───────────────────────────
export async function descontarToken(negocioId) {
  const saldo = await getSaldo(negocioId);
  if (saldo < 1) return false;

  const { error } = await supabase
    .from('socio_tokens')
    .upsert({ negocio_id: negocioId, saldo: saldo - 1, updated_at: new Date().toISOString() });

  return !error;
}

// ─── Acreditar tokens después de una compra ──────────────────
export async function acreditarTokens(negocioId, cantidad) {
  const saldo = await getSaldo(negocioId);
  await supabase
    .from('socio_tokens')
    .upsert({ negocio_id: negocioId, saldo: saldo + cantidad, updated_at: new Date().toISOString() });
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

// ─── Al canjear oferta PLUS/BLACK ────────────────────────────
export async function onCanjeAlojamiento({ negocioId, promocionId, plan }) {
  if (plan === 'black') {
    const { data: neg } = await supabase
      .from('negocios')
      .select('canjes_acumulados')
      .eq('id', negocioId)
      .single();
    const nuevos = (neg?.canjes_acumulados || 0) + 1;
    await supabase.from('negocios').update({ canjes_acumulados: nuevos }).eq('id', negocioId);
    if (nuevos % 3 === 0) {
      await generarOrdenCanje({ negocioId, promocionId });
    }
    return;
  }
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
