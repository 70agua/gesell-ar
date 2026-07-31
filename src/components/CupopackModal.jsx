// ============================================================
//  src/components/CupopackModal.jsx
//  Modal de un Cupopack: coverflow de sus cupones + riel de checkout.
//  - Vista de entrada a PANTALLA COMPLETA, sin bordes redondeados.
//  - Dos columnas:
//      · Izquierda  → cabecera con identidad Cuponear + título grande
//                     + grilla de cupones (mismo contenido que hoy).
//      · Derecha    → panel "checkout": punto ahorro, activación y CTA de pago.
//  - Vista de detalle (coverflow) idéntica al original.
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getBeneficioIcon } from '../lib/beneficioIconos';
import { aplicarBeneficioCupopack, tipoBeneficio } from '../lib/beneficiosCupopack';
import OfertaCard from './OfertaCard';

// Mapea un cupón del Cupopack a la forma `promo` que espera <OfertaCard/>.
const cuponAPromo = c => ({
  id: c.id,
  proveedorNombre: c.socio,
  negocioLocalidad: c.localidad,
  image: c.imagen,
  title: c.titulo,
  badge: c.badge,
  ahorroEstimado: c.ahorro_estimado,
  offerType: 'Normal',
  tieneStock: c.tieneStock,
  stockRestante: c.stockRestante,
});

const C = {
  ink:      '#0B1020',
  ink2:     '#3D4255',
  muted:    '#6B7280',
  line:     '#E7E9EE',
  primary:  '#2545E6',
  primaryDeep: '#1b265d',
  primarySoft: '#EEF1FF',
  green:    '#10A36B',
  bg:       '#F7F7F8',
  yellow:   '#FFC93C',
  font:     "'Inter', system-ui, sans-serif",
};

const TABS = [
  { key: 'detalles', label: 'Detalles del cupón' },
  { key: 'acerca',   label: 'Acerca de' },
  { key: 'mapa',     label: 'Mapa' },
];

const ChevL = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ChevR = ({ s = 22 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>;
const IcoClose = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>;
const IcoPin = ({ s = 13 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2"/></svg>;
const IcoCheck = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M20 6 9 17l-5-5"/></svg>;
const Share = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>;
const Heart = ({ size = 18 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Puntos que gana el turista (misma fórmula que OfertaCard: ahorro / 4).
const calcPts = ahorro => Math.round((Number(ahorro) || 0) / 4);

// ─── Cover lateral (el "lomo" de las fichas vecinas) ─────────
function SideCover({ cupon, side, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Cupón anterior' : 'Cupón siguiente'}
      className="cupon-sidecover"
      style={{
        position: 'absolute', top: '50%', [side]: 0,
        transform: `translateY(-50%) translateX(${side === 'left' ? '-62%' : '62%'}) scale(0.92)`,
        width: 320, height: '76%', borderRadius: 22, overflow: 'hidden',
        border: 'none', padding: 0, cursor: 'pointer',
        boxShadow: '0 20px 50px -20px rgba(5,10,25,0.6)',
        opacity: 0.62, zIndex: 1, transition: 'opacity .25s, transform .25s',
        filter: 'saturate(0.9)',
      }}
      onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '0.62'; }}
    >
      <img src={cupon.imagen} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,10,25,0.9) 0%, rgba(5,10,25,0.35) 55%, rgba(5,10,25,0.1) 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '18px 18px 22px', textAlign: 'left' }}>
        {cupon.badge && <div style={{ fontSize: 20, fontWeight: 900, color: C.yellow, letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8 }}>{cupon.badge}</div>}
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cupon.titulo}</div>
      </div>
    </button>
  );
}

function DetalleItem({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, color: C.ink2, lineHeight: 1.5 }}>
      <span style={{ marginTop: 2 }}><IcoCheck /></span>
      <span>{children}</span>
    </div>
  );
}

