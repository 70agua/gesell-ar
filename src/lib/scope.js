// ============================================================
//  src/lib/scope.js
//  Estado de sesión del SCOPE regional — mismo patrón que
//  src/lib/busqueda.js (objeto plano con getters/setters, sin
//  reactividad propia), pero con dos diferencias necesarias:
//    · region/ciudad son OBJETOS de la base (regiones/ciudades), no strings.
//    · como los datos vienen de Supabase, hay que resolverlos async una
//      vez al arrancar — busqueda.js no tenía ese problema.
//  La reactividad la da un evento en window (cuponear:scope), mismo
//  patrón que ya usa cuponear:home-reset: cualquier componente puede
//  escucharlo sin que este módulo conozca a React. useScope.js es el
//  único punto de entrada pensado para consumir esto desde un componente.
// ============================================================

import { supabase } from './supabase';

const STORAGE_KEY = 'cuponear:scope';
const EVENTO      = 'cuponear:scope';

let _regiones = null; // cache en memoria — todas (activas + waitlist)
let _ciudades = null; // cache en memoria — todas, de cualquier región
let _cargando = null; // promesa en curso, para no disparar el fetch dos veces
let _state    = { region: null, ciudad: null };

// ─── Catálogo (una sola carga, cacheada en memoria) ───────────
async function cargarCatalogo() {
  if (_regiones && _ciudades) return { regiones: _regiones, ciudades: _ciudades };
  if (_cargando) return _cargando;
  _cargando = (async () => {
    const [{ data: regiones }, { data: ciudades }] = await Promise.all([
      supabase.from('regiones').select('*').order('orden'),
      supabase.from('ciudades').select('*').order('orden'),
    ]);
    _regiones = regiones || [];
    _ciudades = ciudades || [];
    return { regiones: _regiones, ciudades: _ciudades };
  })();
  return _cargando;
}

// ─── Helpers de URL / storage / dominio ───────────────────────
// Sólo se lee/escribe el PRIMER segmento del path como slug de región. No
// hay router todavía (Fase 2 del brief, deliberadamente afuera de esta
// tanda): esto no es "/:region/:vista", es sólo la región. Deja la URL
// correcta y estable para cuando el router llegue, sin tocar cómo navega
// el resto de la app hoy (view en estado de React, sin leer la URL).
function leerSlugDePath() {
  if (typeof window === 'undefined') return null;
  return window.location.pathname.split('/').filter(Boolean)[0] || null;
}

function escribirSlugEnPath(slug, { push = false } = {}) {
  if (typeof window === 'undefined' || !slug) return;
  if (leerSlugDePath() === slug) return;
  const metodo = push ? 'pushState' : 'replaceState';
  window.history[metodo](null, '', `/${slug}`);
}

function leerStorage() {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
  catch { return null; }
}

function guardarStorage(regionSlug, ciudadSlug) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ region: regionSlug, ciudad: ciudadSlug || null })); }
  catch { /* localStorage puede fallar en privado/cuota — no es crítico */ }
}

// 'gesell.ar' en cualquier entorno; localhost cae en gesell.ar para que el
// desarrollo local no necesite pisar el hostname a mano (mismo criterio que
// ya usaba siteHost() en Navbar.jsx antes de esto).
function hostnameActual() {
  if (typeof window === 'undefined') return 'gesell.ar';
  return window.location.hostname.replace('www.', '').replace('localhost', 'gesell.ar');
}

// ─── Resolución del scope inicial ─────────────────────────────
// Cascada de prioridad, en este orden — cada paso sólo se intenta si el
// anterior no resolvió nada:
//   1. Path de la URL       (/costa-atlantica/...)
//   2. localStorage         (visita anterior)
//   3. Dominio               (gesell.ar → costa-atlantica + villa-gesell)
//   4. Región activa por defecto (orden más bajo)
export async function resolverScopeInicial() {
  const { regiones, ciudades } = await cargarCatalogo();
  const activas = regiones.filter(r => r.activa);

  let region = null;
  let ciudad = null;

  const slugPath = leerSlugDePath();
  if (slugPath) region = activas.find(r => r.slug === slugPath) || null;

  if (!region) {
    const guardado = leerStorage();
    if (guardado?.region) {
      region = activas.find(r => r.slug === guardado.region) || null;
      if (region && guardado.ciudad) {
        ciudad = ciudades.find(c => c.slug === guardado.ciudad && c.region_id === region.id) || null;
      }
    }
  }

  if (!region) {
    const host = hostnameActual();
    const ciudadPorDominio = ciudades.find(c => c.dominio === host);
    if (ciudadPorDominio) {
      region = activas.find(r => r.id === ciudadPorDominio.region_id) || null;
      // Preseleccionada como FILTRO, no como scope: entrar por gesell.ar
      // arranca en la región Costa Atlántica con Villa Gesell ya elegida
      // en el filtro de ciudad, pero el scope real (qué catálogo/PASS
      // aplica) sigue siendo la región entera.
      if (region) ciudad = ciudadPorDominio;
    }
  }

  if (!region) region = activas[0] || null;

  _state = { region, ciudad };
  guardarStorage(region?.slug, ciudad?.slug);
  escribirSlugEnPath(region?.slug);

  return {
    region,
    ciudad,
    ciudades: region ? ciudades.filter(c => c.region_id === region.id) : [],
  };
}

// ─── Lectura / escritura ───────────────────────────────────────
export function getScope() { return { ..._state }; }

// Cambiar de región resetea el filtro de ciudad: un filtro de la región
// vieja no tiene sentido en el catálogo nuevo.
export function setRegion(region) {
  _state = { region, ciudad: null };
  guardarStorage(region?.slug, null);
  escribirSlugEnPath(region?.slug, { push: true });
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENTO));
}

export function setCiudad(ciudad) {
  _state = { ..._state, ciudad };
  guardarStorage(_state.region?.slug, ciudad?.slug);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENTO));
}

// ─── Catálogo derivado, para el selector y los listados ────────
export async function getRegionesActivas() {
  const { regiones } = await cargarCatalogo();
  return regiones.filter(r => r.activa);
}

export async function getRegionesWaitlist() {
  const { regiones } = await cargarCatalogo();
  return regiones.filter(r => !r.activa);
}

export async function getCiudadesDeRegion(regionId) {
  if (!regionId) return [];
  const { ciudades } = await cargarCatalogo();
  return ciudades.filter(c => c.region_id === regionId);
}

// Región por id — no es el scope de navegación, es "a qué región pertenece
// ESTE pase" (usuario_pases.region_id), que puede no ser la región que el
// viajero está mirando ahora mismo. Usado por MiPaseView/CtaPase para el
// copy "Válido en toda la región X".
export async function getRegionPorId(regionId) {
  if (!regionId) return null;
  const { regiones } = await cargarCatalogo();
  return regiones.find(r => r.id === regionId) || null;
}
