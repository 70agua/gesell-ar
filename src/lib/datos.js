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

// 'Inmobiliaria' entra acá: lo que publica es dónde dormir. 'Agencia de
// turismo' entra en experiencias, que es lo que vende. 'Revendedor' y 'Otro'
// caen en salidas por descarte — ninguno de los dos aparece en los listados
// (las consultas de sección filtran por una lista explícita de tipos).
export const TIPOS_ALOJ   = new Set(['alojamiento', 'Hotel', 'Cabaña', 'Departamento', 'Domo', 'Dormi', 'Carpa', 'Casa', 'Hostel', 'Glamping', 'Inmobiliaria']);
const TIPOS_GASTRO = new Set(['salidas', 'Restaurante', 'Restaurantes', 'Bar', 'Bares', 'Café', 'Cafés & Dulces', 'Cafés y Dulces', 'Balneario', 'Gourmet', 'Pastelería', 'Parrilla', 'Heladería', 'Heladerías', 'Bodegón', 'Panadería', 'Panaderías', 'Discoteca', 'Discotecas', 'Cine y Teatro', 'Cines y Teatros', 'Show y Recital', 'Shows y Recitales', 'Centro Cultural', 'Centros Culturales', 'Otro', 'Otros', 'Revendedor']);
const TIPOS_EXP    = new Set(['aventura_relax', 'Experiencia', 'Excursion', 'Actividad', 'Spa', 'Deportes acuáticos', 'Cabalgatas', 'Kitesurf', 'Yoga & Mindfulness', 'Masajes', 'Salón de belleza', 'Tour fotográfico', 'Pesca deportiva', 'Senderismo', 'Espectáculos', 'Agencia de turismo']);

// Categorías reales que un socio puede elegir al dar de alta su negocio
// (fuente única — `negocios.categoria` guarda uno o dos de estos valores,
// separados por ' / ' si son dos). Navbar y los filtros de OfertasView
// deben usar exactamente estos strings para que coincidan con los datos reales.
export const CATS_RUBRO = {
  alojamiento:    ['Hotel', 'Apart', 'Complejo', 'Hostería', 'Resort', 'Cabaña', 'Departamento', 'Domo', 'Dormi', 'Carpa', 'Glamping'],
  salidas:        ['Restaurantes', 'Bares', 'Cafeterías', 'Heladerías', 'Panaderías', 'Discotecas', 'Cines y Teatros', 'Shows y Recitales', 'Centros Culturales', 'Indumentaria', 'Artesanías', 'Regalos y Recuerdos', 'Kioscos', 'Librerías', 'Jugueterías', 'Otros'],
  aventura_relax: ['Deportes acuáticos', 'Cabalgatas', 'Kitesurf', 'Yoga & Mindfulness', 'Masajes', 'Salón de belleza', 'Tour fotográfico', 'Pesca deportiva', 'Senderismo', 'Espectáculos'],
};

// "Mimo" = subcategorías de bienestar dentro de aventura_relax; el resto de
// aventura_relax es "experiencia". Fuente única: la consumen los filtros de
// GastronomyView y los buckets de la home.
export const CATS_MIMO   = ['Yoga & Mindfulness', 'Masajes', 'Salón de belleza'];
// Subcategorías de `salidas` que son gastronomía.
export const CATS_GASTRO  = ['Restaurantes', 'Bares', 'Cafeterías', 'Heladerías', 'Panaderías'];
// Subcategorías de `salidas` que son comercio: lo que el turista se lleva
// puesto o de regalo. Definen el bucket "compras" / "Traete un recuerdo".
export const CATS_COMPRAS = ['Indumentaria', 'Artesanías', 'Regalos y Recuerdos', 'Kioscos', 'Librerías', 'Jugueterías'];

// ─── Buckets de la home ("Cuponeá antes de pagar") ────────────
// Mismo criterio de agrupación que la navegación de esas pastillas
// (App.jsx → onNavCuponear), para que el ahorro que promete cada una se
// corresponda con las ofertas que el usuario ve al entrar.
export function bucketCuponear(promo) {
  if (promo.categoria === 'alojamiento') return 'alojamientos';
  const subs = promo.subcategorias || [];
  // "Compras" son los comercios (ropa, artesanías, kioscos, librerías…). El
  // resto de salidas —gastronomía, pero también discos, cines y shows— queda
  // en "comer": son planes para salir, no cosas que uno se lleva.
  if (promo.categoria === 'salidas') {
    return subs.some(s => CATS_COMPRAS.includes(s)) ? 'compras' : 'comer';
  }
  return subs.some(s => CATS_MIMO.includes(s)) ? 'mimo' : 'experiencia';
}

// El descuento vive en `badge` como texto libre ('-35%', '25%', '2x1',
// 'Cortesía'). Sólo tomamos los que son porcentaje puro: nunca se muestra
// un número que el socio no cargó.
export function pctDeBadge(badge) {
  const m = /^-?\s*(\d{1,2})\s*%$/.exec(String(badge || '').trim());
  return m ? Number(m[1]) : null;
}

