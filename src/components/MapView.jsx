// ============================================================
//  src/components/MapView.jsx
//  Mapa urbano interactivo con Leaflet nativo + galería sincronizada
// ============================================================
import React, { useEffect, useRef, useState, useCallback } from 'react';

const C = {
  primary:  '#2545E6',
  green:    '#10A36B',
  ink:      '#0B1020',
  ink2:     '#3D4255',
  muted:    '#6B7280',
  line:     '#E7E9EE',
  bg:       '#F7F7F8',
  yellow:   '#FFC93C',
};

// ─── Marcador divIcon ────────────────────────────────────────
function makeMarkerHtml(promo, active) {
  const badge  = promo.badge || '';
  const ahorro = promo.ahorroEstimado > 0
    ? `Ahorrás ~$${promo.ahorroEstimado.toLocaleString('es-AR')}`
    : '';
  const label  = [badge, ahorro].filter(Boolean).join(' · ') || 'Promo';
  const bg     = active ? C.primary : '#fff';
  const color  = active ? '#fff' : C.ink;
  const border = active ? C.primary : C.line;
  const scale  = active ? 'scale(1.12)' : 'scale(1)';
  const shadow = active
    ? '0 4px 16px rgba(37,69,230,0.45)'
    : '0 2px 8px rgba(11,16,32,0.18)';
  const iconColor = active ? '#fff' : C.primary;

  return `
    <div style="
      display:inline-flex; align-items:center; gap:5px;
      background:${bg}; color:${color};
      border:2px solid ${border};
      border-radius:999px; padding:5px 10px 5px 8px;
      font-size:11px; font-weight:700; white-space:nowrap;
      font-family:system-ui,sans-serif;
      box-shadow:${shadow};
      transform:${scale};
      transition:all .2s;
    ">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="${iconColor}" style="transform:rotate(-45deg);flex-shrink:0;">
        <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/>
      </svg>
      ${label}
    </div>`;
}

// ─── Minificha (card en panel lateral / bottom-sheet) ────────
function PromoCard({ promo, active, onClick, onAdd, innerRef }) {
  return (
    <div
      ref={innerRef}
      onClick={onClick}
      style={{
        borderRadius: 14, overflow: 'hidden', cursor: 'pointer', background: '#fff',
        border: `2px solid ${active ? C.primary : C.line}`,
        boxShadow: active ? '0 4px 16px rgba(37,69,230,0.14)' : 'none',
        transition: 'border-color .2s, box-shadow .2s',
        flexShrink: 0,
      }}
    >
      {/* Foto */}
      <div style={{ position: 'relative', height: 120 }}>
        <img
          src={promo.image || promo.imagen_url}
          alt={promo.title || promo.titulo}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(11,16,32,0.6) 0%,transparent 55%)' }} />
        {promo.badge && (
          <div style={{ position: 'absolute', bottom: 8, left: 12, color: '#fff', fontSize: 22, fontWeight: 900, letterSpacing: '-0.03em' }}>
            {promo.badge}
          </div>
        )}
      </div>
      {/* Body */}
      <div style={{ padding: '10px 12px 12px' }}>
        {promo.negocioLocalidad && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginBottom: 3 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/>
            </svg>
            <span style={{ color: C.primary, fontWeight: 600 }}>{promo.negocioLocalidad}</span>
            {promo.proveedorNombre && <span style={{ color: C.muted }}> · {promo.proveedorNombre}</span>}
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 700, color: C.green, lineHeight: 1.3, marginBottom: 8 }}>
          {promo.title || promo.titulo}
        </div>
        {/* Cajita */}
        <div style={{ border: `1px solid ${C.line}`, borderRadius: 8, overflow: 'hidden', fontSize: 10, marginBottom: 8 }}>
          {promo.ahorroEstimado > 0 && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 8px' }}>
              <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.muted }}>Ahorro est.</span>
              <span style={{ fontWeight: 700, color: C.green }}>~${promo.ahorroEstimado.toLocaleString('es-AR')} aprox.</span>
            </div>
            <div style={{ height: 1, background: C.line }} />
          </>}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px' }}>
            <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.muted }}>Lo activás con</span>
            {promo.tokens_costo != null
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontWeight: 700, color: C.ink }}>
                  <CoinSVGSmall /> {promo.tokens_costo} crédito{promo.tokens_costo !== 1 ? 's' : ''}
                </span>
              : <span style={{ color: C.primary, fontWeight: 600 }}>Consultá</span>
            }
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onAdd(promo); }}
          style={{
            width: '100%', background: C.primary, color: '#fff',
            border: 'none', borderRadius: 8, padding: '7px 0',
            fontSize: 11, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/>
            <path d="M13 6v12" strokeDasharray="2 3"/>
          </svg>
          Agregar a cuponera
        </button>
      </div>
    </div>
  );
}

