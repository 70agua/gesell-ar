// ============================================================
//  src/views/MarketplaceView.jsx — Aire design
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import AccommodationCard from '../components/AccommodationCard';
import { getAlojamientos, getPromos } from '../lib/datos';
import { LOCALIDADES, ZONAS, getVecinas } from '../lib/localidades';
import { secondsUntil, formatCountdown } from '../lib/ofertas';
import { useCuponera } from '../lib/cuponera';
import HeartButton     from '../components/HeartButton';

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

const TIPOS_ALOJ = ['Hotel', 'Cabaña', 'Departamento', 'Casa', 'Hostel', 'Dormi'];
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

// ─── Inline SVG icons ────────────────────────────────────────
const IcoSearch  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
const IcoX       = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const IcoChevD   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m6 9 6 6 6-6"/></svg>;
const IcoChevR   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m9 6 6 6-6 6"/></svg>;
const IcoTicket  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M13 6v12" strokeDasharray="2 3"/></svg>;
const IcoPin     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
const IcoBolt    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>;

const IcoGrid    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const IcoList    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>;
const IcoArrowL  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;

function CoinSVG({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9.25" fill="#FFC93C" stroke="#C8990A" strokeWidth="1.5"/>
      <circle cx="10" cy="10" r="6.5" fill="none" stroke="#C8990A" strokeWidth="1" opacity="0.4"/>
      <text x="10" y="14" textAnchor="middle" fill="#7A5A00" fontSize="8" fontWeight="800" fontFamily="system-ui"></text>
    </svg>
  );
}

// ─── Offer card (grid) ────────────────────────────────────────
function OfertaCardGrid({ promo, onClick, onAddToCuponera }) {
  const esFlash = promo.offerType === 'Flash';
  const [secs, setSecs] = useState(() => esFlash ? secondsUntil(promo.fechaFinFlash) : 0);
  useEffect(() => {
    if (!esFlash) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [esFlash]);

  const pad = n => String(n).padStart(2, '0');
  const th = Math.floor(secs / 3600);
  const tm = Math.floor((secs % 3600) / 60);
  const ts = secs % 60;

  return (
    <div
      onClick={() => onClick && onClick(promo)}
      style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 48px -16px rgba(11,16,32,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
        <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.65) 0%, transparent 55%)' }} />

        {/* Pill OFERTA FLASH + timer en misma fila */}
        {esFlash && secs > 0 && (
          <div style={{ position: 'absolute', top: 12, left: 12, right: 12, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ height: '100%', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EF4444', borderRadius: 999, padding: '0 10px 0 9px' }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#fff', letterSpacing: '0.05em' }}>OFERTA</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: A.yellow, fontStyle: 'italic', letterSpacing: '0.05em' }}>FLASH</span>
              <span style={{ color: A.yellow, display: 'flex', alignItems: 'center' }}><IcoBolt /></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: '100%' }}>
              {[th, tm, ts].map((v, i) => (
                <React.Fragment key={i}>
                  <div style={{ background: '#fff', color: A.ink, borderRadius: 5, fontSize: 12, fontWeight: 800, height: '100%', minWidth: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                    {i === 0 ? v : pad(v)}
                  </div>
                  {i < 2 && <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 900, fontSize: 13 }}>:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 12, left: 14, color: '#fff', fontSize: (promo.badge?.length || 0) > 5 ? 25 : 36, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1 }}>{promo.badge}</div>
        <div style={{ position: 'absolute', bottom: 10, right: 10 }}><HeartButton id={promo.id} /></div>
      </div>
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 13, color: A.muted, fontWeight: 400, marginBottom: 4 }}>
          {promo.categoria === 'alojamiento' && promo.negocioLocalidad
            ? `${promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()} · ${promo.negocioLocalidad}`
            : promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: A.ink, lineHeight: 1.3, flex: 1 }}>{promo.title}</div>
        {promo.tokens_costo != null && (
          promo.tokens_costo === 0
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0FDF4', borderRadius: 9, padding: '7px 11px', border: '1px solid #BBF7D0', marginTop: 10 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10A36B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#10A36B' }}>Cupón GRATIS</span>
              </div>
            : <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: A.bg, borderRadius: 9, padding: '7px 11px', border: `1px solid ${A.line}`, marginTop: 10 }}>
                <CoinSVG size={13} />
                <span style={{ fontSize: 12, fontWeight: 700, color: A.ink }}>{promo.tokens_costo} crédito{promo.tokens_costo !== 1 ? 's' : ''}</span>
                <span style={{ fontSize: 11, color: A.muted }}>(${(promo.tokens_costo * 2000).toLocaleString('es-AR')} + IVA)</span>
              </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); onAddToCuponera && onAddToCuponera(promo); }}
          style={{ marginTop: 8, background: A.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = A.primaryDark}
          onMouseLeave={e => e.currentTarget.style.background = A.primary}
        >
          <IcoTicket /> Agregar a cuponera
        </button>
      </div>
    </div>
  );
}

