// ============================================================
//  src/lib/packs.js
//  Lógica de negocio del Armador de Packs
// ============================================================

import { supabase } from './supabase';

// ─── Leer configuración del sistema ──────────────────────────
export async function getConfiguracion() {
  const { data } = await supabase.from('configuracion').select('*');
  if (!data) return {};
  return data.reduce((acc, row) => {
    acc[row.clave] = row.valor;
    return acc;
  }, {});
}

// ─── Tokens por tipo de negocio ──────────────────────────────
export function tokensPorTipo(tipo, config) {
  if (['Hotel', 'Cabaña', 'Departamento'].includes(tipo))
    return parseInt(config.tokens_hotel || 3);
  if (['Restaurante', 'Bar', 'Café', 'Balneario', 'Pastelería', 'Gourmet'].includes(tipo))
    return parseInt(config.tokens_restaurante || 2);
  return parseInt(config.tokens_experiencia || 1);
}

// ─── Precio de un token con IVA ──────────────────────────────
export function precioToken(config) {
  const base = parseFloat(config.token_precio_sin_iva || 5000);
  const iva  = parseFloat(config.token_iva_porcentaje || 21) / 100;
  return base * (1 + iva);
}

// ─── Descuento por forma de pago ─────────────────────────────
export function descuentoPorFormaPago(formaPago, config) {
  const key = {
    mercadopago:   'descuento_mp',
    transferencia: 'descuento_transferencia',
    tarjeta:       'descuento_tarjeta',
  }[formaPago] || 'descuento_tarjeta';
  return parseFloat(config[key] || 0) / 100;
}

// ─── Calcular resumen del carrito ────────────────────────────
export function calcularResumen(items, formaPago, config) {
  const tokenPrice  = precioToken(config);
  const totalTokens = items.reduce((sum, item) =>
    sum + tokensPorTipo(item.type, config), 0
  );
  const subtotal     = totalTokens * tokenPrice;
  const descPct      = descuentoPorFormaPago(formaPago, config);
  const descuento    = subtotal * descPct;
  const totalConDesc = subtotal - descuento;
  const iva          = totalConDesc - (totalConDesc / (1 + parseFloat(config.token_iva_porcentaje || 21) / 100));
  const sinIva       = totalConDesc - iva;

  return {
    totalTokens,
    subtotal,
    descuento,
    descuentoPct: descPct * 100,
    sinIva,
    iva,
    total: totalConDesc,
  };
}

// ─── Cargar beneficios de un negocio ─────────────────────────
export async function getBeneficiosNegocio(negocioId) {
  const { data } = await supabase
    .from('beneficios')
    .select('*')
    .eq('negocio_id', negocioId)
    .eq('activo', true);
  return data || [];
}

// ─── Cargar combinaciones especiales para un set de negocios ─
export async function getCombinaciones(negocioIds) {
  if (!negocioIds.length) return [];
  const { data } = await supabase
    .from('combinaciones')
    .select('*, beneficios(*), negocio_origen:negocios!negocio_origen_id(nombre), negocio_destino:negocios!negocio_destino_id(nombre)')
    .in('negocio_origen_id', negocioIds)
    .in('negocio_destino_id', negocioIds)
    .eq('activa', true);
  return data || [];
}

// ─── Generar token de 6 dígitos único ────────────────────────
function generarToken6() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ─── Crear cuponera en Supabase ───────────────────────────────
export async function crearCuponera({ items, formaPago, email, nombre, config }) {
  const resumen    = calcularResumen(items, formaPago, config);
  const qrToken    = crypto.randomUUID().replace(/-/g, '').slice(0, 16).toUpperCase();
  const qrUrl      = `${window.location.origin}/cuponera/${qrToken}`;

  // 1. Crear la cuponera
  const { data: cuponera, error: errCup } = await supabase
    .from('cuponeras')
    .insert({
      usuario_email:      email,
      usuario_nombre:     nombre,
      estado:             'pendiente_pago',
      forma_pago:         formaPago,
      subtotal_tokens:    resumen.totalTokens,
      precio_sin_iva:     resumen.sinIva,
      iva:                resumen.iva,
      total:              resumen.total,
      descuento_aplicado: resumen.descuento,
      qr_token:           qrToken,
      qr_url:             qrUrl,
    })
    .select()
    .single();

  if (errCup) throw errCup;

  // 2. Crear los ítems con token de canje individual
  const itemsInsert = items.map((item) => ({
    cuponera_id:     cuponera.id,
    negocio_id:      item.id,
    tokens_cobrados: tokensPorTipo(item.type, config),
    token_canje:     generarToken6(),
    canjeado:        false,
  }));

  const { error: errItems } = await supabase
    .from('cuponera_items')
    .insert(itemsInsert);

  if (errItems) throw errItems;

  return { cuponera, qrToken, qrUrl };
}

// ─── Marcar cuponera como pagada ─────────────────────────────
export async function marcarCuponeraPageada(cuponeraId) {
  const { error } = await supabase
    .from('cuponeras')
    .update({ estado: 'pagada', pagado_en: new Date().toISOString() })
    .eq('id', cuponeraId);
  if (error) throw error;
}

// ─── Obtener cuponera por QR token (para el micrositio) ──────
export async function getCuponeraByToken(qrToken) {
  const { data, error } = await supabase
    .from('cuponeras')
    .select('*, cuponera_items(*, negocios(nombre, tipo, imagen_url, localidad))')
    .eq('qr_token', qrToken)
    .single();
  if (error) return null;
  return data;
}

// ─── Canjear un token (lo hace el proveedor) ─────────────────
export async function canjearToken(tokenCanje, negocioId) {
  // Verificar que el token pertenece a este negocio y no fue canjeado
  const { data: item, error } = await supabase
    .from('cuponera_items')
    .select('*')
    .eq('token_canje', tokenCanje)
    .eq('negocio_id', negocioId)
    .eq('canjeado', false)
    .single();

  if (error || !item) return { ok: false, mensaje: 'Token inválido o ya canjeado' };

  // Marcar como canjeado
  await supabase
    .from('cuponera_items')
    .update({ canjeado: true, canjeado_en: new Date().toISOString() })
    .eq('id', item.id);

  // Emitir orden de cobro al proveedor
  const config = await getConfiguracion();
  const tipo   = item.tipo_negocio || 'aventura_relax';
  const tokens = parseInt(config[`tokens_canje_${tipo.toLowerCase()}`] || 1);
  const monto  = tokens * precioToken(config);

  await supabase.from('ordenes_cobro').insert({
    negocio_id:       negocioId,
    cuponera_item_id: item.id,
    tokens:           tokens,
    monto:            monto,
    estado:           'pendiente',
  });

  return { ok: true, mensaje: 'Token canjeado correctamente' };
}