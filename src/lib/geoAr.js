// ============================================================
//  src/lib/geoAr.js
//  Búsqueda de destinos en toda la Argentina (provincias, municipios
//  y localidades) usando la API pública georef del gobierno nacional
//  (apis.datos.gob.ar). Es gratuita, sin API key y tolera texto parcial
//  y sin acentos ("cordob" → Córdoba, "barilo" → Bariloche).
// ============================================================

const BASE = 'https://apis.datos.gob.ar/georef/api';

async function fetchJson(url, signal) {
  try {
    const r = await fetch(url, { signal });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null; // abort o red caída → sin resultados de esa fuente
  }
}

// Busca destinos que coincidan con `q`. Devuelve una lista normalizada
// [{ id, nombre, provincia, tipo }] con provincias primero, deduplicada.
export async function buscarDestinosAr(q, signal) {
  const term = (q || '').trim();
  if (term.length < 2) return [];
  const n = encodeURIComponent(term);

  const [prov, muni, loc] = await Promise.all([
    fetchJson(`${BASE}/provincias?nombre=${n}&max=6&campos=id,nombre`, signal),
    fetchJson(`${BASE}/municipios?nombre=${n}&max=10&campos=id,nombre,provincia`, signal),
    fetchJson(`${BASE}/localidades?nombre=${n}&max=10&campos=id,nombre,provincia`, signal),
  ]);

  const out = [];
  const vistos = new Set();
  const push = (item) => {
    if (!item.nombre) return;
    const key = `${item.nombre}|${item.provincia}`.toLowerCase();
    if (vistos.has(key)) return;
    vistos.add(key);
    out.push(item);
  };

  (prov?.provincias || []).forEach(p =>
    push({ id: `prov-${p.id}`, nombre: p.nombre, provincia: p.nombre, tipo: 'provincia' }));
  (muni?.municipios || []).forEach(m =>
    push({ id: `muni-${m.id}`, nombre: m.nombre, provincia: m.provincia?.nombre || '', tipo: 'municipio' }));
  (loc?.localidades || []).forEach(l =>
    push({ id: `loc-${l.id}`, nombre: l.nombre, provincia: l.provincia?.nombre || '', tipo: 'localidad' }));

  return out.slice(0, 12);
}
