// ============================================================
//  src/lib/publicidad.js
//  Imágenes publicitarias que ocupan la primera ficha de los
//  listings. Se cargan por categoría desde el panel superadmin y
//  rotan de forma arbitraria sin repetición dentro de cada categoría.
// ============================================================

import { supabase } from './supabase';

export const PUBLI_CATEGORIAS = [
  { value: 'alojamiento',     label: 'Alojamientos' },
  { value: 'salidas',         label: 'Salidas' },
  { value: 'aventura_relax',  label: 'Aventura & Relax' },
  { value: 'general',         label: 'General (sin categoría)' },
];

// ─── Lectura pública: publicidades activas de una categoría ───
export async function getPublicidades(categoria) {
  let q = supabase
    .from('publicidades')
    .select('*')
    .eq('activa', true)
    .order('orden', { ascending: true });
  if (categoria) q = q.in('categoria', [categoria, 'general']);
  const { data } = await q;
  return data || [];
}

// ─── Elige una publicidad al azar sin repetir la última mostrada ──
//  Guarda en localStorage el último id por categoría para evitar
//  que salga dos veces seguidas (si hay más de una cargada).
export function elegirPublicidad(lista, categoria = 'general') {
  if (!lista || lista.length === 0) return null;
  if (lista.length === 1) return lista[0];
  const key = `publi_last_${categoria}`;
  let ultimo = null;
  try { ultimo = localStorage.getItem(key); } catch { /* ignore */ }
  const candidatas = lista.filter(p => String(p.id) !== String(ultimo));
  const pool = candidatas.length > 0 ? candidatas : lista;
  const elegida = pool[Math.floor(Math.random() * pool.length)];
  try { localStorage.setItem(key, String(elegida.id)); } catch { /* ignore */ }
  return elegida;
}

// ─── CRUD superadmin ──────────────────────────────────────────
export async function listarPublicidadesAdmin() {
  const { data } = await supabase
    .from('publicidades')
    .select('*')
    .order('categoria', { ascending: true })
    .order('orden', { ascending: true });
  return data || [];
}

export async function crearPublicidad({ categoria, imagen_url, link = null, orden = 0 }) {
  return supabase.from('publicidades').insert({ categoria, imagen_url, link, orden }).select().single();
}

export async function actualizarPublicidad(id, cambios) {
  return supabase.from('publicidades').update(cambios).eq('id', id).select().single();
}

export async function eliminarPublicidad(id) {
  return supabase.from('publicidades').delete().eq('id', id);
}