// { bucket: mayor % de descuento vigente }. Los buckets sin ninguna oferta
// porcentual quedan afuera del objeto → la UI no muestra nada ahí.
export function ahorroMaxPorBucket(promos) {
  const out = {};
  for (const p of promos || []) {
    if (p.tokens_costo === 0) continue;
    const pct = pctDeBadge(p.badge);
    if (pct == null) continue;
    const b = bucketCuponear(p);
    if (!out[b] || pct > out[b]) out[b] = pct;
  }
  return out;
}

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
    // Subcategoría(s) que el socio eligió en el alta (columna `categoria`, hasta
    // 2 unidas por ' / ', vocabulario de CATS_RUBRO). `subcategorias` es el array
    // para filtrar; `subcategoria` la primera para mostrar como etiqueta.
    subcategorias:     n.categoria ? n.categoria.split(' / ').map(s => s.trim()).filter(Boolean) : [],
    subcategoria:      n.categoria ? n.categoria.split(' / ')[0].trim() : '',
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
  const categoria = categoriaDeNegocio(p.negocios?.tipo, p.negocio_id);
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
    // Stock / límite físico de canjes
    tieneStock:       p.tiene_stock       || false,
    stockMaximo:      p.stock_maximo      != null ? Number(p.stock_maximo)   : null,
    stockRestante:    p.stock_restante    != null ? Number(p.stock_restante) : null,
    aprobada:         p.aprobada,
    // ¿El servicio requiere reserva previa? Habilita el form de solicitud de disponibilidad
    // en el detalle. Legacy (null) → según categoría (alojamiento pide fecha; el resto no).
    requiereReserva:  p.requiere_reserva != null ? p.requiere_reserva : (categoria === 'alojamiento'),
    categoria,
    subcategorias:    p.negocios?.categoria ? p.negocios.categoria.split(' / ').map(s => s.trim()).filter(Boolean) : [],
    subcategoria:     p.negocios?.categoria ? p.negocios.categoria.split(' / ')[0].trim() : '',
    negocioTipo:      p.negocios?.tipo   || '',
    proveedorNombre:  p.negocios?.nombre || '',
    proveedorImage:   p.negocios?.foto_perfil || p.negocios?.imagen_url || null,
    negocioLocalidad: p.negocios?.localidad  || '',
    negocioZone:      p.negocios?.zona       || '',
    esReal:           true,
  };
}

// ─── Quién entra al catálogo público ──────────────────────────
// La puerta de entrada del socio es PUBLICAR: un negocio sin ninguna oferta
// publicada es una ficha vacía y no aporta nada al turista, así que no se
// lista. La excepción es el socio con plan pago (alojamiento/agencia), que
// compró estar y puede estar cargando sus ofertas todavía.
//
// Se resuelve con una consulta aparte en vez de un join: el join de Postgrest
// duplicaría la fila del negocio por cada oferta.
async function idsConOfertaPublicada() {
  const { data } = await supabase
    .from('promociones')
    .select('negocio_id')
    .eq('activa', true)
    .eq('aprobada', true);
  return new Set((data || []).map(p => p.negocio_id).filter(Boolean));
}

function publicable(n, conOferta) {
  return conOferta.has(n.id) || n.plan === 'plus';
}

// ─── Alojamientos ─────────────────────────────────────────────
export async function getAlojamientos() {
  const conOferta = await idsConOfertaPublicada();
  const { data } = await supabase
    .from('negocios')
    .select('*')
    .eq('activo', true)
    .in('tipo', ['alojamiento', 'Hotel', 'Cabaña', 'Departamento', 'Casa', 'Hostel', 'Dormi', 'Domo', 'Carpa', 'Glamping'])
    .order('creado_en', { ascending: false });

  return (data || []).filter(n => publicable(n, conOferta)).map(normalizeNegocio);
}

// ─── Salidas ──────────────────────────────────────────────
export async function getGastronomia() {
  const conOferta = await idsConOfertaPublicada();
  const { data } = await supabase
    .from('negocios')
    .select('*')
    .eq('activo', true)
    .in('tipo', ['salidas', 'Restaurante', 'Bar', 'Café', 'Balneario', 'Pastelería', 'Gourmet', 'Parrilla', 'Heladería', 'Bodegón'])
    .order('creado_en', { ascending: false });

  return (data || []).filter(n => publicable(n, conOferta)).map(normalizeNegocio);
}

// ─── Aventura & Relax ──────────────────────────────────────────
export async function getAventura() {
  const conOferta = await idsConOfertaPublicada();
  const tiposExp = [...TIPOS_EXP];
  const { data } = await supabase
    .from('negocios')
    .select('*')
    .eq('activo', true)
    .in('tipo', tiposExp)
    .order('creado_en', { ascending: false });

  return (data || []).filter(n => publicable(n, conOferta)).map(normalizeNegocio);
}

