// ============================================================
//  src/lib/localidades.js
//
//  LOCALIDADES era un array literal hardcodeado — violaba el principio de
//  "nunca hardcodear geografía" y no tenía forma de crecer a una ciudad
//  nueva sin tocar código. Se reemplaza (2026-08-18, brief de scope
//  regional) por un fetch cacheado a la tabla `localidades`, scopeado a la
//  ciudad activa (ver src/lib/scope.js). Cada ciudad cachea aparte —
//  Villa Gesell y Mar del Plata no comparten localidades.
//
//  VECINAS/getVecinas() se dejan TAL CUAL: la firma no cambia para no
//  romper a quien ya las llama (mismo criterio que ZONAS en el brief —
//  no todo lo geográfico necesita migrar en esta tanda). Es una curaduría
//  manual de cercanía, no algo que hoy convenga derivar en vivo.
// ============================================================

import { supabase } from './supabase';

const _cache = new Map(); // ciudadId -> [{ id, slug, nombre, orden }]

export async function getLocalidadesDeCiudad(ciudadId) {
  if (!ciudadId) return [];
  if (_cache.has(ciudadId)) return _cache.get(ciudadId);
  const { data } = await supabase
    .from('localidades')
    .select('id, slug, nombre, orden')
    .eq('ciudad_id', ciudadId)
    .order('orden');
  const rows = data || [];
  _cache.set(ciudadId, rows);
  return rows;
}

// Zonas transversales — aplican a cualquier localidad. Se queda hardcodeada
// a propósito: es vocabulario genérico ("Centro", "Zona norte"), no un dato
// geográfico específico de un destino.
export const ZONAS = [
  "Centro",
  "Zona norte",
  "Zona sur",
  "Línea de playa",
  "A 100m de playa",
  "Casco histórico",
  "Barrio de los médanos",
  "Bosque",
  "Zona de hoteles",
  "Zona residencial",
  "Costa",
  "Acceso principal",
];

// Localidades vecinas ordenadas por cercanía — curaduría manual, no se
// deriva de lat/lng. Firma sin cambios: getVecinas(nombre) → [nombres].
const VECINAS = {
  "Villa Gesell":      ["Las Gaviotas", "Mar de las Pampas", "Mar Azul"],
  "Las Gaviotas":      ["Villa Gesell", "Mar de las Pampas", "Mar Azul"],
  "Mar de las Pampas": ["Las Gaviotas", "Mar Azul", "Villa Gesell"],
  "Mar Azul":          ["Mar de las Pampas", "Las Gaviotas", "Villa Gesell"],
};

// Antes caía a LOCALIDADES (el array literal) para las localidades sin
// entrada en VECINAS. Ya no hay array literal a mano acá — quien llame con
// una localidad no curada recibe [] en vez de "todas las demás menos yo".
// Es un cambio de comportamiento real, pero acotado: sólo afecta a
// "Chacras del Mar" y "El Salvaje", que no tenían vecinas curadas y ya
// devolvían una lista poco significativa (literalmente "todas las otras").
export function getVecinas(localidad) {
  return VECINAS[localidad] || [];
}
