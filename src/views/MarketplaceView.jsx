// ============================================================
//  src/views/MarketplaceView.jsx — Aire design
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import AccommodationCard from '../components/AccommodationCard';
import OfertaCard from '../components/OfertaCard';
import { getAlojamientos, getPromos } from '../lib/datos';
import { LOCALIDADES, getVecinas } from '../lib/localidades';
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

// label (display) → val (coincide con item.type en BD)
const TIPOS_ALOJ = [
  { label: 'Hoteles',         val: 'Hotel' },
  { label: 'Cabañas',         val: 'Cabaña' },
  { label: 'Casas',           val: 'Casa' },
  { label: 'Departamentos',   val: 'Departamento' },
  { label: 'Dormis / Camping',val: 'Dormi' },
];
const SERVICIOS_LIST = [
  { id: 'mar',      label: 'Cerca del mar' },
  { id: 'piscina',  label: 'Piscina'        },
  { id: 'desayuno', label: 'Desayuno'       },
  { id: 'spa',      label: 'Spa'            },
  { id: 'mascotas', label: 'Acepta mascotas'},
];
const ORDEN_OPTS = [
  { id: 'relevancia',  label: 'Más relevantes'  },
  { id: 'precio_asc',  label: 'Menor precio'    },
  { id: 'precio_desc', label: 'Mayor precio'    },
];

const IcoX       = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const IcoChevD   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>;
const IcoChevR   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 6 6 6-6 6"/></svg>;
const IcoPin     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>;

const IcoGrid    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IcoList    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
const IcoMap     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>;

// ─── Accommodation card (list) ────────────────────────────────
function AlojListCard({ item, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onClick && onClick(item, 'alojamiento')}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 18, overflow: 'hidden', display: 'flex', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
    >
      <div style={{ position: 'relative', width: 200, flexShrink: 0, overflow: 'hidden' }}>
        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s', transform: hov ? 'scale(1.05)' : 'scale(1)' }} />
        {item.type && (
          <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.95)', padding: '3px 8px', borderRadius: 999, fontSize: 10, fontWeight: 700, color: A.ink, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.type}</div>
        )}
      </div>
      <div style={{ flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {(item.localidad || item.zona) && (
            <div style={{ fontSize: 11, color: A.muted, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <IcoPin /> {[item.localidad, item.zona].filter(Boolean).join(' · ')}
            </div>
          )}
          <div style={{ fontSize: 17, fontWeight: 700, color: hov ? A.primary : A.ink, transition: 'color 0.15s', marginBottom: 6, lineHeight: 1.2 }}>{item.name}</div>
          {item.tags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {item.tags.slice(0, 4).map(tag => (
                <span key={tag} style={{ fontSize: 11, padding: '2px 8px', background: A.bg, color: A.ink2, borderRadius: 5, fontWeight: 500 }}>{tag}</span>
              ))}
            </div>
          )}
          {item.description && <p style={{ fontSize: 13, color: A.ink2, lineHeight: 1.5, marginTop: 8, margin: '8px 0 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.description}</p>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${A.line}`, paddingTop: 12, marginTop: 12 }}>
          {item.precioMin > 0 ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 12, color: A.muted }}>Desde</span>
              <span style={{ fontSize: 20, fontWeight: 700, color: hov ? A.primary : A.ink, letterSpacing: '-0.02em', transition: 'color 0.15s' }}>${item.precioMin.toLocaleString('es-AR')}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: hov ? A.primary : A.ink2, transition: 'color 0.15s' }}>{item.unidadPrecio === 'huesped' ? 'por persona' : 'por noche'}</span>
            </div>
          ) : (
            <p style={{ fontSize: 13, color: A.muted, fontStyle: 'italic', margin: 0 }}>Consultá disponibilidad</p>
          )}
          <span style={{ fontSize: 13, fontWeight: 600, color: A.primary, display: 'inline-flex', alignItems: 'center', gap: 4 }}>Ver detalle <IcoChevR /></span>
        </div>
      </div>
    </div>
  );
}

