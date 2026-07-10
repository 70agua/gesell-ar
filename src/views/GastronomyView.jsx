// ============================================================
//  src/views/GastronomyView.jsx — Mapa arriba · Mini-fichas abajo
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getGastronomia, getAventura, getPromos } from '../lib/datos';
import { mockDining } from '../data/mockData';
const MiniLoader = () => <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:220 }}><video autoPlay loop muted playsInline style={{ width:90, height:'auto' }}><source src="/loading-casa.webm" type="video/webm"/></video></div>;
import { LOCALIDADES } from '../lib/localidades';
import { useCuponera } from '../lib/cuponera';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const A = {
  primary:     '#2545E6',
  primaryDark: '#1731B8',
  primarySoft: '#EEF1FF',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  yellow:      '#FFC93C',
  green:       '#10A36B',
  font:        "'Inter', system-ui, sans-serif",
};

const TIPOS_GASTRO = [
  { label: 'Restaurantes',      val: 'Restaurante' },
  { label: 'Bares',             val: 'Bar' },
  { label: 'Cafeterías',        val: 'Café' },
  { label: 'Heladerías',        val: 'Heladería' },
  { label: 'Panaderías',        val: 'Panadería' },
  { label: 'Compras',           val: 'Compras' },
  { label: 'Discotecas',        val: 'Discoteca' },
  { label: 'Cines y Teatros',   val: 'Cine y Teatro' },
  { label: 'Shows y Recitales', val: 'Show y Recital' },
  { label: 'Centros Culturales',val: 'Centro Cultural' },
];

const TIPOS_AVENTURA = [
  { label: 'Excursiones',         val: 'Excursion' },
  { label: 'Actividades',         val: 'Actividad' },
  { label: 'Deportes acuáticos',  val: 'Deportes acuáticos' },
  { label: 'Cabalgatas',          val: 'Cabalgatas' },
  { label: 'Kitesurf',            val: 'Kitesurf' },
  { label: 'Tour fotográfico',    val: 'Tour fotográfico' },
  { label: 'Pesca deportiva',     val: 'Pesca deportiva' },
  { label: 'Senderismo',          val: 'Senderismo' },
  { label: 'Espectáculos',        val: 'Espectáculos' },
];

const TIPOS_MIMO = [
  { label: 'Spa',                 val: 'Spa' },
  { label: 'Yoga & Bienestar',    val: 'Yoga / Bienestar' },
  { label: 'Masajes',             val: 'Masajes a domicilio' },
];

const EXPERIENCIA_OPTS = [
  { label: 'Cita de a dos',       icon: '❤️' },
  { label: 'Plan familiar',        icon: '👨‍👩‍👧' },
  { label: 'Pies en la arena',     icon: '🏖️' },
  { label: 'Desayuno & Brunch',    icon: '☕' },
  { label: 'Noche de bares',       icon: '🍸' },
  { label: 'Después de la playa',  icon: '🌊' },
  { label: 'Para grupos grandes',  icon: '🎉' },
  { label: 'Vista al mar',         icon: '🌅' },
];
const PRECIO_OPTS  = [{ id:'$', label:'$ — Económico' },{ id:'$$', label:'$$ — Moderado' },{ id:'$$$', label:'$$$ — Premium' }];
const ORDEN_OPTS   = [{ id:'relevancia', label:'Más relevantes' },{ id:'az', label:'A → Z' }];

const TIPO_COLORS = {
  'Restaurante': '#EF4444', 'Bar': '#F59E0B', 'Cafeterías': '#8B5CF6',
  'Café': '#8B5CF6', 'Balneario': '#0EA5E9', 'Gourmet': '#10B981',
  'Pastelería': '#EC4899', 'Parrilla': '#F97316', 'Heladería': '#06B6D4',
};

// Villa Gesell bounds: lat -37.20 a -37.35, lng -57.02 a -56.88
function itemLatLng(id, zona) {
  const n = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g,'')) || 1;
  // Offsets por zona para simular distribución real
  const zoneOffset = { 'Mar de las Pampas': 0.04, 'Las Gaviotas': 0.06, 'Mar Azul': 0.08 };
  const zOff = zoneOffset[zona] || 0;
  const lat = -37.200 - ((n * 37 + 11) % 130) / 1000 - zOff;
  const lng = -57.000 + ((n * 53 + 17) % 110) / 1000;
  return [lat, lng];
}

// Bounds del Partido de Villa Gesell (VG, Mar de las Pampas, Las Gaviotas,
// Mar Azul, Nueva Atlantis). El mapa arranca mostrando todo el partido.
const PARTIDO_BOUNDS = [[-37.16, -57.05], [-37.42, -56.88]];
// A partir de este zoom aparecen los puntitos del resto de propuestas.
const DOT_ZOOM = 14;

