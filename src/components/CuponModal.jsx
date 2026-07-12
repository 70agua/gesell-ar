// ============================================================
//  src/components/CuponModal.jsx
//  Ficha de un cupón dentro de una cuponera prediseñada.
//  - Coverflow tipo iTunes: fichas laterales asoman a los costados.
//  - Flechas anterior/siguiente (solo ícono) para recorrer los cupones.
//  - Tab bar: Detalles del cupón · Acerca de · Mapa (scroll a subsección).
//  - Mapa reutiliza <MapView/> con todos los servicios de ESA cuponera.
//  - Responsive: en mobile la ficha ocupa casi todo el ancho.
// ============================================================
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getBeneficioIcon } from '../lib/beneficioIconos';
import { aplicarBeneficioCuponera } from '../lib/beneficiosCuponera';

const C = {
  ink:      '#0B1020',
  ink2:     '#3D4255',
  muted:    '#6B7280',
  line:     '#E7E9EE',
  primary:  '#2545E6',
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
function CuponCard({ cupon, cuponera, cupones, idx, dir, onClose, onBack }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px 12px', borderBottom: `1px solid ${C.line}` }}>
        <button onClick={onBack} aria-label="Volver" style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px 0 10px', borderRadius: 999, border: `1px solid ${C.line}`, background: '#fff', color: C.ink2, cursor: 'pointer', fontFamily: C.font, fontSize: 13.5, fontWeight: 600 }}
          onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
        ><ChevL s={18} /> Volver</button>
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.ink, letterSpacing: '-0.01em' }}>Cupón {idx + 1} de {cupones.length}</div>
        </div>
        <button onClick={onClose} aria-label="Cerrar" style={{ flexShrink: 0, width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.line}`, background: '#fff', color: C.ink2, display: 'grid', placeItems: 'center', cursor: 'pointer' }}
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

        {/* ── Detalles del cupón ── */}
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

        {/* ── Acerca de (el socio) ── */}
        <section ref={aboRef} style={{ padding: '22px 22px 8px', borderTop: `1px solid ${C.line}`, marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Acerca de</div>
          <h3 style={{ fontSize: 19, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', margin: '0 0 8px' }}>{cupon.socio}</h3>
          {cupon.descripcionSocio && <p style={{ fontSize: 14, color: C.ink2, lineHeight: 1.65, margin: '0 0 16px' }}>{cupon.descripcionSocio}</p>}

          {/* Minigalería */}
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

        {/* ── Mapa ── */}
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

// ─── Footer tipo checkout (compartido por grid y detail) ──────
// ─── Recuadro del beneficio adicional ──
function BeneficioBox({ texto, icono, tipo, valor, compact = false }) {
  const Icon = getBeneficioIcon(icono);
  const detalle = {
    puntos_mult:  valor > 1 ? `Multiplicás tus puntos ×${valor}` : null,
    precio_pct:   valor > 0 ? `${valor}% de descuento en la activación de la cuponera` : null,
    precio_fijo:  valor > 0 ? `$${Number(valor).toLocaleString('es-AR')} de descuento en la activación` : null,
    cupon_regalo: 'Sumás un cupón extra de regalo',
  }[tipo] || null;

  return (
    <div style={{
      display: 'flex', alignItems: compact ? 'flex-start' : 'center', gap: 12,
      background: 'linear-gradient(90deg, rgba(255,201,60,0.14), rgba(255,201,60,0.05))',
      border: `1px solid rgba(255,201,60,0.4)`, borderRadius: 16, padding: compact ? '14px 16px' : '16px 18px',
    }}>
      <div style={{ width: compact ? 40 : 44, height: compact ? 40 : 44, borderRadius: '50%', background: C.yellow, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon size={compact ? 18 : 22} color={C.ink} strokeWidth={2.4} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: compact ? 9.5 : 10.5, fontWeight: 700, color: '#B5852A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: compact ? 2 : 3 }}>
          Beneficio
        </div>
        <div style={{ fontSize: compact ? 13.5 : 15, fontWeight: 800, color: C.ink, lineHeight: 1.25 }}>{texto}</div>
        {!compact && detalle && <div style={{ fontSize: 12.5, color: C.ink2, marginTop: 2 }}>{detalle}</div>}
      </div>
    </div>
  );
}

function FooterCheckout({ totalPrecio, totalAhorro, totalPuntos, puntosTachado, precioTachado, precioFinal, padX = 24 }) {
  const fmt = n => `$${Math.round(n).toLocaleString('es-AR')}`;
  const lblSt = { fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 };
  const valSt = { fontSize: 22, fontWeight: 800, lineHeight: 1.05, color: '#fff' };
  const valPrecioSt = { fontSize: 22, fontWeight: 800, lineHeight: 1.05, color: C.yellow };
  const sufSt = { fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)' };
  const tachSt = { fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through', lineHeight: 1 };
  const divisor = <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(255,255,255,0.15)' }} />;
  return (
    <div style={{
      background: '#050A19', padding: `20px ${padX}px 18px`,
      borderTop: '1px solid rgba(255,255,255,0.1)',
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Fila: 4 columnas centradas */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* 1 · Puntos a obtener */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: '0 1 auto' }}>
          <div style={lblSt}>Puntos a obtener</div>
          {puntosTachado != null && (
            <div style={{ marginBottom: 3 }}><span style={tachSt}>{puntosTachado.toLocaleString('es-AR')}</span> <span style={{ ...tachSt, textDecoration: 'none' }}>pts.</span></div>
          )}
          <div style={valSt}>
            {totalPuntos.toLocaleString('es-AR')} <span style={sufSt}>pts.</span>
          </div>
        </div>
        {divisor}
        {/* 2 · Ahorro estimado */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: '0 1 auto' }}>
          <div style={lblSt}>Ahorro estimado</div>
          <div style={valSt}>
            {fmt(totalAhorro)} <span style={sufSt}>aprox.</span>
          </div>
        </div>
        {divisor}
        {/* 3 · Activá la cuponera con */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: '0 1 auto' }}>
          <div style={lblSt}>Activá la cuponera con</div>
          {precioTachado != null && (
            <div style={{ marginBottom: 3 }}><span style={tachSt}>{fmt(precioTachado)}</span></div>
          )}
          <div style={valPrecioSt}>{fmt(precioFinal)}</div>
        </div>

        {/* 4 · CTA */}
        <button
          style={{
            alignSelf: 'center', flexShrink: 0,
            padding: '14px 34px', background: C.yellow, color: C.ink, border: 'none',
            borderRadius: 12, fontSize: 14.5, fontWeight: 800, cursor: 'pointer',
            transition: 'background .15s', whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FFD966'}
          onMouseLeave={e => e.currentTarget.style.background = C.yellow}
        >
          Ir al pago
        </button>
      </div>

      {/* Leyenda en una sola línea, centrada */}
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Estás comprando una cuponera de descuentos, no los servicios ni productos en sí.
      </div>
    </div>
  );
}

export default function CuponModal({ cuponera, startIndex = 0, onClose }) {
  const cupones = cuponera?.cupones || [];
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

  // Calcular totales base
  const totalPrecio = cupones.reduce((sum, c) => {
    const precio = c.precio_activacion || c.precioDe || parseFloat(c.precio) || 0;
    return sum + precio;
  }, 0);
  const totalAhorro = cupones.reduce((sum, c) => sum + (Number(c.ahorro_estimado) || 0), 0);
  const puntosBase = calcPts(totalAhorro);

  // Aplicar el beneficio adicional estructurado de la cuponera
  const { puntos: totalPuntos, precio: precioFinal, puntosTachado, precioTachado } =
    aplicarBeneficioCuponera({
      tipo: cuponera?.beneficioTipo,
      valor: cuponera?.beneficioValor,
      puntosBase,
      precioBase: totalPrecio,
    });

  // Teclado + bloqueo de scroll de fondo
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

  const overlay = (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 4000,
        background: 'rgba(5,10,25,0.72)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: C.font,
      }}
    >
      {view === 'grid' ? (
        // ─── Vista Grid: listado de cupones ───
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'relative', width: '100%', maxWidth: 900,
            maxHeight: '90vh',
            display: 'flex', flexDirection: 'column', gap: 0,
            background: '#fff', borderRadius: 24, overflow: 'hidden',
            boxShadow: '0 40px 90px -30px rgba(5,10,25,0.7), 0 0 0 1px rgba(255,255,255,0.14)',
          }}
        >
          {/* Header */}
          <div style={{ padding: 32, paddingBottom: 20, borderBottom: `1px solid ${C.line}` }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.ink, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{cuponera?.title}</h2>
            <p style={{ fontSize: 14, color: C.muted, margin: 0 }}>{cuponera?.subtitle}</p>
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: 20, right: 20,
                width: 36, height: 36, borderRadius: '50%', border: `1px solid ${C.line}`,
                background: '#fff', color: C.ink2, display: 'grid', placeItems: 'center', cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = C.bg}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            ><IcoClose /></button>
          </div>

          {/* Grid de minifíchas */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 32px' }}>
            {/* Beneficio adicional (justo antes de los cupones) */}
            {cuponera?.beneficioAdicional && (
              <div style={{ marginBottom: 24 }}>
                <BeneficioBox
                  texto={cuponera.beneficioAdicional}
                  icono={cuponera.beneficioIcono}
                  tipo={cuponera.beneficioTipo}
                  valor={cuponera.beneficioValor}
                  compact={false}
                />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>
              {cupones.map((c, i) => {
                const pts = calcPts(c.ahorro_estimado);
                return (
                  <button
                    key={c.id}
                    onClick={() => { setIdx(i); setView('detail'); }}
                    style={{
                      position: 'relative', border: `1px solid ${C.line}`, borderRadius: 16, overflow: 'hidden',
                      width: '100%', cursor: 'pointer',
                      background: '#fff', padding: 0, transition: 'transform .15s, box-shadow .15s',
                      display: 'flex', flexDirection: 'column', textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(5,10,25,0.12)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                  >
                    {/* Header con socio + avatar */}
                    <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8, background: '#fff' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: C.primarySoft, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: C.primary }}>{c.socio?.[0]}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: C.ink, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>
                          {c.socio}
                        </div>
                        <div style={{ fontSize: 10.5, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.localidad}
                        </div>
                      </div>
                    </div>

                    {/* Foto con badge */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: C.bg, overflow: 'hidden' }}>
                      <img src={c.imagen} alt={c.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {c.badge && (
                        <div style={{ position: 'absolute', bottom: 8, left: 8, background: C.yellow, color: C.ink, padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, lineHeight: 1 }}>
                          {c.badge}
                        </div>
                      )}
                    </div>

                    {/* Info - Título + ahorro/puntos */}
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.titulo}
                      </div>
                      {c.ahorro_estimado > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <span style={{ fontSize: 10.5, color: C.ink2, fontWeight: 600 }}>
                            Ahorrás AR${Number(c.ahorro_estimado).toLocaleString('es-AR')} aprox.
                          </span>
                          {pts > 0 && (
                            <span style={{ fontSize: 10.5, color: C.ink2, fontWeight: 600 }}>
                              Ganás {pts.toLocaleString('es-AR')} pts.
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer (dentro del modal, sticky) */}
          <div style={{ position: 'sticky', bottom: 0 }}>
            <FooterCheckout
              totalPrecio={totalPrecio} totalAhorro={totalAhorro} totalPuntos={totalPuntos}
              puntosTachado={puntosTachado} precioTachado={precioTachado} precioFinal={precioFinal}
              padX={32}
            />
          </div>
        </div>
      ) : (
        // ─── Vista Detail: detalle de cupón ───
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
            {/* Card scrolleable */}
            <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
              <CuponCard
                key={idx}
                cupon={cupon}
                cuponera={cuponera}
                cupones={cupones}
                idx={idx}
                dir={dir}
                onClose={onClose}
                onBack={() => setView('grid')}
              />
            </div>
          </div>

          {/* Flechas — FUERA del modal, a los costados */}
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
      )}

      <style>{`
        @keyframes cuponInR { from { opacity: 0; transform: translateX(40px) scale(0.97); } to { opacity: 1; transform: translateX(0) scale(1); } }
        @keyframes cuponInL { from { opacity: 0; transform: translateX(-40px) scale(0.97); } to { opacity: 1; transform: translateX(0) scale(1); } }
        .cupon-scroll::-webkit-scrollbar { width: 8px; }
        .cupon-scroll::-webkit-scrollbar-thumb { background: ${C.line}; border-radius: 8px; }
        .cupon-tabs::-webkit-scrollbar { display: none; }
        @media (max-width: 720px) {
          .cupon-sidecover { display: none !important; }
          .cupon-nav-arrow { width: 40px !important; height: 40px !important; }
        }
      `}</style>
    </div>
  );

  return createPortal(overlay, document.body);
}

const arrowSt = {
  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
  zIndex: 5, width: 52, height: 52, borderRadius: '50%',
  background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.25)', color: '#fff',
  display: 'grid', placeItems: 'center', cursor: 'pointer',
  transition: 'background .15s',
};
