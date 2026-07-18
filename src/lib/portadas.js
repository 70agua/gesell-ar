// ============================================================
//  src/lib/portadas.js
//  Imágenes de portada que ocupan la primera ficha de los
//  listings. Se cargan por categoría desde el panel superadmin y
//  rotan de forma arbitraria sin repetición dentro de cada categoría.
// ============================================================

import { supabase } from './supabase';

export const PORTADA_CATEGORIAS = [
  { value: 'alojamiento',     label: 'Alojamientos' },
  { value: 'salidas',         label: 'Salidas' },
  { value: 'aventura_relax',  label: 'Aventura & Relax' },
  { value: 'general',         label: 'General (sin categoría)' },
];

// ─── Lectura pública: portadas activas de una categoría ───
export async function getPortadas(categoria) {
  let q = supabase
    .from('portadas')
    .select('*')
    .eq('activa', true)
    .order('orden', { ascending: true });
  if (categoria) q = q.in('categoria', [categoria, 'general']);
  const { data } = await q;
  return data || [];
}

// ─── Elige una portada al azar sin repetir la última mostrada ──
//  Guarda en localStorage el último id por categoría para evitar
//  que salga dos veces seguidas (si hay más de una cargada).
export function elegirPortada(lista, categoria = 'general') {
  if (!lista || lista.length === 0) return null;
  if (lista.length === 1) return lista[0];
  const key = `portada_last_${categoria}`;
  let ultimo = null;
  try { ultimo = localStorage.getItem(key); } catch { /* ignore */ }
  const candidatas = lista.filter(p => String(p.id) !== String(ultimo));
  const pool = candidatas.length > 0 ? candidatas : lista;
  const elegida = pool[Math.floor(Math.random() * pool.length)];
  try { localStorage.setItem(key, String(elegida.id)); } catch { /* ignore */ }
  return elegida;
}

// ─── CRUD superadmin ──────────────────────────────────────────
export async function listarPortadasAdmin() {
  const { data } = await supabase
    .from('portadas')
    .select('*')
    .order('categoria', { ascending: true })
    .order('orden', { ascending: true });
  return data || [];
}

export async function crearPortada({ categoria, imagen_url, link = null, orden = 0 }) {
  return supabase.from('portadas').insert({ categoria, imagen_url, link, orden }).select().single();
}

export async function actualizarPortada(id, cambios) {
  return supabase.from('portadas').update(cambios).eq('id', id).select().single();
}

export async function eliminarPortada(id) {
  return supabase.from('portadas').delete().eq('id', id);
}
