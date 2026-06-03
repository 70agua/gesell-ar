// ============================================================
//  src/views/HomeView.jsx — Aire design system
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import AccommodationCard from '../components/AccommodationCard';
import { locations, mockPacks, ALL_PROMOS } from '../data/mockData';
import { secondsUntil, formatCountdown } from '../lib/ofertas';
import { useCuponera }  from '../lib/cuponera';
import HeartButton      from '../components/HeartButton';

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
  font:        "'Geist', system-ui, sans-serif",
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
const IcoUsers   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;


// ─── Golden coin SVG ─────────────────────────────────────────
function CoinSVG({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9.25" fill="#FFC93C" stroke="#C8990A" strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="#C8990A" strokeWidth="1" opacity="0.4"/>
      <text x="10" y="14" textAnchor="middle" fill="#7A5A00" fontSize="8" fontWeight="800" fontFamily="system-ui"></text>
    </svg>
  );
}

// ─── Type filter pills with SVG icons ────────────────────────
const TYPE_FILTERS = [
  {
    id: 'hoteles', label: 'Hoteles',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21V7l9-4 9 4v14"/><path d="M9 21V11h6v10"/><rect x="10" y="3" width="4" height="4" rx="1" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
  },
  {
    id: 'casas', label: 'Casas y cabañas',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5 12 3l9 6.5V21H3V9.5Z"/><path d="M9 21v-7h6v7"/>
      </svg>
    ),
  },
  {
    id: 'aparts', label: 'Aparts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6M15 3v18M15 9h6M15 15h6"/>
      </svg>
    ),
  },
  {
    id: 'camping', label: 'Dormis / Camping',
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
        style={{ width: '100%', padding: '14px 20px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer' }}
      >
        <div style={{ fontSize: 10, color: A.muted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Destino</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: A.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: A.primary }}><IcoPin /></span>
          {value}
        </div>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#fff', border: `1px solid ${A.line}`, borderRadius: 14, boxShadow: '0 16px 48px -16px rgba(11,16,32,0.2)', zIndex: 999, overflow: 'hidden', minWidth: 230 }}>
          <button
            onClick={() => { onChange('Todos los destinos'); setOpen(false); }}
            style={{ width: '100%', padding: '10px 16px', border: 'none', background: value === 'Todos los destinos' ? A.primarySoft : 'none', textAlign: 'left', fontSize: 13, fontWeight: 600, color: A.primary, cursor: 'pointer' }}
          >
            Todos los destinos
          </button>
          {locations.map(loc => (
            <button
              key={loc}
              onClick={() => { onChange(loc); setOpen(false); }}
              style={{ width: '100%', padding: '10px 16px', border: 'none', background: value === loc ? A.primarySoft : 'none', textAlign: 'left', fontSize: 13, fontWeight: 500, color: value === loc ? A.primary : A.ink2, cursor: 'pointer' }}
              onMouseEnter={e => { if (value !== loc) e.currentTarget.style.background = A.bg; }}
              onMouseLeave={e => { if (value !== loc) e.currentTarget.style.background = 'none'; }}
            >
              {loc}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Guests dropdown (Adultos / Niños / Bebés) ───────────────
function GuestsDropdown() {
  const [open, setOpen]       = useState(false);
  const [adultos, setAdultos] = useState(2);
  const [ninos, setNinos]     = useState(0);
  const [bebes, setBebes]     = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const summary = () => {
    const parts = [`${adultos} adulto${adultos !== 1 ? 's' : ''}`];
    if (ninos > 0) parts.push(`${ninos} niño${ninos !== 1 ? 's' : ''}`);
    // Los bebés NO se muestran en el visor del trigger (para no expandir el ancho)
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
          <div style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: A.ink, flexShrink: 0 }}>Bebés</span>
              <span style={{ fontSize: 11, color: A.muted, whiteSpace: 'nowrap' }}>Menores de 2 años</span>
            </div>
            <Counter value={bebes} onDec={() => setBebes(v => Math.max(0, v - 1))} onInc={() => setBebes(v => Math.min(4, v + 1))} />
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
export default function HomeView({ accommodations = [], dining = [], onOpenDetail, onVerTodas, onArmarPack, onVerMarketplace, onOpenPack, onOpenOferta, onVerOfertasRegalo }) {
  const [destino,        setDestino]        = useState('Todos los destinos');
  const [activeTypes,    setActiveTypes]    = useState(new Set());
  const [activeSecondary, setActiveSecondary] = useState([]);
  const [locIdx,         setLocIdx]         = useState(0);
  const [locFade,        setLocFade]        = useState(false);
  const [tabAloj,        setTabAloj]        = useState('Todos');

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
        <div className="hero-grid" style={{ display: 'flex', minHeight: 660, position: 'relative' }}>

          {/* ─ LEFT — ocupa el 100% (collage es absolute), contenido limitado a 56vw por CSS ─ */}
          <div className="hero-left" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
            <div className="hero-content" style={{
              paddingRight: 56, paddingTop: 48, paddingBottom: 52,
            }}>

              {/* H1 rotating */}
              {(() => {
                const loc = locations[locIdx];
                // Escala la fuente de la localidad según longitud para evitar salto de línea
                const locFs = loc.length <= 11 ? 'clamp(42px, 5vw, 74px)'
                            : loc.length <= 14 ? 'clamp(36px, 4.2vw, 64px)'
                            :                   'clamp(30px, 3.6vw, 54px)';
                return (
                  <h1 style={{ fontSize: 'clamp(40px, 4.6vw, 70px)', lineHeight: 1.05, letterSpacing: '-0.04em', color: A.ink, margin: '0 0 18px', fontWeight: 800 }}>
                    Ofertas y promociones en<br />
                    <span style={{
                      fontFamily: "'NauryzRedkeds', cursive",
                      fontSize: locFs,
                      color: A.primary,
                      display: 'inline-block',
                      transition: 'opacity 0.28s, font-size 0.2s',
                      opacity: locFade ? 0 : 1,
                      minWidth: 1,
                      lineHeight: 1.1,
                    }}>
                      {loc}
                    </span>
                  </h1>
                );
              })()}

              <p style={{ fontSize: 18, lineHeight: 1.55, color: A.muted, margin: '0 0 26px', fontWeight: 400, maxWidth: 600 }}>
                Encontrá alojamientos con descuentos reales, armá tu cuponera y disfrutá, sin sorpresas.
              </p>

              {/* ─ Filter pills ─ */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {TYPE_FILTERS.map(f => {
                  const on = activeTypes.has(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleType(f.id)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 7,
                        padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
                        border: `1.5px solid ${on ? A.primary : A.line}`,
                        background: on ? A.primarySoft : '#fff',
                        color: on ? A.primary : A.ink2,
                        fontSize: 13, fontWeight: 500,
                        transition: 'background 0.15s, color 0.15s, border-color 0.15s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span style={{ color: on ? A.primary : A.muted, display: 'flex' }}>{f.icon}</span>
                      {f.label}
                    </button>
                  );
                })}
              </div>

              {/* ─ Search widget ─ */}
              <div className="hero-search" style={{ border: `1px solid ${A.line}`, borderRadius: 18, display: 'flex', overflow: 'visible', boxShadow: '0 8px 32px -12px rgba(11,16,32,0.14)', background: '#fff' }}>
                <DestDropdown value={destino} onChange={setDestino} />
                <GuestsDropdown />
                <button
                  className="hero-search-btn"
                  onClick={onVerMarketplace}
                  style={{ background: A.primary, color: '#fff', border: 'none', padding: '0 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, borderRadius: '0 16px 16px 0', flexShrink: 0, fontFamily: A.font }}
                >
                  <IcoSearch /> Buscar
                </button>
              </div>

              {/* ─ Banner descuentos ─ */}
              <div style={{
                marginTop: 36, padding: '18px 24px', background: A.primarySoft,
                borderRadius: 18, display: 'flex', alignItems: 'center', gap: 18,
                border: `1px solid ${A.primary}22`,
              }}>
                {/* Dos ico-disc superpuestos */}
                <div style={{ position: 'relative', width: 80, height: 52, flexShrink: 0 }}>
                  <img src="/ico-disc.svg" alt="" style={{ width: 52, position: 'absolute', top: 0, left: 0, zIndex: 2 }} />
                  <img src="/ico-disc.svg" alt="" style={{ width: 52, position: 'absolute', top: 0, left: 28, zIndex: 1, opacity: 0.55 }} />
                </div>
                <p style={{ fontSize: 15, color: A.ink2, fontWeight: 400, lineHeight: 1.5, margin: 0 }}>
                  Ya contás con 2 descuentos de regalo.{' '}
                  <button
                    onClick={() => onVerOfertasRegalo?.()}
                    style={{ background: 'none', border: 'none', padding: 0, color: A.primary, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: A.font }}
                  >
                    Elegí entre estas opciones.
                  </button>
                </p>
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
      </section>

      {/* ── OFERTAS IMPERDIBLES ───────────────────────────────── */}
      <PromosSection onOpenDetail={onOpenDetail} accommodations={accommodations} onVerTodas={onVerTodas} onOpenOferta={onOpenOferta} />

      {/* ── ALOJAMIENTOS ──────────────────────────────────────── */}
      <section id="alojamientos" style={{ background: '#fff', padding: '72px 56px' }}>
        <div style={{ maxWidth: 1328, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
            <div>
              <h2 style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.028em', margin: '0 0 8px', color: A.ink }}>Alojamientos destacados</h2>
              <p style={{ fontSize: 16, color: A.muted, margin: 0 }}>Donde el descanso se encuentra con el mar.</p>
            </div>
            {/* Tab pills */}
            <div style={{ display: 'flex', gap: 4, background: A.bg, padding: 4, borderRadius: 999, border: `1px solid ${A.line}` }}>
              {['Todos', 'Hotel', 'Cabaña', 'Departamento'].map(t => (
                <button
                  key={t}
                  onClick={() => setTabAloj(t)}
                  style={{
                    padding: '10px 22px', borderRadius: 999, border: 'none', cursor: 'pointer',
                    background: tabAloj === t ? A.ink : 'transparent',
                    color: tabAloj === t ? '#fff' : A.ink2,
                    fontWeight: 600, fontSize: 14, fontFamily: A.font, transition: 'all 0.15s',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="aloj-grid" style={{ marginBottom: 40 }}>
            {filteredAloj.slice(0, 8).map(item => (
              <AccommodationCard key={item.id} item={item} onClick={onOpenDetail} />
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={onVerMarketplace}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 36px', borderRadius: 999, border: `1.5px solid ${A.line}`, background: '#fff', fontSize: 15, fontWeight: 600, color: A.ink, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.color = A.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.color = A.ink; }}
            >
              Ver todos los alojamientos <IcoArrowR />
            </button>
          </div>
        </div>
      </section>

      {/* ── PACKS ─────────────────────────────────────────────── */}
      <PacksSection onArmarPack={onArmarPack} onOpenPack={onOpenPack} />

      {/* ── GASTRONOMÍA ───────────────────────────────────────── */}
      <GastronomySection dining={dining} onOpenDetail={onOpenDetail} onVerTodas={() => {}} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  OFERTAS IMPERDIBLES
// ═══════════════════════════════════════════════════════════
function OfertaCardAire({ promo, onClick, onAddToCuponera }) {
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
      {/* Imagen */}
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.65) 0%, rgba(11,16,32,0.1) 50%, transparent 100%)' }} />

        {/* Fila top: pill OFERTA FLASH (izq) + timer mismo alto (der) */}
        {esFlash && secs > 0 && (
          <div style={{ position: 'absolute', top: 12, left: 12, right: 12, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Pill fondo rojo sólido */}
            <div style={{ height: '100%', display: 'inline-flex', alignItems: 'center', gap: 5, background: '#EF4444', borderRadius: 999, padding: '0 13px 0 11px' }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', letterSpacing: '0.05em' }}>OFERTA</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: A.yellow, fontStyle: 'italic', letterSpacing: '0.05em' }}>FLASH</span>
              <span style={{ color: A.yellow, display: 'flex', alignItems: 'center' }}><IcoBolt /></span>
            </div>
            {/* Timer — mismo alto que el pill, siempre visible */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: '100%' }}>
              {[Math.floor(secs / 3600), Math.floor((secs % 3600) / 60), secs % 60].map((v, i) => (
                <React.Fragment key={i}>
                  <div style={{ background: '#fff', color: A.ink, borderRadius: 7, fontSize: 14, fontWeight: 800, height: '100%', minWidth: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                    {i === 0 ? v : String(v).padStart(2, '0')}
                  </div>
                  {i < 2 && <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 900, fontSize: 15, lineHeight: 1 }}>:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Discount badge */}
        <div style={{ position: 'absolute', bottom: 14, left: 14, color: '#fff' }}>
          <div style={{ fontSize: (promo.badge?.length || 0) > 5 ? 29 : 42, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1 }}>{promo.badge}</div>
        </div>
        {/* Heart */}
        <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
          <HeartButton id={promo.id} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 13, color: A.muted, fontWeight: 400, marginBottom: 4 }}>
          {promo.categoria === 'alojamiento' && promo.negocioLocalidad
            ? `${promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()} · ${promo.negocioLocalidad}`
            : promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, color: A.ink, lineHeight: 1.3, flex: 1 }}>{promo.title}</div>
        {/* Créditos */}
        {promo.tokens_costo != null && (
          promo.tokens_costo === 0
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', borderRadius: 10, padding: '8px 12px', border: '1px solid #BBF7D0', marginTop: 10 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={A.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>
                <span style={{ fontSize: 13, fontWeight: 700, color: A.green }}>Cupón GRATIS</span>
              </div>
            : <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: A.bg, borderRadius: 10, padding: '8px 12px', border: `1px solid ${A.line}`, marginTop: 10 }}>
                <CoinSVG size={14} />
                <span style={{ fontSize: 13, fontWeight: 700, color: A.ink }}>{promo.tokens_costo} crédito{promo.tokens_costo !== 1 ? 's' : ''}</span>
                <span style={{ fontSize: 12, color: A.muted }}>(${(promo.tokens_costo * 2000).toLocaleString('es-AR')} + IVA)</span>
              </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); onAddToCuponera && onAddToCuponera(promo); }}
          style={{ marginTop: 10, background: A.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = A.primaryDark}
          onMouseLeave={e => e.currentTarget.style.background = A.primary}
        >
          <IcoTicket /> Agregar a cuponera
        </button>
      </div>
    </div>
  );
}

const FILTROS_OFERTA = [
  { key: null,          label: 'Todo'         },
  { key: 'alojamiento', label: 'Alojamientos' },
  { key: 'gastronomia', label: 'Gastronomía'  },
  { key: 'experiencia', label: 'Experiencias' },
];

function PromosSection({ onOpenDetail, accommodations, onVerTodas, onOpenOferta }) {
  const [promos, setPromos]       = useState([]);
  const [filtro, setFiltro]       = useState(null); // null = todos
  const [expandido, setExpandido] = useState(false); // una vez a 8, no vuelve a 4
  const { addCupon } = useCuponera();

  useEffect(() => {
    (async () => {
      const { getPromos } = await import('../lib/datos');
      setPromos(await getPromos(20)); // traemos más para tener stock al filtrar
    })();
  }, []);

  const promosFiltradas = filtro
    ? promos.filter(p => p.categoria === filtro)
    : promos;

  return (
    <section style={{ background: A.bg, padding: '72px 56px', borderTop: `1px solid ${A.line}`, borderBottom: `1px solid ${A.line}` }}>
      <div style={{ maxWidth: 1328, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: A.primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
              <IcoBolt /> Cuponera local
            </div>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.025em', color: A.ink, margin: '0 0 8px' }}>Ofertas imperdibles</h2>
            <p style={{ fontSize: 16, color: A.muted, margin: '0 0 14px' }}>Descuentos reales en socios verificados. Canjeás con QR desde tu celular.</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: A.ink }}>
              <CoinSVG size={20} />
              1 crédito = $2.000 + IVA
            </div>
          </div>

          {/* Filtros — mismo estilo que Alojamientos destacados */}
          <div style={{ display: 'flex', gap: 4, background: A.bg, padding: 4, borderRadius: 999, border: `1px solid ${A.line}` }}>
            {FILTROS_OFERTA.map(f => {
              const activo = filtro === f.key;
              return (
                <button
                  key={String(f.key)}
                  onClick={() => { setFiltro(f.key); if (f.key !== null) setExpandido(true); }}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    background: activo ? A.ink : 'transparent',
                    color: activo ? '#fff' : A.ink2,
                    fontWeight: 600,
                    fontSize: 14,
                    fontFamily: A.font,
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid — 4 sin filtro, 8 con filtro */}
        <div className="promos-grid">
          {promosFiltradas.slice(0, expandido ? 8 : 4).map(promo => (
            <OfertaCardAire
              key={promo.id}
              promo={promo}
              onClick={p => {
                if (onOpenOferta) { onOpenOferta(p); return; }
                if (!onOpenDetail || !accommodations) return;
                const neg = accommodations.find(a => String(a.id) === String(p.negocioId));
                if (neg) onOpenDetail(neg, 'alojamiento', 'promos');
              }}
              onAddToCuponera={p => addCupon(p)}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 44 }}>
          <button
            onClick={onVerTodas}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 36px', borderRadius: 999, border: `1.5px solid ${A.line}`, background: '#fff', fontSize: 15, fontWeight: 600, color: A.ink, cursor: 'pointer' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.color = A.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.color = A.ink; }}
          >
            {filtro
              ? `Más ofertas de ${FILTROS_OFERTA.find(f => f.key === filtro)?.label}`
              : 'Ver todas las ofertas'
            } <IcoArrowR />
          </button>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
//  PACKS
// ═══════════════════════════════════════════════════════════
function PacksSection({ onArmarPack, onOpenPack }) {
  const featured = mockPacks[0];
  const others   = mockPacks.slice(1, 4);

  return (
    <section style={{ background: A.navy, padding: '80px 56px', color: '#fff' }}>
      <div style={{ maxWidth: 1328, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'end', marginBottom: 48 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(255,201,60,0.16)', color: A.yellow, borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
              <IcoBolt /> Experiencias todo-en-uno
            </div>
            <h2 style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0 }}>
              Packs exclusivos<br />
              <span style={{ background: 'linear-gradient(135deg, #7DA1FF 0%, #A5C0FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                gesell.ar
              </span>
            </h2>
          </div>
          <div>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.7)', lineHeight: 1.55, margin: '0 0 6px' }}>
              Te ahorramos la búsqueda y la negociación. Combinamos alojamiento, gastronomía y aventuras al mejor precio verificado.
            </p>
            <button
              onClick={onArmarPack}
              style={{ background: 'none', border: 'none', color: '#7DA1FF', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, padding: 0, marginTop: 12 }}
            >
              Ver todos los packs <IcoArrowR />
            </button>
          </div>
        </div>

        {/* Layout: featured (2fr) + column (1fr) */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>

          {/* Featured */}
          <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
            <div style={{ position: 'relative', minHeight: 340 }}>
              <img src={featured?.images?.[0] || PHOTOS.cabin} alt={featured?.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
              <div style={{ position: 'absolute', top: 16, left: 16, background: '#FF3D7F', color: '#fff', padding: '6px 12px', borderRadius: 999, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                MÁS VENDIDO
              </div>
              {featured?.discountPct && (
                <div style={{ position: 'absolute', top: 16, right: 16, background: A.yellow, color: A.navy, padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800 }}>
                  -{featured.discountPct}%
                </div>
              )}
            </div>
            <div style={{ padding: '28px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7DA1FF', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Pack destacado</div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.1 }}>{featured?.title || 'Escapada Romántica'}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, marginBottom: 18 }}>
                {featured?.subtitle || 'Alojamiento + gastronomía + experiencias en un pack verificado.'}
              </div>
              {['Alojamiento incluido', 'Gastronomía seleccionada', 'Experiencia local'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(125,161,255,0.15)', color: '#7DA1FF', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <IcoCheck />
                  </div>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{item}</span>
                </div>
              ))}
              <div style={{ marginTop: 'auto', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 2 }}>Pack desde</div>
                  <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: '#22D396' }}>
                    ${featured?.price?.toLocaleString('es-AR') || '145.000'}
                  </div>
                </div>
                <button
                  onClick={() => onOpenPack ? onOpenPack(featured) : onArmarPack()}
                  style={{ background: '#fff', color: A.navy, border: 'none', padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Ver pack <IcoChevR />
                </button>
              </div>
            </div>
          </div>

          {/* Secondary packs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {others.map(pack => (
              <div
                key={pack.id}
                onClick={() => onOpenPack ? onOpenPack(pack) : onArmarPack()}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              >
                <div style={{ width: 72, height: 72, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={pack.images?.[0] || PHOTOS.forest} alt={pack.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{pack.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{pack.subtitle}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#22D396' }}>${pack.price?.toLocaleString('es-AR')}</div>
                </div>
                <IcoChevR />
              </div>
            ))}
          </div>
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
    <section id="gastronomia" style={{ background: '#fff', padding: '72px 56px', borderTop: `1px solid ${A.line}` }}>
      <div style={{ maxWidth: 1328, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.025em', color: A.ink, margin: '0 0 8px' }}>Dónde comer y beber</h2>
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

        <div className="gastro-grid">
          {visible.map(place => (
            <div
              key={place.id}
              onClick={() => onOpenDetail(place, 'gastronomia')}
              style={{ border: `1px solid ${A.line}`, borderRadius: 20, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.2s, transform 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 48px -16px rgba(11,16,32,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              {/* Photo */}
              <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                <img src={place.image} alt={place.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {/* Menú button */}
                {place.menuUrl && (
                  <a
                    href={place.menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.95)', color: A.green, border: 'none', borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', textDecoration: 'none' }}
                  >
                    Ver menú
                  </a>
                )}
              </div>

              {/* Content */}
              <div style={{ padding: '16px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Tipo */}
                <div style={{ fontSize: 11, color: A.primary, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {place.category}
                </div>
                {/* Nombre */}
                <div style={{ fontSize: 18, fontWeight: 700, color: A.ink, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  {place.name}
                </div>
                {/* Rango de precio */}
                {place.priceRange && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: A.ink2 }}>
                    {place.priceRange}
                  </div>
                )}
                {/* Descripción breve */}
                <div style={{ fontSize: 13, color: A.ink2, lineHeight: 1.5, flex: 1 }}>
                  {place.description}
                </div>
                {/* Ubicación */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: A.muted, marginTop: 4 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
                  {place.address || place.location || 'Villa Gesell'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
