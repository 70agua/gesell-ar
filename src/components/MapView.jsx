// ============================================================
//  src/components/MapView.jsx
//  Mapa urbano interactivo con Leaflet nativo + galería sincronizada
// ============================================================
import React, { useEffect, useRef, useState, useCallback } from 'react';
import InfoTooltip, { CreditTooltip } from './InfoTooltip';
import HeartButton from './HeartButton';
import { precioActivacionARS, creditosActivacion } from '../lib/cobros';

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
  const socio  = promo.proveedorNombre || '';
  const label  = [badge, socio].filter(Boolean).join(' · ') || 'Promo';
  const bg     = active ? C.primary : '#fff';
  const color  = active ? '#fff' : C.ink;
  const border = active ? C.primary : C.line;
  const scale  = active ? 'scale(1.12)' : 'scale(1)';
  const shadow = active
    ? '0 4px 16px rgba(37,69,230,0.45)'
    : '0 2px 8px rgba(11,16,32,0.18)';

  const iconFill  = active ? '#fff' : C.primary;
  const badgeCol  = active ? '#fff' : C.primary;
  const socioCol  = active ? 'rgba(255,255,255,0.82)' : '#3D4255';
  const sepCol    = active ? 'rgba(255,255,255,0.45)' : '#9CA3AF';
  const badgeHtml = badge ? `<span style="color:${badgeCol};font-weight:800;">${badge}</span>` : '';
  const socioHtml = socio ? `<span style="color:${socioCol};font-weight:600;">${socio}</span>` : '';
  const sep       = badge && socio ? `<span style="color:${sepCol}"> · </span>` : '';
  const innerHtml = (badgeHtml + sep + socioHtml) || '<span>Promo</span>';

  return `
    <div style="
      display:inline-flex; align-items:center; gap:6px;
      background:${bg};
      border:2px solid ${border};
      border-radius:999px; padding:5px 11px 5px 8px;
      font-size:11px; white-space:nowrap;
      font-family:system-ui,sans-serif;
      box-shadow:${shadow};
      transform:${scale};
      transition:all .2s;
    ">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="${iconFill}" style="flex-shrink:0;transform:rotate(-45deg);">
        <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/>
      </svg>
      ${innerHtml}
    </div>`;
}

// ─── Minificha mapa — mínima expresión ──────────────────────
function PromoCard({ promo, active, onClick, onAdd, onOpenOferta, innerRef }) {
  const titulo = promo.title || promo.titulo;
  const creds  = creditosActivacion({ ahorro: promo.ahorroEstimado, tokensCosto: promo.tokens_costo });
  const precioCreditos = promo.tokens_precio != null
    ? `$${Math.round(promo.tokens_precio * 1.21).toLocaleString('es-AR')}`
    : (promo.ahorroEstimado > 0 || promo.tokens_costo != null)
    ? `$${precioActivacionARS({ ahorro: promo.ahorroEstimado, tokensCosto: promo.tokens_costo }).toLocaleString('es-AR')}`
    : null;

  return (
    <div
      ref={innerRef}
      onClick={onClick}
      style={{
        borderRadius: 14, cursor: 'pointer', background: '#fff',
        border: `2px solid ${active ? C.primary : C.line}`,
        boxShadow: active ? '0 4px 16px rgba(37,69,230,0.14)' : 'none',
        transition: 'border-color .2s, box-shadow .2s',
        flexShrink: 0, width: 260,
        display: 'flex', flexDirection: 'column',
        padding: '13px 14px 12px',
        gap: 10, position: 'relative',
      }}
    >
      {/* Favorito */}
      <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 2 }}>
        <HeartButton id={promo.id} size={28} light />
      </div>

      {/* Badge + título */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, paddingRight: 32 }}>
        {promo.badge && (
          <div style={{ display: 'inline-flex' }}>
            <div style={{
              background: C.green, color: '#fff', borderRadius: 10,
              padding: '6px 10px', fontSize: 15, fontWeight: 900,
              letterSpacing: '-0.03em', lineHeight: 1,
              whiteSpace: 'nowrap',
            }}>{promo.badge}</div>
          </div>
        )}
        <div style={{ fontSize: 14, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>
          {titulo}
        </div>
      </div>

      {/* Socio — solo nombre + avatar */}
      {promo.proveedorNombre && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: -4 }}>
          {promo.proveedorImage
            ? <img src={promo.proveedorImage} alt="" style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{promo.proveedorNombre[0]}</span>
              </div>
          }
          <span style={{ fontSize: 11, fontWeight: 600, color: C.ink2 }}>{promo.proveedorNombre}</span>
        </div>
      )}


      {/* Botón Ver oferta */}
      <button
        onClick={e => { e.stopPropagation(); onOpenOferta ? onOpenOferta(promo) : onClick?.(); }}
        style={{
          width: '100%', background: '#fff', color: C.ink,
          border: `1px solid ${C.line}`, borderRadius: 10, padding: '9px 0',
          fontSize: 13, fontWeight: 700, cursor: 'pointer',
          transition: 'border-color .13s, color .13s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.ink; }}
      >
        Ver oferta
      </button>

      {/* Activalo con — debajo del CTA */}
      {(promo.ahorroEstimado > 0 || promo.tokens_costo != null) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4 }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Activalo con</span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: C.ink }}>
              <CoinSVGSmall />
              {creds} crédito{creds !== 1 ? 's' : ''}
            </span>
            {precioCreditos && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 400, color: C.muted }}>
                ({precioCreditos})<CreditTooltip />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CoinSVGSmall() {
  return <img src="/credito-coin.svg" alt="crédito" width="11" height="11" style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0 }}/>;
}

// ─── Componente principal MapView ────────────────────────────
export default function MapView({ promos = [], center, hotelName = '', onAddCupon, onOpenOferta }) {
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
            onOpenOferta={onOpenOferta}
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
            onOpenOferta={onOpenOferta}
          />
        </div>
      )}
    </div>
  );
}