// ─── Promociones ──────────────────────────────────────────────
export async function getPromos(limit = 8) {
  const { data } = await supabase
    .from('promociones')
    .select('*, negocios(nombre, tipo, categoria, localidad, zona, foto_perfil, imagen_url, activo)')
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
// CupopackModal y las minifichas de la Home.
function normalizeCuponDeCupopack(p) {
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
    // Necesario para los Cupopacks: una premium con fecha a confirmar NO se
    // puede elegir de un tap —hay que pedirla— y la RPC la rechaza con
    // `requiere_solicitud`. Sin este dato, el pack la intentaría y fallaría.
    requiereFecha:    p.requiere_fecha === true,
    tieneStock:       p.tiene_stock    || false,
    stockRestante:    p.stock_restante != null ? Number(p.stock_restante) : null,
    categoria:        categoriaDeNegocio(n.tipo),
  };
}

// Devuelve los Cupopacks activos con sus cupones ya normalizados,
// listos para <CupopackCard>/<CupopackModal>. Descarta los vacíos.
export async function getCupopacks() {
  const { data, error } = await supabase
    .from('cuponeras_locales')
    .select(`
      id, nombre, descripcion, badge, imagen_url, portada_modo, familia, beneficio_adicional, beneficio_icono, beneficio_tipo, beneficio_valor, estado, menu_icono,
      cuponeras_locales_cupones (
        promociones (
          id, titulo, subtitulo, badge, imagen_url, descripcion, condiciones,
          ahorro_estimado, precio_manual, activa, aprobada, requiere_fecha,
          tiene_stock, stock_maximo, stock_restante,
          negocios ( nombre, tipo, localidad, descripcion, lat, lng, galeria )
        )
      )
    `)
    .eq('estado', 'activa')
    .order('creado_en', { ascending: false });

  if (error) { console.error('getCupopacks', error); return []; }

  return (data || []).map(cl => {
    const cupones = (cl.cuponeras_locales_cupones || [])
      .map(x => x.promociones)
      .filter(p => p && p.activa !== false && p.aprobada !== false)
      .map(normalizeCuponDeCupopack);
    return {
      id:               cl.id,
      title:            cl.nombre,
      subtitle:         cl.descripcion || '',
      badge:            cl.badge || '',
      images:           [cl.imagen_url || FALLBACK_IMG],
      portadaModo:      cl.portada_modo || 'imagen',
      familia:          cl.familia || null,
      beneficioAdicional: cl.beneficio_adicional || '',
      beneficioIcono:   cl.beneficio_icono || '',
      menuIcono:        cl.menu_icono || '',
      beneficioTipo:    cl.beneficio_tipo || '',
      beneficioValor:   cl.beneficio_valor != null ? Number(cl.beneficio_valor) : 0,
      incluyeAlojamiento: cupones.some(c => c.categoria === 'alojamiento'),
      cupones,
    };
  }).filter(c => c.cupones.length > 0);
}

// Cupopacks marcados como destacados en el menú de la navbar
export async function getCupopacksDestacadas() {
  const { data, error } = await supabase
    .from('cuponeras_locales')
    .select(`
      id, nombre, descripcion, badge, imagen_url, portada_modo, familia, beneficio_adicional, beneficio_icono, beneficio_tipo, beneficio_valor, estado, menu_icono,
      cuponeras_locales_cupones (
        promociones (
          id, titulo, subtitulo, badge, imagen_url, descripcion, condiciones,
          ahorro_estimado, precio_manual, activa, aprobada, requiere_fecha,
          tiene_stock, stock_maximo, stock_restante,
          negocios ( nombre, tipo, localidad, descripcion, lat, lng, galeria )
        )
      )
    `)
    .eq('estado', 'activa')
    .eq('destacada_en_menu', true)
    .order('creado_en', { ascending: false });

  if (error) { console.error('getCupopacksDestacadas', error); return []; }

  return (data || []).map(cl => {
    const cupones = (cl.cuponeras_locales_cupones || [])
      .map(x => x.promociones)
      .filter(p => p && p.activa !== false && p.aprobada !== false)
      .map(normalizeCuponDeCupopack);
    return {
      id:               cl.id,
      title:            cl.nombre,
      subtitle:         cl.descripcion || '',
      badge:            cl.badge || '',
      images:           [cl.imagen_url || FALLBACK_IMG],
      portadaModo:      cl.portada_modo || 'imagen',
      familia:          cl.familia || null,
      beneficioAdicional: cl.beneficio_adicional || '',
      beneficioIcono:   cl.beneficio_icono || '',
      menuIcono:        cl.menu_icono || '',
      beneficioTipo:    cl.beneficio_tipo || '',
      beneficioValor:   cl.beneficio_valor != null ? Number(cl.beneficio_valor) : 0,
      incluyeAlojamiento: cupones.some(c => c.categoria === 'alojamiento'),
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