// Ancla del popup: en desktop lo abrimos al costado (derecha) del círculo;
// en mobile arriba. Combinado con autoPan, nunca queda cortado.
function popupAnchorFor(size, isMobile) {
  const half = Math.round(size / 2);
  return isMobile ? [0, -half - 2] : [half + 6, 0];
}

// Círculo numerado del ranking: top 3 en amarillo (igual que el ranking),
// puestos 4–10 en gris. Todos con reborde blanco para despegar del fondo.
function makeRankIcon(rank, top3, isMobile) {
  const bg   = top3 ? '#FFC93C' : '#8B8B8B';
  const fg   = top3 ? '#0B1733' : '#fff';
  const size = top3 ? 34 : 28;
  const html = `
    <div style="
      width:${size}px;height:${size}px;border-radius:50%;
      background:${bg};border:3px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      font-size:${top3 ? 15 : 12}px;font-weight:800;color:${fg};
      font-family:Inter,system-ui,sans-serif;
    ">${rank}</div>`;
  return L.divIcon({ html, className: '', iconSize: [size,size], iconAnchor: [size/2,size/2], popupAnchor: popupAnchorFor(size, isMobile) });
}

// Puntito chico (color principal, reborde blanco) para el resto de las
// propuestas gastronómicas que no están en el top 10.
function makeDotIcon(isMobile) {
  const html = `
    <div style="
      width:13px;height:13px;border-radius:50%;
      background:${A.primary};border:2px solid #fff;
      box-shadow:0 1px 4px rgba(0,0,0,0.3);
    "></div>`;
  return L.divIcon({ html, className: '', iconSize: [13,13], iconAnchor: [6.5,6.5], popupAnchor: popupAnchorFor(13, isMobile) });
}

// ─── Tracker de zoom: revela los puntitos al acercar el mapa ──
function MapZoomTracker({ onZoom }) {
  const map = useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
    load:    () => onZoom(map.getZoom()),
  });
  useEffect(() => { onZoom(map.getZoom()); }, []);
  return null;
}

