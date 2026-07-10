// ============================================================
//  src/lib/perfilNegocio.js
//  Helpers puros del formulario de perfil de negocio, compartidos
//  por el wizard de alta y el panel del socio (ver PerfilNegocioForm.jsx).
//  Separado del componente para no romper el fast-refresh de Vite.
// ============================================================

// Sólo estas subsecciones de Salidas piden "tipo de cocina / bebidas".
export const CATEGORIAS_GASTRO = new Set(['Restaurantes', 'Bares', 'Cafeterías']);

const TIPOS_ALOJ_DB = new Set(['alojamiento', 'Hotel', 'Cabaña', 'Departamento', 'Casa', 'Hostel', 'Dormi', 'Domo', 'Carpa', 'Glamping']);

export const DESC_MIN = 40;

// ─── Value inicial desde una fila `negocios` (o vacío) ────────
export function perfilDesdeNegocio(negocio, emailSemilla = '') {
  const n = negocio || {};
  const tipoNorm = TIPOS_ALOJ_DB.has(n.tipo) ? 'alojamiento'
    : (n.tipo === 'salidas' || n.tipo === 'aventura_relax') ? n.tipo
    : (n.tipo || '');
  return {
    tipo: tipoNorm,
    cats: n.categoria ? n.categoria.split(' / ').map(s => s.trim()).filter(Boolean) : [],
    nombre: n.nombre || '',
    descripcion: n.descripcion || '',
    logoFile: null,
    logoPreview: n.imagen_url || null,
    email: n.email || emailSemilla || '',
    telFijoCod: n.tel_fijo_cod || '+54', telFijoNum: n.tel_fijo_num || '',
    telMovilCod: n.tel_movil_cod || '+54', telMovilNum: n.tel_movil_num || '',
    sitioWeb: n.sitio_web || '', instagram: n.instagram || '', facebook: n.facebook || '', tiktok: n.tiktok || '',
    pais: n.pais || 'Argentina', provincia: n.provincia || 'Buenos Aires', localidad: n.localidad || '', codPostal: n.cod_postal || '7165',
    tieneLocalFisico: n.tiene_local_fisico !== false,
    calle: n.calle || '', piso: n.piso || '', depto: n.depto || '', entreCalles: n.entre_calles || '',
    latLng: (n.lat != null && n.lng != null) ? [Number(n.lat), Number(n.lng)] : null,
    tamMinM2: n.tam_min_m2?.toString() || '', tamMaxM2: n.tam_max_m2?.toString() || '',
    minHues: n.min_huespedes?.toString() || '', maxHues: n.max_huespedes?.toString() || '',
    servicios: n.servicios ? n.servicios.split(',').map(s => s.trim()).filter(Boolean) : [],
    aceptaMascotas: n.acepta_mascotas || false, aceptaNinos: n.acepta_ninos ?? true,
    capacidad: n.capacidad?.toString() || '',
    tiposCocina: n.tipo_cocina ? n.tipo_cocina.split(',').map(s => s.trim()).filter(Boolean) : [],
    tags: Array.isArray(n.tags) ? n.tags : [],
    reservaObligatoria: n.reserva_obligatoria || false,
    duracion: n.duracion || '', maxPax: n.max_pax?.toString() || '', sedeFija: n.sede_fija || '',
  };
}

// ─── value → columnas de `negocios` (sin galería ni imagen_url) ─
export function perfilAPayload(v) {
  const payload = {
    nombre: v.nombre.trim(), tipo: v.tipo, categoria: v.cats.join(' / '),
    email: v.email.trim() || null,
    tel_fijo_cod: v.telFijoNum.trim() ? v.telFijoCod : null, tel_fijo_num: v.telFijoNum.trim() || null,
    tel_movil_cod: v.telMovilNum.trim() ? v.telMovilCod : null, tel_movil_num: v.telMovilNum.trim() || null,
    sitio_web: v.sitioWeb.trim() || null, instagram: v.instagram.trim() || null,
    facebook: v.facebook.trim() || null, tiktok: v.tiktok.trim() || null,
    pais: v.pais, provincia: v.provincia, localidad: v.localidad, cod_postal: v.codPostal.trim() || null,
    tiene_local_fisico: v.tieneLocalFisico,
    calle: v.tieneLocalFisico ? (v.calle.trim() || null) : null,
    piso: v.tieneLocalFisico ? (v.piso.trim() || null) : null,
    depto: v.tieneLocalFisico ? (v.depto.trim() || null) : null,
    entre_calles: v.tieneLocalFisico ? (v.entreCalles.trim() || null) : null,
    lat: v.tieneLocalFisico ? (v.latLng?.[0] ?? null) : null,
    lng: v.tieneLocalFisico ? (v.latLng?.[1] ?? null) : null,
    descripcion: v.descripcion.trim(),
  };
  if (v.tipo === 'alojamiento') {
    Object.assign(payload, {
      tam_min_m2: v.tamMinM2 ? parseFloat(v.tamMinM2) : null,
      tam_max_m2: v.tamMaxM2 ? parseFloat(v.tamMaxM2) : null,
      min_huespedes: v.minHues ? parseInt(v.minHues) : null,
      max_huespedes: v.maxHues ? parseInt(v.maxHues) : null,
      servicios: v.servicios.join(', '),
      acepta_mascotas: v.aceptaMascotas, acepta_ninos: v.aceptaNinos,
    });
  } else if (v.tipo === 'salidas') {
    payload.capacidad = v.capacidad ? parseInt(v.capacidad) : null;
    payload.reserva_obligatoria = v.reservaObligatoria;
    const esGastro = v.cats.some(c => CATEGORIAS_GASTRO.has(c));
    payload.tipo_cocina = esGastro ? v.tiposCocina.join(', ') : null;
    payload.tags = v.tags;
  } else if (v.tipo === 'aventura_relax') {
    payload.duracion = v.duracion;
    payload.max_pax = v.maxPax ? parseInt(v.maxPax) : null;
    payload.sede_fija = v.sedeFija;
    payload.reserva_obligatoria = v.reservaObligatoria;
  }
  return payload;
}

// ─── Validación de campos obligatorios ────────────────────────
export function validarPerfil(v) {
  const e = {};
  if (!v.tipo)             e.tipo        = 'Elegí el rubro de tu negocio';
  if (v.cats.length === 0) e.categorias  = 'Elegí al menos una categoría';
  if (!v.nombre.trim())    e.nombre      = 'Campo requerido';
  if (!v.provincia)        e.provincia   = 'Campo requerido';
  if (!v.localidad)        e.localidad   = 'Campo requerido';
  if (!v.email.trim())     e.email       = 'Campo requerido';
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email.trim())) e.email = 'Email inválido';
  if (!v.telMovilNum.trim()) e.telMovil  = 'Campo requerido';
  if (!v.codPostal.trim()) e.codPostal   = 'Campo requerido';
  // La dirección exacta (calle/mapa) sólo aplica si el partner atiende en un local físico.
  if (v.tieneLocalFisico && !v.calle.trim()) e.calle = 'Campo requerido';
  if (!v.descripcion.trim()) e.descripcion = 'Campo requerido';
  else if (v.descripcion.length < DESC_MIN) e.descripcion = `Mínimo ${DESC_MIN} caracteres (${v.descripcion.length} escritos)`;
  return e;
}
