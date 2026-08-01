// ============================================================
//  src/lib/compras.js
//  La compra del turista: cupones sueltos comprados con el carrito.
//
//  Toda la escritura pasa por la RPC `registrar_compra_turista`, que hace en
//  una sola transacción: venta + items + cupones + débito de los puntos
//  usados + acreditación del cashback. Nada de esto se escribe desde el
//  cliente: `ventas` y `venta_items` ni siquiera tienen policy de INSERT.
//
//  NINGÚN precio lo manda el cliente: la RPC los recalcula con
//  `precio_cupon()` (espejo de calcularPrecioCupon) y `precio_cupon_grupal()`
//  (espejo de calcularPrecioGrupal). Del grupal sólo viaja la cantidad de
//  personas.
// ============================================================
import { supabase } from './supabase';

// ─── Comprar ──────────────────────────────────────────────────
// `cupones` es lo que hay en el carrito (ver ofertaToCupon en carrito.jsx).
// Devuelve { ok, ventaId, estado, subtotal, puntosUsados, total, cashback, codigos }
// o { ok:false, error }.
export async function registrarCompra({ cupones, formaPago, usarPuntos = false }) {
  const items = (cupones || [])
    .map(c => {
      const promocionId = c._oferta?.id;
      if (!promocionId) return null;          // mock sin id: no se puede persistir
      return {
        promocion_id: promocionId,
        // Del cupón grupal sólo viaja la CANTIDAD de personas. El total lo
        // calcula la RPC con precio_cupon_grupal(): ningún precio sale de acá.
        ...(c.grupal ? { personas: c.grupal.declared_pax } : {}),
      };
    })
    .filter(Boolean);

  if (items.length === 0) return { ok: false, error: 'carrito_sin_ofertas_reales' };

  const { data, error } = await supabase.rpc('registrar_compra_turista', {
    p_items: items,
    p_forma_pago: formaPago,
    p_usar_puntos: !!usarPuntos,
  });

  if (error)      return { ok: false, error: error.message };
  if (!data?.ok)  return { ok: false, error: data?.error || 'error_desconocido' };

  return {
    ok: true,
    ventaId:      data.venta_id,
    estado:       data.estado,
    subtotal:     Number(data.subtotal) || 0,
    puntosUsados: Number(data.puntos_usados) || 0,
    total:        Number(data.total) || 0,
    cashback:     Number(data.cashback) || 0,
    codigos:      data.codigos || [],
  };
}

// ─── Mis cupones ──────────────────────────────────────────────
// Un cupón vencido se muestra como tal aunque el job todavía no lo haya
// marcado: la fecha manda sobre el estado guardado.
export async function getMisCupones(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('cupones_usuario')
    .select('*, promociones(titulo, imagen_url, badge, descripcion), negocios(nombre, localidad, tipo)')
    .eq('usuario_id', userId)
    .order('creado_en', { ascending: false });

  if (error) { console.error('getMisCupones', error); return []; }

  const ahora = Date.now();
  return (data || []).map(c => {
    const vencido = c.estado === 'activo' && c.vence_el && new Date(c.vence_el).getTime() < ahora;
    return {
      id:          c.id,
      codigo:      c.codigo,
      estado:      vencido ? 'vencido' : c.estado,
      titulo:      c.titulo || c.promociones?.titulo || 'Cupón',
      imagen:      c.promociones?.imagen_url || null,
      badge:       c.promociones?.badge || null,
      negocio:     c.negocios?.nombre || 'Socio Cuponear',
      localidad:   c.negocios?.localidad || '',
      precioPagado: Number(c.precio_pagado) || 0,
      ahorro:      Number(c.ahorro) || 0,
      personas:    c.personas || null,
      venceEl:     c.vence_el,
      creadoEn:    c.creado_en,
      canjeadoEn:  c.canjeado_en,
    };
  });
}

// ─── Compras pendientes de pago ───────────────────────────────
// Transferencia: la venta queda registrada pero SIN cupones, porque todavía
// no entró la plata. Se listan aparte para que el turista sepa que existe.
export async function getComprasPendientes(userId) {
  if (!userId) return [];
  const { data } = await supabase
    .from('ventas')
    .select('id, monto_total, forma_pago, creado_en')
    .eq('usuario_id', userId)
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: false });
  return data || [];
}

// ─── Superadmin: ventas por transferencia esperando confirmación ──
// Es la traba #4 del lado del turista: pagó, la venta quedó `pendiente` y
// nadie le emitía los cupones.
export async function getVentasPendientes() {
  const { data, error } = await supabase
    .from('ventas')
    .select('*, venta_items(id, precio, personas, promociones(titulo), negocios(nombre))')
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: false });
  if (error) { console.error('getVentasPendientes', error); return []; }
  return data || [];
}

// Emite los cupones, debita los puntos usados y acredita el cashback —
// exactamente la misma RPC que corre una compra con tarjeta.
export async function confirmarVentaTransferencia(ventaId) {
  const { data, error } = await supabase.rpc('confirmar_venta_transferencia', { p_venta_id: ventaId });
  if (error)     return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error || 'error_desconocido' };
  return { ok: true, codigos: data.codigos || [], cashback: Number(data.cashback) || 0 };
}

export async function anularVentaPendiente(ventaId) {
  const { data, error } = await supabase.rpc('anular_venta_pendiente', { p_venta_id: ventaId });
  if (error)     return { ok: false, error: error.message };
  if (!data?.ok) return { ok: false, error: data?.error || 'error_desconocido' };
  return { ok: true };
}
