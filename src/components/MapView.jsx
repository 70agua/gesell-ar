// ============================================================
//  src/components/MapView.jsx
//  Mapa urbano interactivo con Leaflet nativo.
//
//  Desde 2026-08-13 el mapa va DENTRO de la columna central de la ficha de
//  socio y no en una sección aparte a todo el ancho. Ahí no entraba la
//  columna de microfichas que tenía al costado, así que se fue: quedó sólo el
//  mapa, y la ficha de la oferta aparece sobre él al tocar el pin.
//
//  Esa ficha usa el mismo formato que la fila cerrada del acordeón de ofertas
//  (OfertaFila): thumb 16:9, badge, título y aclaración. No es una tercera
//  manera de mostrar una oferta — es la que el turista ya vio dos renglones
//  más arriba, en la misma pantalla.
// ============================================================
import { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, X } from 'lucide-react';

const C = {
  primary:  '#475BE1',
  ink:      '#0B1020',
  ink2:     '#3D4255',
  muted:    '#6B7280',
  line:     '#E7E9EE',
};

const FICHA_ANCHO = 340;
// Alto aproximado de la ficha, sólo para decidir de qué lado del pin sale y
// para el caso en que sale por abajo. No hace falta que sea exacto: el thumb
// de 62px + padding la fijan cerca de 86px y el título no envuelve (va con
// ellipsis, igual que en la fila del acordeón).
const FICHA_ALTO  = 88;
const MAPA_ALTO   = 460;

