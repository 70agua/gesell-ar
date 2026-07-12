// ============================================================
//  src/lib/datos.js  — Supabase como única fuente de datos
// ============================================================

import { supabase } from './supabase';
import { calcularPrecioCupon } from './cobros';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80';

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

// Categorías reales que un socio puede elegir al dar de alta su negocio
// (fuente única — `negocios.categoria` guarda uno o dos de estos valores,
// separados por ' / ' si son dos). Navbar y los filtros de OfertasView
// deben usar exactamente estos strings para que coincidan con los datos reales.
export const CATS_RUBRO = {
  alojamiento:    ['Hotel', 'Apart', 'Complejo', 'Hostería', 'Resort', 'Cabaña', 'Departamento', 'Domo', 'Dormi', 'Carpa', 'Glamping'],
  salidas:        ['Restaurantes', 'Bares', 'Cafeterías', 'Heladerías', 'Panaderías', 'Discotecas', 'Cines y Teatros', 'Shows y Recitales', 'Centros Culturales', 'Otros'],
  aventura_relax: ['Deportes acuáticos', 'Cabalgatas', 'Kitesurf', 'Yoga / Bienestar', 'Masajes a domicilio', 'Tour fotográfico', 'Pesca deportiva', 'Senderismo', 'Espectáculos'],
};

// "Tipo de experiencia" — el socio de Salidas lo elige al darse de alta
// (PerfilNegocioForm) y queda guardado en `negocios.tags`. El filtro de
// "Tipo de experiencia" en OfertasView y el dropdown del Navbar usan esta
// misma lista. Pensada para cruzar TODAS las subcategorías de Salidas
// (restaurantes, bares, cafeterías, heladerías, panaderías, discotecas,
// cines y teatros, shows y recitales, centros culturales, otros) — no solo
// gastronomía.
export const EXPERIENCIAS_SALIDAS = [
  'En pareja', 'Plan familiar', 'Con amigos', 'Para grupos grandes',
  'Al aire libre', 'Vista al mar', 'De día', 'De noche',
  'Con música / shows en vivo', 'Cultural / arte',
];

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
    // Galería cargada por el socio (columna text[] `galeria`). La ficha de detalle la usa
    // como `item.fotos`; si no hay logo, el hero cae a la primera foto de la galería.
    fotos:             Array.isArray(n.galeria) ? n.galeria.filter(Boolean) : [],
    image:             n.imagen_url          || (Array.isArray(n.galeria) && n.galeria.filter(Boolean)[0]) || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    location:          n.localidad           || 'Villa Gesell',
    localidad:         n.localidad           || '',
    zona:              n.zona                || '',
    // `direccion` es una columna legacy que ningún flujo de alta actual completa —
    // la dirección real vive en `calle`/`numero`/`piso`/`depto` desde que se agregó
    // el mapa con autocompletado. Se arma acá para no perder el dato.
    address:           n.direccion || [n.calle, n.numero].filter(Boolean).join(' ') || '',
    tieneLocalFisico:  n.tiene_local_fisico   !== false,
    category:          n.tipo                || '',
    priceRange:        n.precio_rango        || null,
    tags:              n.tags                || [],
    servicios:         n.servicios ? n.servicios.split(',').map(s => s.trim()).filter(Boolean) : [],
    horario:           n.horario             || '',
    description:       n.descripcion         || '',
    iconName:          iconPorTipo(n.tipo),
    fotoPerfil:        n.foto_perfil         || null,
    lat:               n.lat != null ? Number(n.lat) : null,
    lng:               n.lng != null ? Number(n.lng) : null,
    plan:              n.plan                || 'free',
    // ── Contacto / info pública que el socio carga a mano (ficha de socio) ──
    email:             n.email              || '',
    sitioWeb:          n.sitio_web          || '',
    menuUrl:           n.menu_url           || '',
    instagram:         n.instagram          || '',
    facebook:          n.facebook           || '',
    tiktok:            n.tiktok             || '',
    whatsapp:          [n.tel_movil_cod, n.tel_movil_num].filter(Boolean).join(' ') || '',
    telefono:          [n.tel_fijo_cod, n.tel_fijo_num].filter(Boolean).join(' ') || '',
    tipoCocina:        n.tipo_cocina        || '',
    capacidad:         n.capacidad          || null,
    reservaObligatoria: n.reserva_obligatoria || false,
    // Detalle de dirección (piso/depto/entre calles) para la ficha
    piso:              n.piso               || '',
    depto:             n.depto              || '',
    entreCalles:       n.entre_calles       || '',
    esReal:            true,
  };
}

export function normalizePromo(p) {
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
    ahorroModalidad:  p.ahorro_modalidad || null,
    // Cupones grupales
    esGrupal:         p.is_group          || false,
    grupoMinPax:      p.group_min_pax     || null,
    grupoMaxPax:      p.group_max_pax     || null,
    basePricePp:      p.base_price_pp     != null ? Number(p.base_price_pp) : null,
    grupoTramos:      Array.isArray(p.group_tiers) ? p.group_tiers : [],
    // Impulso publicitario
    impulsoActivo:    p.impulso_activo    || false,
    aprobada:         p.aprobada,
    categoria:        categoriaDeNegocio(p.negocios?.tipo, p.negocio_id),
    negocioTipo:      p.negocios?.tipo   || '',
    proveedorNombre:  p.negocios?.nombre || '',
    proveedorImage:   p.negocios?.foto_perfil || p.negocios?.imagen_url || null,
    negocioLocalidad: p.negocios?.localidad  || '',
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
  const tiposExp = [...TIPOS_EXP];
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
    .select('*, negocios(nombre, tipo, localidad, zona, foto_perfil, imagen_url, activo)')
    .eq('activa', true)
    .eq('aprobada', true)
    .order('creado_en', { ascending: false })
    .limit(limit);

  const now = Date.now();
  return (data || [])
    .filter(p => p.negocios?.activo !== false)
    .map(normalizePromo)
    .filter(p => p.offerType !== 'Flash' || (p.fechaFinFlash && new Date(p.fechaFinFlash).getTime() > now));
}