// ─── Mini-mapa con un solo punto (la ubicación del cupón) ───
function PuntoMapa({ lat, lng, label }) {
  const mapRef     = useRef(null);
  const leafletRef = useRef(null);
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const L = window.L;
    if (!L) return;
    const map = L.map(mapRef.current, { center: [lat, lng], zoom: 15, zoomControl: true, scrollWheelZoom: false });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, attribution: '&copy; <a href="https://carto.com/">CARTO</a>' }).addTo(map);
    const icon = L.divIcon({
      className: '',
      html: `<div style="background:#2545E6;border:3px solid #fff;border-radius:50%;width:40px;height:40px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(37,69,230,0.45)">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
      </div>`,
      iconSize: [40, 40], iconAnchor: [20, 20],
    });
    L.marker([lat, lng], { icon }).addTo(map).bindTooltip(label || 'Ubicación', { direction: 'top', offset: [0, -22] });
    leafletRef.current = map;
    setTimeout(() => map.invalidateSize(), 120);
    return () => { map.remove(); leafletRef.current = null; };
  }, [lat, lng, label]);
  return <div ref={mapRef} style={{ height: 340, borderRadius: 16, border: `1px solid ${C.line}` }} />;
}

// ─── Ficha central (se remonta por key={idx} → resetea tab/scroll) ─
function CuponCard({ cupon, cupopack, cupones, idx, dir, onClose, onBack }) {
  const [tab, setTab]           = useState('detalles');
  const [mapReady, setMapReady] = useState(false);
  const scrollRef = useRef(null);
  const detRef    = useRef(null);
  const aboRef    = useRef(null);
  const mapRef    = useRef(null);
  const spyLock   = useRef(false);

  const goTab = (key) => {
    setTab(key);
    if (key === 'mapa') setMapReady(true);
    const map = { detalles: detRef, acerca: aboRef, mapa: mapRef };
    const el  = map[key]?.current;
    const cont = scrollRef.current;
    if (el && cont) {
      spyLock.current = true;
      cont.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
      setTimeout(() => { spyLock.current = false; }, 500);
    }
  };

  const onScroll = () => {
    const cont = scrollRef.current;
    if (!cont) return;
    if (mapRef.current && mapRef.current.offsetTop - cont.scrollTop < cont.clientHeight * 0.9) {
      setMapReady(true);
    }
    if (spyLock.current) return;
    const y = cont.scrollTop + 80;
    let active = 'detalles';
    if (aboRef.current && y >= aboRef.current.offsetTop) active = 'acerca';
    if (mapRef.current && y >= mapRef.current.offsetTop) active = 'mapa';
    setTab(active);
  };

  return (
    <div
      className="cupon-card"
      style={{
        position: 'relative', zIndex: 2,
        width: '100%', height: '100%',
        background: '#fff', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        animation: `${dir >= 0 ? 'cuponInR' : 'cuponInL'} .34s cubic-bezier(0.22,1,0.36,1)`,
      }}
    >
      {/* Header */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 18px 12px', borderBottom: `1px solid ${C.line}`, minHeight: 52 }}>
        <button onClick={onBack} aria-label="Volver" style={{ position: 'absolute', left: 18, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px 0 10px', borderRadius: 999, border: `1px solid ${C.line}`, background: '#fff', color: C.ink2, cursor: 'pointer', fontFamily: C.font, fontSize: 13.5, fontWeight: 600 }}
          onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
        ><ChevL s={18} /> Volver</button>

        <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, letterSpacing: '-0.01em' }}>Cupón {idx + 1} de {cupones.length}</div>

        <button onClick={onClose} aria-label="Cerrar" style={{ position: 'absolute', right: 18, flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.line}`, background: '#fff', color: C.ink2, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
        ><IcoClose /></button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, padding: '0 12px', borderBottom: `1px solid ${C.line}`, flexShrink: 0, overflowX: 'auto' }} className="cupon-tabs">
        {TABS.map(t => (
          <button key={t.key} onClick={() => goTab(t.key)}
            style={{
              position: 'relative', background: 'none', border: 'none', cursor: 'pointer',
              padding: '13px 12px', fontSize: 13.5, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? C.primary : C.ink2, whiteSpace: 'nowrap', fontFamily: C.font,
            }}
          >
            {t.label}
            {tab === t.key && <span style={{ position: 'absolute', left: 12, right: 12, bottom: 0, height: 2.5, borderRadius: 3, background: C.primary }} />}
          </button>
        ))}
      </div>

      {/* Contenido scrolleable con las 3 subsecciones */}
      <div ref={scrollRef} onScroll={onScroll} style={{ flex: 1, overflowY: 'auto', position: 'relative' }} className="cupon-scroll">
        <section ref={detRef}>
          <div style={{ position: 'relative', height: 220 }}>
            <img src={cupon.imagen} alt={cupon.titulo} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,10,25,0.6) 0%, transparent 60%)' }} />
            {cupon.badge && (
              <div style={{ position: 'absolute', top: 14, left: 16, background: C.yellow, color: C.ink, padding: '7px 14px', borderRadius: 999, fontSize: 20, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>{cupon.badge}</div>
            )}
            {cupon.localidad && (
              <div style={{ position: 'absolute', bottom: 12, left: 16, display: 'inline-flex', alignItems: 'center', gap: 5, color: '#fff', fontSize: 12, fontWeight: 600 }}>
                <IcoPin /> {cupon.localidad}
              </div>
            )}
          </div>

          <div style={{ padding: '20px 22px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: C.primarySoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: C.primary }}>{cupon.socio?.[0]}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>{cupon.socio}</span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 10px' }}>{cupon.titulo}</h3>
            {cupon.beneficio && <p style={{ fontSize: 14.5, color: C.ink2, lineHeight: 1.6, margin: '0 0 18px' }}>{cupon.beneficio}</p>}

            {cupon.detalles?.length > 0 && (
              <>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Qué incluye</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 20 }}>
                  {cupon.detalles.map((d, i) => <DetalleItem key={i}>{d}</DetalleItem>)}
                </div>
              </>
            )}
          </div>

          {cupon.terminos?.length > 0 && (
            <div style={{ margin: '0 22px 8px', padding: '16px 18px', background: C.bg, borderRadius: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Términos y condiciones del canje</div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {cupon.terminos.map((t, i) => (
                  <li key={i} style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5 }}>{t}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section ref={aboRef} style={{ padding: '22px 22px 8px', borderTop: `1px solid ${C.line}`, marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Acerca de</div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', margin: '0 0 8px' }}>{cupon.socio}</h3>
          {cupon.descripcionSocio && <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.65, margin: '0 0 16px' }}>{cupon.descripcionSocio}</p>}

          {cupon.galeria?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {cupon.galeria.slice(0, 3).map((g, i) => (
                <div key={i} style={{ aspectRatio: '1/1', borderRadius: 12, overflow: 'hidden', background: C.line }}>
                  <img src={g} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section ref={mapRef} style={{ padding: '22px 22px 26px', borderTop: `1px solid ${C.line}`, marginTop: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Mapa</div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Dónde canjear</h3>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, margin: '0 0 16px' }}>
            Ubicación de <strong style={{ color: C.ink2 }}>{cupon.socio}</strong>{cupon.localidad ? ` · ${cupon.localidad}` : ''}.
          </p>
          {mapReady && cupon.lat && cupon.lng ? (
            <PuntoMapa lat={cupon.lat} lng={cupon.lng} label={cupon.socio} />
          ) : (
            <div style={{ height: 320, borderRadius: 16, border: `1px solid ${C.line}`, background: C.bg, display: 'grid', placeItems: 'center', color: C.muted, fontSize: 13 }}>
              {cupon.lat && cupon.lng ? 'Cargando mapa…' : 'Sin ubicación disponible'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// ─── Recuadro del beneficio adicional ──
function BeneficioBox({ texto, icono, tipo, valor, compact = false, dark = false }) {
  const Icon = getBeneficioIcon(icono);
  const detalle = {
    puntos_mult:  valor > 1 ? `Multiplicás tus puntos ×${valor}` : null,
    precio_pct:   valor > 0 ? `${valor}% de descuento en la activación del Cupopack` : null,
    precio_fijo:  valor > 0 ? `$${Number(valor).toLocaleString('es-AR')} de descuento en la activación` : null,
    cupon_regalo: 'Sumás un cupón extra de regalo',
  }[tipo] || null;

  return (
    <div style={{
      display: 'flex', alignItems: compact ? 'flex-start' : 'center', gap: 12,
      background: dark ? 'rgba(255,201,60,0.14)' : 'linear-gradient(90deg, rgba(255,201,60,0.14), rgba(255,201,60,0.05))',
      border: `1px solid rgba(255,201,60,0.4)`, borderRadius: 16, padding: compact ? '14px 16px' : '16px 18px',
    }}>
      <div style={{ width: compact ? 40 : 44, height: compact ? 40 : 44, borderRadius: '50%', background: C.yellow, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon size={compact ? 18 : 22} color={C.ink} strokeWidth={2.4} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: compact ? 9.5 : 10.5, fontWeight: 700, color: dark ? C.yellow : '#B5852A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: compact ? 2 : 3 }}>
          Beneficio adicional
        </div>
        <div style={{ fontSize: compact ? 13.5 : 15, fontWeight: 800, color: dark ? '#fff' : C.ink, lineHeight: 1.25 }}>{texto}</div>
        {detalle && <div style={{ fontSize: 12.5, color: dark ? 'rgba(255,255,255,0.7)' : C.ink2, marginTop: 2 }}>{detalle}</div>}
      </div>
    </div>
  );
}

// ─── Cómo funciona el Cupopack (franja horizontal con miniaturas) ──
const TicketIco = () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4Z"/><path d="M13 6v1M13 11.5v1M13 17v1"/></svg>;
const QrIco = () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3M17 14v3M20 14v.01M14 20v.01M20 20v.01M17 17.5v.01"/></svg>;
const SmileIco = () => <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9.5h.01M15 9.5h.01"/></svg>;

const PASOS = [
  { n: 1, t: 'Comprás el Cupopack', d: 'Pagás una vez y ya es tuya.',            bg: '#FBE7D4', accent: '#C9741F', icon: <TicketIco /> },
  { n: 2, t: 'Escaneás un QR en el lugar',      d: 'El descuento se aplica solo.', bg: '#E2E8FB', accent: '#3B5BE8', icon: <QrIco /> },
  { n: 3, t: '¡A disfrutar!',       d: 'Aprovechás todos los beneficios.',       bg: '#DFF1E8', accent: '#1B9A63', icon: <SmileIco /> },
];
function ComoFunciona() {
  return (
    <div style={{ marginBottom: 30, background: 'linear-gradient(120deg, #FBF3EC 0%, #EEF1FB 52%, #E9F4EF 100%)', borderRadius: 20, padding: '20px 24px' }}>
      <div className="cupon-pasos" style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {PASOS.map((p, i) => (
          <React.Fragment key={p.n}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
              <div style={{ width: 58, height: 58, borderRadius: 16, background: p.bg, color: p.accent, display: 'grid', placeItems: 'center', flexShrink: 0 }}>{p.icon}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: p.accent, letterSpacing: '0.02em', marginBottom: 2 }}>Paso {p.n}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, lineHeight: 1.2, marginBottom: 3 }}>{p.t}</div>
                <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.35 }}>{p.d}</div>
              </div>
            </div>
            {i < 2 && (
              <div className="cupon-paso-arrow" style={{ color: '#C3C8D4', flexShrink: 0, padding: '0 8px' }}><ChevR s={20} /></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Envoltorio de "cupón de regalo" (borde amarillo + chip) ──
function CuponRegaloWrap({ icono, children }) {
  const Icon = getBeneficioIcon(icono);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 22, border: `2px solid ${C.yellow}`, overflow: 'hidden', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', background: 'rgba(255,201,60,0.16)', borderBottom: '1px solid rgba(255,201,60,0.5)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: C.yellow, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon size={16} color={C.ink} strokeWidth={2.6} />
        </div>
        <span style={{ fontSize: 11.5, fontWeight: 900, color: '#8A5A00', letterSpacing: '0.07em' }}>CUPÓN DE REGALO</span>
      </div>
      <div style={{ flex: 1, display: 'flex' }}>{children}</div>
    </div>
  );
}

// ─── Fila de dato del panel checkout (estilo ticket: label izq · valor der) ──
function RailRow({ label, children, tach }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)' }}>{label}</div>
      <div style={{ textAlign: 'right' }}>
        {tach}
        {children}
      </div>
    </div>
  );
}

// ─── Panel checkout (columna derecha) ────────────────────────
function CheckoutRail({ cupopack, cupones, totalAhorro, totalPuntos, puntosTachado, precioFinal, precioTachado }) {
  const fmt = n => `$${Math.round(n).toLocaleString('es-AR')}`;
  const tachSt = { fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' };

  // Dónde impacta el beneficio adicional: 'puntos' | 'precio' | null.
  const afecta = cupopack?.beneficioAdicional ? tipoBeneficio(cupopack.beneficioTipo).afecta : null;
  const beneficioBox = (
    <BeneficioBox
      texto={cupopack?.beneficioAdicional}
      icono={cupopack?.beneficioIcono}
      tipo={cupopack?.beneficioTipo}
      valor={cupopack?.beneficioValor}
      compact
      dark
    />
  );

  return (
    <aside
      className="cupon-rail"
      style={{
        width: 400, flexShrink: 0, background: C.primaryDeep, color: '#fff',
        display: 'flex', flexDirection: 'column', height: '100%',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Encabezado del panel */}
      <div style={{ padding: '26px 30px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ position: 'relative', width: 74, height: 44, marginBottom: 14 }}>
          <img src="/ico-disc.svg" alt="" style={{ width: 44, position: 'absolute', top: 0, left: 0, zIndex: 2 }} />
          <img src="/ico-disc.svg" alt="" style={{ width: 44, position: 'absolute', top: 0, left: 26, zIndex: 1, opacity: 0.55 }} />
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.01em' }}>
          Resumen del Cupopack
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
          {cupones.length} cupones para canjear
        </div>
      </div>

      {/* Cuerpo scrolleable */}
      <div className="cupon-scroll" style={{ flex: 1, overflowY: 'auto', padding: '4px 30px 20px' }}>
        {/* El beneficio de puntos aparece justo antes del conteo */}
        {afecta === 'puntos' && (
          <div style={{ padding: '16px 0 0' }}>{beneficioBox}</div>
        )}

        <RailRow label="Puntos que ganás"
          tach={puntosTachado != null && <div><span style={tachSt}>{puntosTachado.toLocaleString('es-AR')} pts.</span></div>}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, justifyContent: 'flex-end' }}>
            {afecta === 'puntos' && puntosTachado != null && (
              <span style={{ fontSize: 16, fontWeight: 800, color: C.yellow, fontStyle: 'italic' }}>×{cupopack.beneficioValor}</span>
            )}
            <span style={{ fontSize: 21, fontWeight: 400, fontStyle: 'italic', lineHeight: 1 }}>{totalPuntos.toLocaleString('es-AR')}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>pts.</span>
          </div>
        </RailRow>

        <RailRow label="Ahorro estimado">
          <div>
            <span style={{ fontSize: 21, fontWeight: 700, lineHeight: 1 }}>{fmt(totalAhorro)}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginLeft: 6 }}>aprox.</span>
          </div>
        </RailRow>
      </div>

      {/* Pie fijo: precio + CTA */}
      <div style={{ padding: '20px 30px 26px', background: 'rgba(0,0,0,0.18)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        {/* El beneficio sobre el precio aparece junto a la activación */}
        {afecta === 'precio' && (
          <div style={{ marginBottom: 16 }}>{beneficioBox}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Activá los {cupones.length} cupones por</span>
          <div style={{ textAlign: 'right' }}>
            {precioTachado != null && <div style={{ ...tachSt, marginBottom: 2 }}>{fmt(precioTachado)}</div>}
            <div style={{ fontSize: 30, fontWeight: 800, color: C.yellow, lineHeight: 1 }}>{fmt(precioFinal)}</div>
          </div>
        </div>
        <button
          style={{
            width: '100%', padding: '16px', background: C.yellow, color: C.ink, border: 'none',
            borderRadius: 14, fontSize: 16, fontWeight: 800, cursor: 'pointer', transition: 'background .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FFD966'}
          onMouseLeave={e => e.currentTarget.style.background = C.yellow}
        >
          Ir al pago
        </button>
        <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.45)', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.4 }}>
          Estás comprando un Cupopack de descuentos, no los servicios ni productos en sí.
        </p>
      </div>
    </aside>
  );
}

export default function CupopackModal({ cupopack, startIndex = 0, onClose }) {
  const cupones = cupopack?.cupones || [];
  const [view, setView] = useState('grid');  // 'grid' o 'detail'
  const [idx, setIdx] = useState(startIndex);
  const [dir, setDir] = useState(0);

  const go = useCallback((d) => {
    setIdx(prev => {
      const next = clamp(prev + d, 0, cupones.length - 1);
      if (next !== prev) setDir(d);
      return next;
    });
  }, [cupones.length]);

  const totalPrecio = cupones.reduce((sum, c) => {
    const precio = c.precio_activacion || c.precioDe || parseFloat(c.precio) || 0;
    return sum + precio;
  }, 0);
  const totalAhorro = cupones.reduce((sum, c) => sum + (Number(c.ahorro_estimado) || 0), 0);
  const puntosBase = calcPts(totalAhorro);

  const { puntos: totalPuntos, precio: precioFinal, puntosTachado, precioTachado } =
    aplicarBeneficioCupopack({
      tipo: cupopack?.beneficioTipo,
      valor: cupopack?.beneficioValor,
      puntosBase,
      precioBase: totalPrecio,
    });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      else if (view === 'detail') {
        if (e.key === 'ArrowRight') go(1);
        else if (e.key === 'ArrowLeft') go(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; };
  }, [go, onClose, view]);

  const cupon = cupones[idx];
  const portada = cupopack?.images?.[0];
  // Si el beneficio regala un cupón, marcamos el último como "de regalo".
  const regaloIdx = cupopack?.beneficioTipo === 'cupon_regalo' ? cupones.length - 1 : -1;

  const overlay = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: '#fff', fontFamily: C.font }}>
      {view === 'grid' ? (
        // ─── Vista de entrada: pantalla completa, dos columnas ───
        <div className="cupon-fullscreen" style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          {/* Columna izquierda: identidad + título + grilla */}
          <div className="cupon-main" style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
            {/* Cabecera con identidad Cuponear */}
            <header
              style={{
                position: 'relative', overflow: 'hidden', flexShrink: 0,
                padding: '24px 44px 44px',
                background: `linear-gradient(120deg, ${C.primaryDeep} 0%, ${C.primary} 100%)`,
                color: '#fff',
              }}
            >
              {/* Portada difuminada de fondo */}
              {portada && (
                <>
                  <img src={portada} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                  <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(120deg, rgba(11,16,32,0.9) 0%, rgba(27,38,93,0.62) 58%, rgba(37,69,230,0.42) 100%)` }} />
                </>
              )}

              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 22 }}>
                  {/* Logo + chip del Cupopack, juntos a la izquierda */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', minWidth: 0 }}>
                    <button onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <img src="/logo-cuponear-wh.svg" alt="Cuponear" style={{ height: 41, width: 'auto', transition: 'opacity .15s' }} onMouseEnter={e => { e.currentTarget.style.opacity = '0.7'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }} />
                    </button>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,201,60,0.18)', border: '1px solid rgba(255,201,60,0.4)', color: C.yellow, padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                      Cupopack · {cupones.length} cupones
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button aria-label="Compartir" style={railIconBtn}><Share size={18} /></button>
                    <button aria-label="Favorito" style={railIconBtn}><Heart size={18} /></button>
                  </div>
                </div>

                <h1 className="cupon-title" style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 12px', maxWidth: '16ch' }}>
                  {cupopack?.title}
                </h1>
                <p style={{ fontSize: 15.5, color: 'rgba(255,255,255,0.82)', lineHeight: 1.55, margin: 0, maxWidth: '52ch' }}>
                  {cupopack?.subtitle}
                </p>
              </div>
            </header>

            {/* Grilla de cupones */}
            <div style={{ padding: '28px 44px 44px', flexShrink: 0 }}>
              {/* Cómo funciona: 3 pasos, compacto */}
              <ComoFunciona />

              <h2 style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
                Cupones que incluye
              </h2>

              <div className="cupon-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20 }}>
                {cupones.map((c, i) => {
                  const card = (
                    <OfertaCard
                      promo={cuponAPromo(c)}
                      onOpen={() => { setIdx(i); setView('detail'); }}
                      hidePrecio hideAgregar hideHeart
                    />
                  );
                  return i === regaloIdx
                    ? <CuponRegaloWrap key={c.id} icono={cupopack?.beneficioIcono}>{card}</CuponRegaloWrap>
                    : <React.Fragment key={c.id}>{card}</React.Fragment>;
                })}
              </div>
            </div>
          </div>

          {/* Columna derecha: checkout */}
          <CheckoutRail
            cupopack={cupopack} cupones={cupones}
            totalAhorro={totalAhorro} totalPuntos={totalPuntos}
            puntosTachado={puntosTachado} precioFinal={precioFinal} precioTachado={precioTachado}
          />

          {/* Cerrar (fijo, arriba a la derecha absoluto) */}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              position: 'fixed', top: 20, right: 20, zIndex: 20,
              width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(11,16,32,0.55)', backdropFilter: 'blur(6px)', color: '#fff',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}
          ><IcoClose /></button>
        </div>
      ) : (
        // ─── Vista Detail: detalle de cupón (idéntica al original) ───
        <div
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0, background: 'rgba(5,10,25,0.72)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="cupon-stage"
            style={{ position: 'relative', width: '100%', maxWidth: 640, height: '86vh', maxHeight: 780, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {idx > 0 && <SideCover cupon={cupones[idx - 1]} side="left" onClick={() => go(-1)} />}
            {idx < cupones.length - 1 && <SideCover cupon={cupones[idx + 1]} side="right" onClick={() => go(1)} />}

            <div style={{
              position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
              background: '#fff', borderRadius: 24, overflow: 'hidden',
              boxShadow: '0 40px 90px -30px rgba(5,10,25,0.7), 0 0 0 1px rgba(255,255,255,0.14)',
            }}>
              <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
                <CuponCard
                  key={idx}
                  cupon={cupon}
                  cupopack={cupopack}
                  cupones={cupones}
                  idx={idx}
                  dir={dir}
                  onClose={onClose}
                  onBack={() => setView('grid')}
                />
              </div>
            </div>

            <button
              onClick={e => { e.stopPropagation(); go(-1); }}
              disabled={idx === 0}
              className="cupon-nav-arrow"
              style={{ ...arrowSt, left: -75, opacity: idx === 0 ? 0.3 : 1, pointerEvents: idx === 0 ? 'none' : 'auto', cursor: idx === 0 ? 'default' : 'pointer' }}
              aria-label="Anterior"
            ><ChevL /></button>
            <button
              onClick={e => { e.stopPropagation(); go(1); }}
              disabled={idx === cupones.length - 1}
              className="cupon-nav-arrow"
              style={{ ...arrowSt, right: -75, opacity: idx === cupones.length - 1 ? 0.3 : 1, pointerEvents: idx === cupones.length - 1 ? 'none' : 'auto', cursor: idx === cupones.length - 1 ? 'default' : 'pointer' }}
              aria-label="Siguiente"
            ><ChevR /></button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes cuponInR { from { opacity: 0; transform: translateX(40px) scale(0.97); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes cuponInL { from { opacity: 0; transform: translateX(-40px) scale(0.97); } to { opacity: 1; transform: translateX(0) scale(1); } }
        .cupon-scroll::-webkit-scrollbar { width: 8px; }
        .cupon-scroll::-webkit-scrollbar-thumb { background: rgba(120,130,150,0.35); border-radius: 8px; }
        .cupon-tabs::-webkit-scrollbar { display: none; }
        @media (max-width: 1024px) {
          .cupon-fullscreen { flex-direction: column !important; }
          .cupon-main { overflow-y: visible !important; }
          .cupon-rail { width: 100% !important; height: auto !important; border-left: none !important; border-top: 1px solid rgba(255,255,255,0.1) !important; }
          .cupon-fullscreen { overflow-y: auto; }
        }
        @media (max-width: 860px) {
          .cupon-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
        @media (max-width: 720px) {
          .cupon-title { font-size: 32px !important; }
          .cupon-pasos { flex-direction: column !important; align-items: stretch !important; gap: 16px !important; }
          .cupon-paso-arrow { display: none !important; }
          .cupon-sidecover { display: none !important; }
          .cupon-nav-arrow { width: 40px !important; height: 40px !important; }
        }
        @media (max-width: 520px) {
          .cupon-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );

  return createPortal(overlay, document.body);
}

const railIconBtn = {
  width: 38, height: 38, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.28)',
  background: 'rgba(255,255,255,0.12)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer',
};

const arrowSt = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  zIndex: 5, width: 52, height: 52, borderRadius: '50%',
  background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.25)', color: '#fff',
  display: 'grid', placeItems: 'center', cursor: 'pointer',
  transition: 'background .15s',
};