// ─── Checkbox row ─────────────────────────────────────────────
function CheckRow({ label, checked, onChange, count }) {
  return (
    <label onClick={onChange} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}>
      <div
        style={{ width: 18, height: 18, borderRadius: 5, border: checked ? `2px solid ${A.primary}` : `2px solid ${A.line}`, background: checked ? A.primary : '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all 0.12s', cursor: 'pointer' }}
      >
        {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>}
      </div>
      <span style={{ flex: 1, fontSize: 13, color: A.ink2, fontWeight: checked ? 600 : 400 }}>{label}</span>
      {count != null && <span style={{ fontSize: 12, color: A.muted }}>{count}</span>}
    </label>
  );
}

// ═══════════════════════════════════════════════════════════
//  Mapa de resultados
// ═══════════════════════════════════════════════════════════
function MarketplaceMapView({ items, onBoundsChange }) {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  const markersRef = useRef({});

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [-37.2636, -56.9769],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    const fireBounds = () => {
      const b = map.getBounds();
      onBoundsChange({ north: b.getNorth(), south: b.getSouth(), east: b.getEast(), west: b.getWest() });
    };

    map.on('moveend', fireBounds);
    map.on('zoomend', fireBounds);
    leafletRef.current = map;

    // Bounds iniciales después de que el mapa renderizó
    setTimeout(fireBounds, 150);

    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  // Actualizar marcadores cuando cambian los items
  useEffect(() => {
    const L = window.L;
    const map = leafletRef.current;
    if (!L || !map) return;

    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    // Si hay items con coords, ajustar zoom para verlos todos
    const conCoords = items.filter(i => i.lat && i.lng);
    if (conCoords.length > 0 && Object.keys(markersRef.current).length === 0) {
      try {
        const bounds = L.latLngBounds(conCoords.map(i => [i.lat, i.lng]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } catch {}
    }

    conCoords.forEach(item => {
      const precioLabel = item.precioMin > 0
        ? `$${Math.round(item.precioMin / 1000)}k`
        : item.type?.[0] || '•';

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background:#475BE1; color:#fff; border:2.5px solid #fff;
          border-radius:20px; padding:5px 9px;
          font-size:12px; font-weight:700; white-space:nowrap;
          box-shadow:0 2px 10px rgba(71,91,225,0.38);
          font-family:-apple-system,sans-serif; cursor:pointer;
          line-height:1;
        ">${precioLabel}</div>`,
        iconAnchor: [20, 16],
      });

      const marker = L.marker([item.lat, item.lng], { icon })
        .addTo(map)
        .bindTooltip(`<strong style="font-size:13px">${item.name}</strong><br/><span style="color:#6B7280;font-size:11px">${item.type} · ${item.localidad}</span>`, {
          direction: 'top', offset: [0, -10], className: '',
        });

      markersRef.current[item.id] = marker;
    });
  }, [items]);

  return (
    <div style={{ marginBottom: 24, borderRadius: 16, overflow: 'hidden', border: `1px solid ${A.line}`, position: 'relative' }}>
      <div ref={mapRef} style={{ height: 440, width: '100%' }} />
      <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(11,16,32,0.75)', backdropFilter: 'blur(6px)', borderRadius: 999, padding: '6px 14px', color: '#fff', fontSize: 12, fontWeight: 500, pointerEvents: 'none', whiteSpace: 'nowrap' }}>
        Mové o hacé zoom para filtrar los resultados
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  VISTA PRINCIPAL
// ═══════════════════════════════════════════════════════════
// ─── Hook ancho de ventana ────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

export default function MarketplaceView({ onBack, onOpenDetail, initialFiltro = 'todos', initialLocalidad = 'todas', onVerOfertas, onOpenOferta }) {
  const [alojamientos, setAlojamientos] = useState([]);
  const [promos,       setPromos]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [vista,        setVista]        = useState('grilla');
  const [mapaActivo,   setMapaActivo]   = useState(false);
  const [mapaBounds,   setMapaBounds]   = useState(null);
  const [busqueda,     setBusqueda]     = useState('');
  const [orden,        setOrden]        = useState('relevancia');
  const [showOrden,    setShowOrden]    = useState(false);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [stickyTop,    setStickyTop]    = useState(90);
  const sidebarRef = useRef(null);

  // Recalcula el top sticky según altura de sidebar vs viewport
  useEffect(() => {
    const calc = () => {
      if (!sidebarRef.current) return;
      const sH = sidebarRef.current.offsetHeight;
      const vH = window.innerHeight;
      const NAV = 90; // altura nav + padding top
      const BOT = 16; // margen inferior
      setStickyTop(Math.min(NAV, vH - sH - BOT));
    };
    calc();
    window.addEventListener('resize', calc);
    const ro = new ResizeObserver(calc);
    if (sidebarRef.current) ro.observe(sidebarRef.current);
    return () => { window.removeEventListener('resize', calc); ro.disconnect(); };
  }, []);

  // Filtros sidebar
  const [filtroLocalidades, setFiltroLocalidades] = useState(() => {
    if (!initialLocalidad || initialLocalidad === 'todas') return [];
    if (initialLocalidad.startsWith('__multi__:')) {
      return initialLocalidad.slice('__multi__:'.length).split(',').filter(Boolean);
    }
    return [initialLocalidad];
  });
  const [filtroTipos,     setFiltroTipos]     = useState(() => {
    if (!initialFiltro || initialFiltro === 'todos') return new Set();
    return new Set(initialFiltro.split(',').filter(Boolean));
  });
  const [filtroServicios, setFiltroServicios] = useState(new Set());

  // Infinite scroll
  const [shownCount, setShownCount] = useState(10);
  const sentinelRef = useRef(null);
  const ordenRef = useRef(null);
  const winW = useWindowWidth();
  const isMobile = winW < 768;

  useEffect(() => {
    (async () => {
      const [aloj, proms] = await Promise.all([getAlojamientos(), getPromos(20)]);
      setAlojamientos(aloj);
      setPromos(proms.filter(p => p.tokens_costo !== 0));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const h = e => { if (ordenRef.current && !ordenRef.current.contains(e.target)) setShowOrden(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Infinite scroll ──────────────────────────────────────
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setShownCount(n => n + 10);
    }, { rootMargin: '200px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [sentinelRef.current]);

  // Filtrar + ordenar alojamientos ───────────────────────
  const alojFiltrados = alojamientos.filter(item => {
    const matchTipo      = filtroTipos.size === 0 || filtroTipos.has(item.type);
    const matchLocalidad = filtroLocalidades.length === 0 || filtroLocalidades.includes(item.localidad);
    const matchBusq      = !busqueda || (item.name || '').toLowerCase().includes(busqueda.toLowerCase());
    return matchTipo && matchLocalidad && matchBusq;
  }).sort((a, b) => {
    if (orden === 'precio_asc')  return (a.precioMin || 0) - (b.precioMin || 0);
    if (orden === 'precio_desc') return (b.precioMin || 0) - (a.precioMin || 0);
    return 0;
  });

  // ── Promos filtradas por localidad ──────────────────────
  const promosPorLocalidad = promos.filter(p =>
    filtroLocalidades.length === 0 || filtroLocalidades.includes(p.negocioLocalidad) || filtroLocalidades.includes(p.negocioZone)
  );

  // Separar por categoría
  const alojPromos  = promosPorLocalidad.filter(p => p.categoria === 'alojamiento');
  const gastroPromos = promosPorLocalidad.filter(p => p.categoria === 'salidas');
  const expPromos    = promosPorLocalidad.filter(p => p.categoria === 'aventura_relax');

  // ── Lógica de mezcla 50/20/20 ──
  const N = alojFiltrados.length;
  const pickPromos = (list, cuota) => {
    return list.slice(0, Math.max(0, cuota)).map(p => ({ ...p, _esOferta: true, type: 'oferta', _inMarketplace: true }));
  };
  const alojOfertas  = pickPromos(alojPromos,  Math.floor(N * 0.5));
  const todasOfertas  = [...alojOfertas];

  // ── Intercalar ofertas de forma pareja entre alojamientos ──
  const visibles = [];
  if (todasOfertas.length === 0) {
    visibles.push(...alojFiltrados);
  } else {
    const ratio = Math.max(1, Math.floor(alojFiltrados.length / todasOfertas.length));
    let oIdx = 0;
    alojFiltrados.forEach((item, i) => {
      visibles.push(item);
      if ((i + 1) % ratio === 0 && oIdx < todasOfertas.length) {
        visibles.push(todasOfertas[oIdx++]);
      }
    });
    while (oIdx < todasOfertas.length) visibles.push(todasOfertas[oIdx++]);
  }

  // ── Tags de descuento para cada alojamiento ──────────────
  const discountTagsMap = {};
  alojFiltrados.forEach(item => {
    const loc = item.localidad;
    const hasGastro = gastroPromos.some(p => p.negocioLocalidad === loc || p.negocioZone === loc);
    const hasExp    = expPromos.some(p => p.negocioLocalidad === loc || p.negocioZone === loc);
    discountTagsMap[item.id] = { gastro: hasGastro, exp: hasExp };
  });

  // Reset paginado cuando cambian filtros/búsqueda
  const filterKey = `${busqueda}|${[...filtroTipos].join()}|${filtroLocalidades.join()}|${[...filtroServicios].join()}|${orden}`;
  useEffect(() => { setShownCount(10); }, [filterKey]);

  const visiblesPaged = visibles.slice(0, shownCount);
  const hayMas = shownCount < visibles.length;

  // Items filtrados por lo que muestra el mapa en pantalla
  const visiblesEnMapa = React.useMemo(() => {
    if (!mapaActivo || !mapaBounds) return [];
    return visibles.filter(item => {
      const lat = item.lat, lng = item.lng;
      if (!lat || !lng) return false;
      return lat >= mapaBounds.south && lat <= mapaBounds.north
          && lng >= mapaBounds.west  && lng <= mapaBounds.east;
    });
  }, [mapaActivo, mapaBounds, visibles]);

  const vecinas = filtroLocalidades.length === 1 ? getVecinas(filtroLocalidades[0]) : [];

  const toggleTipo = (t) => setFiltroTipos(prev => {
    const next = new Set(prev);
    next.has(t) ? next.delete(t) : next.add(t);
    return next;
  });

  const toggleServicio = (s) => setFiltroServicios(prev => {
    const next = new Set(prev);
    next.has(s) ? next.delete(s) : next.add(s);
    return next;
  });

  const limpiarFiltros = () => {
    setFiltroLocalidades([]);
    setFiltroTipos(new Set());
    setFiltroServicios(new Set());
    setBusqueda('');
  };

  const limpiarSecundarios = () => {
    setFiltroTipos(new Set());
    setFiltroServicios(new Set());
  };

  // Solo filtros secundarios (no destinos)
  const haySecundarios = filtroTipos.size > 0 || filtroServicios.size > 0;
  const hayFiltros = filtroLocalidades.length > 0 || haySecundarios || busqueda;

  const tipoLabel = (val) => TIPOS_ALOJ.find(t => t.val === val)?.label || val;

  // Chips solo de filtros secundarios
  const activeChips = [
    ...[...filtroTipos].map(t => ({ key: `t-${t}`, label: tipoLabel(t), clear: () => toggleTipo(t) })),
    ...[...filtroServicios].map(s => ({ key: `s-${s}`, label: SERVICIOS_LIST.find(x => x.id === s)?.label || s, clear: () => toggleServicio(s) })),
  ];

  const cols = isMobile ? 1 : winW < 1024 ? 2 : 3;
  const renderGrid = (items) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 16 : 22 }}>
      {items.map(item => item._esOferta
        ? <OfertaCard key={`o-${item.id}-${item.categoria}`} promo={item} onOpen={onOpenOferta} inMarketplace={item._inMarketplace} />
        : <AccommodationCard key={`a-${item.id}`} item={item} onClick={onOpenDetail} discountTags={discountTagsMap[item.id]} />
      )}
    </div>
  );

  const renderList = (items) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map(item => item._esOferta
        ? <OfertaCard key={`o-${item.id}-${item.categoria}`} promo={item} variant="list" onOpen={onOpenOferta} inMarketplace={item._inMarketplace} />
        : <AlojListCard key={`a-${item.id}`} item={item} onClick={onOpenDetail} discountTags={discountTagsMap[item.id]} />
      )}
    </div>
  );

  const renderItems = (items) => vista === 'grilla' ? renderGrid(items) : renderList(items);

  // ── Contenido del sidebar (reutilizado en desktop y drawer) ──
  const SidebarContent = (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${A.line}` }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: A.ink }}>Filtros</span>
        {hayFiltros
          ? <button onClick={limpiarFiltros} style={{ background: 'none', border: 'none', fontSize: 12, color: A.primary, cursor: 'pointer', fontWeight: 600, fontFamily: A.font }}>Limpiar filtros</button>
          : isMobile && <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: A.muted, display: 'flex', padding: 4 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
        }
      </div>

      <div style={{ padding: '16px 18px 8px' }}>

        {/* BENEFICIOS EN */}
        <div style={{ borderBottom: `1px solid ${A.line}`, paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Beneficios en</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {[
              { label: 'Alojamientos',    cat: 'alojamiento' },
              { label: 'Salidas',         cat: 'salidas' },
              { label: 'Aventura & Relax',cat: 'aventura_relax' },
            ].map(({ label, cat }) => {
              const active = cat === 'alojamiento';
              return (
                <button key={cat} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 13px', borderRadius: 999, border: `1.5px solid ${active ? '#38f' : A.line}`, background: active ? '#fff' : '#def', color: active ? '#3d4255' : '#777', fontSize: 13, fontWeight: active ? 700 : 500, cursor: 'pointer', fontFamily: A.font, transition: 'all 0.15s' }}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* DESTINO */}
        <div style={{ borderBottom: `1px solid ${A.line}`, paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Destino</span>
            {filtroLocalidades.length > 0 && <button onClick={() => setFiltroLocalidades([])} style={{ background: 'none', border: 'none', fontSize: 11, color: A.primary, cursor: 'pointer', fontWeight: 600, fontFamily: A.font, padding: 0 }}>Limpiar</button>}
          </div>
          {LOCALIDADES.map(loc => (
            <CheckRow key={loc} label={loc} checked={filtroLocalidades.includes(loc)} onChange={() => setFiltroLocalidades(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc])} />
          ))}
        </div>

        {/* FLASH (navega a OfertasView con categoría alojamiento) */}
        <div style={{ borderBottom: `1px solid ${A.line}`, paddingBottom: 16, marginBottom: 16 }}>
          <CheckRow
            label={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>Solo ofertas{' '}<span style={{ fontWeight: 900, fontStyle: 'italic', color: '#EF4444', letterSpacing: '0.05em' }}>FLASH</span><span style={{ color: '#EF4444' }}>⚡</span></span>}
            checked={false}
            onChange={() => {}}
          />
        </div>

        {/* OTROS FILTROS */}
        <div style={{ borderBottom: `1px solid ${A.line}`, paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: A.ink }}>Otros filtros</span>
            {haySecundarios && <button onClick={limpiarSecundarios} style={{ background: 'none', border: 'none', fontSize: 11, color: A.primary, cursor: 'pointer', fontWeight: 600, fontFamily: A.font, padding: 0 }}>Limpiar</button>}
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>Tipos de alojamiento</div>
          <CheckRow label="Todos los tipos" checked={filtroTipos.size === 0} onChange={() => setFiltroTipos(new Set())} />
          {TIPOS_ALOJ.map(t => (
            <CheckRow key={t.val} label={t.label} checked={filtroTipos.has(t.val)} onChange={() => toggleTipo(t.val)} />
          ))}

          <div style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8, marginTop: 14 }}>Servicios incluidos</div>
          {SERVICIOS_LIST.map(s => (
            <CheckRow key={s.id} label={s.label} checked={filtroServicios.has(s.id)} onChange={() => toggleServicio(s.id)} />
          ))}
        </div>

      </div>
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, color: A.ink, paddingTop: 70 }}>

      {/* ── Drawer mobile ── */}
      {isMobile && drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.4)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 300, background: '#fff', zIndex: 101, overflowY: 'auto', boxShadow: '4px 0 32px rgba(0,0,0,0.15)' }}>
            {SidebarContent}
          </div>
        </>
      )}

      {/* ── Body ── */}
      <div style={{ maxWidth: 'var(--site-max)', margin: '0 auto', padding: isMobile ? '16px 16px 72px' : '32px var(--site-pad) 72px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* Sidebar desktop */}
        {!isMobile && (
          <div style={{ width: 260, flexShrink: 0 }}>
          <aside style={{ background: '#fff', borderRadius: 18, border: `1px solid ${A.line}`, overflow: 'hidden' }}>
            {SidebarContent}
          </aside>
          </div>
        )}

        {/* ── RESULTS ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Fila: título + [filtros mobile] + search */}
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 700, color: A.ink, letterSpacing: '-0.02em', margin: 0 }}>Alojamiento, experiencias y más</h1>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {loading ? (
                  <span style={{ fontSize: 13, color: A.muted }}>Cargando...</span>
                ) : (
                  <>
                    <span style={{ fontSize: 13, color: A.muted }}>
                      {`${alojFiltrados.length} alojamiento${alojFiltrados.length !== 1 ? 's' : ''} disponible${alojFiltrados.length !== 1 ? 's' : ''}`}
                    </span>
                    {filtroLocalidades.length === 0 ? (
                      <span style={{ fontSize: 13, color: A.muted }}>en Villa Gesell y alrededores</span>
                    ) : (
                      <>
                        <span style={{ fontSize: 13, color: A.muted }}>en</span>
                        {filtroLocalidades.map(loc => (
                          <span key={loc} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', background: A.primarySoft, color: A.primary, borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                            {loc}
                            <button onClick={() => setFiltroLocalidades(prev => prev.filter(l => l !== loc))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: A.primary, display: 'flex', padding: 0, lineHeight: 1 }}>
                              <IcoX />
                            </button>
                          </span>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {isMobile && (
                <button
                  onClick={() => setDrawerOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: hayFiltros ? A.primary : '#fff', color: hayFiltros ? '#fff' : A.ink, border: `1.5px solid ${hayFiltros ? A.primary : A.line}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
                  Filtros{hayFiltros ? ` (${(filtroTipos.size + filtroServicios.size + filtroLocalidades.length)})` : ''}
                </button>
              )}
              <div style={{ position: 'relative' }}>
                <input
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar en alojamientos"
                  style={{ width: isMobile ? 180 : 260, paddingLeft: 14, paddingRight: 40, paddingTop: 10, paddingBottom: 10, border: `1.5px solid ${A.line}`, borderRadius: 12, fontSize: 14, fontFamily: A.font, background: '#fff', color: A.ink, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = A.primary}
                  onBlur={e => e.target.style.borderColor = A.line}
                />
                <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: A.muted, display: 'flex', pointerEvents: 'none' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                </span>
              </div>
            </div>
          </div>

          {/* Controles: grilla/lista + orden */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
            {!isMobile && (
              <div style={{ display: 'flex', background: A.bg, padding: 3, borderRadius: 10, border: `1px solid ${A.line}` }}>
                <button onClick={() => setVista('grilla')} style={{ padding: '6px 10px', borderRadius: 7, background: vista === 'grilla' ? '#fff' : 'transparent', border: vista === 'grilla' ? `1px solid ${A.line}` : '1px solid transparent', color: vista === 'grilla' ? A.ink : A.muted, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <IcoGrid /> Grilla
                </button>
                <button onClick={() => setVista('lista')} style={{ padding: '6px 10px', borderRadius: 7, background: vista === 'lista' ? '#fff' : 'transparent', border: vista === 'lista' ? `1px solid ${A.line}` : '1px solid transparent', color: vista === 'lista' ? A.ink : A.muted, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <IcoList /> Lista
                </button>
                <button
                  onClick={() => setMapaActivo(m => !m)}
                  style={{ padding: '6px 10px', borderRadius: 7, background: mapaActivo ? A.primary : 'transparent', border: mapaActivo ? `1px solid ${A.primary}` : '1px solid transparent', color: mapaActivo ? '#fff' : A.muted, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  <IcoMap /> Mapa
                </button>
              </div>
            )}
            <span style={{ fontSize: 13, color: A.muted, fontWeight: 500 }}>Ordenar por</span>
            <div style={{ position: 'relative' }} ref={ordenRef}>
              <button onClick={() => setShowOrden(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fff', border: `1px solid ${A.line}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: A.ink, cursor: 'pointer', fontFamily: A.font }}>
                {ORDEN_OPTS.find(o => o.id === orden)?.label} <IcoChevD />
              </button>
              {showOrden && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#fff', border: `1px solid ${A.line}`, borderRadius: 14, boxShadow: '0 16px 48px -16px rgba(11,16,32,0.2)', zIndex: 50, overflow: 'hidden', minWidth: 200 }}>
                  {ORDEN_OPTS.map(opt => (
                    <button key={opt.id} onClick={() => { setOrden(opt.id); setShowOrden(false); }} style={{ width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', background: orden === opt.id ? A.primarySoft : 'transparent', color: orden === opt.id ? A.primary : A.ink2, fontSize: 13, fontWeight: orden === opt.id ? 600 : 500, cursor: 'pointer', fontFamily: A.font }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Mapa */}
          {mapaActivo && !loading && (
            <MarketplaceMapView
              items={visibles.filter(i => i.lat && i.lng && !i._esOferta)}
              onBoundsChange={setMapaBounds}
            />
          )}

          {/* Results */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 12 }}>
              <video autoPlay loop muted playsInline style={{ width: 90, height: 'auto' }}>
                <source src="/loading-casa.webm" type="video/webm" />
              </video>
              <span style={{ fontSize: 14, color: A.muted, fontWeight: 500 }}>Buscando resultados…</span>
            </div>
          ) : visibles.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 20, padding: '56px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: A.ink, marginBottom: 6 }}>Sin resultados</div>
              <div style={{ fontSize: 14, color: A.muted, marginBottom: 20 }}>Probá con otros filtros o explorá otras zonas</div>
              <button onClick={limpiarFiltros} style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Limpiar filtros
              </button>
            </div>
          ) : mapaActivo ? (
            <>
              {visiblesEnMapa.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: A.muted, fontSize: 14 }}>
                  No hay alojamientos en esta zona del mapa. Hacé zoom out o mové el mapa.
                </div>
              ) : renderItems(visiblesEnMapa)}
            </>
          ) : renderItems(visiblesPaged)}

          {/* Sentinel infinite scroll — solo cuando el mapa no está activo */}
          {!mapaActivo && hayMas && <div ref={sentinelRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, border: `3px solid ${A.line}`, borderTopColor: A.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* Otras opciones cerca */}
          {!loading && filtroLocalidades.length === 1 && vecinas.length > 0 && (
            <div style={{ marginTop: 64 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
                <div style={{ flex: 1, height: 1, background: A.line }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>También te puede interesar</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: A.ink }}>Otras opciones similares cerca de {filtroLocalidades[0]}</div>
                </div>
                <div style={{ flex: 1, height: 1, background: A.line }} />
              </div>
              {vecinas.map(vecina => {
                const itemsVecina = alojamientos.filter(i => i.localidad === vecina).slice(0, 3);
                if (itemsVecina.length === 0) return null;
                return (
                  <div key={vecina} style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: A.primary }}><IcoPin /></span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: A.ink }}>{vecina}</span>
                        <span style={{ fontSize: 12, color: A.muted }}>({itemsVecina.length} opciones)</span>
                      </div>
                      <button onClick={() => setFiltroLocalidades([vecina])} style={{ background: 'none', border: 'none', color: A.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                        Ver todo en {vecina} <IcoChevR />
                      </button>
                    </div>
                    {renderGrid(itemsVecina)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
