// ============================================================
//  src/lib/datos.js  — Supabase como única fuente de datos
// ============================================================

import { supabase } from './supabase';

// ─── Localidades cercanas ─────────────────────────────────────
const LOCALIDADES_CERCANAS = {
  'Villa Gesell':      ['Las Gaviotas', 'Mar de las Pampas', 'Mar Azul'],
  'Las Gaviotas':      ['Villa Gesell', 'Mar de las Pampas'],
  'Mar de las Pampas': ['Villa Gesell', 'Las Gaviotas', 'Mar Azul'],
  'Mar Azul':          ['Mar de las Pampas', 'Las Gaviotas', 'Villa Gesell'],
  'Chacras del Mar':   ['Mar de las Pampas', 'Las Gaviotas', 'Villa Gesell'],
  'Colonia Marina':    ['Villa Gesell', 'Las Gaviotas'],
  'El Salvaje':        ['Villa Gesell'],
};

export const TIPOS_ALOJ   = new Set(['alojamiento', 'Hotel', 'Cabaña', 'Departamento', 'Domo', 'Dormi', 'Carpa', 'Casa', 'Hostel', 'Glamping']);
const TIPOS_GASTRO = new Set(['salidas', 'Restaurante', 'Restaurantes', 'Bar', 'Bares', 'Café', 'Cafés & Dulces', 'Cafés y Dulces', 'Balneario', 'Gourmet', 'Pastelería', 'Parrilla', 'Heladería', 'Heladerías', 'Bodegón', 'Panadería', 'Panaderías', 'Discoteca', 'Discotecas', 'Cine y Teatro', 'Cines y Teatros', 'Show y Recital', 'Shows y Recitales', 'Centro Cultural', 'Centros Culturales', 'Otro', 'Otros']);
const TIPOS_EXP    = new Set(['aventura_relax', 'Experiencia', 'Excursion', 'Actividad', 'Spa', 'Deportes acuáticos', 'Cabalgatas', 'Kitesurf', 'Yoga / Bienestar', 'Masajes a domicilio', 'Tour fotográfico', 'Pesca deportiva', 'Senderismo', 'Espectáculos']);

export function categoriaDeNegocio(tipo, negocioId) {
  if (!tipo && negocioId)  return 'alojamiento';
  if (!tipo && !negocioId) return 'aventura_relax';
  if (TIPOS_ALOJ.has(tipo))   return 'alojamiento';
  if (TIPOS_GASTRO.has(tipo)) return 'salidas';
  if (TIPOS_EXP.has(tipo))    return 'aventura_relax';
  return negocioId ? 'alojamiento' : 'aventura_relax';
}

function normalizeNegocio(n) {
  return {
    id:                n.id,
    name:              n.nombre,
    type:              n.tipo,
    precioMin:         n.precio_min          || 0,
    precioMinEspecial: n.precio_min_especial || 0,
    unidadPrecio:      n.unidad_precio       || 'noche',
    packPrecio:        n.pack_precio         || 0,
    packNoches:        n.pack_noches         || null,
    packAclaracion:    n.pack_aclaracion     || '',
    rating:            n.rating              || 4.5,
    image:             n.imagen_url          || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    location:          n.ubicacion           || n.localidad || 'Villa Gesell',
    localidad:         n.localidad           || '',
    zona:              n.zona                || '',
    address:           n.direccion           || n.ubicacion || '',
    category:          n.tipo                || '',
    priceRange:        n.precio_rango        || null,
    tags:              n.tags                || [],
    description:       n.descripcion         || '',
    iconName:          iconPorTipo(n.tipo),
    fotoPerfil:        n.foto_perfil         || null,
    lat:               n.lat != null ? Number(n.lat) : null,
    lng:               n.lng != null ? Number(n.lng) : null,
    plan:              n.plan                || 'free',
    esReal:            true,
  };
}

function normalizePromo(p) {
  return {
    id:               p.id,
    negocioId:        p.negocio_id,
    offerType:        p.offer_type       || 'Normal',
    title:            p.titulo,
    subtitle:         p.subtitulo        || p.negocios?.nombre || '',
    badge:            p.badge            || 'Promo',
    image:            p.imagen_url       || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    fechaFinFlash:    p.fecha_fin_flash,
    tokens_costo:     p.tokens_costo,
    ahorroEstimado:   p.ahorro_estimado  || 0,
    ahorroMax:        p.ahorro_max       || null,
    aprobada:         p.aprobada,
    categoria:        categoriaDeNegocio(p.negocios?.tipo, p.negocio_id),
    negocioTipo:      p.negocios?.tipo   || '',
    proveedorNombre:  p.negocios?.nombre || '',
    proveedorImage:   p.negocios?.foto_perfil || p.negocios?.imagen_url || null,
    negocioLocalidad: p.negocios?.localidad  || p.negocios?.ubicacion || '',
    negocioZone:      p.negocios?.zona       || '',
    esReal:           true,
  };
}

