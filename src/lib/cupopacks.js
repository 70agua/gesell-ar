// ============================================================
//  src/lib/cupopacks.js
//  Cupopacks = selecciones curadas de cupones que arma
//  el superadmin. Por ahora sólo nombre, estado y localidad.
// ============================================================

import { supabase } from './supabase';

// Devuelve todos los Cupopacks con los ids de sus cupones.
export async function listarCupopacks() {
  const { data, error } = await supabase
    .from('cuponeras_locales')
    .select('*, cuponeras_locales_cupones(promocion_id)')
    .order('creado_en', { ascending: false });
  if (error) return { data: [], error };
  const filas = (data || []).map(c => ({
    ...c,
    promocionIds: (c.cuponeras_locales_cupones || []).map(x => x.promocion_id),
  }));
  return { data: filas, error: null };
}

// `familia` es la categoría con la que se filtra en "Packs todo incluido"
// (ids en lib/familiasPack.js). Se puede fijar desde el alta: antes sólo se
// podía después, entrando a editar, y por eso quedaban todas sin categoría.
export async function crearCupopack({ nombre, descripcion = null, badge = null, imagen_url = null, beneficio_adicional = null, beneficio_icono = null, beneficio_tipo = null, beneficio_valor = null, localidad = null, familia = null, estado = 'activa' }) {
  return supabase.from('cuponeras_locales').insert({ nombre, descripcion, badge, imagen_url, beneficio_adicional, beneficio_icono, beneficio_tipo, beneficio_valor, localidad, familia, estado }).select().single();
}

export async function actualizarCupopack(id, campos) {
  return supabase.from('cuponeras_locales').update(campos).eq('id', id).select().single();
}

export async function eliminarCupopack(id) {
  return supabase.from('cuponeras_locales').delete().eq('id', id);
}

// Agrega/quita un cupón del Cupopack.
// Ojo: las columnas y tablas siguen con el nombre viejo (`cuponeras_locales*`,
// `cuponera_local_id`) — la Fase 2 renombra vocabulario, no el esquema.
export async function agregarCuponASet(cupopackId, promocionId) {
  return supabase.from('cuponeras_locales_cupones').insert({ cuponera_local_id: cupopackId, promocion_id: promocionId });
}

export async function quitarCuponDeSet(cupopackId, promocionId) {
  return supabase.from('cuponeras_locales_cupones').delete()
    .eq('cuponera_local_id', cupopackId).eq('promocion_id', promocionId);
}
