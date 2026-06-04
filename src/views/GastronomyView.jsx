// ============================================================
//  src/views/GastronomyView.jsx — Aire design
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import { getGastronomia, getPromos } from '../lib/datos';
import { LOCALIDADES } from '../lib/localidades';
import { useCuponera } from '../lib/cuponera';

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
  font:        "'Geist', system-ui, sans-serif",
};

const TIPOS_GASTRO = [
  'Restaurante', 'Bar', 'Café & Dulces', 'Balneario',
  'Gourmet', 'Pastelería', 'Parrilla',
];
const PRECIO_OPTS = [
  { id: '$',   label: '$ — Económico'  },
  { id: '$$',  label: '$$ — Moderado'  },
  { id: '$$$', label: '$$$ — Premium'  },
];
const ORDEN_OPTS = [
  { id: 'relevancia', label: 'Más relevantes' },
  { id: 'az',         label: 'A → Z'           },
];

// Deterministic pin position from item id
function hashPos(id) {
  const n = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, '')) || 1;
  return {
    x: ((n * 37 + 11) % 74) + 8,   // 8–82% (avoids ocean strip)
    y: ((n * 53 + 17) % 68) + 8,   // 8–76%
  };
}

const TIPO_COLORS = {
  'Restaurante':  '#EF4444',
  'Bar':          '#F59E0B',
  'Café & Dulces':'#8B5CF6',
  'Café':         '#8B5CF6',
  'Balneario':    '#0EA5E9',
  'Gourmet':      '#10B981',
  'Pastelería':   '#EC4899',
  'Parrilla':     '#F97316',
  'Heladería':    '#06B6D4',
};

// ─── Icons ───────────────────────────────────────────────────
const IcoSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
  </svg>
);
const IcoX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <path d="M18 6 6 18M6 6l12 12"/>
  </svg>
);
const IcoChevD = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="m6 9 6 6 6-6"/>
  </svg>
);
const IcoChevR = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="m9 6 6 6-6 6"/>
  </svg>
);
const IcoPin = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>
);
const IcoLock = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IcoArrowL = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M19 12H5M11 6l-6 6 6 6"/>
  </svg>
);
const IcoTicket = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/>
    <path d="M13 6v12" strokeDasharray="2 3"/>
  </svg>
);
const IcoBolt = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/>
  </svg>
);

function CoinSVG({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9.25" fill="#FFC93C" stroke="#C8990A" strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="#C8990A" strokeWidth="1" opacity="0.4"/>
      <text x="10" y="14" textAnchor="middle" fill="#7A5A00" fontSize="8" fontWeight="800" fontFamily="system-ui"></text>
    </svg>
  );
}

// ─── Checkbox row ─────────────────────────────────────────────
function CheckRow({ label, checked, onChange }) {
  return (
    <label onClick={onChange} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', cursor: 'pointer' }}>
      <div
        style={{
          width: 18, height: 18, borderRadius: 5,
          border: checked ? `2px solid ${A.primary}` : `2px solid ${A.line}`,
          background: checked ? A.primary : '#fff',
          display: 'grid', placeItems: 'center',
          flexShrink: 0, transition: 'all 0.12s', cursor: 'pointer',
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12 4.5 4.5L20 6"/>
          </svg>
        )}
      </div>
      <span style={{ flex: 1, fontSize: 13, color: A.ink2, fontWeight: checked ? 600 : 400 }}>{label}</span>
    </label>
  );
}