// ─── Alojamientos ─────────────────────────────────────────────
export async function getAlojamientos() {
  const { data } = await supabase
    .from('negocios')
    .select('*')
    .eq('aprobado', true)
    .eq('activo', true)
    .in('tipo', ['alojamiento', 'Hotel', 'Cabaña', 'Departamento', 'Casa', 'Hostel', 'Dormi', 'Domo', 'Carpa', 'Glamping'])
    .order('creado_en', { ascending: false });

  return (data || []).map(normalizeNegocio);
}

// ─── Salidas ──────────────────────────────────────────────
export async function getGastronomia() {
  const { data } = await supabase
    .from('negocios')
    .select('*')
    .eq('aprobado', true)
    .eq('activo', true)
    .in('tipo', ['salidas', 'Restaurante', 'Bar', 'Café', 'Balneario', 'Pastelería', 'Gourmet', 'Parrilla', 'Heladería', 'Bodegón'])
    .order('creado_en', { ascending: false });

  return (data || []).map(normalizeNegocio);
}

// ─── Aventura & Relax ──────────────────────────────────────────
export async function getAventura() {
  const tiposExp = [...TIPOS_EXP].filter(t => t !== 'aventura_relax');
  const { data } = await supabase
    .from('negocios')
    .select('*')
    .eq('aprobado', true)
    .eq('activo', true)
    .in('tipo', tiposExp)
    .order('creado_en', { ascending: false });

  return (data || []).map(normalizeNegocio);
}

// ─── Promociones ──────────────────────────────────────────────
export async function getPromos(limit = 8) {
  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, ubicacion, localidad, zona, foto_perfil, imagen_url)')
    .eq('activa', true)
    .eq('aprobada', true)
    .order('creado_en', { ascending: false })
    .limit(limit);

  const now = Date.now();
  return (data || [])
    .map(normalizePromo)
    .filter(p => p.offerType !== 'Flash' || (p.fechaFinFlash && new Date(p.fechaFinFlash).getTime() > now));
}

// ─── Ofertas destacadas para la home ──────────────────────────
export async function getOfertasDestacadas() {
  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, ubicacion, localidad, zona, foto_perfil, imagen_url)')
    .eq('activa', true)
    .eq('aprobada', true)
    .eq('destacada_home', true)
    .order('creado_en', { ascending: false });

  return (data || []).map(normalizePromo);
}

// ─── Promos propias de un negocio ─────────────────────────────
export async function getPromosDeNegocio(negocioId) {
  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, ubicacion, localidad, zona, foto_perfil, imagen_url)')
    .eq('negocio_id', negocioId)
    .eq('aprobada', true)
    .eq('activa', true);

  return (data || []).map(normalizePromo);
}

// ─── Alianzas de un negocio ───────────────────────────────────
export async function getAlianzasPorNegocio(negocioId) {
  const { data } = await supabase
    .from('alianzas')
    .select('*, promociones(*, negocios(nombre, localidad, foto_perfil, imagen_url))')
    .eq('negocio_id', negocioId)
    .eq('aprobada', true);

  return (data || []).map(a => ({
    ...a,
    promo: a.promociones ? normalizePromo({ ...a.promociones, negocios: a.promociones.negocios }) : null,
  }));
}

// ─── Promos de la localidad (salidas + aventura & relax) ───────────
export async function getPromosLocalidad(localidad, excludeNegocioId = null) {
  const cercanas = LOCALIDADES_CERCANAS[localidad] || [];
  const localidades = [localidad, ...cercanas].filter(Boolean);

  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, ubicacion, localidad, zona, foto_perfil, imagen_url)')
    .eq('activa', true)
    .eq('aprobada', true)
    .in('negocios.localidad', localidades);

  return (data || [])
    .map(normalizePromo)
    .filter(p =>
      p.categoria !== 'alojamiento' &&
      (excludeNegocioId ? p.negocioId !== excludeNegocioId : true) &&
      localidades.includes(p.negocioLocalidad)
    )
    .sort((a, b) => (a.negocioLocalidad === localidad ? -1 : 1) - (b.negocioLocalidad === localidad ? -1 : 1));
}

export async function getNegocioById(id) {
  const { data } = await supabase
    .from('negocios')
    .select('*')
    .eq('id', id)
    .single();
  return data ? normalizeNegocio(data) : null;
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
