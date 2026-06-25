// ============================================================
//  src/lib/seguir.js — Seguir ofertas de un socio
// ============================================================
import { supabase } from './supabase';

// ¿El usuario ya sigue este negocio?
export async function esSiguiendo(usuarioId, negocioId) {
  if (!usuarioId || !negocioId) return false;
  const { data } = await supabase
    .from('seguimientos')
    .select('id')
    .eq('usuario_id', usuarioId)
    .eq('negocio_id', negocioId)
    .maybeSingle();
  return !!data;
}

// Alterna seguir / dejar de seguir. Devuelve { error }
export async function toggleSeguir(usuarioId, negocioId, seguir) {
  if (seguir) {
    return supabase.from('seguimientos').insert({ usuario_id: usuarioId, negocio_id: negocioId });
  }
  return supabase.from('seguimientos').delete().eq('usuario_id', usuarioId).eq('negocio_id', negocioId);
}

// Cantidad de seguidores de un negocio
export async function contarSeguidores(negocioId) {
  if (!negocioId) return 0;
  const { count } = await supabase
    .from('seguimientos')
    .select('id', { count: 'exact', head: true })
    .eq('negocio_id', negocioId);
  return count || 0;
}
