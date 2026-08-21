// ============================================================
//  src/views/OfertasView.jsx — Listado de todas las ofertas
//  Diseño: mismo sistema Aire que MarketplaceView
// ============================================================
import { useState, useEffect, useRef, useMemo } from 'react';
import { getAlojamientos, categoriaDeNegocio, EXPERIENCIAS_SALIDAS } from '../lib/datos';
import OfertaCard from '../components/OfertaCard';
import HeartButton from '../components/HeartButton';
import { getPortadas, elegirPortada } from '../lib/portadas';
import BuscarDestinoModal from '../components/BuscarDestinoModal';
import { getLocalidadesDeCiudad } from '../lib/localidades';
import useScope from '../hooks/useScope';

// ─── Tokens ──────────────────────────────────────────────────
const A = {
  primary:     '#475BE1',
  primaryDark: '#3347C8',
  primarySoft: '#EEF0FD',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  yellow:      '#FFC93C',
  green:       '#10A36B',
  font:        "'Inter', system-ui, sans-serif",
};

// LOCALIDADES era un array literal hardcodeado (2026-08-18: se reemplazó
// por src/lib/localidades.js, que fetchea desde la tabla `localidades`
// scopeada a la ciudad activa — ver getLocalidadesDeCiudad más abajo).

// Subcategorías primarias (tipo de negocio agrupado)
// Subcategorías = CATS_RUBRO (src/lib/datos.js), los valores reales que un socio
// elige al darse de alta y que quedan guardados en `negocios.categoria`. Cada
// grupo acá corresponde 1:1 a un link del Navbar (mismo label, mismo valor).
const SUBCATS_PRIMARY = {
  alojamiento: [
    { label: 'Hoteles',          tipos: ['Hotel'] },
    { label: 'Cabañas',          tipos: ['Cabaña'] },
    { label: 'Departamentos',    tipos: ['Departamento'] },
    { label: 'Aparts',           tipos: ['Apart'] },
    { label: 'Complejos',        tipos: ['Complejo'] },
    { label: 'Hosterías',        tipos: ['Hostería'] },
    { label: 'Resorts',          tipos: ['Resort'] },
    { label: 'Dormis / Camping', tipos: ['Dormi', 'Carpa', 'Domo', 'Glamping'] },
  ],
  salidas: [
    { label: 'Restaurantes',       tipos: ['Restaurantes'] },
    { label: 'Bares',              tipos: ['Bares'] },
    { label: 'Cafeterías',         tipos: ['Cafeterías'] },
    { label: 'Heladerías',         tipos: ['Heladerías'] },
    { label: 'Panaderías',         tipos: ['Panaderías'] },
    { label: 'Discotecas',         tipos: ['Discotecas'] },
    { label: 'Cines y Teatros',    tipos: ['Cines y Teatros'] },
    { label: 'Shows y Recitales',  tipos: ['Shows y Recitales'] },
    { label: 'Centros Culturales', tipos: ['Centros Culturales'] },
    { label: 'Otros',              tipos: ['Otros'] },
  ],
  aventura_relax: [
    { label: 'Deportes acuáticos',      tipos: ['Deportes acuáticos'] },
    { label: 'Cabalgatas',              tipos: ['Cabalgatas'] },
    { label: 'Kitesurf & Viento',       tipos: ['Kitesurf'] },
    { label: 'Yoga & Mindfulness',      tipos: ['Yoga / Bienestar'] },
    { label: 'Masajes a domicilio',     tipos: ['Masajes a domicilio'] },
    { label: 'Tour fotográfico',        tipos: ['Tour fotográfico'] },
    { label: 'Pesca deportiva',         tipos: ['Pesca deportiva'] },
    { label: 'Senderismo & Naturaleza', tipos: ['Senderismo'] },
    { label: 'Espectáculos',            tipos: ['Espectáculos'] },
  ],
};

// Subcategorías secundarias (servicios / atributos del negocio via tags)
const SUBCATS_SECONDARY = {
  alojamiento: [
    { label: 'Cerca del mar',   tag: 'cerca-del-mar' },
    { label: 'Piscina',         tag: 'piscina' },
    { label: 'Desayuno',        tag: 'desayuno' },
    { label: 'Spa',             tag: 'spa' },
    { label: 'Acepta mascotas', tag: 'mascotas' },
  ],
  // "Tipo de experiencia": lo elige el socio en su alta/edición (PerfilNegocioForm)
  // y queda en `negocios.tags` — mismo listado que el dropdown del Navbar.
  salidas: EXPERIENCIAS_SALIDAS.map(e => ({ label: e, tag: e })),
  aventura_relax: [
    { label: 'Para niños',    tag: 'ninos' },
    { label: 'En grupo',      tag: 'grupos' },
    { label: 'Con instructor',tag: 'instructor' },
    { label: 'Al atardecer',  tag: 'atardecer' },
    { label: 'Accesible',     tag: 'accesible' },
  ],
};