function CoinSVGSmall() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="9.25" fill="#FFC93C" stroke="#C8990A" strokeWidth="1.5"/>
    </svg>
  );
}

// ─── Componente principal MapView ────────────────────────────
export default function MapView({ promos = [], center, hotelName = '', onAddCupon }) {
  const mapRef      = useRef(null);   // div DOM
  const leafletRef  = useRef(null);   // instancia L.Map
  const markersRef  = useRef({});     // { id → L.marker }
  const [activeId, setActiveId]     = useState(null);
  const [sheetPromo, setSheetPromo] = useState(null); // mobile bottom-sheet
  const cardRefs    = useRef({});
  const panelRef    = useRef(null);

  // ── Inicializar mapa ────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: center || [-37.2636, -56.9769],
      zoom: 15,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    // CartoDB Voyager: colores naturales (arena, verde, agua azul) sin filtros
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    // ── Marcador del alojamiento con ícono de camita ──────────
    const hotelCoords = center || [-37.2636, -56.9769];
    const hotelIcon = L.divIcon({
      className: '',
      html: `<div style="
        background:#2545E6; border:3px solid #fff;
        border-radius:50%; width:44px; height:44px;
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 4px 16px rgba(37,69,230,0.45);
      ">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z"/>
          <path d="M9 21V12h6v9"/>
        </svg>
      </div>`,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    L.marker(hotelCoords, { icon: hotelIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindTooltip(hotelName || 'Alojamiento', {
        permanent: false,
        direction: 'top',
        offset: [0, -26],
        className: '',
      });

    leafletRef.current = map;
    return () => { map.remove(); leafletRef.current = null; };
  }, []);

  // ── Actualizar marcadores cuando cambian promos o activeId ──
  useEffect(() => {
    const L = window.L;
    const map = leafletRef.current;
    if (!L || !map) return;

    // Limpiar marcadores anteriores
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    promos.forEach(p => {
      if (!p.lat || !p.lng) return;
      const isActive = activeId === p.id;
      const icon = L.divIcon({
        className: '',
        html: makeMarkerHtml(p, isActive),
        iconAnchor: [0, 0],
      });
      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .on('click', () => handleMarkerClick(p));
      markersRef.current[p.id] = marker;
    });
  }, [promos, activeId]);

  // ── Click en marcador → scroll a card + activar ─────────────
  const handleMarkerClick = useCallback((p) => {
    setActiveId(p.id);
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      setSheetPromo(p);
    } else {
      setTimeout(() => {
        cardRefs.current[p.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 50);
    }
  }, []);

  // ── Click en card → paneo suave del mapa ───────────────────
  const handleCardClick = useCallback((p) => {
    setActiveId(p.id);
    const map = leafletRef.current;
    if (map && p.lat && p.lng) {
      map.setView([p.lat, p.lng], 15, { animate: true, duration: 0.5 });
    }
  }, []);

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative' }}>

      {/* ── Panel lateral (desktop) ──────────────────────────── */}
      <div
        ref={panelRef}
        className="zona-panel"
        style={{
          width: 300, flexShrink: 0,
          display: 'none',            // override con .zona-panel en CSS
          flexDirection: 'column',
          gap: 10,
          maxHeight: 460,
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        {promos.map(p => (
          <PromoCard
            key={p.id}
            promo={p}
            active={activeId === p.id}
            onClick={() => handleCardClick(p)}
            onAdd={onAddCupon}
            innerRef={el => { cardRefs.current[p.id] = el; }}
          />
        ))}
      </div>

      {/* ── Mapa ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
        <div
          ref={mapRef}
          style={{ height: 460, borderRadius: 16, border: `1px solid ${C.line}` }}
        />
      </div>

      {/* ── Bottom-sheet mobile ──────────────────────────────── */}
      {sheetPromo && (
        <div
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 2000,
            background: '#fff', borderRadius: '18px 18px 0 0',
            boxShadow: '0 -8px 40px rgba(11,16,32,0.18)',
            padding: '12px 16px 24px',
            animation: 'slideUp .25s ease',
          }}
          className="lg:hidden"
        >
          <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
          {/* Handle */}
          <div style={{ width: 36, height: 4, borderRadius: 2, background: C.line, margin: '0 auto 14px' }} />
          {/* Cerrar */}
          <button
            onClick={() => setSheetPromo(null)}
            style={{ position: 'absolute', top: 14, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 20, lineHeight: 1 }}
          >✕</button>
          <PromoCard
            promo={sheetPromo}
            active={true}
            onClick={() => {}}
            onAdd={p => { onAddCupon(p); setSheetPromo(null); }}
          />
        </div>
      )}
    </div>
  );
}
