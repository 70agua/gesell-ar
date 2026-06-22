// ============================================================
//  src/lib/gamificacion.js
//  Sistema de tokens ganados por acciones del usuario
// ============================================================

import { supabase } from './supabase';

// ─── Acciones disponibles y sus recompensas ───────────────────
// Estas son fijas en el código por ahora (según decisión de diseño)
export const ACCIONES = {
  registro: {
    label:       'Registro en Cuponear',
    descripcion: 'Bonus por crear tu cuenta',
    tokens:      2,
    unica_vez:   true,
    emoji:       '🎉',
  },
  compartir_pack: {
    label:       'Compartir pack en redes',
    descripcion: 'Compartís tu pack armado',
    tokens:      1,
    unica_vez:   true,
    emoji:       '📲',
  },
  primera_compra: {
    label:       'Primera cuponera',
    descripcion: 'Comprás tu primera cuponera',
    tokens:      3,
    unica_vez:   true,
    emoji:       '🛍️',
  },
};

// ─── Obtener wallet del usuario ───────────────────────────────
export async function getWallet(userId) {
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

// ─── Otorgar tokens por una acción ───────────────────────────
export async function otorgarTokens(userId, accionKey, referenciaId = null) {
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
    cantidad:     accion.tokens,
    descripcion:  accion.label,
    referencia_id: referenciaId,
  });

  // Actualizar o crear el wallet
  const wallet = await getWallet(userId);

  if (wallet.user_id) {
    await supabase
      .from('usuario_tokens')
      .update({ balance: wallet.balance + accion.tokens })
      .eq('user_id', userId);
  } else {
    await supabase
      .from('usuario_tokens')
      .insert({ user_id: userId, balance: accion.tokens });
  }

  return { ok: true, tokens: accion.tokens, mensaje: accion.label };
}

// ─── Gastar tokens en el checkout ────────────────────────────
export async function gastarTokens(userId, cantidad, cuponeraId) {
  const wallet = await getWallet(userId);
  if (wallet.balance < cantidad)
    return { ok: false, mensaje: 'No tenés suficientes tokens' };

  await supabase
    .from('usuario_tokens')
    .update({ balance: wallet.balance - cantidad })
    .eq('user_id', userId);

  await supabase.from('token_movimientos').insert({
    user_id:       userId,
    tipo:          'gastado_cuponera',
    cantidad:      -cantidad,
    descripcion:   'Tokens usados en cuponera',
    referencia_id: cuponeraId,
  });

  return { ok: true };
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