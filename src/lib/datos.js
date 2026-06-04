// ============================================================
//  src/lib/datos.js
//  Capa de datos: combina Supabase con mockData de respaldo.
// ============================================================

import { supabase } from './supabase';
import { mockAccommodations, mockDining, ALL_PROMOS, mockAlianzas, PROMO_META } from '../data/mockData';

// Enriquece una promo mock con tokens_costo, tarifaValidez y description
function enrichPromo(p) {
  const meta = PROMO_META[p.id] || {};
  return { ...p, ...meta };
}

// ─── Localidades cercanas (para "Más descuentos en la zona") ─
const LOCALIDADES_CERCANAS = {
  'Villa Gesell':      ['Las Gaviotas', 'Mar de las Pampas', 'Mar Azul'],
  'Las Gaviotas':      ['Villa Gesell', 'Mar de las Pampas'],
  'Mar de las Pampas': ['Villa Gesell', 'Las Gaviotas', 'Mar Azul'],
  'Mar Azul':          ['Mar de las Pampas', 'Las Gaviotas', 'Villa Gesell'],
  'Chacras del Mar':   ['Mar de las Pampas', 'Las Gaviotas', 'Villa Gesell'],
  'Colonia Marina':    ['Villa Gesell', 'Las Gaviotas'],
  'El Salvaje':        ['Villa Gesell'],
};

const MIN_ALOJAMIENTOS = 11;
const MIN_GASTRONOMIA  = 10;
const MIN_PROMOS       = 4;

// ─── Semilla basada en ciclo de 6 horas ──────────────────────
// Igual para todos los usuarios durante el mismo ciclo
function getSeedDelCiclo() {
  const ahora = new Date();
  return Math.floor(ahora.getTime() / (1000 * 60 * 60 * 6));
}

