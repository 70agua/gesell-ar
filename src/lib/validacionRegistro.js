// ============================================================
//  src/lib/validacionRegistro.js
//  Chequeos de unicidad usados al registrarse (nombre+apellido,
//  nombre de negocio). El email ya lo protege Supabase Auth
//  (auth.users.email es único) — no hace falta duplicar ese check acá.
// ============================================================
import { supabase } from './supabase';

// ilike sin comodines hace match exacto case-insensitive; escapamos % y _
// para que un nombre con esos caracteres no se interprete como patrón.
function escaparIlike(s) {
  return s.replace(/[%_\\]/g, m => `\\${m}`);
}

export async function existePersonaConNombre(nombreCompleto) {
  const nombre = nombreCompleto.trim();
  if (!nombre) return false;
  const { data } = await supabase
    .from('perfiles')
    .select('id')
    .ilike('nombre', escaparIlike(nombre))
    .limit(1);
  return (data?.length || 0) > 0;
}

export async function existeNegocioConNombre(nombre, { excluirId } = {}) {
  const n = (nombre || '').trim();
  if (!n) return false;
  let q = supabase.from('negocios').select('id').ilike('nombre', escaparIlike(n)).limit(1);
  if (excluirId) q = q.neq('id', excluirId);
  const { data } = await q;
  return (data?.length || 0) > 0;
}