// ─── Gastronomy Map ───────────────────────────────────────────
function GastroMap({ allItems, filteredIds, hoveredId, onHoverPin }) {
  return (
    <div style={{
      position: 'relative',
      height: 400,
      borderRadius: 20,
      overflow: 'hidden',
      border: `1px solid ${A.line}`,
      background: '#F5F0E0',
      marginBottom: 32,
      boxShadow: '0 4px 24px -8px rgba(11,16,32,0.10)',
    }}>
      {/* Street grid – horizontals */}
      {[20, 33, 47, 61, 75].map(y => (
        <div key={y} style={{ position: 'absolute', left: 0, right: '18%', top: `${y}%`, height: 1, background: 'rgba(170,140,100,0.28)' }} />
      ))}
      {/* Street grid – verticals */}
      {[14, 27, 40, 53, 66, 79].map(x => (
        <div key={x} style={{ position: 'absolute', top: 0, bottom: 0, left: `${x}%`, width: 1, background: 'rgba(170,140,100,0.28)' }} />
      ))}

      {/* Main avenue – horizontal */}
      <div style={{ position: 'absolute', left: 0, right: '18%', top: '47%', height: 3, background: 'rgba(180,150,100,0.22)', borderRadius: 2 }} />
      {/* Main avenue – vertical */}
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '40%', width: 3, background: 'rgba(180,150,100,0.22)', borderRadius: 2 }} />

      {/* Pinar / Forest – bottom band */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: '4%', right: '20%',
        height: '28%',
        background: 'rgba(134,239,172,0.32)',
        borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '24%', left: '12%',
        fontSize: 9, fontWeight: 700, color: '#166534',
        opacity: 0.65, letterSpacing: '0.07em', textTransform: 'uppercase',
      }}>
        Pinar
      </div>

      {/* Ocean strip – right */}
      <div style={{
        position: 'absolute',
        top: 0, bottom: 0, right: 0,
        width: '18%',
        background: 'linear-gradient(to right, rgba(186,230,253,0.45) 0%, rgba(125,211,252,0.80) 100%)',
        borderLeft: '1px dashed rgba(56,189,248,0.35)',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            writingMode: 'vertical-rl', textOrientation: 'mixed',
            fontSize: 9, fontWeight: 700, color: '#1D4ED8',
            letterSpacing: '0.08em', opacity: 0.6,
            textTransform: 'uppercase',
          }}>
            Atlántico
          </span>
        </div>
      </div>

      {/* Map title badge */}
      <div style={{
        position: 'absolute', top: 12, left: 12, zIndex: 5,
        background: 'rgba(255,255,255,0.94)',
        borderRadius: 10, padding: '5px 12px',
        fontSize: 10, fontWeight: 700, color: A.ink,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        boxShadow: '0 1px 6px rgba(0,0,0,0.09)',
      }}>
        Plano gastronómico · Villa Gesell
      </div>

      {/* North compass */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 5,
        background: 'rgba(255,255,255,0.88)',
        borderRadius: 8, padding: '4px 9px',
        fontSize: 11, fontWeight: 600, color: A.muted,
      }}>
        N ↑
      </div>

      {/* Tipo legend */}
      <div style={{
        position: 'absolute', bottom: 12, right: '20%',
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 10, padding: '7px 12px',
        display: 'flex', gap: 10, flexWrap: 'wrap',
        maxWidth: 260, zIndex: 5,
        boxShadow: '0 1px 6px rgba(0,0,0,0.09)',
      }}>
        {Object.entries(TIPO_COLORS).slice(0, 6).map(([tipo, color]) => (
          <div key={tipo} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: A.muted, fontWeight: 600 }}>{tipo}</span>
          </div>
        ))}
      </div>

      {/* Pins */}
      {allItems.map(item => {
        const pos = hashPos(item.id);
        const color = TIPO_COLORS[item.category] || A.primary;
        const isHovered = hoveredId === item.id;
        const isActive  = filteredIds.length === 0 || filteredIds.includes(item.id);
        return (
          <div
            key={item.id}
            onMouseEnter={() => onHoverPin(item.id)}
            onMouseLeave={() => onHoverPin(null)}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top:  `${pos.y}%`,
              transform: `translate(-50%, -50%) scale(${isHovered ? 1.5 : 1})`,
              zIndex: isHovered ? 20 : 4,
              opacity: isActive ? 1 : 0.25,
              transition: 'transform 0.18s ease, opacity 0.2s, z-index 0s',
              cursor: 'pointer',
            }}
          >
            {/* Pin circle */}
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: color,
              border: `2.5px solid ${isHovered ? '#fff' : 'rgba(255,255,255,0.9)'}`,
              boxShadow: isHovered
                ? `0 4px 14px ${color}80, 0 0 0 3px ${color}30`
                : '0 2px 6px rgba(0,0,0,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: '#fff', lineHeight: 1,
            }}>
              {item.name.charAt(0)}
            </div>
            {/* Tooltip */}
            {isHovered && (
              <div style={{
                position: 'absolute',
                bottom: '130%', left: '50%',
                transform: 'translateX(-50%)',
                background: A.ink, color: '#fff',
                borderRadius: 8, padding: '5px 10px',
                fontSize: 11, fontWeight: 600,
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.22)',
                zIndex: 30,
              }}>
                {item.name}
                {/* Arrow */}
                <div style={{
                  position: 'absolute', top: '100%', left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0, height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: `5px solid ${A.ink}`,
                }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Gastronomy Card ──────────────────────────────────────────
function GastroCard({ item, isHovered, onHover, session, onLoginClick, onOpenDetail }) {
  const color = TIPO_COLORS[item.category] || A.primary;
  return (
    <div
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onOpenDetail && onOpenDetail(item, 'gastronomia')}
      style={{
        background: '#fff',
        border: `1px solid ${isHovered ? color + '60' : A.line}`,
        borderRadius: 18,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s',
        boxShadow: isHovered ? '0 12px 40px -12px rgba(11,16,32,0.16)' : 'none',
        transform: isHovered ? 'translateY(-2px)' : 'none',
      }}
    >
      {/* Photo */}
      <div style={{ position: 'relative', height: 190, overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={item.image}
          alt={item.name}
          style={{
            width: '100%', height: '100%', objectFit: 'cover',
            transition: 'transform 0.4s',
            transform: isHovered ? 'scale(1.05)' : 'scale(1)',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.5) 0%, transparent 50%)' }} />
        {/* Tipo badge */}
        <div style={{
          position: 'absolute', bottom: 10, left: 10,
          background: color, color: '#fff',
          padding: '3px 10px', borderRadius: 999,
          fontSize: 10, fontWeight: 700, letterSpacing: '0.03em',
        }}>
          {item.category}
        </div>
        {/* Price range */}
        {item.priceRange && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(255,255,255,0.95)', color: A.ink,
            padding: '3px 10px', borderRadius: 999,
            fontSize: 11, fontWeight: 700,
          }}>
            {item.priceRange}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Name */}
        <div style={{
          fontSize: 16, fontWeight: 700, color: isHovered ? A.primary : A.ink,
          marginBottom: 4, lineHeight: 1.2, transition: 'color 0.15s',
        }}>
          {item.name}
        </div>

        {/* Zone */}
        <div style={{ fontSize: 12, color: A.muted, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <IcoPin />
          <span style={{ color: A.ink2, fontWeight: 500 }}>
            {[item.zona, item.localidad].filter(Boolean).join(' · ')}
          </span>
        </div>

        {/* Description */}
        <p style={{
          fontSize: 13, color: A.ink2, lineHeight: 1.5,
          margin: '0 0 auto',
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.description}
        </p>

        {/* Address / CTA */}
        <div style={{ borderTop: `1px solid ${A.line}`, paddingTop: 10, marginTop: 12 }}>
          {session ? (
            <div style={{ fontSize: 12, color: A.ink2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <IcoPin /> {item.address || item.zona}
            </div>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onLoginClick && onLoginClick(); }}
              style={{
                background: 'none', border: 'none', padding: 0,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              <span style={{ color: A.muted }}><IcoLock /></span>
              <span style={{ fontSize: 12, color: A.primary, fontWeight: 600 }}>
                Ver dirección exacta
              </span>
            </button>
          )}
          {item.menuUrl && (
            <a
              href={item.menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: A.muted, fontWeight: 500,
                textDecoration: 'none', marginTop: 6,
              }}
            >
              Ver menú →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sponsored Offer Card (Anuncio) ───────────────────────────
function AnuncioCard({ promo, onAddToCuponera }) {
  const esFlash = promo.offerType === 'Flash';
  return (
    <div style={{
      gridColumn: '1 / -1',
      background: `linear-gradient(135deg, ${A.primarySoft} 0%, #F0F4FF 100%)`,
      border: `1px solid ${A.primarySoft}`,
      borderLeft: `4px solid ${A.primary}`,
      borderRadius: 18,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
    }}>
      {/* Image */}
      <div style={{ width: 130, height: 90, flexShrink: 0, overflow: 'hidden', position: 'relative' }}>
        <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(11,16,32,0.4), transparent)' }} />
        <div style={{ position: 'absolute', bottom: 8, left: 8, color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>
          {promo.badge}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: A.muted,
              letterSpacing: '0.07em', textTransform: 'uppercase',
              background: 'rgba(0,0,0,0.07)', padding: '2px 7px', borderRadius: 4,
            }}>
              Anuncio
            </span>
            {esFlash && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: A.ink, color: A.yellow, padding: '2px 7px', borderRadius: 5, fontSize: 10, fontWeight: 700 }}>
                <IcoBolt /> Flash
              </span>
            )}
            <span style={{ fontSize: 11, color: A.muted }}>{promo.proveedorNombre}</span>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: A.ink, lineHeight: 1.3 }}>{promo.title}</div>
        </div>
        <button
          onClick={() => onAddToCuponera && onAddToCuponera(promo)}
          style={{
            background: A.primary, color: '#fff', border: 'none',
            borderRadius: 12, padding: '9px 18px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            whiteSpace: 'nowrap', flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = A.primaryDark}
          onMouseLeave={e => e.currentTarget.style.background = A.primary}
        >
          <IcoTicket /> Ver oferta
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  VISTA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function GastronomyView({ onBack, session, onLoginClick, onOpenDetail }) {
  const { addCupon } = useCuponera();
  const [gastronomia, setGastronomia] = useState([]);
  const [promos,      setPromos]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busqueda,    setBusqueda]    = useState('');
  const [orden,       setOrden]       = useState('relevancia');
  const [showOrden,   setShowOrden]   = useState(false);
  const [hoveredId,   setHoveredId]   = useState(null);

  // Sidebar filters
  const [filtroLocalidad, setFiltroLocalidad] = useState('');
  const [filtroTipos,     setFiltroTipos]     = useState(new Set());
  const [filtroPrecios,   setFiltroPrecios]   = useState(new Set());

  const ordenRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [gastro, proms] = await Promise.all([getGastronomia(), getPromos(30)]);
      setGastronomia(gastro);
      setPromos(proms.filter(p => p.categoria === 'gastronomia'));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const h = e => { if (ordenRef.current && !ordenRef.current.contains(e.target)) setShowOrden(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Filtrar ───────────────────────────────────────────────
  const gastroFiltrada = gastronomia.filter(item => {
    const matchLocalidad = !filtroLocalidad || item.localidad === filtroLocalidad;
    const matchTipo      = filtroTipos.size === 0 || filtroTipos.has(item.category);
    const matchPrecio    = filtroPrecios.size === 0 || filtroPrecios.has(item.priceRange);
    const matchBusq      = !busqueda || item.name.toLowerCase().includes(busqueda.toLowerCase()) || (item.description || '').toLowerCase().includes(busqueda.toLowerCase());
    return matchLocalidad && matchTipo && matchPrecio && matchBusq;
  }).sort((a, b) => {
    if (orden === 'az') return a.name.localeCompare(b.name, 'es');
    return 0;
  });

  const filteredIds = gastroFiltrada.map(i => i.id);

  // ── Intercalar: 1 anuncio cada 5 ítems ───────────────────
  const itemsConAnuncios = [];
  let pIdx = 0;
  gastroFiltrada.forEach((item, i) => {
    if (i > 0 && i % 5 === 0 && pIdx < promos.length) {
      itemsConAnuncios.push({ ...promos[pIdx++], _esAnuncio: true });
    }
    itemsConAnuncios.push(item);
  });

  const toggleTipo   = t => setFiltroTipos(prev => { const n = new Set(prev); n.has(t) ? n.delete(t) : n.add(t); return n; });
  const togglePrecio = p => setFiltroPrecios(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });

  const limpiarFiltros = () => {
    setFiltroLocalidad('');
    setFiltroTipos(new Set());
    setFiltroPrecios(new Set());
    setBusqueda('');
  };

  const hayFiltros = filtroLocalidad || filtroTipos.size > 0 || filtroPrecios.size > 0 || busqueda;

  const activeChips = [
    ...(filtroLocalidad ? [{ key: 'loc', label: filtroLocalidad, clear: () => setFiltroLocalidad('') }] : []),
    ...[...filtroTipos].map(t => ({ key: `t-${t}`, label: t, clear: () => toggleTipo(t) })),
    ...[...filtroPrecios].map(p => ({ key: `p-${p}`, label: p, clear: () => togglePrecio(p) })),
  ];

  return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, color: A.ink }}>

      {/* ── Sticky top bar ── */}
      <div style={{
        background: '#fff',
        borderBottom: `1px solid ${A.line}`,
        position: 'sticky', top: 64, zIndex: 30,
        boxShadow: '0 2px 12px -4px rgba(11,16,32,0.08)',
      }}>
        <div style={{
          maxWidth: 1328, margin: '0 auto',
          padding: '12px 40px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          {/* Back */}
          <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', color: A.muted,
              cursor: 'pointer', display: 'flex', alignItems: 'center',
              gap: 6, fontWeight: 600, fontSize: 14, padding: '6px 0', flexShrink: 0,
            }}
          >
            <IcoArrowL /> Inicio
          </button>

          {/* Search */}
          <div style={{ flex: 1, position: 'relative', maxWidth: 520 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: A.muted, display: 'flex' }}>
              <IcoSearch />
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar restaurantes, bares, cafés..."
              style={{
                width: '100%', paddingLeft: 42, paddingRight: busqueda ? 36 : 14,
                paddingTop: 10, paddingBottom: 10,
                background: A.bg, border: `1px solid ${A.line}`, borderRadius: 12,
                fontSize: 14, fontWeight: 500, color: A.ink, outline: 'none',
                boxSizing: 'border-box', fontFamily: A.font,
              }}
              onFocus={e => e.target.style.borderColor = A.primary}
              onBlur={e => e.target.style.borderColor = A.line}
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: A.muted, display: 'flex' }}
              >
                <IcoX />
              </button>
            )}
          </div>

          {/* Count */}
          <div style={{ fontSize: 13, color: A.muted, fontWeight: 500, flexShrink: 0 }}>
            <span style={{ fontWeight: 700, color: A.ink }}>{gastroFiltrada.length}</span> lugares
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + main ── */}
      <div style={{
        maxWidth: 1328, margin: '0 auto',
        padding: '28px 40px 72px',
        display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32,
      }}>

        {/* ── SIDEBAR ── */}
        <aside>
          <div style={{
            position: 'sticky', top: 132,
            background: '#fff', border: `1px solid ${A.line}`,
            borderRadius: 18, overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: `1px solid ${A.line}` }}>
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Filtros</span>
              {hayFiltros && (
                <button onClick={limpiarFiltros} style={{ background: 'none', border: 'none', color: A.primary, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  Limpiar
                </button>
              )}
            </div>

            {/* Destino */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${A.line}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.ink, marginBottom: 10, letterSpacing: '-0.01em' }}>Destino</div>
              <CheckRow
                label="Todos"
                checked={!filtroLocalidad}
                onChange={() => setFiltroLocalidad('')}
              />
              {LOCALIDADES.map(loc => (
                <CheckRow
                  key={loc}
                  label={loc}
                  checked={filtroLocalidad === loc}
                  onChange={() => setFiltroLocalidad(filtroLocalidad === loc ? '' : loc)}
                />
              ))}
            </div>

            {/* Tipo de negocio */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${A.line}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.ink, marginBottom: 10, letterSpacing: '-0.01em' }}>Tipo de negocio</div>
              {TIPOS_GASTRO.map(t => (
                <CheckRow
                  key={t}
                  label={t}
                  checked={filtroTipos.has(t)}
                  onChange={() => toggleTipo(t)}
                />
              ))}
            </div>

            {/* Precio esperado */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.ink, marginBottom: 10, letterSpacing: '-0.01em' }}>Precio esperado</div>
              {PRECIO_OPTS.map(p => (
                <CheckRow
                  key={p.id}
                  label={p.label}
                  checked={filtroPrecios.has(p.id)}
                  onChange={() => togglePrecio(p.id)}
                />
              ))}
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <div>
          {/* Page header */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 6px' }}>
              Dónde comer y beber
            </h1>
            <p style={{ fontSize: 14, color: A.muted, margin: 0 }}>
              {loading
                ? 'Cargando…'
                : `${gastroFiltrada.length} lugar${gastroFiltrada.length !== 1 ? 'es' : ''} en ${filtroLocalidad || 'toda la zona'}`
              }
              {!session && !loading && (
                <span>
                  {' '}·{' '}
                  <button
                    onClick={onLoginClick}
                    style={{ background: 'none', border: 'none', color: A.primary, fontWeight: 600, cursor: 'pointer', fontSize: 14, padding: 0 }}
                  >
                    Registrate
                  </button>
                  {' '}para ver direcciones exactas
                </span>
              )}
            </p>
          </div>

          {/* ── MAPA ── */}
          {!loading && gastronomia.length > 0 && (
            <GastroMap
              allItems={gastronomia}
              filteredIds={filteredIds}
              hoveredId={hoveredId}
              onHoverPin={setHoveredId}
            />
          )}

          {/* Controls: sort */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: activeChips.length ? 14 : 20 }}>
            <div style={{ fontSize: 13, color: A.muted, fontWeight: 500 }}>
              {loading ? '' : `${gastroFiltrada.length} resultado${gastroFiltrada.length !== 1 ? 's' : ''}`}
            </div>
            <div style={{ position: 'relative' }} ref={ordenRef}>
              <button
                onClick={() => setShowOrden(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', background: '#fff',
                  border: `1px solid ${A.line}`, borderRadius: 10,
                  fontSize: 13, fontWeight: 500, color: A.ink, cursor: 'pointer',
                  fontFamily: A.font,
                }}
              >
                {ORDEN_OPTS.find(o => o.id === orden)?.label} <IcoChevD />
              </button>
              {showOrden && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                  background: '#fff', border: `1px solid ${A.line}`,
                  borderRadius: 14, boxShadow: '0 16px 48px -16px rgba(11,16,32,0.2)',
                  zIndex: 50, overflow: 'hidden', minWidth: 180,
                }}>
                  {ORDEN_OPTS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => { setOrden(opt.id); setShowOrden(false); }}
                      style={{
                        width: '100%', textAlign: 'left', padding: '11px 16px',
                        border: 'none',
                        background: orden === opt.id ? A.primarySoft : 'transparent',
                        color: orden === opt.id ? A.primary : A.ink2,
                        fontSize: 13, fontWeight: orden === opt.id ? 600 : 500,
                        cursor: 'pointer', fontFamily: A.font,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {activeChips.map(chip => (
                <span
                  key={chip.key}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', background: A.primarySoft,
                    color: A.primary, borderRadius: 999, fontSize: 12, fontWeight: 600,
                  }}
                >
                  {chip.label}
                  <button
                    onClick={chip.clear}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: A.primary, display: 'flex', padding: 0 }}
                  >
                    <IcoX />
                  </button>
                </span>
              ))}
              <button
                onClick={limpiarFiltros}
                style={{
                  padding: '5px 12px', background: 'transparent',
                  border: `1px solid ${A.line}`, borderRadius: 999,
                  fontSize: 12, fontWeight: 600, color: A.muted, cursor: 'pointer',
                }}
              >
                Limpiar todo
              </button>
            </div>
          )}

          {/* Results */}
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, color: A.muted, fontSize: 15, fontWeight: 500 }}>
              Cargando restaurantes y bares…
            </div>
          ) : gastroFiltrada.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 20, padding: '56px 32px', textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🍽️</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: A.ink, marginBottom: 6 }}>Sin resultados</div>
              <div style={{ fontSize: 14, color: A.muted, marginBottom: 20 }}>Probá con otros filtros o explorá otra localidad</div>
              <button
                onClick={limpiarFiltros}
                style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              {itemsConAnuncios.map((item, idx) =>
                item._esAnuncio ? (
                  <AnuncioCard
                    key={`anuncio-${item.id}-${idx}`}
                    promo={item}
                    onAddToCuponera={p => addCupon(p)}
                  />
                ) : (
                  <GastroCard
                    key={item.id}
                    item={item}
                    isHovered={hoveredId === item.id}
                    onHover={setHoveredId}
                    session={session}
                    onLoginClick={onLoginClick}
                    onOpenDetail={onOpenDetail}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