// Mezcla determinista basada en una semilla numérica
function shuffleConSemilla(array, semilla) {
  const arr = [...array];
  let s = semilla;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Alojamientos ────────────────────────────────────────────
export async function getAlojamientos() {
  const { data } = await supabase
    .from('negocios')
    .select('*')
    .eq('aprobado', true)
    .eq('activo', true)
    .in('tipo', ['Hotel', 'Cabaña', 'Departamento'])
    .order('creado_en', { ascending: false });

  const reales = (data || []).map(normalizeNegocio);

  // Mocks primero (para que los ejemplos con precios sean visibles inmediatamente),
  // luego los reales de Supabase sin duplicar IDs.
  const idsReales = new Set(reales.map((n) => String(n.id)));
  const mockFiltrado = mockAccommodations.filter((m) => !idsReales.has(String(m.id)));

  return [...mockFiltrado, ...reales];
}

// ─── Gastronomía ─────────────────────────────────────────────
export async function getGastronomia() {
  const { data } = await supabase
    .from('negocios')
    .select('*')
    .eq('aprobado', true)
    .eq('activo', true)
    .in('tipo', ['Restaurante', 'Bar', 'Café', 'Balneario', 'Pastelería', 'Gourmet'])
    .order('creado_en', { ascending: false });

  const reales = (data || []).map(normalizeNegocio);
  const idsReales = new Set(reales.map((n) => String(n.id)));
  const mockFiltrado = mockDining.filter((m) => !idsReales.has(String(m.id)));

  const faltantes = Math.max(0, MIN_GASTRONOMIA - reales.length);
  return [...reales, ...mockFiltrado.slice(0, faltantes)];
}

// ─── Promociones ─────────────────────────────────────────────
export async function getPromos(limit = 4) {
  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, ubicacion, localidad, zona, foto_perfil, imagen_url)')
    .eq('activa', true)
    .eq('aprobada', true)
    .order('creado_en', { ascending: false });

  const TIPOS_ALOJ    = new Set(['Hotel', 'Cabaña', 'Departamento', 'Casa', 'Hostel', 'Dormi']);
  const TIPOS_GASTRO  = new Set(['Restaurante', 'Bar', 'Café', 'Balneario', 'Gourmet', 'Pastelería', 'Parrilla', 'Heladería', 'Bodegón', 'Café & Dulces']);
  const TIPOS_EXP     = new Set(['Experiencia', 'Excursion', 'Actividad', 'Spa']);

  function categoriaDeNegocio(tipo, negocioId) {
    if (!tipo && negocioId)  return 'alojamiento'; // fallback si tiene negocio
    if (!tipo && !negocioId) return 'experiencia';
    if (TIPOS_ALOJ.has(tipo))   return 'alojamiento';
    if (TIPOS_GASTRO.has(tipo)) return 'gastronomia';
    if (TIPOS_EXP.has(tipo))    return 'experiencia';
    return negocioId ? 'alojamiento' : 'experiencia';
  }

  const reales = (data || []).map((p) => ({
    id:               p.id,
    negocioId:        p.negocio_id,
    offerType:        p.offer_type || 'Normal',
    title:            p.titulo,
    subtitle:         p.subtitulo || p.negocios?.nombre || '',
    badge:            p.badge || 'Promo',
    image:            p.imagen_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    fechaFinFlash:    p.fecha_fin_flash,
    tokens_costo:     p.tokens_costo,
    ahorroEstimado:   p.ahorro_estimado || 0,
    aprobada:         p.aprobada,
    categoria:        categoriaDeNegocio(p.negocios?.tipo, p.negocio_id),
    // Datos del proveedor para la ficha
    proveedorNombre:  p.negocios?.nombre || '',
    proveedorImage:   p.negocios?.foto_perfil || p.negocios?.imagen_url || null,
    negocioLocalidad: p.negocios?.localidad || p.negocios?.ubicacion || '',
    negocioZone:      p.negocios?.zona || '',
    esReal:           true,
  }));

  // Filtrar flash expiradas (real y mock)
  const now = Date.now();
  const noExpirada = (p) =>
    p.offerType !== 'Flash' || (p.fechaFinFlash && new Date(p.fechaFinFlash).getTime() > now);

  const realesFiltradas = reales.filter(noExpirada);

  const semilla = getSeedDelCiclo();
  const faltantes = Math.max(0, limit - realesFiltradas.length);
  const mockRespaldo = shuffleConSemilla(ALL_PROMOS, semilla)
    .filter(noExpirada)
    .slice(0, faltantes)
    .map(enrichPromo);
  const todas = [...realesFiltradas, ...mockRespaldo];
  return shuffleConSemilla(todas, semilla).slice(0, limit);
}

// ─── Ofertas destacadas para la home (seleccionadas por superadmin) ──
export async function getOfertasDestacadas() {
  const TIPOS_ALOJ   = new Set(['Hotel', 'Cabaña', 'Departamento', 'Casa', 'Hostel', 'Dormi']);
  const TIPOS_GASTRO = new Set(['Restaurante', 'Bar', 'Café', 'Balneario', 'Gourmet', 'Pastelería', 'Parrilla', 'Heladería', 'Bodegón', 'Café & Dulces']);
  const TIPOS_EXP    = new Set(['Experiencia', 'Excursion', 'Actividad', 'Spa']);

  function categoriaDeNegocio(tipo, negocioId) {
    if (!tipo && negocioId)  return 'alojamiento';
    if (!tipo && !negocioId) return 'experiencia';
    if (TIPOS_ALOJ.has(tipo))   return 'alojamiento';
    if (TIPOS_GASTRO.has(tipo)) return 'gastronomia';
    if (TIPOS_EXP.has(tipo))    return 'experiencia';
    return negocioId ? 'alojamiento' : 'experiencia';
  }

  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, ubicacion, localidad, zona, foto_perfil, imagen_url)')
    .eq('activa', true)
    .eq('aprobada', true)
    .eq('destacada_home', true)
    .order('creado_en', { ascending: false });

  return (data || []).map(p => ({
    id:               p.id,
    negocioId:        p.negocio_id,
    offerType:        p.offer_type || 'Normal',
    title:            p.titulo,
    subtitle:         p.subtitulo || p.negocios?.nombre || '',
    badge:            p.badge || 'Promo',
    image:            p.imagen_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    fechaFinFlash:    p.fecha_fin_flash,
    tokens_costo:     p.tokens_costo,
    ahorroEstimado:   p.ahorro_estimado || 0,
    aprobada:         p.aprobada,
    categoria:        categoriaDeNegocio(p.negocios?.tipo, p.negocio_id),
    proveedorNombre:  p.negocios?.nombre || '',
    proveedorImage:   p.negocios?.foto_perfil || p.negocios?.imagen_url || null,
    negocioLocalidad: p.negocios?.localidad || p.negocios?.ubicacion || '',
    negocioZone:      p.negocios?.zona || '',
    esReal:           true,
  }));
}

