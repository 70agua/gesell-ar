// ============================================================
//  src/lib/adminUsuarios.js
//  Usuarios administrativos + perfiles/permisos (Ajustes generales).
//  Alta/baja de usuarios pasan por la edge function `admin-usuarios`
//  (necesita service role); el resto son queries directas con RLS
//  de superadmin.
// ============================================================

import { supabase } from './supabase';

// Capacidades que se tildan por perfil. Fuente única para los checkboxes.
export const CAPACIDADES = [
  { id: 'socios',       label: 'Gestionar socios comerciales' },
  { id: 'turistas',     label: 'Gestionar viajeros' },
  { id: 'cupones',      label: 'Gestionar cupones' },
  { id: 'cuponeras',    label: 'Gestionar Cupopacks' },
  { id: 'estadisticas', label: 'Ver estadísticas y ventas' },
  { id: 'consultas',    label: 'Ver consultas' },
  { id: 'ajustes',      label: 'Administrar ajustes (usuarios y perfiles)' },
];

// ─── Perfiles / permisos ──────────────────────────────────────
export async function listarRoles() {
  const { data } = await supabase.from('roles_permiso').select('*').order('es_sistema', { ascending: false }).order('nombre');
  return data || [];
}

export async function crearRol(nombre) {
  const permisos = Object.fromEntries(CAPACIDADES.map(c => [c.id, false]));
  return supabase.from('roles_permiso').insert({ nombre, permisos, es_sistema: false }).select().single();
}

export async function actualizarRol(id, campos) {
  return supabase.from('roles_permiso').update(campos).eq('id', id).select().single();
}

export async function eliminarRol(id) {
  return supabase.from('roles_permiso').delete().eq('id', id);
}

// ─── Usuarios administrativos ─────────────────────────────────
// Son perfiles con un rol asignado (o el superadmin).
export async function listarUsuariosAdmin() {
  const { data } = await supabase
    .from('perfiles')
    .select('id, nombre, apellido, email, rol, es_superadmin, creado_en')
    .or('es_superadmin.eq.true,rol.not.is.null')
    .order('creado_en', { ascending: true });
  return data || [];
}

async function invokeAdminUsuarios(payload) {
  const { data: sesion } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke('admin-usuarios', {
    headers: { Authorization: `Bearer ${sesion?.session?.access_token}` },
    body: payload,
  });
  if (error) {
    // En respuestas no-2xx el mensaje real viene en el body de error.context.
    let msg = 'Error de conexión';
    try { const b = await error.context?.json?.(); if (b?.error) msg = b.error; } catch { /* ignore */ }
    return { error: msg };
  }
  if (data?.error) return { error: data.error };
  return { data };
}

export async function crearUsuario({ email, password, nombre, apellido, rol }) {
  return invokeAdminUsuarios({ action: 'crear', email, password, nombre, apellido, rol });
}

export async function eliminarUsuario(userId) {
  return invokeAdminUsuarios({ action: 'eliminar', userId });
}

// Modificación de nombre/apellido/rol no toca auth → query directa.
export async function actualizarUsuario(id, { nombre, apellido, rol }) {
  return supabase.from('perfiles').update({ nombre, apellido, rol }).eq('id', id).select().single();
}
