// ============================================================
//  src/lib/gamificacion.js
//  PUNTOS del turista — la única moneda que toca un usuario final.
//
//  No confundir con los CRÉDITOS PUBLICITARIOS del socio, que viven en
//  `socio_tokens` y se manejan en lib/cobros.js: son cosas distintas, de
//  actores distintos. Acá:
//    · usuario_tokens     = saldo de puntos del turista (histórico del nombre)
//    · token_movimientos  = su historial
//
//  Los puntos son cashback: se ganan al registrarse y con cada compra, y se
//  usan como parte de pago en la compra siguiente — en este destino o en
//  cualquier otro de la red Cuponear, porque viajan con la cuenta.
// ============================================================

import { supabase } from './supabase';

// Cuánto vale un punto al momento de pagar. Es una definición de negocio, no
// un detalle técnico: cambiala acá y cambia en toda la app.
export const PESOS_POR_PUNTO = 1;
export const pesosDePuntos = (puntos) => Math.round((Number(puntos) || 0) * PESOS_POR_PUNTO);

// Porcentaje de la compra que vuelve como puntos.
export const CASHBACK_PCT = 0.05;
export const puntosDeCompra = (monto) => Math.round((Number(monto) || 0) * CASHBACK_PCT / PESOS_POR_PUNTO);

// ─── Acciones que suman puntos ────────────────────────────────
// Escala: 1 punto = $1. Antes esto daba "2" y "3" porque estaba en la escala
// de los créditos del socio ($2.000 c/u), y convivía en el mismo saldo con los
// puntos del pase (+500 por compra) — dos escalas en una misma cuenta.
export const ACCIONES = {
  registro: {
    label:       'Registro en Cuponear',
    descripcion: 'Bonus por crear tu cuenta',
    puntos:      500,
    unica_vez:   true,
    emoji:       '🎉',
  },
  compartir_pack: {
    label:       'Compartir pack en redes',
    descripcion: 'Compartís tu pack armado',
    puntos:      200,
    unica_vez:   true,
    emoji:       '📲',
  },
  primera_compra: {
    label:       'Primera cuponera',
    descripcion: 'Comprás tu primera cuponera',
    puntos:      300,
    unica_vez:   true,
    emoji:       '🛍️',
  },
};

// ─── Saldo de puntos del usuario ──────────────────────────────
export async function getPuntos(userId) {
  const { data } = await supabase
    .from('usuario_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data || { balance: 0 };
}

// ─── Obtener historial de movimientos ────────────────────────
export async function getMovimientos(userId) {
  const { data } = await supabase
    .from('token_movimientos')
    .select('*')
    .eq('user_id', userId)
    .order('creado_en', { ascending: false });
  return data || [];
}

// ─── Verificar si el usuario ya realizó una acción ───────────
export async function accionYaRealizada(userId, accion) {
  const { data } = await supabase
    .from('acciones_usuario')
    .select('id')
    .eq('user_id', userId)
    .eq('accion', accion)
    .single();
  return !!data;
}

// ─── Otorgar puntos por una acción ───────────────────────────
export async function otorgarPuntos(userId, accionKey, referenciaId = null) {
  const accion = ACCIONES[accionKey];
  if (!accion) return { ok: false, mensaje: 'Acción desconocida' };

  // Si es única vez, verificar que no se haya hecho antes
  if (accion.unica_vez) {
    const yaHecha = await accionYaRealizada(userId, accionKey);
    if (yaHecha) return { ok: false, mensaje: 'Esta acción ya fue recompensada' };
  }

  // Registrar la acción
  await supabase.from('acciones_usuario').insert({
    user_id: userId,
    accion:  accionKey,
  });

  // Registrar el movimiento
  await supabase.from('token_movimientos').insert({
    user_id:      userId,
    tipo:         `ganado_${accionKey}`,
    cantidad:     accion.puntos,
    descripcion:  accion.label,
    referencia_id: referenciaId,
  });

  // Actualizar o crear el wallet
  const wallet = await getPuntos(userId);

  if (wallet.user_id) {
    await supabase
      .from('usuario_tokens')
      .update({ balance: wallet.balance + accion.puntos })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('usuario_tokens')
      .insert({ user_id: userId, balance: accion.puntos });
  }

  return { ok: true, puntos: accion.puntos, mensaje: accion.label };
}

// ─── Usar puntos como parte de pago ──────────────────────────
export async function gastarPuntos(userId, cantidad, cuponeraId) {
  const wallet = await getPuntos(userId);
  if (wallet.balance < cantidad)
    return { ok: false, mensaje: 'No tenés suficientes puntos' };

  await supabase
    .from('usuario_tokens')
    .update({ balance: wallet.balance - cantidad })
    .eq('user_id', userId);

  await supabase.from('token_movimientos').insert({
    user_id:       userId,
    tipo:          'gastado_cuponera',
    cantidad:      -cantidad,
    descripcion:   'Puntos usados como parte de pago',
    referencia_id: cuponeraId,
  });

  return { ok: true };
}

// ─── Acreditar puntos sueltos (contextuales, sin "única vez") ─
// Para recompensas variables que no viven en ACCIONES: puntos del
// Pase (+500 compra, +300 upgrade, +100 canje), etc. Registra el
// movimiento y actualiza el wallet. `cantidad` puede ser negativa.
export async function acreditarPuntos(userId, cantidad, tipo, descripcion, referenciaId = null) {
  if (!userId || !cantidad) return { ok: false, mensaje: 'Faltan datos' };

  await supabase.from('token_movimientos').insert({
    user_id:       userId,
    tipo,
    cantidad,
    descripcion,
    referencia_id: referenciaId,
  });

  const wallet = await getPuntos(userId);
  if (wallet.user_id) {
    await supabase
      .from('usuario_tokens')
      .update({ balance: wallet.balance + cantidad })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('usuario_tokens')
      .insert({ user_id: userId, balance: cantidad });
  }

  return { ok: true, puntos: cantidad };
}

// ─── Desbloqueos progresivos según items en carrito ──────────
// Devuelve los desbloqueos activos según la combinación actual
export function calcularDesbloqueos(items) {
  const tipos = items.map(i => {
    if (['Hotel', 'Cabaña', 'Departamento'].includes(i.type)) return 'alojamiento';
    if (['Restaurante', 'Bar', 'Café', 'Balneario', 'Pastelería', 'Gourmet'].includes(i.type)) return 'salidas';
    return 'aventura_relax';
  });

  const tieneAloj  = tipos.includes('alojamiento');
  const tieneGastro = tipos.includes('salidas');
  const tieneExp   = tipos.includes('aventura_relax');
  const total      = items.length;

  const desbloqueos = [];

  if (total >= 2)
    desbloqueos.push({ emoji: '🔓', texto: '¡Pack doble activado! Verificación prioritaria incluida.' });

  if (tieneAloj && tieneGastro)
    desbloqueos.push({ emoji: '🍽️', texto: 'Combo Alojamiento + Salidas: los proveedores pueden ofrecerte extras.' });

  if (tieneAloj && tieneExp)
    desbloqueos.push({ emoji: '🏄', texto: 'Combo Alojamiento + Experiencia: consultá por early check-in.' });

  if (tieneAloj && tieneGastro && tieneExp)
    desbloqueos.push({ emoji: '⭐', texto: '¡Pack completo desbloqueado! Máximos beneficios disponibles.' });

  if (total >= 4)
    desbloqueos.push({ emoji: '🎁', texto: '4 servicios o más: accedés al beneficio sorpresa de Cuponear.' });

  return desbloqueos;
}