// ─── Zoom control clickeable ──────────────────────────────────
function ZoomControls() {
  const map = useMapEvents({});
  return (
    <div style={{
      position: 'absolute', bottom: 48, right: 12, zIndex: 800,
      display: 'flex', flexDirection: 'column', gap: 2,
    }}>
      {[{ label: '+', fn: () => map.zoomIn() }, { label: '−', fn: () => map.zoomOut() }].map(({ label, fn }) => (
        <button key={label} onClick={fn} style={{
          width: 32, height: 32, background: '#fff', border: '1px solid rgba(0,0,0,0.18)',
          borderRadius: 6, fontSize: 18, fontWeight: 700, lineHeight: 1, cursor: 'pointer',
          boxShadow: '0 1px 5px rgba(0,0,0,0.18)', color: A.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Icons SVG ───────────────────────────────────────────────
const IcoSearch  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
const IcoX       = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const IcoChevD   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>;
const IcoPin     = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
const IcoArrowL  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
const IcoLock    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IcoRefresh = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 2v6h-6"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M3 22v-6h6"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>;

// ─── Checkbox ────────────────────────────────────────────────
function CheckRow({ label, checked, onChange }) {
  return (
    <label onClick={onChange} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', cursor:'pointer' }}>
      <div style={{ width:18, height:18, borderRadius:5, border:checked ? `2px solid ${A.primary}` : `2px solid ${A.line}`, background:checked ? A.primary : '#fff', display:'grid', placeItems:'center', flexShrink:0, transition:'all .12s' }}>
        {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="m5 12 4.5 4.5L20 6"/></svg>}
      </div>
      <span style={{ flex:1, fontSize:13, color:A.ink2, fontWeight:checked ? 600 : 400 }}>{label}</span>
    </label>
  );
}

// ─── Ficha gastronómica (formato original) ───────────────────
function GastroCard({ item, isHovered, onHover, session, onLoginClick, onOpenDetail }) {
  const color = TIPO_COLORS[item.category] || A.primary;
  return (
    <div
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onOpenDetail && onOpenDetail(item, 'salidas')}
      style={{
        background:'#fff', border:`1px solid ${isHovered ? color+'60' : A.line}`,
        borderRadius:18, overflow:'hidden', display:'flex', flexDirection:'column',
        cursor:'pointer', transition:'box-shadow .2s, border-color .2s, transform .2s',
        boxShadow: isHovered ? '0 12px 40px -12px rgba(11,16,32,0.16)' : 'none',
        transform: isHovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Foto */}
      <div style={{ position:'relative', height:190, overflow:'hidden', flexShrink:0 }}>
        <img src={item.image} alt={item.name}
          style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .4s', transform: isHovered ? 'scale(1.05)' : 'scale(1)' }}
        />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,16,32,0.5) 0%, transparent 50%)' }} />
        <div style={{ position:'absolute', bottom:10, left:10, background:color, color:'#fff', padding:'3px 10px', borderRadius:999, fontSize:10, fontWeight:700, letterSpacing:'0.03em' }}>
          {item.category}
        </div>
        {item.priceRange && (
          <div style={{ position:'absolute', top:10, right:10, background:'rgba(255,255,255,0.95)', color:A.ink, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}>
            {item.priceRange}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding:'14px 16px', flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ fontSize:16, fontWeight:700, color:isHovered ? A.primary : A.ink, marginBottom:4, lineHeight:1.2, transition:'color .15s' }}>
          {item.name}
        </div>
        <div style={{ fontSize:12, color:A.muted, marginBottom:8, display:'flex', alignItems:'center', gap:4 }}>
          <IcoPin />
          <span style={{ color:A.ink2, fontWeight:500 }}>{[item.zona, item.localidad].filter(Boolean).join(' · ')}</span>
        </div>
        <p style={{ fontSize:13, color:A.ink2, lineHeight:1.5, margin:'0 0 auto', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
          {item.description}
        </p>
        <div style={{ borderTop:`1px solid ${A.line}`, paddingTop:10, marginTop:12 }}>
          {session ? (
            <div style={{ fontSize:12, color:A.ink2, display:'flex', alignItems:'center', gap:4 }}><IcoPin /> {item.address || item.zona}</div>
          ) : (
            <button onClick={e => { e.stopPropagation(); onLoginClick && onLoginClick(); }}
              style={{ background:'none', border:'none', padding:0, cursor:'pointer', display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ color:A.muted }}><IcoLock /></span>
              <span style={{ fontSize:12, color:A.primary, fontWeight:600 }}>Ver dirección exacta</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
export default function GastronomyView({ onBack, session, onLoginClick, onOpenDetail, onVerOfertas, initialCategoria = '', initialAventura = '', initialTipos = null, modoRanking = false, modoAventura = false }) {
  const { addCupon } = useCuponera();
  const [salidas, setSalidas] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busqueda,    setBusqueda]    = useState('');
  const [orden,       setOrden]       = useState('relevancia');
  const [showOrden,   setShowOrden]   = useState(false);
  const [hoveredId,   setHoveredId]   = useState(null);
  const [zoom,        setZoom]        = useState(12);      // zoom actual del mapa (revela puntitos)
  const [isMobile,    setIsMobile]    = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Sidebar filters
  const [filtroLocalidad,   setFiltroLocalidad]   = useState('');
  const [filtroTipos,       setFiltroTipos]       = useState(new Set());
  const [filtroPrecios,     setFiltroPrecios]     = useState(new Set());
  const [filtroComida,      setFiltroComida]      = useState('');
  const [filtroExperiencia, setFiltroExperiencia] = useState('');

  useEffect(() => {
    if (initialTipos) setFiltroTipos(new Set(initialTipos));
    else if (initialCategoria) setFiltroTipos(new Set([initialCategoria]));
    if (initialAventura) setFiltroExperiencia(initialAventura);
  }, []);

  const ordenRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (modoAventura) {
        const data = await getAventura();
        setSalidas(data);
      } else {
        const gastro = await getGastronomia();
        const realIds   = new Set(gastro.map(g => String(g.id)));
        const realNames = new Set(gastro.map(g => (g.name || '').toLowerCase()));
        const mocks = mockDining
          .filter(m => !realIds.has(String(m.id)) && !realNames.has((m.name || '').toLowerCase()))
          .map(m => ({ ...m, esReal: false }));
        setSalidas([...gastro, ...mocks]);
      }
      setLoading(false);
    })();
  }, [modoAventura]);

  useEffect(() => {
    const h = e => { if (ordenRef.current && !ordenRef.current.contains(e.target)) setShowOrden(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // Asociar lat/lng a cada ítem (estable, no recalcula)
  const itemsConLatLng = salidas.map(item => ({
    ...item,
    _lat: itemLatLng(item.id, item.zona)[0],
    _lng: itemLatLng(item.id, item.zona)[1],
  }));

  // Filtros sidebar + búsqueda
  const gastroFiltradaBase = itemsConLatLng.filter(item => {
    const matchLocalidad = !filtroLocalidad || item.localidad === filtroLocalidad;
    const matchTipo      = filtroTipos.size === 0 || filtroTipos.has(item.category);
    const matchPrecio    = filtroPrecios.size === 0 || filtroPrecios.has(item.priceRange);
    const matchBusq      = !busqueda || item.name.toLowerCase().includes(busqueda.toLowerCase()) || (item.description||'').toLowerCase().includes(busqueda.toLowerCase());
    return matchLocalidad && matchTipo && matchPrecio && matchBusq;
  });

  // El ranking y el mapa muestran el mismo conjunto (filtros del sidebar),
  // sin recortar por viewport: el zoom solo revela puntitos, no filtra la lista.
  const gastroFiltrada = gastroFiltradaBase;

  const esNido = item => (item.name || '').toLowerCase().includes('nido');
  const gastroOrdenada = [...gastroFiltrada].sort((a, b) => {
    if (esNido(a) && !esNido(b)) return -1;
    if (!esNido(a) && esNido(b)) return 1;
    if (orden === 'az') return a.name.localeCompare(b.name, 'es');
    return 0;
  });

  const toggleTipo   = t => setFiltroTipos(prev   => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
  const togglePrecio = p => setFiltroPrecios(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
  const limpiarFiltros = () => { setFiltroLocalidad(''); setFiltroTipos(new Set()); setFiltroPrecios(new Set()); setFiltroComida(''); setFiltroExperiencia(''); setBusqueda(''); };
  const hayFiltros = filtroLocalidad || filtroTipos.size > 0 || filtroPrecios.size > 0 || filtroComida || filtroExperiencia || busqueda;

  const activeChips = [
    ...(filtroLocalidad ? [{ key:'loc',  label:filtroLocalidad, clear:() => setFiltroLocalidad('') }] : []),
    ...[...filtroTipos].map(t => ({ key:`t-${t}`, label: TIPOS_GASTRO.find(g => g.val === t)?.label || t, clear:() => toggleTipo(t) })),
    ...[...filtroPrecios].map(p => ({ key:`p-${p}`, label:p, clear:() => togglePrecio(p) })),
  ];

  // IDs de items que pasan los filtros de sidebar (para highlight de pins)
  const filtradoBaseIds = new Set(gastroFiltradaBase.map(i => i.id));

  // ─── Mapa: círculos numerados del top 10 + puntitos del resto ──
  //  Se posiciona distinto según el modo (ver más abajo en el render).
  const mapEl = (
    <div className="gastro-map-wrapper" style={{ position:'relative', height:'46vh', minHeight:340, maxHeight:520, borderRadius:16, overflow:'hidden', border:`1px solid ${A.line}`, marginBottom:24, background:'#e8f4f8', transform:'translateZ(0)' }}>
      <MapContainer
        bounds={PARTIDO_BOUNDS}
        style={{ width:'100%', height:'100%' }}
        scrollWheelZoom={false}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapZoomTracker onZoom={setZoom} />
        <ZoomControls />

        {gastroOrdenada.map((item, idx) => {
          const rank      = idx + 1;
          const enRanking = rank <= 10;
          // El resto (puntitos) solo aparece al acercar el zoom.
          if (!enRanking && zoom < DOT_ZOOM) return null;
          const icon = enRanking ? makeRankIcon(rank, rank <= 3, isMobile) : makeDotIcon(isMobile);
          return (
            <Marker
              key={item.id}
              position={[item._lat, item._lng]}
              icon={icon}
              eventHandlers={{ mouseover: () => setHoveredId(item.id), mouseout: () => setHoveredId(null) }}
            >
              <Popup minWidth={190} maxWidth={210} autoPan keepInView autoPanPadding={[28, 28]}>
                <div style={{ fontFamily:A.font, width:190 }}>
                  {item.image && (
                    <div style={{ margin:'-12px -20px 10px', height:104, overflow:'hidden', borderRadius:'8px 8px 0 0' }}>
                      <img src={item.image} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    </div>
                  )}
                  <div style={{ fontWeight:700, fontSize:13, color:A.ink, lineHeight:1.3, marginBottom:6 }}>
                    {enRanking && <span style={{ color: rank <= 3 ? '#C9971B' : A.muted, fontWeight:800 }}>#{rank} · </span>}
                    {item.name}
                  </div>
                  {(item.zona || item.localidad) && (
                    <div style={{ fontSize:11, color:A.muted, marginBottom:10, display:'flex', alignItems:'center', gap:3 }}>
                      <IcoPin /> {[item.zona, item.localidad].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  <button
                    onClick={() => onOpenDetail && onOpenDetail(item, 'salidas')}
                    style={{ width:'100%', padding:'7px 0', background:A.primary, color:'#fff', border:'none', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:A.font }}
                  >
                    Ver más →
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:A.bg, fontFamily:A.font, color:A.ink, paddingTop:70 }}>

      {/* ── Body: sidebar + [mapa + resultados] ── */}
      <div style={{ maxWidth:1328, margin:'0 auto', padding:'32px 40px 72px', display:'flex', gap:32, alignItems:'flex-start' }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ width:260, flexShrink:0 }}>
          <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:18, overflow:'hidden' }}>

            {/* Header Filtros */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', borderBottom:`1px solid ${A.line}` }}>
              <span style={{ fontSize:15, fontWeight:700 }}>Filtros</span>
              {hayFiltros && <button onClick={limpiarFiltros} style={{ background:'none', border:'none', color:A.primary, fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:A.font }}>Limpiar filtros</button>}
            </div>

            <div style={{ padding:'16px 18px 8px' }}>

              {/* BENEFICIOS EN */}
              <div style={{ borderBottom:`1px solid ${A.line}`, paddingBottom:16, marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:A.muted, letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:10 }}>Beneficios en</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                  {[
                    { label:'Alojamientos', cat:'alojamiento' },
                    { label:'Salidas',      cat:'salidas' },
                    { label:'Aventura & Relax', cat:'aventura_relax' },
                  ].map(({ label, cat }) => {
                    const active = cat === 'salidas';
                    return (
                      <button key={cat} style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 13px', borderRadius:999, border:`1.5px solid ${active ? '#38f' : A.line}`, background: active ? '#fff' : '#def', color: active ? '#3d4255' : '#777', fontSize:13, fontWeight: active ? 700 : 500, cursor:'pointer', fontFamily:A.font, transition:'all 0.15s' }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DESTINO */}
              <div style={{ borderBottom:`1px solid ${A.line}`, paddingBottom:16, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <span style={{ fontSize:11, fontWeight:700, color:A.muted, letterSpacing:'0.06em', textTransform:'uppercase' }}>Destino</span>
                  {filtroLocalidad && <button onClick={() => setFiltroLocalidad('')} style={{ background:'none', border:'none', fontSize:11, color:A.primary, cursor:'pointer', fontWeight:600, fontFamily:A.font, padding:0 }}>Limpiar</button>}
                </div>
                {LOCALIDADES.map(loc => (
                  <CheckRow key={loc} label={loc} checked={filtroLocalidad===loc} onChange={() => setFiltroLocalidad(filtroLocalidad===loc ? '' : loc)} />
                ))}
              </div>

              {/* FLASH */}
              <div style={{ borderBottom:`1px solid ${A.line}`, paddingBottom:16, marginBottom:16 }}>
                <CheckRow
                  label={<span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>Solo ofertas{' '}<span style={{ fontWeight:900, fontStyle:'italic', color:'#EF4444', letterSpacing:'0.05em' }}>FLASH</span><span style={{ color:'#EF4444' }}>⚡</span></span>}
                  checked={false}
                  onChange={() => {}}
                />
              </div>

              {/* OTROS FILTROS */}
              <div style={{ borderBottom:`1px solid ${A.line}`, paddingBottom:16, marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <span style={{ fontSize:14, fontWeight:700, color:A.ink }}>Otros filtros</span>
                  {(filtroTipos.size > 0 || filtroExperiencia) && (
                    <button onClick={() => { setFiltroTipos(new Set()); setFiltroExperiencia(''); }} style={{ background:'none', border:'none', fontSize:11, color:A.primary, cursor:'pointer', fontWeight:600, fontFamily:A.font, padding:0 }}>Limpiar</button>
                  )}
                </div>

                {/* Tipos */}
                <div style={{ fontSize:11, fontWeight:700, color:A.muted, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:8 }}>Tipo de lugar</div>
                {(modoAventura ? [...TIPOS_AVENTURA, ...TIPOS_MIMO] : TIPOS_GASTRO).map(t => (
                  <CheckRow key={t.val} label={t.label} checked={filtroTipos.has(t.val)} onChange={() => toggleTipo(t.val)} />
                ))}

                {!modoAventura && (
                  <>
                    {/* Experiencia (solo gastro) */}
                    <div style={{ fontSize:11, fontWeight:700, color:A.muted, letterSpacing:'0.05em', textTransform:'uppercase', marginBottom:8, marginTop:14 }}>Tipo de experiencia</div>
                    {EXPERIENCIA_OPTS.map(o => (
                      <CheckRow key={o.label} label={o.label} checked={filtroExperiencia === o.label} onChange={() => setFiltroExperiencia(filtroExperiencia === o.label ? '' : o.label)} />
                    ))}
                  </>
                )}
              </div>

            </div>
          </div>
        </aside>

        {/* ── RESULTADOS ── */}
        <div>

          {/* Encabezado: título + chips + buscador */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, marginBottom:20 }}>
            <div style={{ flex:1 }}>
              <h1 style={{ fontSize:30, fontStyle:'italic', fontWeight:500, color:A.ink, letterSpacing:'-0.01em', margin:'25px 0 6px', lineHeight:1.2 }}>
                {modoAventura
                  ? 'Aventura & Relax'
                  : modoRanking
                  ? <>Top <em style={{ fontStyle:'normal', color:A.primary }}>#10</em> donde comer y beber</>
                  : 'Los más ricos sabores locales'}
              </h1>
              <div style={{ display:'flex', alignItems:'center', flexWrap:'wrap', gap:6 }}>
                <span style={{ fontSize:13, color:A.muted }}>
                  {loading ? 'Cargando…' : `${gastroOrdenada.length} lugar${gastroOrdenada.length!==1?'es':''} encontrado${gastroOrdenada.length!==1?'s':''}`}
                </span>
                {!loading && filtroLocalidad && (
                  <>
                    <span style={{ fontSize:13, color:A.muted }}>en</span>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 10px', background:A.primarySoft, color:A.primary, borderRadius:999, fontSize:12, fontWeight:600 }}>
                      {filtroLocalidad}
                      <button onClick={() => setFiltroLocalidad('')} style={{ background:'none', border:'none', cursor:'pointer', color:A.primary, display:'flex', padding:0, lineHeight:1 }}><IcoX /></button>
                    </span>
                  </>
                )}
                {!session && !loading && (
                  <span style={{ fontSize:13, color:A.muted }}>· <button onClick={onLoginClick} style={{ background:'none', border:'none', color:A.primary, fontWeight:600, cursor:'pointer', fontSize:13, padding:0, fontFamily:A.font }}>Registrate</button> para ver direcciones</span>
                )}
              </div>
            </div>
            <div style={{ position:'relative', flexShrink:0, marginTop:25 }}>
              <input
                type="text" value={busqueda} onChange={e => setBusqueda(e.target.value)}
                placeholder={modoAventura ? 'Buscar en aventura & relax' : 'Buscar en gastronomía'}
                style={{ width:260, paddingLeft:14, paddingRight:40, paddingTop:10, paddingBottom:10, border:`1.5px solid ${A.line}`, borderRadius:12, fontSize:14, fontFamily:A.font, background:'#fff', color:A.ink, outline:'none', boxSizing:'border-box' }}
                onFocus={e => e.target.style.borderColor=A.primary}
                onBlur={e => e.target.style.borderColor=A.line}
              />
              <span style={{ position:'absolute', right:13, top:'50%', transform:'translateY(-50%)', color:A.muted, display:'flex', pointerEvents:'none' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
              </span>
            </div>
          </div>

          {/* Chips de tipo/precio activos */}
          {(filtroTipos.size > 0 || filtroPrecios.size > 0) && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
              {[...filtroTipos].map(t => (
                <span key={t} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', background:A.primarySoft, color:A.primary, borderRadius:999, fontSize:12, fontWeight:600 }}>
                  {TIPOS_GASTRO.find(g => g.val === t)?.label || t}
                  <button onClick={() => toggleTipo(t)} style={{ background:'none', border:'none', cursor:'pointer', color:A.primary, display:'flex', padding:0 }}><IcoX /></button>
                </span>
              ))}
              {[...filtroPrecios].map(p => (
                <span key={p} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', background:A.primarySoft, color:A.primary, borderRadius:999, fontSize:12, fontWeight:600 }}>
                  {p}<button onClick={() => togglePrecio(p)} style={{ background:'none', border:'none', cursor:'pointer', color:A.primary, display:'flex', padding:0 }}><IcoX /></button>
                </span>
              ))}
            </div>
          )}

          {/* Ranking de fichas */}
          {loading ? (
            <MiniLoader />
          ) : gastroOrdenada.length === 0 ? (
            <div style={{ background:'#fff', border:`1px solid ${A.line}`, borderRadius:20, padding:'48px 32px', textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12 }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={A.muted} strokeWidth="1.5" strokeLinecap="round"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
              </div>
              <div style={{ fontSize:17, fontWeight:700, color:A.ink, marginBottom:6 }}>Sin resultados en esta zona</div>
              <div style={{ fontSize:13, color:A.muted, marginBottom:20 }}>Hacé zoom out en el mapa o cambiá los filtros</div>
              <button onClick={limpiarFiltros} style={{ background:A.primary, color:'#fff', border:'none', borderRadius:12, padding:'10px 24px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:A.font }}>
                Limpiar filtros
              </button>
            </div>
          ) : !modoRanking ? (
            /* ── Vista regular (desde header nav): mapa + grilla sin numeración ── */
            <>
            {mapEl}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
              {gastroOrdenada.map((item) => {
                const color = TIPO_COLORS[item.category] || A.primary;
                const isHov = hoveredId === item.id;
                return (
                  <div key={item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onOpenDetail && onOpenDetail(item, 'salidas')}
                    style={{ background:'#fff', border:`1px solid ${isHov ? color+'60' : A.line}`, borderRadius:18, overflow:'hidden', cursor:'pointer', transition:'box-shadow .2s, transform .2s', boxShadow: isHov ? '0 12px 40px -12px rgba(11,16,32,0.18)' : 'none', transform: isHov ? 'translateY(-2px)' : 'none' }}
                  >
                    <div style={{ position:'relative', height:190, overflow:'hidden', flexShrink:0 }}>
                      <img src={item.image} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .4s', transform: isHov ? 'scale(1.05)' : 'scale(1)' }} />
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,16,32,0.4) 0%, transparent 55%)' }} />
                      <div style={{ position:'absolute', bottom:10, left:10, background:color, color:'#fff', padding:'3px 10px', borderRadius:999, fontSize:10, fontWeight:700 }}>
                        {item.category}
                      </div>
                      {item.priceRange && (
                        <div style={{ position:'absolute', top:10, right:10, background:'rgba(255,255,255,0.95)', color:A.ink, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}>
                          {item.priceRange}
                        </div>
                      )}
                    </div>
                    <div style={{ padding:'13px 15px 16px' }}>
                      <div style={{ fontSize:15, fontWeight:800, color: isHov ? A.primary : A.ink, marginBottom:3, lineHeight:1.2, transition:'color .15s' }}>{item.name}</div>
                      <div style={{ fontSize:12, color:A.muted, marginBottom:5, display:'flex', alignItems:'center', gap:4 }}><IcoPin /><span style={{ color:A.ink2, fontWeight:500 }}>{[item.zona, item.localidad].filter(Boolean).join(' · ')}</span></div>
                      <p style={{ fontSize:12, color:A.ink2, lineHeight:1.45, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>

              {/* TOP 3 — cards grandes, 3 columnas */}
              {gastroOrdenada.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:8 }}>
                  {gastroOrdenada.slice(0,3).map((item, i) => {
                    const MEDAL      = [A.yellow, A.yellow, A.yellow];
                    const MEDAL_TEXT = [A.navy,   A.navy,   A.navy  ];
                    const color = TIPO_COLORS[item.category] || A.primary;
                    const isHov = hoveredId === item.id;
                    return (
                      <div key={item.id}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => onOpenDetail && onOpenDetail(item, 'salidas')}
                        style={{ background:'#fff', border:`1px solid ${isHov ? color+'60' : A.line}`, borderRadius:18, overflow:'hidden', cursor:'pointer', transition:'box-shadow .2s, transform .2s', boxShadow: isHov ? '0 12px 40px -12px rgba(11,16,32,0.18)' : 'none', transform: isHov ? 'translateY(-2px)' : 'none' }}
                      >
                        <div style={{ position:'relative', height:220, overflow:'hidden', flexShrink:0 }}>
                          <img src={item.image} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .4s', transform: isHov ? 'scale(1.05)' : 'scale(1)' }} />
                          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(11,16,32,0.5) 0%, transparent 50%)' }} />
                          <div style={{ position:'absolute', bottom:10, left:10, background:color, color:'#fff', padding:'3px 10px', borderRadius:999, fontSize:10, fontWeight:700 }}>
                            {item.category}
                          </div>
                          {item.priceRange && (
                            <div style={{ position:'absolute', top:10, right:10, background:'rgba(255,255,255,0.95)', color:A.ink, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700 }}>
                              {item.priceRange}
                            </div>
                          )}
                        </div>
                        <div style={{ padding:'14px 16px 18px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                            <div style={{ background:MEDAL[i], color:MEDAL_TEXT[i], width:38, height:38, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:900, flexShrink:0, letterSpacing:'-0.03em', boxShadow:`0 2px 8px ${MEDAL[i]}60` }}>
                              #{i+1}
                            </div>
                            <div style={{ fontSize:17, fontWeight:800, color: isHov ? A.primary : A.ink, lineHeight:1.2, transition:'color .15s' }}>{item.name}</div>
                          </div>
                          <div style={{ fontSize:12, color:A.muted, marginBottom:6, display:'flex', alignItems:'center', gap:4 }}><IcoPin /><span style={{ color:A.ink2, fontWeight:500 }}>{[item.zona, item.localidad].filter(Boolean).join(' · ')}</span></div>
                          <p style={{ fontSize:13, color:A.ink2, lineHeight:1.5, margin:0, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* MAPA — top 10 numerado + puntitos del resto */}
              {mapEl}

              {/* PUESTO 4–10 — lista intermedia */}
              {gastroOrdenada.slice(3,10).map((item, i) => {
                const rank = i + 4;
                const color = TIPO_COLORS[item.category] || A.primary;
                const isHov = hoveredId === item.id;
                return (
                  <div key={item.id}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onOpenDetail && onOpenDetail(item, 'salidas')}
                    style={{ background:'#fff', border:`1px solid ${isHov ? color+'60' : A.line}`, borderRadius:14, overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'stretch', transition:'box-shadow .2s, transform .2s', boxShadow: isHov ? '0 8px 28px -8px rgba(11,16,32,0.14)' : 'none', transform: isHov ? 'translateX(2px)' : 'none' }}
                  >
                    {/* Foto */}
                    <div style={{ width:110, height:90, flexShrink:0, overflow:'hidden' }}>
                      <img src={item.image} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .4s', transform: isHov ? 'scale(1.05)' : 'scale(1)' }} />
                    </div>
                    {/* Info */}
                    <div style={{ padding:'12px 16px', flex:1, display:'flex', flexDirection:'column', justifyContent:'center', gap:3 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ background:'#8B8B8B', color:'#fff', width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, flexShrink:0, letterSpacing:'-0.02em' }}>#{rank}</div>
                        <div style={{ fontSize:15, fontWeight:700, color: isHov ? A.primary : A.ink, lineHeight:1.2, transition:'color .15s' }}>{item.name}</div>
                        <span style={{ background:color, color:'#fff', padding:'2px 8px', borderRadius:999, fontSize:9, fontWeight:700, flexShrink:0 }}>{item.category}</span>
                        {item.priceRange && <span style={{ fontSize:11, color:A.muted, fontWeight:600, flexShrink:0 }}>{item.priceRange}</span>}
                      </div>
                      <div style={{ fontSize:12, color:A.muted, display:'flex', alignItems:'center', gap:3 }}><IcoPin /><span>{[item.zona, item.localidad].filter(Boolean).join(' · ')}</span></div>
                      <p style={{ fontSize:12, color:A.ink2, lineHeight:1.4, margin:0, display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{item.description}</p>
                    </div>
                  </div>
                );
              })}

              {/* RESTO — "Otras experiencias gastronómicas" sin numeración */}
              {gastroOrdenada.slice(10).length > 0 && (
                <>
                  <div style={{ padding:'20px 0 8px', fontSize:15, fontWeight:700, color:A.ink2, letterSpacing:'-0.01em' }}>
                    Otras experiencias gastronómicas
                  </div>
                  {gastroOrdenada.slice(10).map((item) => {
                    const color = TIPO_COLORS[item.category] || A.primary;
                    const isHov = hoveredId === item.id;
                    return (
                      <div key={item.id}
                        onMouseEnter={() => setHoveredId(item.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => onOpenDetail && onOpenDetail(item, 'salidas')}
                        style={{ background:'#fff', border:`1px solid ${isHov ? color+'40' : A.line}`, borderRadius:10, overflow:'hidden', cursor:'pointer', display:'flex', alignItems:'center', transition:'box-shadow .15s', boxShadow: isHov ? '0 4px 16px -4px rgba(11,16,32,0.10)' : 'none' }}
                      >
                        <div style={{ width:72, height:60, flexShrink:0, overflow:'hidden' }}>
                          <img src={item.image} alt={item.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        </div>
                        <div style={{ padding:'10px 14px', flex:1, display:'flex', alignItems:'center', gap:12 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14, fontWeight:600, color: isHov ? A.primary : A.ink, transition:'color .15s' }}>{item.name}</div>
                            <div style={{ fontSize:11, color:A.muted, display:'flex', alignItems:'center', gap:3, marginTop:2 }}><IcoPin />{[item.zona, item.localidad].filter(Boolean).join(' · ')}</div>
                          </div>
                          <span style={{ background:color, color:'#fff', padding:'2px 8px', borderRadius:999, fontSize:9, fontWeight:700, flexShrink:0 }}>{item.category}</span>
                          {item.priceRange && <span style={{ fontSize:11, color:A.muted, fontWeight:600, flexShrink:0 }}>{item.priceRange}</span>}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .leaflet-popup-content-wrapper { border-radius: 10px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important; }
        .leaflet-popup-tip { display: none; }
        .gastro-map-wrapper .leaflet-pane { z-index: 10 !important; }
        .gastro-map-wrapper .leaflet-top,
        .gastro-map-wrapper .leaflet-bottom { z-index: 20 !important; }
      `}</style>
    </div>
  );
}