// ─── Normalizar negocio de Supabase al formato del front ──────
function normalizeNegocio(n) {
  return {
    id:          n.id,
    name:        n.nombre,
    type:        n.tipo,
    precioMin:         n.precio_min          || 0,
    precioMinEspecial: n.precio_min_especial || 0,
    unidadPrecio:      n.unidad_precio       || 'noche',
    packPrecio:        n.pack_precio         || 0,
    packNoches:        n.pack_noches         || null,
    packAclaracion:    n.pack_aclaracion     || '',
    rating:      n.rating      || 4.5,
    image:       n.imagen_url  || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    location:    n.ubicacion   || n.localidad || 'Villa Gesell',
    localidad:   n.localidad   || '',
    zona:        n.zona        || '',
    address:     n.direccion   || n.ubicacion || '',
    category:    n.tipo        || '',
    priceRange:  n.precio_rango || null,
    tags:        n.tags        || [],
    description: n.descripcion || '',
    iconName:    iconPorTipo(n.tipo),
    esReal:      true,
  };
}

// ─── Promos propias de un negocio (mock) ─────────────────────
export function getPromosDeNegocio(negocioId) {
  return ALL_PROMOS.filter(p => p.negocioId === negocioId).map(enrichPromo);
}

// ─── Beneficios exclusivos que un hotel ofrece a sus huéspedes
export function getAlianzasPorNegocio(negocioId) {
  return mockAlianzas
    .filter(a => a.negocioId === negocioId)
    .map(a => {
      const promo = ALL_PROMOS.find(p => p.id === a.promoId);
      return promo ? { ...a, promo: enrichPromo(promo) } : null;
    })
    .filter(Boolean);
}

// ─── Promos (gastro + experiencias) de la misma localidad ────
// Excluye promos de alojamientos y el propio negocio.
// Devuelve primero las de la localidad exacta, luego cercanas.
export function getPromosLocalidad(localidad, excludeNegocioId = null) {
  const cercanas = LOCALIDADES_CERCANAS[localidad] || [];
  return ALL_PROMOS.filter(p =>
    p.categoria !== 'alojamiento' &&
    (p.negocioZone === localidad || cercanas.includes(p.negocioZone)) &&
    p.negocioId !== excludeNegocioId
  ).sort((a, b) => {
    const aLocal = a.negocioZone === localidad ? 0 : 1;
    const bLocal = b.negocioZone === localidad ? 0 : 1;
    return aLocal - bLocal;
  }).map(enrichPromo);
}

function iconPorTipo(tipo) {
  const mapa = {
    Restaurante: 'Utensils',
    Bar:         'Beer',
    Café:        'Coffee',
    Balneario:   'Waves',
    Gourmet:     'Wine',
    Pastelería:  'Cookie',
  };
  return mapa[tipo] || 'Utensils';
}