const IcoBolt    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>;

// ─── CheckRow (sidebar) — toda la fila es clickeable ─────────
function CheckRow({ label, checked, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', padding: '5px 0', userSelect: 'none' }}
    >
      <div style={{
        width: 17, height: 17, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${checked ? A.primary : A.line}`,
        background: checked ? A.primary : '#fff',
        display: 'grid', placeItems: 'center', transition: 'all 0.15s',
      }}>
        {checked && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span style={{ fontSize: 13, color: checked ? A.ink : A.ink2, fontWeight: checked ? 600 : 400, fontFamily: A.font }}>{label}</span>
    </div>
  );
}

// ─── Sección colapsable del sidebar ──────────────────────────
function SideSection({ title, children, onLimpiar, bold }) {
  return (
    <div style={{ borderBottom: `1px solid ${A.line}`, paddingBottom: 16, marginBottom: 16 }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 10px' }}>
          {bold
            ? <span style={{ fontSize: 14, fontWeight: 700, color: A.ink }}>{title}</span>
            : <span style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
          }
          {onLimpiar && (
            <button onClick={onLimpiar} style={{ background: 'none', border: 'none', fontSize: 11, color: A.primary, cursor: 'pointer', fontWeight: 600, fontFamily: A.font, padding: 0 }}>
              Limpiar
            </button>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

// Pill de selección única para categorías
function CategoriaPill({ label, checked, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
        fontFamily: A.font, fontSize: 13.5, fontWeight: 500,
        border: `1.5px solid ${checked ? '#38f' : 'transparent'}`,
        background: checked ? '#fff' : '#def',
        color: checked ? '#3d4255' : '#777',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        boxShadow: checked ? '0 1px 4px rgba(11,16,32,0.08)' : 'none',
      }}
    >
      {label}
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3d4255" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  VISTA PRINCIPAL
// ═══════════════════════════════════════════════════════════
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

// ─── Ficha de portada (primera celda de la grilla) ──────────
function PortadaCard({ portada }) {
  const img = <img src={portada.imagen_url} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />;
  // height:100% para igualar el alto de las cards vecinas; minHeight evita que
  // colapse cuando queda sola en su fila (mobile, 1 columna).
  const base = { position: 'relative', borderRadius: 20, overflow: 'hidden', border: `1px solid ${A.line}`, height: '100%', minHeight: 420, background: A.bg, display: 'block' };
  if (portada.link) {
    return <a href={portada.link} target="_blank" rel="noopener noreferrer" style={{ ...base, cursor: 'pointer' }}>{img}</a>;
  }
  return <div style={base}>{img}</div>;
}

// ─── Tab-bar de destinos (paralelo al sidebar) ────────────────
function DestinoTabs({ destinos, value, onPick }) {
  return (
    <div className="hscroll" style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
      {['Todo', ...destinos].map(d => {
        const active = value === d;
        return (
          <button
            key={d}
            onClick={() => onPick(d)}
            style={{
              flexShrink: 0, padding: '11px 26px', borderRadius: 999, cursor: 'pointer',
              fontFamily: A.font, fontSize: 15, fontWeight: 600, whiteSpace: 'nowrap',
              border: `1.5px solid ${active ? A.ink : A.line}`,
              background: active ? A.ink : '#fff',
              color: active ? '#fff' : A.ink2,
              transition: 'all 0.15s',
            }}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}

// ─── Minificha de socio (strip horizontal "Elegí un destino") ──
function SocioMiniCard({ socio, promoCount, onOpen }) {
  const tipo = (socio.subcategoria || socio.type || '').toUpperCase();
  const ubic = [socio.localidad, socio.zona].filter(Boolean).join(' - ');
  return (
    <div
      onClick={() => onOpen(socio)}
      style={{ width: 300, flexShrink: 0, cursor: 'pointer', fontFamily: A.font }}
    >
      <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', aspectRatio: '1 / 0.92', background: A.bg, border: `1px solid ${A.line}` }}>
        <img src={socio.image} alt={socio.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
          <HeartButton id={socio.id} size={34} />
        </div>
        {tipo && (
          <span style={{ position: 'absolute', bottom: 12, left: 12, background: '#fff', color: A.ink, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', padding: '5px 12px', borderRadius: 999 }}>
            {tipo}
          </span>
        )}
      </div>
      <div style={{ padding: '12px 2px 0' }}>
        {ubic && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: A.primary }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {ubic}
          </div>
        )}
        <div style={{ fontSize: 21, fontWeight: 700, color: A.ink, letterSpacing: '-0.01em', margin: '4px 0 10px', lineHeight: 1.15, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {socio.name}
        </div>
        {promoCount > 0 ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: A.primary, color: '#fff', fontSize: 13, fontWeight: 600, padding: '6px 13px', borderRadius: 999 }}>
            <img src="/ico-disc.svg" alt="" width={14} height={14} style={{ display: 'block', filter: 'brightness(0) invert(1)' }} />
            {promoCount} promocion{promoCount !== 1 ? 'es' : ''}
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', background: A.bg, color: A.muted, fontSize: 13, fontWeight: 500, padding: '6px 13px', borderRadius: 999 }}>
            Sin promociones vigentes
          </span>
        )}
      </div>
    </div>
  );
}

export default function OfertasView({ onOpenOferta, initialCategoria = null, initialLocalidades = [], initialTipo = null, initialExperiencia = null }) {
  const [promos,      setPromos]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busqueda,    setBusqueda]    = useState('');
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [shownCount,  setShownCount]  = useState(10);
  const [portada,     setPortada]     = useState(null);
  const [socios,      setSocios]      = useState([]);   // Alojamientos para el strip "Elegí un destino"
  const [buscarPaisOpen, setBuscarPaisOpen] = useState(false);
  const sentinelRef = useRef(null);
  const winW    = useWindowWidth();
  const isMobile = winW < 768;

  // Scope regional (2026-08-18): la región descarta lo que no es de la
  // región activa antes de cualquier otro filtro — nunca aparece en el
  // sidebar, ya la eligió el header.
  const { region, ciudades } = useScope();
  const [filtroCiudades, setFiltroCiudades] = useState([]); // ids de ciudad
  const [localidadesDisp, setLocalidadesDisp] = useState([]);
  useEffect(() => {
    let vivo = true;
    const objetivo = filtroCiudades.length > 0 ? ciudades.filter(c => filtroCiudades.includes(c.id)) : ciudades;
    Promise.all(objetivo.map(c => getLocalidadesDeCiudad(c.id))).then(listas => { if (vivo) setLocalidadesDisp(listas.flat()); });
    return () => { vivo = false; };
  }, [filtroCiudades, ciudades]);

  // Filtros — pre-activados si viene con initialCategoria
  const [tipoAloj,    setTipoAloj]    = useState(initialCategoria === 'alojamiento');
  const [tipoSalidas,  setTipoGastro]  = useState(initialCategoria === 'salidas');
  const [tipoExp,     setTipoExp]     = useState(initialCategoria === 'aventura_relax');
  const [soloFlash,       setSoloFlash]       = useState(false);
  const [soloGrupales,    setSoloGrupales]    = useState(false);
  const [localidades,     setLocalidades]     = useState(initialLocalidades);
  const [subcatPrimaria,  setSubcatPrimaria]  = useState(() => {
    if (!initialCategoria || !initialTipo) return new Set();
    const grupo = (SUBCATS_PRIMARY[initialCategoria] || []).find(sc => sc.tipos.includes(initialTipo));
    return grupo ? new Set([grupo.label]) : new Set();
  });
  const [subcatSecundaria,setSubcatSecundaria]= useState(() => {
    if (!initialExperiencia) return new Set();
    const grupo = (SUBCATS_SECONDARY[initialCategoria] || []).find(sc => sc.tag === initialExperiencia);
    return grupo ? new Set([grupo.label]) : new Set();
  });

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      const { supabase } = await import('../lib/supabase');

      const { data } = await supabase
        .from('promociones')
        .select('*, negocios(nombre, tipo, categoria, tags, localidad, zona, region_id, ciudad_id, foto_perfil, imagen_url)')
        .eq('activa', true)
        .eq('aprobada', true)
        .order('creado_en', { ascending: false });

      const reales = (data || [])
        .map(p => ({
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
          ahorroModalidad:  p.ahorro_modalidad || null,
          esGrupal:         p.is_group || false,
          grupoMinPax:      p.group_min_pax || null,
          grupoMaxPax:      p.group_max_pax || null,
          basePricePp:      p.base_price_pp != null ? Number(p.base_price_pp) : null,
          grupoTramos:      Array.isArray(p.group_tiers) ? p.group_tiers : [],
          impulsoActivo:    p.impulso_activo || false,
          categoria:        categoriaDeNegocio(p.negocios?.tipo, p.negocio_id),
          // negocios.categoria guarda 1 o 2 subcategorías separadas por ' / ' (ver CATS_RUBRO en datos.js)
          negocioCategorias: (p.negocios?.categoria || '').split(' / ').map(s => s.trim()).filter(Boolean),
          negocioTags:      p.negocios?.tags || [],
          proveedorNombre:  p.negocios?.nombre || '',
          negocioLocalidad: p.negocios?.localidad || '',
          negocioZone:      p.negocios?.zona || '',
          negocioRegionId:  p.negocios?.region_id || null,
          negocioCiudadId:  p.negocios?.ciudad_id || null,
          esReal:           true,
        }))
        // Flash solo si tiene fecha futura válida; sin fecha = se descarta igual
        .filter(p => p.offerType !== 'Flash' || (p.fechaFinFlash && new Date(p.fechaFinFlash) > new Date()))
        // Ocultar ofertas de regalo (tokens_costo = 0) de las vistas regulares
        .filter(p => p.tokens_costo !== 0);

      // Sólo lo real. Antes acá se concatenaban las ofertas de mockData que no
      // colisionaran por id, así que el listado mostraba un catálogo mezclado:
      // el turista veía ofertas que no existen, sin socio, sin cupo premium y
      // fuera de la escalera de comisiones. Si con datos reales el listado
      // queda corto, queda corto — es la información verdadera.
      setPromos(reales);
      setLoading(false);
    }
    cargar();
  }, []);

  // ── Categoría activa (single-select) ─────────────────────────
  const catActiva = tipoAloj ? 'alojamiento' : tipoSalidas ? 'salidas' : tipoExp ? 'aventura_relax' : null;

  // Portada de la primera ficha — rota sin repetir por categoría
  useEffect(() => {
    let cancel = false;
    (async () => {
      const cat = catActiva || 'general';
      const lista = await getPortadas(cat);
      if (cancel) return;
      setPortada(elegirPortada(lista, cat));
    })();
    return () => { cancel = true; };
  }, [catActiva]);

  // Socios (alojamientos) para el strip horizontal "Elegí un destino".
  // Solo se cargan en la vista de alojamiento; incluye negocios sin ofertas vigentes.
  useEffect(() => {
    if (catActiva !== 'alojamiento') { setSocios([]); return; }
    let cancel = false;
    (async () => {
      const list = await getAlojamientos();
      if (!cancel) setSocios(list);
    })();
    return () => { cancel = true; };
  }, [catActiva]);

  const seleccionarCategoria = (cat) => {
    const ya = catActiva === cat;
    setTipoAloj(cat === 'alojamiento' && !ya);
    setTipoGastro(cat === 'salidas' && !ya);
    setTipoExp(cat === 'aventura_relax' && !ya);
    setSubcatPrimaria(new Set());
    setSubcatSecundaria(new Set());
  };

  // ── Destinos con suficientes ofertas (≥4) ────────────────────
  const conteoPorDestino = {};
  promos.forEach(p => {
    const loc = p.negocioLocalidad;
    if (loc) conteoPorDestino[loc] = (conteoPorDestino[loc] || 0) + 1;
  });
  const nombresLocalidades = localidadesDisp.map(l => l.nombre);
  const destinosValidos = nombresLocalidades.filter(l => (conteoPorDestino[l] || 0) >= 4);
  const hayOtrosDestinos = nombresLocalidades.some(l => {
    const n = conteoPorDestino[l] || 0;
    return n > 0 && n < 4;
  });

  // ── Tipos válidos según subcatPrimaria seleccionada ──────────
  const tiposValidos = (() => {
    if (!catActiva || subcatPrimaria.size === 0) return null;
    const set = new Set();
    (SUBCATS_PRIMARY[catActiva] || []).forEach(sc => {
      if (subcatPrimaria.has(sc.label)) sc.tipos.forEach(t => set.add(t));
    });
    return set;
  })();

  // Tags válidos según subcatSecundaria seleccionada
  const tagsRequeridos = (() => {
    if (!catActiva || subcatSecundaria.size === 0) return null;
    return (SUBCATS_SECONDARY[catActiva] || [])
      .filter(sc => subcatSecundaria.has(sc.label))
      .map(sc => sc.tag);
  })();

  // ── Aplicar filtros ─────────────────────────────────────────
  const hayTipo = tipoAloj || tipoSalidas || tipoExp;
  const visibles = promos
    .filter(p => {
    if (!region || p.negocioRegionId !== region.id) return false;
    if (filtroCiudades.length > 0 && !filtroCiudades.includes(p.negocioCiudadId)) return false;
    if (busqueda && !p.title.toLowerCase().includes(busqueda.toLowerCase()) &&
        !(p.proveedorNombre || p.subtitle || '').toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (hayTipo) {
      const ok = (tipoAloj && p.categoria === 'alojamiento') ||
                 (tipoSalidas && p.categoria === 'salidas') ||
                 (tipoExp && p.categoria === 'aventura_relax');
      if (!ok) return false;
    }
    if (tiposValidos && !(p.negocioCategorias || []).some(c => tiposValidos.has(c))) return false;
    if (tagsRequeridos && !tagsRequeridos.some(t => (p.negocioTags || []).includes(t))) return false;
    if (soloFlash && p.offerType !== 'Flash') return false;
    if (soloGrupales && !p.esGrupal) return false;
    if (localidades.length > 0) {
      const enDestino = localidades.filter(l => l !== '__otros__').includes(p.negocioLocalidad);
      const esOtro = localidades.includes('__otros__') && !destinosValidos.includes(p.negocioLocalidad);
      if (!enDestino && !esOtro) return false;
    }
    return true;
    })
    // Ofertas impulsadas primero (más visibilidad); el resto conserva su orden.
    .sort((a, b) => (b.impulsoActivo ? 1 : 0) - (a.impulsoActivo ? 1 : 0));

  // ── Promos vigentes por negocio (para el badge de las minifichas) ──
  const promosPorNegocio = useMemo(() => {
    const m = {};
    promos.forEach(p => { if (p.negocioId) m[p.negocioId] = (m[p.negocioId] || 0) + 1; });
    return m;
  }, [promos]);

  // ── Socios del strip: mismos filtros del sidebar (destino, tipo, servicios, búsqueda) ──
  const sociosVisibles = socios.filter(s => {
    if (!region || s.regionId !== region.id) return false;
    if (filtroCiudades.length > 0 && !filtroCiudades.includes(s.ciudadId)) return false;
    if (busqueda && !(s.name || '').toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (localidades.length > 0) {
      const enDestino = localidades.filter(l => l !== '__otros__').includes(s.localidad);
      const esOtro = localidades.includes('__otros__') && !destinosValidos.includes(s.localidad);
      if (!enDestino && !esOtro) return false;
    }
    if (tiposValidos && !(s.subcategorias || []).some(c => tiposValidos.has(c))) return false;
    if (tagsRequeridos && !tagsRequeridos.some(t => (s.tags || []).includes(t))) return false;
    return true;
  });

  const hayOtrosFiltros = subcatPrimaria.size > 0 || subcatSecundaria.size > 0;
  const limpiarFiltros = () => {
    setTipoAloj(false); setTipoGastro(false); setTipoExp(false);
    setSoloFlash(false); setSoloGrupales(false); setLocalidades([]);
    setFiltroCiudades([]);
    setSubcatPrimaria(new Set()); setSubcatSecundaria(new Set());
    setBusqueda('');
  };
  const hayFiltros = hayTipo || soloFlash || soloGrupales || localidades.length > 0 || filtroCiudades.length > 0 || hayOtrosFiltros || busqueda;

  // Infinite scroll
  const filterKey = `${busqueda}|${tipoAloj}|${tipoSalidas}|${tipoExp}|${soloFlash}|${soloGrupales}|${localidades.join()}|${[...subcatPrimaria].join()}|${[...subcatSecundaria].join()}`;
  useEffect(() => { setShownCount(10); }, [filterKey]);

  const visiblesPaged = visibles.slice(0, shownCount);
  const hayMas = shownCount < visibles.length;

  // Observer del sentinel. Se reconstruye en cada carga (dep shownCount): al re-observar,
  // IntersectionObserver re-evalúa la intersección, así que si el sentinel sigue en pantalla
  // vuelve a disparar y carga otra tanda hasta llenar el viewport (evita el "loading eterno"
  // al scrollear rápido). Depender de `hayMas` re-adjunta cuando el sentinel aparece/desaparece.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hayMas) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setShownCount(n => n + 10);
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hayMas, shownCount, filterKey]);

  // Cols responsive
  const cols = isMobile ? 1 : winW < 1024 ? 2 : 3;

  // ── Título dinámico según categoría + destino(s) seleccionados ──
  const destinoTexto = (() => {
    const locs = localidades.filter(l => l && l !== '__otros__');
    if (locs.length === 0) return 'Villa Gesell y alrededores';
    return `${locs.join(', ')} y alrededores`;
  })();
  const tituloPrincipal = catActiva === 'salidas'
    ? `Salí y ahorrá en ${destinoTexto}`
    : catActiva === 'aventura_relax'
    ? `Experiencias inolvidables en ${destinoTexto}`
    : catActiva === 'alojamiento'
    ? `Elegí tu alojamiento en ${destinoTexto}`
    : `Ofertas en ${destinoTexto}`;

  // Tab-bar de destinos (single-select) — comparte estado con el sidebar (localidades).
  const destinoTabActivo = localidades.length === 1 ? localidades[0] : (localidades.length === 0 ? 'Todo' : '');
  const pickDestinoTab = (d) => setLocalidades(d === 'Todo' ? [] : [d]);

  const searchPlaceholder =
    catActiva === 'alojamiento'    ? 'Buscar en alojamientos' :
    catActiva === 'salidas'        ? 'Buscar en salidas' :
    catActiva === 'aventura_relax' ? 'Buscar en aventura & relax' :
    'Buscar en ofertas';

  const esAlojamiento = catActiva === 'alojamiento';

  // Elemento del buscador (reutilizado en el header de alojamiento y el genérico).
  const searchBox = (
    <div style={{ position: 'relative' }}>
      <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder={searchPlaceholder}
        style={{ width: isMobile ? 170 : 300, paddingLeft: 16, paddingRight: 42, paddingTop: 12, paddingBottom: 12, border: `1.5px solid ${A.line}`, borderRadius: 14, fontSize: 14, fontFamily: A.font, background: '#fff', color: A.ink, outline: 'none', boxSizing: 'border-box' }}
        onFocus={e => e.target.style.borderColor = A.primary} onBlur={e => e.target.style.borderColor = A.line}
      />
      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: A.muted, display: 'flex', pointerEvents: 'none' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
      </span>
    </div>
  );

  const filtrosMobileBtn = (
    <button onClick={() => setDrawerOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: hayFiltros ? A.primary : '#fff', color: hayFiltros ? '#fff' : A.ink, border: `1.5px solid ${hayFiltros ? A.primary : A.line}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
      Filtros{hayFiltros ? ` (${[tipoAloj,tipoSalidas,tipoExp,soloFlash,soloGrupales].filter(Boolean).length + localidades.length + subcatPrimaria.size + subcatSecundaria.size})` : ''}
    </button>
  );

  // Link "Buscar en el resto del país" (bajo el conteo de ofertas).
  const buscarPaisLink = (
    <button
      onClick={() => setBuscarPaisOpen(true)}
      style={{ background: 'none', border: 'none', padding: 0, marginLeft: 8, color: A.primary, textDecoration: 'underline', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}
    >
      Buscar en el resto del país
    </button>
  );

  const SidebarContent = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${A.line}` }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: A.ink }}>Filtros</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hayFiltros && <button onClick={limpiarFiltros} style={{ background: 'none', border: 'none', fontSize: 12, color: A.primary, cursor: 'pointer', fontWeight: 600, fontFamily: A.font }}>Limpiar filtros</button>}
          {isMobile && <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: A.muted, display: 'flex', padding: 4 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>}
        </div>
      </div>
      <div style={{ padding: '16px 20px 8px' }}>

        {/* ── BENEFICIOS EN (categoría, single-select pills) ── */}
        <SideSection title="Beneficios en">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            <CategoriaPill label="Alojamientos"     checked={tipoAloj}    onClick={() => seleccionarCategoria('alojamiento')} />
            <CategoriaPill label="Salidas"          checked={tipoSalidas} onClick={() => seleccionarCategoria('salidas')} />
            <CategoriaPill label="Aventura & Relax" checked={tipoExp}     onClick={() => seleccionarCategoria('aventura_relax')} />
          </div>
        </SideSection>

        {/* ── CIUDAD (2026-08-18) — primer grupo, arriba de destino/localidad:
            es un filtro DENTRO de la región, nunca la región misma. Multi-select
            porque el Cupon PASS vale en toda la región. */}
        {!loading && ciudades.length > 1 && (
          <SideSection
            title="Ciudad"
            onLimpiar={filtroCiudades.length > 0 ? () => setFiltroCiudades([]) : null}
          >
            {ciudades.map(c => (
              <CheckRow
                key={c.id} label={c.nombre}
                checked={filtroCiudades.includes(c.id)}
                onChange={() => setFiltroCiudades(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
              />
            ))}
          </SideSection>
        )}

        {/* ── DESTINO (solo destinos con ≥4 ofertas) ── */}
        {!loading && (
          <SideSection
            title="Destino"
            onLimpiar={localidades.length > 0 ? () => setLocalidades([]) : null}
          >
            <CheckRow
              label="Todos los destinos"
              checked={localidades.length === 0}
              onChange={() => setLocalidades([])}
            />
            {destinosValidos.map(loc => (
              <CheckRow
                key={loc} label={loc}
                checked={localidades.includes(loc)}
                onChange={() => setLocalidades(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc])}
              />
            ))}
            {hayOtrosDestinos && (
              <CheckRow
                label="Otros destinos cerca"
                checked={localidades.includes('__otros__')}
                onChange={() => setLocalidades(prev => prev.includes('__otros__') ? prev.filter(l => l !== '__otros__') : [...prev, '__otros__'])}
              />
            )}
          </SideSection>
        )}

        {/* ── FLASH SALE (sin título, directo el checkbox) ── */}
        <SideSection>
          <CheckRow
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                Solo ofertas{' '}
                <span style={{ fontWeight: 900, fontStyle: 'italic', color: '#EF4444', letterSpacing: '0.05em' }}>FLASH</span>
                <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center' }}><IcoBolt /></span>
              </span>
            }
            checked={soloFlash}
            onChange={() => setSoloFlash(v => !v)}
          />
          <CheckRow
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Solo <span style={{ fontWeight: 800, color: '#7C3AED' }}>grupales</span>
              </span>
            }
            checked={soloGrupales}
            onChange={() => setSoloGrupales(v => !v)}
          />
        </SideSection>

        {/* ── Separador + OTROS FILTROS ── */}
        {catActiva && (
          <SideSection
            title="Otros filtros"
            bold
            onLimpiar={hayOtrosFiltros ? () => { setSubcatPrimaria(new Set()); setSubcatSecundaria(new Set()); } : null}
          >
            {/* Subcategorías primarias */}
            {SUBCATS_PRIMARY[catActiva] && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {catActiva === 'alojamiento' ? 'Tipo de alojamiento' : catActiva === 'salidas' ? 'Tipo de salida' : 'Tipo de experiencia'}
                </div>
                <CheckRow
                  label="Todos los tipos"
                  checked={subcatPrimaria.size === 0}
                  onChange={() => setSubcatPrimaria(new Set())}
                />
                {SUBCATS_PRIMARY[catActiva].map(sc => (
                  <CheckRow
                    key={sc.label} label={sc.label}
                    checked={subcatPrimaria.has(sc.label)}
                    onChange={() => setSubcatPrimaria(prev => {
                      const next = new Set(prev);
                      next.has(sc.label) ? next.delete(sc.label) : next.add(sc.label);
                      return next;
                    })}
                  />
                ))}
              </div>
            )}

            {/* Subcategorías secundarias */}
            {SUBCATS_SECONDARY[catActiva] && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {catActiva === 'alojamiento' ? 'Servicios incluidos' : catActiva === 'salidas' ? 'Tipo de experiencia' : 'Modalidad'}
                </div>
                {SUBCATS_SECONDARY[catActiva].map(sc => (
                  <CheckRow
                    key={sc.label} label={sc.label}
                    checked={subcatSecundaria.has(sc.label)}
                    onChange={() => setSubcatSecundaria(prev => {
                      const next = new Set(prev);
                      next.has(sc.label) ? next.delete(sc.label) : next.add(sc.label);
                      return next;
                    })}
                  />
                ))}
              </div>
            )}
          </SideSection>
        )}

      </div>
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, paddingTop: 70 }}>

      {/* Modal "Buscar en el resto del país" */}
      {buscarPaisOpen && (
        <BuscarDestinoModal categoria={catActiva} onClose={() => setBuscarPaisOpen(false)} />
      )}

      {/* Drawer mobile */}
      {isMobile && drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.4)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 300, background: '#fff', zIndex: 101, overflowY: 'auto', boxShadow: '4px 0 32px rgba(0,0,0,0.15)' }}>
            {SidebarContent}
          </div>
        </>
      )}

      <div style={{ maxWidth: 'var(--site-max)', margin: '0 auto', padding: isMobile ? '16px 16px 72px' : '32px var(--site-pad)', display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* Sidebar desktop */}
        {!isMobile && (
          <div style={{ width: 260, flexShrink: 0 }}>
            <aside style={{ background: '#fff', borderRadius: 18, border: `1px solid ${A.line}`, overflow: 'hidden' }}>
              {SidebarContent}
            </aside>
          </div>
        )}

        {/* Resultados */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {esAlojamiento ? (
            <>
              {/* "Elegí un destino" + búsqueda */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, margin: '25px 0 20px', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                <h1 style={{ fontSize: isMobile ? 24 : 32, fontStyle: 'italic', fontWeight: 500, color: A.ink, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2 }}>
                  Elegí un destino:
                </h1>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  {isMobile && filtrosMobileBtn}
                  {searchBox}
                </div>
              </div>

              {/* Tabs de destino (en paralelo al sidebar) */}
              {!loading && destinosValidos.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <DestinoTabs destinos={destinosValidos} value={destinoTabActivo} onPick={pickDestinoTab} />
                </div>
              )}

              {/* Strip horizontal de socios */}
              {sociosVisibles.length > 0 && (
                <div className="hscroll" style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8, marginBottom: 34, scrollbarWidth: 'none' }}>
                  {sociosVisibles.map(s => (
                    <SocioMiniCard
                      key={s.id} socio={s} promoCount={promosPorNegocio[s.id] || 0}
                      onOpen={(soc) => onOpenOferta && onOpenOferta({ negocioId: soc.id, categoria: 'alojamiento' })}
                    />
                  ))}
                </div>
              )}

              {/* Encabezado de las ofertas */}
              <h2 style={{ fontSize: isMobile ? 22 : 30, fontStyle: 'italic', fontWeight: 500, color: A.ink, letterSpacing: '-0.01em', margin: '0 0 4px', lineHeight: 1.2 }}>
                Ofertas en alojamientos
              </h2>
              <p style={{ fontSize: 13, color: A.muted, margin: '0 0 20px' }}>
                {loading ? 'Cargando...' : (
                  <>{visibles.length} oferta{visibles.length !== 1 ? 's' : ''} disponible{visibles.length !== 1 ? 's' : ''}{buscarPaisLink}</>
                )}
              </p>
            </>
          ) : (
            /* Header genérico (salidas, aventura & relax, o sin categoría) */
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <div style={{ flex: 1 }}>
                <h1 style={{ fontSize: isMobile ? 22 : 30, fontStyle: 'italic', fontWeight: 500, color: A.ink, letterSpacing: '-0.01em', margin: '25px 0 0', lineHeight: 1.2 }}>
                  {tituloPrincipal}
                </h1>
                <p style={{ fontSize: 13, color: A.muted, margin: '6px 0 0' }}>
                  {loading ? 'Cargando...' : (
                    <>{visibles.length} oferta{visibles.length !== 1 ? 's' : ''} disponible{visibles.length !== 1 ? 's' : ''}{buscarPaisLink}</>
                  )}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, marginTop: 25 }}>
                {isMobile && filtrosMobileBtn}
                {searchBox}
              </div>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 16 : 20 }}>
              {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 340, background: A.line, borderRadius: 20, opacity: 0.5 }} />)}
            </div>
          ) : visibles.length === 0 && filtroCiudades.length > 0 ? (
            // Ciudad de la región sin catálogo todavía — nunca "sin resultados"
            // a secas cuando la razón es que esa ciudad recién empieza.
            <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 18, padding: '60px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, fontWeight: 700, color: A.ink, margin: '0 0 6px' }}>
                Todavía no hay cupones en {filtroCiudades.length === 1 ? (ciudades.find(c => c.id === filtroCiudades[0])?.nombre || 'esta ciudad') : 'estas ciudades'}
              </p>
              <p style={{ fontSize: 14, color: A.muted, margin: 0 }}>Mirá los {promos.filter(p => region && p.negocioRegionId === region.id).length} de la región</p>
              <button onClick={() => setFiltroCiudades([])} style={{ marginTop: 14, background: A.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}>Ver toda la región</button>
            </div>
          ) : visibles.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 18, padding: '60px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: A.muted, margin: 0 }}>No hay ofertas para esta combinación de filtros.</p>
              <button onClick={limpiarFiltros} style={{ marginTop: 14, background: A.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}>Limpiar filtros</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 16 : 20 }}>
              {portada && <PortadaCard key="portada" portada={portada} />}
              {visiblesPaged.map(promo => (
                <OfertaCard key={promo.id} promo={promo} onOpen={onOpenOferta} />
              ))}
            </div>
          )}

          {/* Sentinel infinite scroll */}
          {hayMas && (
            <div ref={sentinelRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
              <div style={{ width: 28, height: 28, border: `3px solid ${A.line}`, borderTopColor: A.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } } .hscroll::-webkit-scrollbar { display: none; }`}</style>
        </div>
      </div>
    </div>
  );
}