// ─── Offer card (list) ────────────────────────────────────────
function OfertaCardList({ promo, onClick, onAddToCuponera }) {
  const esFlash = promo.offerType === 'Flash';
  const [secs, setSecs] = useState(() => esFlash ? secondsUntil(promo.fechaFinFlash) : 0);
  useEffect(() => {
    if (!esFlash) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [esFlash]);

  const pad = n => String(n).padStart(2, '0');
  const th = Math.floor(secs / 3600);
  const tm = Math.floor((secs % 3600) / 60);
  const ts = secs % 60;

  return (
    <div
      onClick={() => onClick && onClick(promo)}
      style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 18, overflow: 'hidden', display: 'flex', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px -12px rgba(11,16,32,0.18)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ position: 'relative', width: 200, flexShrink: 0, overflow: 'hidden' }}>
        <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(11,16,32,0.45), transparent)' }} />
        {/* Pill OFERTA FLASH — top left de la imagen */}
        {esFlash && secs > 0 && (
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EF4444', borderRadius: 999, padding: '4px 10px 4px 9px' }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#fff', letterSpacing: '0.05em' }}>OFERTA</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: A.yellow, fontStyle: 'italic', letterSpacing: '0.05em' }}>FLASH</span>
            <span style={{ color: A.yellow, display: 'flex', alignItems: 'center' }}><IcoBolt /></span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 14, left: 14, color: '#fff', fontSize: (promo.badge?.length || 0) > 5 ? 22 : 32, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1 }}>{promo.badge}</div>
        <div style={{ position: 'absolute', bottom: 12, right: 10 }}><HeartButton id={promo.id} size={28} /></div>
      </div>
      <div style={{ flex: 1, padding: '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Timer flash — en el body, al tope */}
          {esFlash && secs > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 8 }}>
              {[th, tm, ts].map((v, i) => (
                <React.Fragment key={i}>
                  <div style={{ background: A.bg, border: `1px solid ${A.line}`, color: A.ink, borderRadius: 5, fontSize: 13, fontWeight: 800, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i === 0 ? v : pad(v)}
                  </div>
                  {i < 2 && <span style={{ color: A.muted, fontWeight: 700, fontSize: 14 }}>:</span>}
                </React.Fragment>
              ))}
              <span style={{ fontSize: 11, color: A.muted, marginLeft: 5 }}>restantes</span>
            </div>
          )}
          <div style={{ fontSize: 13, color: A.muted, fontWeight: 400, marginBottom: 4 }}>
            {promo.categoria === 'alojamiento' && promo.negocioLocalidad
              ? `${promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()} · ${promo.negocioLocalidad}`
              : <>{promo.negocioLocalidad && <span style={{ color: A.primary, fontWeight: 600 }}>{promo.negocioLocalidad}</span>}{promo.negocioLocalidad && ' · '}{promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()}</>
            }
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: A.ink, lineHeight: 1.3 }}>{promo.title}</div>
        </div>
        <div>
          {promo.tokens_costo != null && (
            promo.tokens_costo === 0
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0FDF4', borderRadius: 9, padding: '7px 11px', border: '1px solid #BBF7D0', marginBottom: 10 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10A36B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#10A36B' }}>Cupón GRATIS</span>
                </div>
              : <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: A.bg, borderRadius: 9, padding: '7px 11px', border: `1px solid ${A.line}`, marginBottom: 10 }}>
                  <CoinSVG size={13} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: A.ink }}>{promo.tokens_costo} crédito{promo.tokens_costo !== 1 ? 's' : ''}</span>
                  <span style={{ fontSize: 11, color: A.muted }}>(${(promo.tokens_costo * 2000).toLocaleString('es-AR')} + IVA)</span>
                </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={e => { e.stopPropagation(); onAddToCuponera && onAddToCuponera(promo); }}
              style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <IcoTicket /> Agregar a cuponera
            </button>
            <span style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 600, color: A.primary, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              Ver detalle <IcoChevR />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

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
              <span style={{ fontSize: 13, fontWeight: 700, color: hov ? A.primary : A.ink2, transition: 'color 0.15s' }}>{item.unidadPrecio === 'huesped' ? 'por huésped' : 'por noche'}</span>
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
//  VISTA PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function MarketplaceView({ onBack, onOpenDetail, initialFiltro = 'todos', initialLocalidad = 'todas' }) {
  const { addCupon } = useCuponera();
  const [alojamientos, setAlojamientos] = useState([]);
  const [promos,       setPromos]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [vista,        setVista]        = useState('grilla');
  const [busqueda,     setBusqueda]     = useState('');
  const [orden,        setOrden]        = useState('relevancia');
  const [showOrden,    setShowOrden]    = useState(false);

  // Filtros sidebar
  const [filtroLocalidad, setFiltroLocalidad] = useState(initialLocalidad === 'todas' ? '' : initialLocalidad);
  const [filtroTipos,     setFiltroTipos]     = useState(initialFiltro !== 'todos' ? new Set([initialFiltro]) : new Set());
  const [filtroServicios, setFiltroServicios] = useState(new Set());

  const ordenRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [aloj, proms] = await Promise.all([getAlojamientos(), getPromos(20)]);
      setAlojamientos(aloj);
      // Solo ofertas de alojamientos
      setPromos(proms.filter(p => p.categoria === 'alojamiento'));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const h = e => { if (ordenRef.current && !ordenRef.current.contains(e.target)) setShowOrden(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Filtrar + ordenar alojamientos ───────────────────────
  const alojFiltrados = alojamientos.filter(item => {
    const matchTipo      = filtroTipos.size === 0 || filtroTipos.has(item.type);
    const matchLocalidad = !filtroLocalidad || item.localidad === filtroLocalidad;
    const matchBusq      = !busqueda || (item.name || '').toLowerCase().includes(busqueda.toLowerCase());
    return matchTipo && matchLocalidad && matchBusq;
  }).sort((a, b) => {
    if (orden === 'precio_asc')  return (a.precioMin || 0) - (b.precioMin || 0);
    if (orden === 'precio_desc') return (b.precioMin || 0) - (a.precioMin || 0);
    return 0;
  });

  // ── Filtrar ofertas (solo de la localidad seleccionada) ──
  const promosFiltradas = promos.filter(p =>
    !filtroLocalidad || p.negocioLocalidad === filtroLocalidad || p.negocioZone === filtroLocalidad
  ).map(p => ({ ...p, _esOferta: true, type: 'oferta' }));

  // ── Intercalar: 1 oferta cada 10 alojamientos ───────────
  const visibles = [];
  let pIdx = 0;
  alojFiltrados.forEach((item, i) => {
    if (i > 0 && i % 10 === 0 && pIdx < promosFiltradas.length) {
      visibles.push(promosFiltradas[pIdx++]);
    }
    visibles.push(item);
  });

  const vecinas = filtroLocalidad ? getVecinas(filtroLocalidad) : [];

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
    setFiltroLocalidad('');
    setFiltroTipos(new Set());
    setFiltroServicios(new Set());
    setBusqueda('');
  };

  const hayFiltros = filtroLocalidad || filtroTipos.size > 0 || busqueda || filtroServicios.size > 0;

  // Active filter chips
  const activeChips = [
    ...(filtroLocalidad ? [{ key: 'loc', label: filtroLocalidad, clear: () => setFiltroLocalidad('') }] : []),
    ...[...filtroTipos].map(t => ({ key: `t-${t}`, label: t, clear: () => toggleTipo(t) })),
    ...[...filtroServicios].map(s => ({ key: `s-${s}`, label: SERVICIOS_LIST.find(x => x.id === s)?.label || s, clear: () => toggleServicio(s) })),
  ];

  const renderGrid = (items) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
      {items.map(item => item._esOferta
        ? <OfertaCardGrid key={`o-${item.id}`} promo={item} onClick={() => {}} onAddToCuponera={p => addCupon(p)} />
        : <AccommodationCard key={`a-${item.id}`} item={item} onClick={onOpenDetail} />
      )}
    </div>
  );

  const renderList = (items) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map(item => item._esOferta
        ? <OfertaCardList key={`o-${item.id}`} promo={item} onClick={() => {}} onAddToCuponera={p => addCupon(p)} />
        : <AlojListCard key={`a-${item.id}`} item={item} onClick={onOpenDetail} />
      )}
    </div>
  );

  const renderItems = (items) => vista === 'grilla' ? renderGrid(items) : renderList(items);

  return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, color: A.ink }}>

      {/* ── Sticky top bar ── */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${A.line}`, position: 'sticky', top: 64, zIndex: 30, boxShadow: '0 2px 12px -4px rgba(11,16,32,0.08)' }}>
        <div style={{ maxWidth: 1328, margin: '0 auto', padding: '12px 40px', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Back */}
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', color: A.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, fontSize: 14, padding: '6px 0', flexShrink: 0 }}
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
              placeholder="Buscar alojamientos, ofertas..."
              style={{ width: '100%', paddingLeft: 42, paddingRight: busqueda ? 36 : 14, paddingTop: 10, paddingBottom: 10, background: A.bg, border: `1px solid ${A.line}`, borderRadius: 12, fontSize: 14, fontWeight: 500, color: A.ink, outline: 'none', boxSizing: 'border-box', fontFamily: A.font }}
              onFocus={e => e.target.style.borderColor = A.primary}
              onBlur={e => e.target.style.borderColor = A.line}
            />
            {busqueda && (
              <button onClick={() => setBusqueda('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: A.muted, display: 'flex' }}>
                <IcoX />
              </button>
            )}
          </div>

          {/* Result count */}
          <div style={{ fontSize: 13, color: A.muted, fontWeight: 500, flexShrink: 0 }}>
            <span style={{ fontWeight: 700, color: A.ink }}>{alojFiltrados.length}</span> alojamientos
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + results ── */}
      <div style={{ maxWidth: 1328, margin: '0 auto', padding: '28px 40px 72px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32 }}>

        {/* ── SIDEBAR ── */}
        <aside>
          <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 18, overflow: 'hidden' }}>
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
              <CheckRow label="Todos los destinos" checked={!filtroLocalidad} onChange={() => setFiltroLocalidad('')} />
              {LOCALIDADES.map(loc => (
                <CheckRow
                  key={loc}
                  label={loc}
                  checked={filtroLocalidad === loc}
                  onChange={() => setFiltroLocalidad(filtroLocalidad === loc ? '' : loc)}
                />
              ))}
            </div>

            {/* Tipo */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${A.line}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.ink, marginBottom: 10, letterSpacing: '-0.01em' }}>Tipo de alojamiento</div>
              {TIPOS_ALOJ.map(t => (
                <CheckRow key={t} label={t} checked={filtroTipos.has(t)} onChange={() => toggleTipo(t)} />
              ))}
            </div>

            {/* Servicios */}
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: A.ink, marginBottom: 10, letterSpacing: '-0.01em' }}>Servicios</div>
              {SERVICIOS_LIST.map(s => (
                <CheckRow key={s.id} label={s.label} checked={filtroServicios.has(s.id)} onChange={() => toggleServicio(s.id)} />
              ))}
            </div>
          </div>
        </aside>

        {/* ── RESULTS ── */}
        <div>
          {/* Header: título + controles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: activeChips.length ? 14 : 22 }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.025em', margin: '0 0 4px' }}>
                {loading ? 'Buscando...' : `${alojFiltrados.length} alojamiento${alojFiltrados.length !== 1 ? 's' : ''}${filtroLocalidad ? ` en ${filtroLocalidad}` : ''}`}
              </h1>
              {filtroLocalidad && (
                <div style={{ fontSize: 13, color: A.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <IcoPin /> {filtroLocalidad}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {/* Grid / List toggle */}
              <div style={{ display: 'flex', background: A.bg, padding: 3, borderRadius: 10, border: `1px solid ${A.line}` }}>
                <button
                  onClick={() => setVista('grilla')}
                  style={{ padding: '6px 10px', borderRadius: 7, background: vista === 'grilla' ? '#fff' : 'transparent', border: vista === 'grilla' ? `1px solid ${A.line}` : '1px solid transparent', color: vista === 'grilla' ? A.ink : A.muted, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  <IcoGrid /> Grilla
                </button>
                <button
                  onClick={() => setVista('lista')}
                  style={{ padding: '6px 10px', borderRadius: 7, background: vista === 'lista' ? '#fff' : 'transparent', border: vista === 'lista' ? `1px solid ${A.line}` : '1px solid transparent', color: vista === 'lista' ? A.ink : A.muted, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  <IcoList /> Lista
                </button>
              </div>
              {/* Orden */}
              <div style={{ position: 'relative' }} ref={ordenRef}>
                <button
                  onClick={() => setShowOrden(o => !o)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fff', border: `1px solid ${A.line}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: A.ink, cursor: 'pointer', fontFamily: A.font }}
                >
                  {ORDEN_OPTS.find(o => o.id === orden)?.label} <IcoChevD />
                </button>
                {showOrden && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: '#fff', border: `1px solid ${A.line}`, borderRadius: 14, boxShadow: '0 16px 48px -16px rgba(11,16,32,0.2)', zIndex: 50, overflow: 'hidden', minWidth: 200 }}>
                    {ORDEN_OPTS.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setOrden(opt.id); setShowOrden(false); }}
                        style={{ width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', background: orden === opt.id ? A.primarySoft : 'transparent', color: orden === opt.id ? A.primary : A.ink2, fontSize: 13, fontWeight: orden === opt.id ? 600 : 500, cursor: 'pointer', fontFamily: A.font }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {activeChips.map(chip => (
                <span
                  key={chip.key}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: A.primarySoft, color: A.primary, borderRadius: 999, fontSize: 12, fontWeight: 600 }}
                >
                  {chip.label}
                  <button onClick={chip.clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: A.primary, display: 'flex', padding: 0 }}>
                    <IcoX />
                  </button>
                </span>
              ))}
              {hayFiltros && (
                <button
                  onClick={limpiarFiltros}
                  style={{ padding: '5px 12px', background: 'transparent', border: `1px solid ${A.line}`, borderRadius: 999, fontSize: 12, fontWeight: 600, color: A.muted, cursor: 'pointer' }}
                >
                  Limpiar todo
                </button>
              )}
            </div>
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
              <button
                onClick={limpiarFiltros}
                style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
              >
                Limpiar filtros
              </button>
            </div>
          ) : renderItems(visibles)}

          {/* Otras opciones cerca */}
          {!loading && filtroLocalidad && vecinas.length > 0 && (
            <div style={{ marginTop: 64 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
                <div style={{ flex: 1, height: 1, background: A.line }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>También te puede interesar</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: A.ink }}>Otras opciones similares cerca de {filtroLocalidad}</div>
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
                      <button
                        onClick={() => setFiltroLocalidad(vecina)}
                        style={{ background: 'none', border: 'none', color: A.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
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