// ─── Ofertas destacadas para la home ──────────────────────────
export async function getOfertasDestacadas() {
  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, localidad, zona, foto_perfil, imagen_url, activo)')
    .eq('activa', true)
    .eq('aprobada', true)
    .eq('destacada_home', true)
    .order('creado_en', { ascending: false });

  return (data || []).filter(p => p.negocios?.activo !== false).map(normalizePromo);
}

// ─── Promos propias de un negocio ─────────────────────────────
export async function getPromosDeNegocio(negocioId) {
  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, localidad, zona, foto_perfil, imagen_url, activo)')
    .eq('negocio_id', negocioId)
    .eq('aprobada', true)
    .eq('activa', true);

  return (data || []).filter(p => p.negocios?.activo !== false).map(normalizePromo);
}

// ─── Alianzas de un negocio ───────────────────────────────────
export async function getAlianzasPorNegocio(negocioId) {
  const { data } = await supabase
    .from('alianzas')
    .select('*, promociones(*, negocios(nombre, localidad, foto_perfil, imagen_url, activo))')
    .eq('negocio_id', negocioId)
    .eq('aprobada', true);

  return (data || [])
    .filter(a => a.promociones?.negocios?.activo !== false)
    .map(a => ({
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
    .select('*, negocios(nombre, tipo, localidad, zona, foto_perfil, imagen_url, activo)')
    .eq('activa', true)
    .eq('aprobada', true)
    .in('negocios.localidad', localidades);

  return (data || [])
    .filter(p => p.negocios?.activo !== false)
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

// ─── Cuponeras prediseñadas (cuponeras_locales) ───────────────
// Normaliza una promoción de la DB a la forma de "cupón" que consumen
// CuponModal y las minifichas de la Home.
function normalizeCuponDeCuponera(p) {
  const n = p.negocios || {};
  const precio = p.precio_manual != null
    ? Number(p.precio_manual)
    : calcularPrecioCupon(Number(p.ahorro_estimado) || 0);
  const terminos = (p.condiciones || '')
    .split(/\n|(?<=\.)\s+/).map(s => s.trim()).filter(Boolean);
  const galeria = Array.isArray(n.galeria) && n.galeria.length
    ? n.galeria
    : [p.imagen_url].filter(Boolean);
  return {
    id:               p.id,
    titulo:           p.titulo,
    badge:            p.badge || 'Promo',
    imagen:           p.imagen_url || FALLBACK_IMG,
    socio:            n.nombre || '',
    localidad:        n.localidad || '',
    beneficio:        p.descripcion || p.subtitulo || '',
    descripcionSocio: n.descripcion || '',
    detalles:         [],
    terminos,
    galeria,
    lat:              n.lat != null ? Number(n.lat) : null,
    lng:              n.lng != null ? Number(n.lng) : null,
    ahorro_estimado:  Number(p.ahorro_estimado) || 0,
    precio_activacion: precio,
  };
}

// Devuelve las cuponeras activas con sus cupones ya normalizados,
// listas para <CuponeraCard>/<CuponModal>. Descarta las vacías.
export async function getCuponeras() {
  const { data, error } = await supabase
    .from('cuponeras_locales')
    .select(`
      id, nombre, descripcion, badge, imagen_url, beneficio_adicional, beneficio_icono, beneficio_tipo, beneficio_valor, estado,
      cuponeras_locales_cupones (
        promociones (
          id, titulo, subtitulo, badge, imagen_url, descripcion, condiciones,
          ahorro_estimado, precio_manual, activa, aprobada,
          negocios ( nombre, localidad, descripcion, lat, lng, galeria )
        )
      )
    `)
    .eq('estado', 'activa')
    .order('creado_en', { ascending: false });

  if (error) { console.error('getCuponeras', error); return []; }

  return (data || []).map(cl => {
    const cupones = (cl.cuponeras_locales_cupones || [])
      .map(x => x.promociones)
      .filter(p => p && p.activa !== false && p.aprobada !== false)
      .map(normalizeCuponDeCuponera);
    return {
      id:               cl.id,
      title:            cl.nombre,
      subtitle:         cl.descripcion || '',
      badge:            cl.badge || '',
      images:           [cl.imagen_url || FALLBACK_IMG],
      beneficioAdicional: cl.beneficio_adicional || '',
      beneficioIcono:   cl.beneficio_icono || '',
      beneficioTipo:    cl.beneficio_tipo || '',
      beneficioValor:   cl.beneficio_valor != null ? Number(cl.beneficio_valor) : 0,
      cupones,
    };
  }).filter(c => c.cupones.length > 0);
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
