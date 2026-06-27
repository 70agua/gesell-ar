// ============================================================
//  src/views/HomeView.jsx — Aire design system
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import AccommodationCard from '../components/AccommodationCard';
import { locations, mockPacks, ALL_PROMOS } from '../data/mockData';
import { secondsUntil, formatCountdown } from '../lib/ofertas';
import { useCuponera }  from '../lib/cuponera';
import HeartButton      from '../components/HeartButton';
import InfoTooltip, { CreditTooltip } from '../components/InfoTooltip';
import { busqueda } from '../lib/busqueda';
import DateRangePicker from '../components/DateRangePicker';
import { socialProof } from '../lib/socialProof';

// ─── Design tokens ───────────────────────────────────────────
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
  navy:        '#0B1733',
  font:        "'Inter', system-ui, sans-serif",
};

// ─── Photos — Mar de las Pampas aesthetic ────────────────────
const PHOTOS = {
  forest:  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80',
  cabin:   'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=900&q=80',
  pool:    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80',
};

// ─── SVG Icons ───────────────────────────────────────────────
const IcoPin     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
const IcoSearch  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
const IcoBolt    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>;
const IcoTicket  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M13 6v12" strokeDasharray="2 3"/></svg>;
const IcoChevR   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>;
const IcoArrowR  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
const IcoCheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>;
const IcoInfo    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>;
const IcoUsers    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

// ─── Golden coin SVG ─────────────────────────────────────────
function CoinSVG({ size = 14 }) {
  return <img src="/cuponera-coin.svg" alt="crédito" style={{ width: size, height: size, display:'inline-block', verticalAlign:'middle' }}/>;
}

// ─── Type filter pills with SVG icons ────────────────────────
const TYPE_FILTERS = [
  {
    id: 'hoteles', label: 'Hoteles', navFiltro: 'Hotel,Hostel',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21V7l9-4 9 4v14"/><path d="M9 21V11h6v10"/><rect x="10" y="3" width="4" height="4" rx="1" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
  },
  {
    id: 'casas', label: 'Casas y cabañas', navFiltro: 'Cabaña,Casa',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5 12 3l9 6.5V21H3V9.5Z"/><path d="M9 21v-7h6v7"/>
      </svg>
    ),
  },
  {
    id: 'aparts', label: 'Aparts', navFiltro: 'Departamento',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6M15 3v18M15 9h6M15 15h6"/>
      </svg>
    ),
  },
  {
    id: 'camping', label: 'Dormis / Camping', navFiltro: 'Dormi',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20 12 4l10 16H2Z"/><path d="M12 4v16M2 20h20"/>
      </svg>
    ),
  },
];

const SECONDARY_FILTERS = [
  { id: 'mar', label: 'Cerca del mar' },
  { id: 'piscina', label: 'Con piscina' },
  { id: 'mascotas', label: 'Acepta mascotas' },
];

// ─── Destination dropdown ────────────────────────────────────

function DestDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div className="hero-search-dest" style={{ flex: 1, borderRight: `1px solid ${A.line}`, position: 'relative' }} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', padding: '20px 20px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, color: A.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: A.primary, display: 'flex' }}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg></span>
          {value}
        </div>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#fff', border: `1px solid ${A.line}`, borderRadius: 14, boxShadow: '0 16px 48px -16px rgba(11,16,32,0.2)', zIndex: 999, overflow: 'hidden', minWidth: 340 }}>
          <button
            onClick={() => { onChange('Todos los destinos'); setOpen(false); }}
            style={{ width: '100%', padding: '10px 16px', border: 'none', borderBottom: `1px solid ${A.line}`, background: value === 'Todos los destinos' ? A.primarySoft : 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, color: A.primary, cursor: 'pointer' }}
          >
            Todos los destinos
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            {locations.map(loc => (
              <button
                key={loc}
                onClick={() => { onChange(loc); setOpen(false); }}
                style={{ padding: '10px 16px', border: 'none', background: value === loc ? A.primarySoft : 'none', textAlign: 'left', fontSize: 13, fontWeight: 500, color: value === loc ? A.primary : A.ink2, cursor: 'pointer' }}
                onMouseEnter={e => { if (value !== loc) e.currentTarget.style.background = A.bg; }}
                onMouseLeave={e => { if (value !== loc) e.currentTarget.style.background = 'none'; }}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Guests dropdown (Adultos / Niños / Bebés) ───────────────
function GuestsDropdown() {
  const [open, setOpen]           = useState(false);
  const [adultos, setAdultos]     = useState(2);
  const [ninos, setNinos]         = useState(0);
  const [bebes, setBebes]         = useState(0);
  const [mascotas, setMascotas]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const summary = () => {
    const parts = [`${adultos} adulto${adultos !== 1 ? 's' : ''}`];
    if (ninos > 0) parts.push(`${ninos} niño${ninos !== 1 ? 's' : ''}`);
    if (mascotas) parts.push('+ mascota');
    return parts.join(', ');
  };

  const Counter = ({ value, onDec, onInc, min = 0 }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={onDec}
        disabled={value <= min}
        style={{ width: 30, height: 30, borderRadius: '50%', border: `1px solid ${value <= min ? A.line : A.ink2}`, background: '#fff', cursor: value <= min ? 'default' : 'pointer', fontWeight: 700, fontSize: 18, display: 'grid', placeItems: 'center', lineHeight: 1, color: value <= min ? A.muted : A.ink, transition: 'all 0.1s' }}
      >
        −
      </button>
      <span style={{ minWidth: 20, textAlign: 'center', fontSize: 15, fontWeight: 600, color: A.ink }}>{value}</span>
      <button
        onClick={onInc}
        style={{ width: 30, height: 30, borderRadius: '50%', border: `1px solid ${A.ink2}`, background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 18, display: 'grid', placeItems: 'center', lineHeight: 1, color: A.ink }}
      >
        +
      </button>
    </div>
  );

  return (
    <div className="hero-search-guests" style={{ position: 'relative', borderRight: `1px solid ${A.line}`, flexShrink: 0 }} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ padding: '14px 20px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, width: 168 }}
      >
        <div style={{ fontSize: 10, color: A.muted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Huéspedes</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: A.ink, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span style={{ color: A.primary, flexShrink: 0 }}><IcoUsers /></span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary()}</span>
        </div>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, boxShadow: '0 16px 48px -16px rgba(11,16,32,0.2)', zIndex: 999, minWidth: 300, padding: '8px 0 0' }}>
          {/* Adultos */}
          <div style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${A.line}` }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: A.ink }}>Adultos</span>
            <Counter value={adultos} onDec={() => setAdultos(v => Math.max(1, v - 1))} onInc={() => setAdultos(v => Math.min(16, v + 1))} min={1} />
          </div>
          {/* Niños */}
          <div style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${A.line}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: A.ink, flexShrink: 0 }}>Niños</span>
              <span style={{ fontSize: 11, color: A.muted, whiteSpace: 'nowrap' }}>2 – 12 años</span>
            </div>
            <Counter value={ninos} onDec={() => setNinos(v => Math.max(0, v - 1))} onInc={() => setNinos(v => Math.min(8, v + 1))} />
          </div>
          {/* Bebés */}
          <div style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${A.line}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: A.ink, flexShrink: 0 }}>Bebés</span>
              <span style={{ fontSize: 11, color: A.muted, whiteSpace: 'nowrap' }}>Menores de 2 años</span>
            </div>
            <Counter value={bebes} onDec={() => setBebes(v => Math.max(0, v - 1))} onInc={() => setBebes(v => Math.min(4, v + 1))} />
          </div>
          {/* Mascotas */}
          <div
            onClick={() => setMascotas(v => !v)}
            style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>🐾</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: A.ink }}>Con mascotas</span>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${mascotas ? A.primary : A.line}`, background: mascotas ? A.primary : '#fff', display: 'grid', placeItems: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
              {mascotas && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
          </div>
          {/* Confirmar */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${A.line}`, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setOpen(false)}
              style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function HomeView({ accommodations = [], dining = [], onOpenDetail, onVerTodas, onArmarPack, onVerMarketplace, onOpenPack, onOpenOferta, onVerOfertasRegalo, onNavMarketplaceTipo }) {
  const [destino,        setDestino]        = useState('Todos los destinos');
  const [fechas,         setFechas]         = useState({ desde: null, hasta: null });
  const [activeTypes,    setActiveTypes]    = useState(new Set());
  const [activeSecondary, setActiveSecondary] = useState([]);
  const [locIdx,         setLocIdx]         = useState(0);
  const [locFade,        setLocFade]        = useState(false);
  const [tabAloj,        setTabAloj]        = useState('Todos'); // eslint-disable-line

  // Location rotation
  useEffect(() => {
    const iv = setInterval(() => {
      setLocFade(true);
      setTimeout(() => { setLocIdx(i => (i + 1) % locations.length); setLocFade(false); }, 280);
    }, 2800);
    return () => clearInterval(iv);
  }, []);

  const toggleSecondary = id => setActiveSecondary(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const toggleType = id => setActiveTypes(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const filteredAloj = tabAloj === 'Todos' ? accommodations : accommodations.filter(a => a.type === tabAloj);

  return (
    <div style={{ color: A.ink, fontFamily: A.font }}>

      {/* ── HERO — full-bleed right, alineado con la nav ─────── */}
      <section style={{ background: '#fff', paddingTop: 70, position: 'relative', zIndex: 5 }}>
        <div className="hero-grid" style={{ display: 'flex', minHeight: 540, position: 'relative' }}>

          {/* ─ LEFT — ocupa el 100% (collage es absolute), contenido limitado a 56vw por CSS ─ */}
          <div className="hero-left" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
            <div className="hero-content" style={{
              paddingRight: 56, paddingTop: 28, paddingBottom: 52,
            }}>

              {/* H1 rotating — tamaño fijo calibrado para la localidad más larga */}
              <h1 style={{ fontSize: 'clamp(40px, 4.6vw, 70px)', lineHeight: 1.05, letterSpacing: '-0.04em', color: A.ink, margin: '0 0 18px', fontWeight: 800 }}>
                <span style={{ fontWeight: 500, letterSpacing: '-0.03em' }}>Tu cuponera viajera<br />de beneficios en</span><br />
                <span style={{
                  fontFamily: "'NauryzRedkeds', cursive",
                  fontSize: 'clamp(30px, 3.6vw, 54px)',
                  letterSpacing: '0.03em',
                  color: A.primary,
                  display: 'inline-block',
                  transition: 'opacity 0.28s',
                  opacity: locFade ? 0 : 1,
                  minWidth: 1,
                  lineHeight: 1.1,
                }}>
                  {locations[locIdx]}
                </span>
              </h1>

              <p style={{ fontSize: 18, lineHeight: 1.55, color: A.muted, margin: '0 0 26px', fontWeight: 400, maxWidth: 600 }}>
                Buscá ofertas en <b>alojamientos, salidas y relax.</b> Planeá tu viaje!
              </p>

              {/* ─ Search widget — 1 fila ─ */}
              <div className="hero-search" style={{ border: `1px solid ${A.line}`, borderRadius: 18, overflow: 'visible', boxShadow: '0 8px 32px -12px rgba(11,16,32,0.14)', background: '#fff', display: 'flex', alignItems: 'stretch' }}>
                <DestDropdown value={destino} onChange={v => { setDestino(v); busqueda.setDestino(v); }} />
                <div style={{ width: 1, background: A.line, flexShrink: 0, margin: '10px 0' }} />
                <DateRangePicker
                  value={fechas}
                  onChange={f => { setFechas(f); busqueda.setFechas(f.desde, f.hasta); }}
                />
                <button
                  className="hero-search-btn"
                  onClick={() => { busqueda.setFechas(fechas.desde, fechas.hasta); onVerMarketplace && onVerMarketplace(); }}
                  style={{ background: A.primary, color: '#fff', border: 'none', padding: '0 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderRadius: '0 16px 16px 0', flexShrink: 0, fontFamily: A.font }}
                >
                  <IcoSearch /> Buscar
                </button>
              </div>
            </div>
          </div>

          {/* ─ RIGHT — absolute, 44vw anclado a la derecha, siempre completo ─ */}
          <div className="hero-collage" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '44vw', overflow: 'hidden', zIndex: 1 }}>
            <img
              src="/img/banner-home.jpg"
              alt="Villa Gesell"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
            />
          </div>
        </div>

        {/* ── Banner regalo — pie del hero ─────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 0, marginTop: -25, paddingTop: 0, paddingBottom: 28, paddingRight: 56, paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))' }}>
          <div style={{ position: 'relative', width: 72, height: 52, flexShrink: 0, zIndex: 2 }}>
            <img src="/ico-disc.svg" alt="" style={{ width: 48, position: 'absolute', top: 0, left: 0, zIndex: 2 }} />
            <img src="/ico-disc.svg" alt="" style={{ width: 48, position: 'absolute', top: 0, left: 26, zIndex: 1, opacity: 0.55 }} />
          </div>
          <div style={{ position: 'relative', padding: '12px 18px', background: A.primarySoft, borderRadius: 14, border: `1px solid ${A.primary}22`, marginLeft: 10 }}>
            <div style={{ position: 'absolute', top: -5, right: -5, width: 14, height: 14, borderRadius: '50%', background: 'rgb(230, 57, 70)', border: '3px solid #fff' }} />
            <div style={{ position: 'absolute', left: -9, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: `8px solid #c7cdf5` }} />
            <div style={{ position: 'absolute', left: -7, top: '50%', transform: 'translateY(-50%)', width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: `7px solid ${A.primarySoft}` }} />
            <p style={{ fontSize: 14, color: A.ink, fontWeight: 400, lineHeight: 1.5, margin: 0 }}>
              Hay <span style={{ fontWeight: 700 }}>2 descuentos de regalo</span> esperándote.{' '}
              <button
                onClick={() => onVerOfertasRegalo?.()}
                style={{ background: 'none', border: 'none', padding: 0, color: A.primary, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: A.font, textDecoration: 'underline' }}
              >¡Reclamalos ahora!</button>{' '}🎁
            </p>
          </div>
        </div>
      </section>

      {/* ── ¡Alquilá por menos! ───────────────────────────────── */}
      <PromosSection onOpenDetail={onOpenDetail} accommodations={accommodations} onVerTodas={onVerTodas} onOpenOferta={onOpenOferta} onNavMarketplaceTipo={onNavMarketplaceTipo} />

      {/* ── Socios locales que son tendencia ──────────────────── */}
      <SociosTendenciaSection accommodations={accommodations} dining={dining} onOpenDetail={onOpenDetail} />

      {/* ── FEED "Descubrí experiencias reales" ────────────────────── */}
      <FeedSection onOpenOferta={onOpenOferta} onAddCupon={undefined} />

      {/* ── PACKS ─────────────────────────────────────────────── */}
      <PacksSection onArmarPack={onArmarPack} onOpenPack={onOpenPack} />

      {/* ── SALIDAS ───────────────────────────────────────── */}
      <GastronomySection dining={dining} onOpenDetail={onOpenDetail} onVerTodas={() => {}} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  Socios locales que son tendencia — avatares redondos
// ═══════════════════════════════════════════════════════════
const IcoStarFill = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>;
const IcoFlame    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-1 4.5-2.5 6C8 9.5 7 11 7 13a5 5 0 0 0 10 0c0-1.7-.7-3.2-1.7-4.4-.3 1-1 1.7-1.9 1.9.6-2-.3-4.4-1.4-6.5-.3 1.2-1 2-2 2.6.2-1.8-.2-3.6-1-5.6 1.6.4 3.4 1.3 4.9 0z"/></svg>;

function SociosTendenciaSection({ accommodations = [], dining = [], onOpenDetail }) {
  // Mezcla socios de alojamiento + salidas; prioriza plan (BLACK > PLUS > resto) y rating
  const planRank = { BLACK: 3, PLUS: 2, BASE: 1 };
  const socios = [
    ...accommodations.map(a => ({ ...a, _tipo: 'alojamiento' })),
    ...dining.map(d => ({ ...d, _tipo: 'salidas' })),
  ]
    .filter(s => s.image && s.name)
    .map(s => ({ ...s, _reservas: socialProof(`${s._tipo}-${s.id}`).reservasSemana }))
    // Tendencia real: más reservas primero; plan premium y rating como desempate
    .sort((a, b) => b._reservas - a._reservas || (planRank[b.plan] || 0) - (planRank[a.plan] || 0) || (b.rating || 0) - (a.rating || 0))
    .slice(0, 12);

  if (!socios.length) return null;

  return (
    <section style={{ background: 'linear-gradient(30deg, #fff1f6 0%, #d2e9f3 55%, #fff1f6 100%)', padding: '72px 0', borderTop: `1px solid ${A.line}`, borderBottom: `1px solid ${A.line}` }}>
      {/* Header */}
      <div style={{ paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingRight: 56, marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: A.primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          <span style={{ color: '#FF5A8A', display: 'flex' }}><IcoFlame /></span> Tendencia en la costa
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', color: A.ink, margin: 0 }}>Socios locales que son tendencia</h2>
        <p style={{ fontSize: 16, color: A.ink2, margin: '10px 0 0', maxWidth: 560, lineHeight: 1.5 }}>
          Los lugares más elegidos de la temporada. Tocá uno y descubrí sus promociones.
        </p>
      </div>

      {/* Scroll horizontal de avatares redondos */}
      <div style={{ position: 'relative' }}>
        <div style={{ overflowX: 'auto', paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingTop: 6, paddingBottom: 12 }} className="no-scrollbar">
          <div style={{ display: 'flex', gap: 26, width: 'max-content', paddingRight: 56 }}>
            {socios.map(s => (
              <button
                key={`${s._tipo}-${s.id}`}
                onClick={() => onOpenDetail?.(s, s._tipo)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 150, flexShrink: 0, fontFamily: A.font }}
                onMouseEnter={e => { const img = e.currentTarget.querySelector('.socio-ring'); if (img) { img.style.transform = 'scale(1.05)'; img.style.boxShadow = '0 16px 36px -12px rgba(37,69,230,0.45)'; } }}
                onMouseLeave={e => { const img = e.currentTarget.querySelector('.socio-ring'); if (img) { img.style.transform = 'scale(1)'; img.style.boxShadow = '0 10px 28px -14px rgba(11,16,32,0.35)'; } }}
              >
                {/* Foto redonda */}
                <div className="socio-ring" style={{ position: 'relative', width: 128, height: 128, borderRadius: '50%', padding: 4, background: '#fff', boxShadow: '0 10px 28px -14px rgba(11,16,32,0.35)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: A.line }}>
                    <img src={s.image} alt={s.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  {/* Badge plan BLACK */}
                  {s.plan === 'BLACK' && (
                    <div style={{ position: 'absolute', top: 2, right: 2, background: A.ink, color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: '0.04em', padding: '3px 7px', borderRadius: 999, border: '2px solid #fff' }}>BLACK</div>
                  )}
                  {/* Rating */}
                  {s.rating != null && (
                    <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', display: 'inline-flex', alignItems: 'center', gap: 3, background: '#fff', color: A.ink, fontSize: 11, fontWeight: 800, padding: '3px 8px', borderRadius: 999, boxShadow: '0 4px 12px -4px rgba(11,16,32,0.3)' }}>
                      <span style={{ color: A.yellow, display: 'flex' }}><IcoStarFill /></span>{Number(s.rating).toFixed(1)}
                    </div>
                  )}
                </div>
                {/* Nombre + localidad */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: A.ink, lineHeight: 1.25, marginBottom: 3 }}>{s.name}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: A.muted }}>
                    <span style={{ display: 'flex' }}><IcoPin /></span>{s.localidad}
                  </div>
                  {/* Prueba social — reservas de la semana */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 7, padding: '3px 9px', borderRadius: 999, background: 'rgba(255,90,138,0.1)', color: '#E03A6D', fontSize: 11, fontWeight: 700 }}>
                    <span style={{ display: 'flex' }}><IcoFlame /></span>
                    {s._reservas} reservas esta semana
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 12, width: 120, background: 'linear-gradient(to right, transparent, #fff1f6)', pointerEvents: 'none', zIndex: 2 }} />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
//  Feed "Descubrí salidas y aventura"
// ═══════════════════════════════════════════════════════════
const FEED_W = 280;
const FEED_H = Math.round(FEED_W * 16 / 9); // 498 — proporción 9:16 de los videos

function feedTokens(ahorro = 0) {
  if (ahorro <= 5000)  return 1;
  if (ahorro <= 15000) return 2;
  if (ahorro <= 30000) return 3;
  if (ahorro <= 50000) return 4;
  return 5;
}

const MOCK_VIDEOS = [
  { type: 'video', id: 'v1', negocio: 'Cabañas del Pinar', tipo: 'Alojamiento', localidad: 'Mar de las Pampas', avatar: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=80&fit=crop&q=80', titulo: 'Tres noches en el bosque. Así se vive.', fecha: 'hace 3 días', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=700&fit=crop&q=80', videoSrc: null },
  { type: 'video', id: 'v2', negocio: 'Balneario El Faro', tipo: 'Balneario', localidad: 'Villa Gesell', avatar: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=80&fit=crop&q=80', titulo: 'Vista al mar de 180°. Te esperamos este verano.', fecha: 'hace 1 semana', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=700&fit=crop&q=80', videoSrc: null },
  { type: 'video', id: 'v3', negocio: 'Spa Costas del Mar', tipo: 'Spa & Bienestar', localidad: 'Las Gaviotas', avatar: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=80&fit=crop&q=80', titulo: 'Un momento para vos. Relajate de verdad.', fecha: 'hace 2 días', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=700&fit=crop&q=80', videoSrc: null },
];

const MOCK_POSTS = [
  { type: 'post', id: 'p1', negocio: 'Spa Costas del Mar', localidad: 'Las Gaviotas', avatar: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=80&fit=crop&q=80', image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&fit=crop&q=80', texto: '💆 Martes de relax total. Turnos disponibles este finde. ¡Reservá con tu cupón y regalate un momento!', tiempoAgo: 'hace 2 horas' },
  { type: 'post', id: 'p2', negocio: 'Parador Windy', localidad: 'Villa Gesell', avatar: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=80&fit=crop&q=80', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&fit=crop&q=80', texto: '☀️ Domingo de playa con vista al mar. Mesa disponible. 20% off en tu primera visita con tu cupón.', tiempoAgo: 'hace 5 horas' },
  { type: 'post', id: 'p3', negocio: 'Cabañas del Pinar', localidad: 'Mar de las Pampas', avatar: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=80&fit=crop&q=80', image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=600&fit=crop&q=80', texto: 'Bienvenida Martina y Diego 🌲 Ya disfrutando del fogón. Esto es Villa Gesell en invierno.', tiempoAgo: 'ayer' },
];

const MOCK_TESTIMONIALS = [
  { texto: '"Superó todas las expectativas. Volvería sin dudarlo, fue de lo mejor que hice en el viaje."', nombre: 'Lucía', fecha: 'hace 3 días', rating: 5.0 },
  { texto: '"El servicio fue increíble y la atención de primera. Totalmente recomendable para cualquier ocasión."', nombre: 'Martín', fecha: 'hace 1 semana', rating: 4.8 },
  { texto: '"Lugar mágico. Las vistas y el ambiente son únicos. Imposible no enamorarse."', nombre: 'Valentina', fecha: 'hace 5 días', rating: 4.9 },
  { texto: '"Relación calidad-precio inmejorable. Muy buena experiencia, todo estuvo a la altura."', nombre: 'Sebastián', fecha: 'hace 2 semanas', rating: 4.7 },
  { texto: '"Una experiencia que no me esperaba tan buena. Nos fuimos felices y con ganas de volver."', nombre: 'Camila', fecha: 'ayer', rating: 5.0 },
  { texto: '"Atención espectacular. Te hacen sentir como en casa desde el primer momento."', nombre: 'Diego', fecha: 'hace 4 días', rating: 4.6 },
];

function SocioHeaderOverlay({ avatar, negocio, sub }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, transparent 100%)', padding: '12px 14px 22px', display: 'flex', alignItems: 'center', gap: 9, zIndex: 2 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
        {avatar
          ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (negocio || '?')[0]}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{negocio}</div>
        {sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.72)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function VideoCard({ item }) {
  const videoRef = useRef(null);
  const cardRef  = useRef(null);

  // Mobile: autoplay muted via IntersectionObserver cuando entra al viewport
  useEffect(() => {
    if (!item.videoSrc || !videoRef.current || !cardRef.current) return;
    if (window.innerWidth >= 768) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) videoRef.current?.play().catch(() => {});
      else { videoRef.current?.pause(); if (videoRef.current) videoRef.current.currentTime = 0; }
    }, { threshold: 0.5 });
    obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, [item.videoSrc]);

  const handleMouseEnter = () => {
    if (item.videoSrc && videoRef.current && window.innerWidth >= 768)
      videoRef.current.play().catch(() => {});
  };
  const handleMouseLeave = () => {
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width: FEED_W, height: FEED_H, borderRadius: 20, overflow: 'hidden', flexShrink: 0, position: 'relative', cursor: 'pointer', background: '#1a2a35' }}
    >
      {/* Fondo: video si hay src, imagen de fallback */}
      {item.videoSrc
        ? <video ref={videoRef} src={item.videoSrc} muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : item.image && <img src={item.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      }
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)' }} />

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 3 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(6px)', borderRadius: 999, padding: '4px 10px 4px 8px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>RESEÑA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HeartButton id={item.id} />
          <button onClick={e => e.stopPropagation()} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(6px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Play — centrado exacto al card */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 62, height: 62, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
      </div>

      {/* Info cluster — fondo */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {item.avatar ? <img src={item.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (item.negocio || '?')[0]}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.negocio}</span>
        </div>
        {item.titulo && (
          <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
            {item.titulo}
          </p>
        )}
        {item.fecha && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.52)', letterSpacing: '0.01em' }}>{item.fecha}</span>
        )}
      </div>
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? A.yellow : '#E7E9EE'} style={{ flexShrink: 0 }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span style={{ fontSize: 12, fontWeight: 700, color: A.ink, marginLeft: 2 }}>{rating.toFixed(1)}</span>
      <span style={{ fontSize: 11, color: A.muted }}>/5</span>
    </div>
  );
}

function OfertaFeedCard({ promo, onOpen, onAdd }) {
  const cred = promo.tokens_costo ?? feedTokens(promo.ahorroEstimado);
  const pesoPrice = `$${(cred * 2000).toLocaleString('es-AR')} + IVA`;
  const tIdx = (promo.proveedorNombre || '').charCodeAt(0) % MOCK_TESTIMONIALS.length;
  const testim = MOCK_TESTIMONIALS[isNaN(tIdx) ? 0 : tIdx];

  return (
    <div
      onClick={() => onOpen?.(promo)}
      style={{ width: FEED_W, height: FEED_H, borderRadius: 20, overflow: 'hidden', flexShrink: 0, background: '#fff', border: `1px solid ${A.line}`, display: 'flex', flexDirection: 'column', cursor: 'pointer', boxShadow: '0 2px 14px -4px rgba(11,16,32,0.09)' }}
    >
      {/* Imagen — socio arriba + badge+título abajo */}
      <div style={{ position: 'relative', height: 210, background: '#1a2a35', flexShrink: 0 }}>
        {promo.image && <img src={promo.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.78) 0%, rgba(11,16,32,0.08) 50%, transparent 100%)' }} />
        {/* Socio header — superpuesto arriba */}
        <SocioHeaderOverlay avatar={promo.proveedorImage} negocio={promo.proveedorNombre} sub={promo.negocioLocalidad} />
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 3 }}><HeartButton id={promo.id} /></div>
        {/* Badge + título — abajo */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px 13px', zIndex: 2 }}>
          {promo.badge && (
            <div style={{ fontSize: (promo.badge?.length || 0) > 5 ? 28 : 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1 }}>
              {promo.badge}
            </div>
          )}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.88)', lineHeight: 1.35, marginTop: 5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {promo.title}
          </div>
        </div>
      </div>


      {/* Body */}
      <div style={{ padding: '11px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 9, overflow: 'hidden' }}>

        {/* Estrellas + Testimonial — bloque unido */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ flexShrink: 0 }}>
            <StarRating rating={testim.rating} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{
              fontSize: 12.5, fontStyle: 'italic', fontWeight: 400,
              color: A.ink2, margin: 0, lineHeight: 1.55,
              display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {testim.texto}
            </p>
            <p style={{ fontSize: 11, color: A.muted, margin: '5px 0 0', fontWeight: 500 }}>
              — {testim.nombre}, {testim.fecha}
            </p>
          </div>
        </div>

        {/* Ahorro social proof */}
        {promo.ahorroEstimado > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#EDFAF4', borderRadius: 8, padding: '6px 10px', flexShrink: 0 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill={A.green}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5"/></svg>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: A.green }}>Se ahorró ~${promo.ahorroEstimado.toLocaleString('es-AR')} aprox.</span>
          </div>
        )}

        {/* CTA + Activalo con */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); onOpen?.(promo); }}
            style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `1px solid ${A.line}`, background: '#fff', color: A.ink, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            Ver oferta
          </button>
          <button
            onClick={e => { e.stopPropagation(); onAdd?.(promo); }}
            style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: 'none', background: A.primary, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          >
            + Agregar a cuponera
          </button>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '18px' }}>Activalo con</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <img src="/cuponera-coin.svg" alt="" width="11" height="11" />
                <span style={{ fontSize: 12, fontWeight: 800, color: A.ink }}>{cred} crédito{cred !== 1 ? 's' : ''}</span>
                <CreditTooltip />
              </div>
              <span style={{ fontSize: 10, color: A.muted }}>{pesoPrice}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialPostCard({ item }) {
  return (
    <div style={{ width: FEED_W, height: FEED_H, borderRadius: 20, overflow: 'hidden', flexShrink: 0, background: '#fff', border: `1px solid ${A.line}`, display: 'flex', flexDirection: 'column', boxShadow: '0 2px 14px -4px rgba(11,16,32,0.09)' }}>
      {/* Header socio */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 13px', flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: A.bg }}>
          {item.avatar && <img src={item.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: A.ink, margin: 0, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.negocio}</p>
          <p style={{ fontSize: 11, color: A.muted, margin: 0 }}>{item.localidad} · {item.tiempoAgo}</p>
        </div>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={A.primary} strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
      </div>
      {/* Foto cuadrada */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
        {item.image && <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>
      {/* Caption + CTA */}
      <div style={{ padding: '10px 13px 13px', flexShrink: 0 }}>
        {item.texto && (
          <p style={{ fontSize: 12, color: A.ink, margin: '0 0 8px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.texto}{' '}
            <span style={{ color: A.muted, fontWeight: 400 }}>{item.tiempoAgo}</span>
          </p>
        )}
        <button
          style={{ width: '100%', padding: '8px 0', borderRadius: 10, border: `1.5px solid ${A.line}`, background: '#fff', color: A.ink, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.color = A.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.color = A.ink; }}
        >
          Ver la oferta →
        </button>
      </div>
    </div>
  );
}

function FeedSection({ onOpenOferta }) {
  const [promos, setPromos] = useState([]);
  const { addCupon } = useCuponera();

  useEffect(() => {
    (async () => {
      const { getPromos } = await import('../lib/datos');
      setPromos(await getPromos(20));
    })();
  }, []);

  // Interleave: video, promo, promo, post, video, promo, promo, post...
  const feed = [];
  const vids  = [...MOCK_VIDEOS];
  const posts = [...MOCK_POSTS];
  const ps    = promos.filter(p => p.ahorroEstimado > 0);
  let pi = 0;
  const pattern = ['video', 'promo', 'promo', 'post'];
  let slot = 0;
  while (vids.length || posts.length || pi < ps.length) {
    const s = pattern[slot % pattern.length];
    if (s === 'video' && vids.length)     { feed.push(vids.shift()); }
    else if (s === 'promo' && pi < ps.length) { feed.push({ type: 'promo', promo: ps[pi++] }); }
    else if (s === 'post' && posts.length) { feed.push(posts.shift()); }
    else if (pi < ps.length)              { feed.push({ type: 'promo', promo: ps[pi++] }); }
    else break;
    slot++;
  }

  return (
    <section id="feed-ofertas" style={{ background: '#fff', padding: '72px 0' }}>
      <div style={{ paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingRight: 56, marginBottom: 36 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: A.primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          <IcoBolt /> SALIDAS Y AVENTURA & RELAX
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', color: A.ink, margin: '0 0 8px' }}>Descubrí experiencias reales</h2>
        <p style={{ fontSize: 16, color: A.muted, margin: 0 }}>Ofertas y momentos inolvidables, contado por quienes te van a acompañar en este viaje.</p>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ overflowX: 'auto', paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingBottom: 10 }} className="no-scrollbar">
          <div style={{ display: 'flex', gap: 14, width: 'max-content', paddingRight: 56 }}>
            {feed.map((item, i) => {
              if (item.type === 'video') return <VideoCard key={item.id} item={item} />;
              if (item.type === 'promo') return <OfertaFeedCard key={item.promo.id} promo={item.promo} onOpen={onOpenOferta} onAdd={addCupon} />;
              if (item.type === 'post')  return <SocialPostCard key={item.id} item={item} />;
              return null;
            })}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 10, width: 120, background: 'linear-gradient(to right, transparent, #fff)', pointerEvents: 'none', zIndex: 2 }} />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
//  ¡Alquilá por menos!
// ═══════════════════════════════════════════════════════════
function OfertaCardAire({ promo, onClick, onAddToCuponera, showTipo }) {
  const esFlash = promo.offerType === 'Flash';
  const [secs, setSecs] = useState(() => esFlash ? secondsUntil(promo.fechaFinFlash) : 0);

  useEffect(() => {
    if (!esFlash) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [esFlash]);

  return (
    <div
      onClick={() => onClick && onClick(promo)}
      style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 48px -16px rgba(11,16,32,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Proveedor — arriba de todo */}
      <div style={{ padding: '10px 13px 10px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: A.bg, border: `1px solid ${A.line}`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {promo.proveedorImage
            ? <img src={promo.proveedorImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 13, fontWeight: 700, color: A.muted }}>{(promo.proveedorNombre || '?')[0]}</span>
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: A.ink, lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()}
          </div>
          {promo.negocioLocalidad && (
            <div style={{ fontSize: 11, color: A.muted, marginTop: 2 }}>
              {promo.negocioLocalidad}
            </div>
          )}
        </div>
      </div>

      {/* Imagen 4:3 */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
        <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.75) 0%, rgba(11,16,32,0.15) 55%, transparent 100%)' }} />

        {/* Pill FLASH + timer */}
        {esFlash && secs > 0 && (
          <div style={{ position: 'absolute', top: 10, left: 10, right: 10, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ height: '100%', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EF4444', borderRadius: 999, padding: '0 10px 0 9px' }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#fff', letterSpacing: '0.05em' }}>OFERTA</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: A.yellow, fontStyle: 'italic', letterSpacing: '0.05em' }}>FLASH</span>
              <span style={{ color: A.yellow, display: 'flex', alignItems: 'center' }}><IcoBolt /></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: '100%' }}>
              {[Math.floor(secs / 3600), Math.floor((secs % 3600) / 60), secs % 60].map((v, i) => (
                <React.Fragment key={i}>
                  <div style={{ background: '#fff', color: A.ink, borderRadius: 6, fontSize: 13, fontWeight: 800, height: '100%', minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                    {i === 0 ? v : String(v).padStart(2, '0')}
                  </div>
                  {i < 2 && <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 900, fontSize: 14, lineHeight: 1 }}>:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Exclusivo huéspedes */}
        {promo.exclusivoHuespedes && (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56, background: 'linear-gradient(to bottom, rgba(5,10,25,0.72) 0%, transparent 100%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5" rx="1"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', lineHeight: 1.3 }}>Exclusivo huéspedes {promo.exclusivoHuespedes}</span>
            </div>
          </>
        )}

        {/* Heart — top right */}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <HeartButton id={promo.id} />
        </div>

        {/* Badge + título — abajo */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px 13px' }}>
          <div style={{ fontSize: (promo.badge?.length || 0) > 5 ? 28 : 38, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1 }}>{promo.badge}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.88)', lineHeight: 1.35, marginTop: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{promo.title}</div>
        </div>
      </div>

      {/* CTA + Activalo con */}
      <div style={{ padding: '10px 13px 13px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={e => { e.stopPropagation(); onClick && onClick(promo); }}
          style={{ width: '100%', background: '#fff', border: `1.5px solid ${A.line}`, borderRadius: 12, padding: '9px 0', fontSize: 13, fontWeight: 700, color: A.ink, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'border-color 0.15s, color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.color = A.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.color = A.ink; }}
        >
          Ver la oferta
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
        {promo.tokens_costo != null && promo.tokens_costo > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '18px' }}>Activalo con</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <img src="/cuponera-coin.svg" alt="" width="11" height="11" />
                <span style={{ fontSize: 12, fontWeight: 800, color: A.ink }}>{promo.tokens_costo} crédito{promo.tokens_costo !== 1 ? 's' : ''}</span>
                <CreditTooltip />
              </div>
              <span style={{ fontSize: 10, color: A.muted }}>${(promo.tokens_costo * 2000).toLocaleString('es-AR')} + IVA</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const TIPO_FILTER_MAP = {
  hoteles: ['Hotel', 'Hostel'],
  casas:   ['Casa', 'Cabaña'],
  aparts:  ['Departamento'],
  camping: ['Dormi'],
};

function PromosSection({ onOpenDetail, accommodations, onVerTodas, onOpenOferta, onNavMarketplaceTipo }) {
  const [promos, setPromos] = useState([]);
  const { addCupon } = useCuponera();

  useEffect(() => {
    (async () => {
      const { getPromos } = await import('../lib/datos');
      setPromos(await getPromos(60));
    })();
  }, []);

  const promosAloj = promos
    .filter(p => p.tokens_costo !== 0 && p.categoria === 'alojamiento')
    .slice(0, 16);

  return (
    <section style={{ background: A.bg, padding: '72px 0', borderTop: `1px solid ${A.line}`, borderBottom: `1px solid ${A.line}` }}>
      {/* Header */}
      <div style={{ paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingRight: 56, marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: A.primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          <IcoBolt /> OFERTAS EN ALOJAMIENTOS
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', color: A.ink, margin: 0 }}>¡Alquilá por menos!</h2>
          {/* Pills — click navega directo al marketplace filtrado */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, paddingBottom: 4 }}>
            {TYPE_FILTERS.map(f => (
              <button
                key={f.id}
                onClick={() => onNavMarketplaceTipo?.(f.navFiltro)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
                  border: `1.5px solid ${A.line}`,
                  background: '#fff', color: A.ink2,
                  fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.color = A.primary; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.color = A.ink2; }}
              >
                <span style={{ color: A.muted, display: 'flex' }}>{f.icon}</span>
                {f.label} <IcoArrowR />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll horizontal — una sola fila con fade */}
      <div style={{ position: 'relative' }}>
        <div style={{ overflowX: 'auto', paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingBottom: 8 }} className="no-scrollbar">
          <div style={{ display: 'flex', gap: 18, width: 'max-content', paddingRight: 56 }}>
            {promosAloj.map(promo => (
              <div key={promo.id} style={{ width: 280, flexShrink: 0 }}>
                <OfertaCardAire
                  promo={promo}
                  showTipo
                  onClick={p => {
                    if (onOpenOferta) { onOpenOferta(p); return; }
                    if (!onOpenDetail || !accommodations) return;
                    const neg = accommodations.find(a => String(a.id) === String(p.negocioId));
                    if (neg) onOpenDetail(neg, 'alojamiento', 'promos');
                  }}
                  onAddToCuponera={p => addCupon(p)}
                />
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 8, width: 120, background: `linear-gradient(to right, transparent, ${A.bg})`, pointerEvents: 'none', zIndex: 2 }} />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
//  PACKS
// ═══════════════════════════════════════════════════════════
// Icono chevron izquierda para flechas del carrusel
const IcoChevL = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const IcoChevR2 = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>;

function PacksSection({ onArmarPack, onOpenPack }) {
  const [activeIdx, setActiveIdx]           = useState(0);
  const [contentVisible, setContentVisible] = useState(true);
  const [badgesVisible, setBadgesVisible]   = useState(true);
  const fadeTimerRef   = useRef(null);
  const badgeTimerRef  = useRef(null);
  const expandTimerRef = useRef(null);
  const stripRef = useRef(null);
  const packs = mockPacks.slice(0, 6);

  const CARD_H    = 500;
  const FEAT_W    = 560;
  const COLL_W    = 192;
  const MORE_W    = 96;
  const RADIUS    = 24;
  const GAP       = 16;
  const PAD_L     = 120;
  const ANIM_MS    = 480; // duración del width transition
  const FADEOUT_MS = 50;  // solo un tick de render — el ocultado es instantáneo (transition:none)

  function handleSelect(idx) {
    if (idx === activeIdx) return;

    // Cancelar timers pendientes
    clearTimeout(fadeTimerRef.current);
    clearTimeout(badgeTimerRef.current);
    clearTimeout(expandTimerRef.current);

    // 1. Fade out del contenido actual
    setContentVisible(false);
    setBadgesVisible(false);

    // 2. Cuando termina el fade-out, arrancar el expand de imagen + scroll
    expandTimerRef.current = setTimeout(() => {
      setActiveIdx(idx);
      if (stripRef.current) {
        const targetScroll = idx * (COLL_W + GAP) - PAD_L / 2;
        stripRef.current.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
      }
      // 3. Cuando termina la animación de ancho, fade-in del contenido nuevo
      fadeTimerRef.current  = setTimeout(() => setContentVisible(true), ANIM_MS + 30);
      badgeTimerRef.current = setTimeout(() => setBadgesVisible(true),  ANIM_MS + 180);
    }, FADEOUT_MS);
  }

  useEffect(() => () => {
    clearTimeout(fadeTimerRef.current);
    clearTimeout(badgeTimerRef.current);
    clearTimeout(expandTimerRef.current);
  }, []);

  function nudge(dir) {
    stripRef.current?.scrollBy({ left: dir * (COLL_W + GAP) * 2, behavior: 'smooth' });
  }

  return (
    <section style={{ background: A.navy, padding: '88px 0 96px', color: '#fff' }}>
      {/* Ocultar scrollbar nativa pero permitir scroll táctil */}
      <style>{`.packs-strip::-webkit-scrollbar{display:none}`}</style>

      <div style={{ paddingLeft: PAD_L, paddingRight: 80 }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'end', marginBottom: 52 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(255,201,60,0.16)', color: A.yellow, borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 16 }}>
              <IcoBolt /> Aventura & Relax todo-en-uno
            </div>
            <h2 style={{ fontSize: 52, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0 }}>
              Packs exclusivos
              <img src="/logo-cuponera-wh.svg" alt="Cuponear" style={{ display: 'block', height: 74, width: 'auto', marginTop: 14 }} />
            </h2>
          </div>
          <div>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, margin: '0 0 6px' }}>
              Te ahorramos la búsqueda y la negociación. Combinamos alojamiento, gastronomía y aventuras al mejor precio verificado.
            </p>
          </div>
        </div>
      </div>

      {/* Wrapper relativo para las flechas de nav */}
      <div style={{ position: 'relative' }}>

        {/* Flecha izquierda */}
        <button
          onClick={() => nudge(-1)}
          style={{
            position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          aria-label="Anterior"
        >
          <IcoChevL />
        </button>

        {/* Flecha derecha */}
        <button
          onClick={() => nudge(1)}
          style={{
            position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
            zIndex: 10, width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
          aria-label="Siguiente"
        >
          <IcoChevR2 />
        </button>

        {/* Strip scrollable — orden FIJO, expansión in-place */}
        <div
          ref={stripRef}
          className="packs-strip"
          style={{
            paddingLeft: PAD_L,
            paddingRight: 40,
            display: 'flex',
            gap: GAP,
            height: CARD_H,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {packs.map((pack, idx) => {
            const isFeatured = idx === activeIdx;
            const img = pack.images?.[0] || PHOTOS.cabin;
            return (
              <div
                key={pack.id}
                onClick={() => !isFeatured && handleSelect(idx)}
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  width: isFeatured ? FEAT_W : COLL_W,
                  borderRadius: RADIUS,
                  overflow: 'hidden',
                  cursor: isFeatured ? 'default' : 'pointer',
                  transition: 'width 0.48s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {/* Imagen de fondo */}
                <img src={img} alt={pack.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s', transform: isFeatured ? 'scale(1)' : 'scale(1.06)' }}/>

                {/* Gradiente */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: isFeatured
                    ? 'linear-gradient(to top, rgba(5,10,25,0.95) 0%, rgba(5,10,25,0.5) 45%, rgba(5,10,25,0.08) 100%)'
                    : 'linear-gradient(to top, rgba(5,10,25,0.88) 0%, rgba(5,10,25,0.2) 70%, transparent 100%)',
                  transition: 'background 0.48s',
                }}/>

                {/* Hover tint en colapsadas */}
                {!isFeatured && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(37,69,230,0)', transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(37,69,230,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(37,69,230,0)'}
                  />
                )}

                {/* Badge localidad — arriba izquierda, solo en expandida */}
                {pack.location && isFeatured && (
                  <div style={{
                    position: 'absolute', top: 18, left: 18,
                    background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
                    color: '#fff', padding: '5px 11px', borderRadius: 999,
                    fontSize: 11, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5,
                    border: '1px solid rgba(255,255,255,0.2)',
                    opacity: badgesVisible ? 1 : 0,
                    transition: badgesVisible ? 'opacity 0.28s ease' : 'none',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2"/></svg>
                    {pack.location}
                  </div>
                )}

                {/* Badge descuento — arriba derecha, solo en expandida */}
                {pack.discountPct && isFeatured && (
                  <div style={{
                    position: 'absolute', top: 14, right: 16,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    opacity: badgesVisible ? 1 : 0,
                    transition: badgesVisible ? 'opacity 0.28s ease' : 'none',
                  }}>
                    <div style={{ background: A.yellow, color: A.navy, padding: '7px 16px', borderRadius: 999, fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
                      -{pack.discountPct}% OFF
                    </div>
                    <div style={{ background: A.yellow, color: A.navy, borderRadius: 999, padding: '3px 10px', fontSize: 9, fontWeight: 700, whiteSpace: 'nowrap', alignSelf: 'flex-end' }}>
                      que contratando por separado
                    </div>
                  </div>
                )}

                {isFeatured ? (
                  /* ── CARD EXPANDIDA ── */
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, padding: '36px 36px 32px',
                    opacity: contentVisible ? 1 : 0,
                    transition: contentVisible ? 'opacity 0.28s ease' : 'none',
                    pointerEvents: contentVisible ? 'auto' : 'none',
                  }}>
                    {pack.badge && <div style={{ fontSize: 10, fontWeight: 700, color: A.yellow, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{pack.badge}</div>}
                    <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 10 }}>{pack.title}</div>
                    <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.68)', lineHeight: 1.55, marginBottom: 18, maxWidth: 440 }}>{pack.subtitle}</div>

                    {/* Chips de qué incluye */}
                    {pack.includes?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 24 }}>
                        {pack.includes.map((item, i) => (
                          <span key={i} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 5,
                            background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(6px)',
                            border: '1px solid rgba(255,255,255,0.18)',
                            color: '#fff', fontSize: 11.5, fontWeight: 600,
                            padding: '5px 12px', borderRadius: 999,
                          }}>
                            <IcoCheck /> {item}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <button
                        onClick={e => { e.stopPropagation(); onOpenPack ? onOpenPack(pack) : onArmarPack(); }}
                        style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.22)', padding: '13px 22px', borderRadius: 14, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
                      >
                        Ver detalles
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); onOpenPack ? onOpenPack(pack) : onArmarPack(); }}
                        style={{ marginLeft: 'auto', background: A.primary, color: '#fff', border: 'none', padding: '13px 26px', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = A.primaryDark}
                        onMouseLeave={e => e.currentTarget.style.background = A.primary}
                      >
                        Pedí un presupuesto <IcoArrowR />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── CARD COLAPSADA ── */
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 16px' }}>
                    {pack.badge && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: A.yellow, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>{pack.badge}</div>
                    )}
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>
                      {pack.title}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>

        {/* Indicadores dot */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 28 }}>
          {packs.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              style={{
                width: idx === activeIdx ? 24 : 7,
                height: 7,
                borderRadius: 999,
                background: idx === activeIdx ? '#7DA1FF' : 'rgba(255,255,255,0.25)',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), background 0.3s',
              }}
              aria-label={`Pack ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
//  GASTRONOMÍA
// ═══════════════════════════════════════════════════════════
function GastronomySection({ dining, onOpenDetail, onVerTodas }) {
  const visible = dining.slice(0, 6);

  return (
    <section id="salidas" style={{ background: '#fff', padding: '72px 0', borderTop: `1px solid ${A.line}` }}>
      {/* Header */}
      <div style={{ paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingRight: 56, marginBottom: 28 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: A.primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          <IcoBolt /> GASTRONOMÍA
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.025em', color: A.ink, margin: '0 0 6px' }}>Dónde comer y beber</h2>
            <p style={{ fontSize: 16, color: A.muted, margin: 0, maxWidth: 480 }}>
              Los mejores restaurantes, bares y cafeterías para cada momento de tu estadía.
            </p>
          </div>
          <button
            onClick={onVerTodas}
            style={{ background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: A.primary, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
          >
            Ver todos <IcoArrowR />
          </button>
        </div>
      </div>

      {/* Scroll horizontal */}
      <div style={{ position: 'relative' }}>
        <div style={{ overflowX: 'auto', paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingBottom: 10 }} className="no-scrollbar">
          <div style={{ display: 'flex', gap: 16, width: 'max-content', paddingRight: 56 }}>
            {visible.map(place => (
              <div
                key={place.id}
                onClick={() => onOpenDetail(place, 'salidas')}
                style={{ width: 270, flexShrink: 0, border: `1px solid ${A.line}`, borderRadius: 20, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s, transform 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 48px -16px rgba(11,16,32,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
              >
                {/* Photo */}
                <div style={{ position: 'relative', height: 180, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={place.image} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {place.menuUrl && (
                    <a
                      href={place.menuUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.95)', color: A.green, border: 'none', borderRadius: 10, padding: '5px 10px', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer', textDecoration: 'none' }}
                    >
                      Ver menú
                    </a>
                  )}
                </div>

                {/* Content */}
                <div style={{ padding: '14px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 11, color: A.primary, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {place.category}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: A.ink, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                    {place.name}
                  </div>
                  {place.priceRange && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: A.ink2 }}>{place.priceRange}</div>
                  )}
                  <div style={{ fontSize: 12, color: A.ink2, lineHeight: 1.5, flex: 1 }}>
                    {place.description}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: A.muted, marginTop: 4 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
                    {place.address || place.location || 'Villa Gesell'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 10, width: 100, background: 'linear-gradient(to right, transparent, #fff)', pointerEvents: 'none', zIndex: 2 }} />
      </div>
    </section>
  );
}