// ─── Marcador divIcon ────────────────────────────────────────
function makeMarkerHtml(promo, active) {
  const badge  = promo.badge || '';
  const socio  = promo.proveedorNombre || '';
  const bg     = active ? C.primary : '#fff';
  const border = active ? C.primary : C.line;
  const scale  = active ? 'scale(1.12)' : 'scale(1)';
  const shadow = active
    ? '0 4px 16px rgba(71,91,225,0.45)'
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

// La aclaración de la fila: el reloj del flash si corre, y si no, lo que traiga
// la oferta. Misma regla que OfertaFila — sin dato no hay renglón vacío.
function subtitulo(promo) {
  if (promo.offerType === 'Flash' && promo.fechaFinFlash) {
    const ms = new Date(promo.fechaFinFlash).getTime() - Date.now();
    if (ms > 0) {
      const hs = Math.floor(ms / 3600000);
      return hs >= 24 ? `Termina en ${Math.floor(hs / 24)} días` : `Termina en ${Math.max(1, hs)} h`;
    }
  }
  return promo.subtitle || '';
}

// ─── Ficha del pin — formato de la fila cerrada del acordeón ─────────────────
function FichaPin({ promo, onAmpliar, onCerrar }) {
  return (
    <div
      style={{
        width: FICHA_ANCHO, background: '#fff',
        border: `1px solid ${C.line}`, borderRadius: 14,
        boxShadow: '0 12px 36px -10px rgba(11,16,32,0.28)',
        padding: '12px 12px 12px 12px',
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: "'Inter', system-ui, sans-serif",
        // Nace desde el pin: chica y transparente, y crece hacia arriba a la
        // izquierda, que es donde está el marcador. Sin esto la ficha
        // "aparece puesta" y no se lee como el mismo objeto que se tocó.
        transformOrigin: 'bottom left',
        animation: 'fichaPinIn .18s cubic-bezier(.16,1,.3,1)',
      }}
      onClick={e => e.stopPropagation()}
    >
      <div style={{ width: 110, height: 62, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#1a2a35' }}>
        {(promo.image || promo.imagen_url) && (
          <img src={promo.image || promo.imagen_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {promo.badge && (
          <div style={{ fontSize: 12.5, fontWeight: 700, color: C.primary, lineHeight: 1.4, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {promo.badge}
          </div>
        )}
        <div style={{ fontSize: 14.5, fontWeight: 600, color: C.ink, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {promo.title || promo.titulo}
        </div>
        {subtitulo(promo) && (
          <div style={{ fontSize: 12.5, fontWeight: 500, color: C.muted, lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subtitulo(promo)}
          </div>
        )}
      </div>

      {/* Lupa: la ficha tiene lo que se necesita para reconocer la oferta, no
          para decidirla. El botón lleva al detalle, que es donde están el
          precio, el ahorro y los términos. */}
      <button
        type="button"
        onClick={() => onAmpliar?.(promo)}
        title="Ver la oferta completa"
        aria-label="Ver la oferta completa"
        style={{
          flexShrink: 0, width: 38, height: 38, borderRadius: 10,
          border: `1px solid ${C.line}`, background: '#fff', color: C.ink2,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'border-color .13s, color .13s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.primary; e.currentTarget.style.color = C.primary; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.line; e.currentTarget.style.color = C.ink2; }}
      >
        <ZoomIn size={18} />
      </button>

      <button
        type="button"
        onClick={onCerrar}
        aria-label="Cerrar"
        style={{
          position: 'absolute', top: -9, right: -9,
          width: 24, height: 24, borderRadius: 999,
          border: `1px solid ${C.line}`, background: '#fff', color: C.muted,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 2px 8px rgba(11,16,32,0.14)',
        }}
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ─── Componente principal MapView ────────────────────────────
export default function MapView({ promos = [], center, hotelName = '', onOpenOferta }) {
  const mapRef      = useRef(null);   // div DOM
  const leafletRef  = useRef(null);   // instancia L.Map
  const markersRef  = useRef({});     // { id → L.marker }
  const [activeId, setActiveId] = useState(null);
  // Posición de la ficha en píxeles del contenedor. Se recalcula en cada
  // movimiento del mapa: la ficha está en el DOM de React, fuera de las capas
  // de Leaflet, así que nada la mueve sola cuando el turista panea.
  const [pos, setPos] = useState(null);

  const activa = promos.find(p => p.id === activeId) || null;

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
        background:#475BE1; border:3px solid #fff;
        border-radius:50%; width:44px; height:44px;
        display:flex; align-items:center; justify-content:center;
        box-shadow:0 4px 16px rgba(71,91,225,0.45);
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

    // Tocar el mapa fuera de un pin cierra la ficha.
    map.on('click', () => setActiveId(null));

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
        .on('click', ev => {
          // Sin esto el click llega también al mapa y cierra la ficha en el
          // mismo gesto que la abre.
          window.L.DomEvent.stopPropagation(ev);
          setActiveId(p.id);
        });
      markersRef.current[p.id] = marker;
    });
  }, [promos, activeId]);

  // ── Seguir al pin activo mientras el mapa se mueve ──────────
  const recolocar = useCallback(() => {
    const map = leafletRef.current;
    const cont = mapRef.current;
    if (!map || !cont || !activa || activa.lat == null || activa.lng == null) { setPos(null); return; }

    const pt = map.latLngToContainerPoint([activa.lat, activa.lng]);
    const w = cont.clientWidth;
    const h = cont.clientHeight;

    // La ficha sale desde el pin hacia arriba. Se la mantiene dentro del mapa
    // en los dos ejes: contra el borde derecho se corre a la izquierda, y si
    // arriba no hay lugar cae debajo del pin.
    // `top` es el BORDE INFERIOR de la ficha: el div va con translateY(-100%).
    const left = Math.min(Math.max(pt.x - 6, 12), Math.max(12, w - FICHA_ANCHO - 12));
    const cabeArriba = pt.y > FICHA_ALTO + 24;
    const top = cabeArriba
      ? pt.y - 12
      : Math.min(pt.y + 40 + FICHA_ALTO, h - 12);

    setPos({ left, top });
  }, [activa]);

  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;
    recolocar();
    map.on('move zoom resize', recolocar);
    return () => { map.off('move zoom resize', recolocar); };
  }, [recolocar]);

  return (
    <div style={{ position: 'relative' }}>
      <style>{`@keyframes fichaPinIn { from { opacity: 0; transform: scale(.92) } to { opacity: 1; transform: none } }`}</style>

      <div
        ref={mapRef}
        style={{ height: MAPA_ALTO, borderRadius: 16, border: `1px solid ${C.line}` }}
      />

      {/* Fuera del div del mapa no: Leaflet le pisa el contenido a su
          contenedor. Va como hermano absoluto, con el mismo origen. */}
      {activa && pos && (
        <div
          style={{
            position: 'absolute', left: pos.left, top: pos.top,
            transform: 'translateY(-100%)',
            zIndex: 500, pointerEvents: 'auto',
          }}
        >
          <div style={{ position: 'relative' }}>
            <FichaPin
              promo={activa}
              onAmpliar={p => onOpenOferta?.(p)}
              onCerrar={() => setActiveId(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
