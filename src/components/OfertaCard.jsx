// ============================================================
//  src/components/OfertaCard.jsx
//  Card canónica de oferta/cupón — usada en Favoritos, OfertasView,
//  Marketplace (grid y lista), y las minifichas de HomeView.
//  Estructura: header (avatar+nombre+localidad) → imagen con badge
//  + heart → franja "Ahorrás/Ganás" → precio → botón "Ver oferta"
//  → link "Agregar a cuponera".
// ============================================================

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { secondsUntil } from '../lib/ofertas';
import { precioActivacionARS, creditosActivacion } from '../lib/cobros';
import HeartButton from './HeartButton';
import { CreditTooltip } from './InfoTooltip';
import { useMostrarCreditos } from '../lib/sesion';
import GroupBadge from './GroupBadge';
import { descuentoMaximo } from '../lib/grupos';

const A = {
  primary: '#2545E6',
  ink:     '#0B1020',
  ink2:    '#3D4255',
  muted:   '#6B7280',
  line:    '#E7E9EE',
  bg:      '#F7F7F8',
  yellow:  '#FFC93C',
  green:   '#10A36B',
  greenSoft: '#EDFAF4',
  font:    "'Inter', system-ui, sans-serif",
};

const fmtPesos = n => 'AR$' + Math.round(n).toLocaleString('es-AR');
// Puntos mostrados en la franja de ahorro: ahorroEstimado / 4
const calcPts = ahorro => Math.round((ahorro || 0) / 4);

// Leyenda del ahorro. Los alojamientos SIEMPRE la muestran (evita confusión
// sobre a qué corresponde el ahorro); default seguro = "en toda la estadía".
const MODALIDAD_AHORRO = {
  por_persona:        'por persona',
  por_noche:          'por noche',
  en_toda_la_estadia: 'en toda la estadía',
};
function ahorroLegend(promo) {
  if (promo.categoria !== 'alojamiento') return null;
  return MODALIDAD_AHORRO[promo.ahorroModalidad] || 'en toda la estadía';
}

function CoinSVG({ size = 13 }) {
  return <img src="/cuponera-coin.svg" alt="crédito" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }} />;
}

const IcoBolt = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>;

function FlashPill({ fechaFinFlash }) {
  const [secs, setSecs] = useState(() => secondsUntil(fechaFinFlash));
  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  if (secs <= 0) return null;
  const pad = n => String(n).padStart(2, '0');
  const th = Math.floor(secs / 3600), tm = Math.floor((secs % 3600) / 60), ts = secs % 60;
  return (
    // right:52 reserva el espacio del corazón (top-right) — si chip+contador
    // no entran en el ancho disponible, el contador baja a un renglón nuevo.
    <div style={{ position: 'absolute', top: 10, left: 10, right: 52, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, zIndex: 2 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#EF4444', borderRadius: 999, padding: '5px 12px 5px 11px', flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', letterSpacing: '0.05em' }}>OFERTA</span>
        <span style={{ fontSize: 11, fontWeight: 900, color: A.yellow, fontStyle: 'italic', letterSpacing: '0.05em' }}>FLASH</span>
        <span style={{ color: A.yellow, display: 'flex', alignItems: 'center' }}><IcoBolt /></span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        {[th, tm, ts].map((v, i) => (
          <React.Fragment key={i}>
            <div style={{ background: '#fff', color: A.ink, borderRadius: 5, fontSize: 12, fontWeight: 800, minWidth: 26, padding: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {i === 0 ? v : pad(v)}
            </div>
            {i < 2 && <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 900, fontSize: 13 }}>:</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Header: avatar + nombre + localidad ──────────────────────
function ProveedorHeader({ promo, size = 44 }) {
  const nombre = promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim();
  const localidad = promo.negocioLocalidad || promo.negocioZone;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px 12px' }}>
      <div style={{ width: size, height: size, borderRadius: '50%', background: A.bg, border: `1px solid ${A.line}`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {promo.proveedorImage
          ? <img src={promo.proveedorImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span style={{ fontSize: size * 0.32, fontWeight: 700, color: A.muted }}>{(nombre || '?')[0]}</span>
        }
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: A.ink, lineHeight: 1.25, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          {nombre}
        </div>
        {localidad && (
          <div style={{ fontSize: 12, color: A.muted, marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            {localidad}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Imagen con badge, heart y overlays ───────────────────────
function ImagenConBadge({ promo, imgHeight, inMarketplace }) {
  const esFlash = promo.offerType === 'Flash';
  return (
    <div style={{ position: 'relative', overflow: 'hidden', flexShrink: 0, ...(imgHeight ? { height: imgHeight } : { aspectRatio: '4/3' }) }}>
      <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.75) 0%, rgba(11,16,32,0.15) 55%, transparent 100%)' }} />

      {esFlash && <FlashPill fechaFinFlash={promo.fechaFinFlash} />}

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

      {promo.esGrupal && (
        <div style={{ position: 'absolute', top: esFlash ? 44 : 10, left: 10, zIndex: 3 }}>
          <GroupBadge descuentoMax={descuentoMaximo(promo.grupoTramos)} compact />
        </div>
      )}

      {inMarketplace ? (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 3, background: '#d2e9f3', color: '#0c101f', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 999 }}>
          PROMOCIÓN
        </div>
      ) : (
        <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 3 }}>
          <HeartButton id={promo.id} />
        </div>
      )}

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px 15px' }}>
        <div style={{ fontSize: (promo.badge?.length || 0) > 5 ? 30 : 42, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{promo.badge}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3, marginTop: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{promo.title}</div>
      </div>
    </div>
  );
}

// ─── Franja "Ahorrás $X aprox. · Ganás X pts." ────────────────
//  Fila principal en una sola línea (se achica si no entra). Si hay
//  leyenda (alojamientos) va en un renglón aparte, agrandando el recuadro.
function FranjaAhorro({ ahorroEstimado, legend }) {
  const pts = calcPts(ahorroEstimado);
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const fit = () => {
      const o = outerRef.current, inn = innerRef.current;
      if (!o || !inn) return;
      const avail = o.clientWidth;
      const need = inn.scrollWidth;
      setScale(need > avail && need > 0 ? avail / need : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (outerRef.current) ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, [ahorroEstimado, pts]);

  if (!(ahorroEstimado > 0)) return null;

  return (
    <div style={{ background: A.greenSoft, padding: '11px 16px' }}>
      <div ref={outerRef} style={{ overflow: 'hidden' }}>
        <div ref={innerRef} style={{ display: 'flex', width: 'max-content', minWidth: '100%', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, whiteSpace: 'nowrap', transform: `scale(${scale})`, transformOrigin: 'left center' }}>
          <span style={{ color: A.green }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>Ahorrás </span>
            <span style={{ fontSize: 13, fontWeight: 800 }}>{fmtPesos(ahorroEstimado)} </span>
            <span style={{ fontSize: 11, fontWeight: 700 }}>aprox.</span>
          </span>
          {pts > 0 && (
            <span style={{ fontSize: 11, fontStyle: 'italic', fontWeight: 600, color: A.green }}>Ganás {pts.toLocaleString('es-AR')} pts.</span>
          )}
        </div>
      </div>
      {legend && (
        <div style={{ fontSize: 11, fontWeight: 700, color: A.green }}>{legend}</div>
      )}
    </div>
  );
}

// ─── Texto "Activá este cupón por…" (reutilizable) ────────────
export function PrecioCupon({ tokens_costo, ahorro = 0, color = A.ink, mutedColor = A.muted }) {
  const mostrarCreditos = useMostrarCreditos();
  const tc = tokens_costo;
  if (tc == null && !(ahorro > 0)) return null;
  if (tc === 0) {
    return (
      <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: A.green }}>
        Este cupón es GRATIS para vos
      </div>
    );
  }
  const pesos = fmtPesos(precioActivacionARS({ ahorro, tokensCosto: tc }));
  const creds = creditosActivacion({ ahorro, tokensCosto: tc });
  return (
    <div style={{ textAlign: 'center', fontSize: 14.5, color, lineHeight: 1.4 }}>
      {mostrarCreditos ? (
        <>
          Activá este cupón por{' '}
          <CoinSVG size={13} />{' '}
          <span style={{ fontWeight: 800 }}>{creds} crédito{creds !== 1 ? 's' : ''}</span>
          <CreditTooltip />
          <span style={{ display: 'block', fontSize: 11, color: mutedColor, marginTop: 2 }}>({pesos})</span>
        </>
      ) : (
        <>Activá este cupón por <span style={{ fontWeight: 800 }}>{pesos}</span></>
      )}
    </div>
  );
}

// ─── Precio + CTAs ─────────────────────────────────────────────
function PrecioYAcciones({ promo, onOpen, onAddToCuponera, hideActions = false }) {
  return (
    <div style={{ padding: '15px 16px 17px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <PrecioCupon tokens_costo={promo.tokens_costo} ahorro={promo.ahorroEstimado} />

      {!hideActions && (
        <>
          <button
            onClick={e => { e.stopPropagation(); onOpen && onOpen(promo); }}
            style={{ alignSelf: 'center', background: '#fff', border: '1.5px solid #E8E9EE', borderRadius: 14, padding: '9px 40px', fontSize: 14.5, fontWeight: 800, color: A.ink, cursor: 'pointer', transition: 'border-color .15s, color .15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.color = A.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E8E9EE'; e.currentTarget.style.color = A.ink; }}
          >
            Ver oferta
          </button>

          <button
            onClick={e => { e.stopPropagation(); onAddToCuponera && onAddToCuponera(promo); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'none', border: 'none', color: A.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font, padding: 0 }}
          >
            <img src="/ico-disc.svg" alt="" width={15} height={15} style={{ display: 'block' }} /> Agregar a cuponera
          </button>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
export default function OfertaCard({ promo, onOpen, onClick, onAddToCuponera, variant = 'grid', inMarketplace = false, reviewSlot = null, fixedHeight = null, hideActions = false }) {
  const abrir = onOpen || onClick;

  if (variant === 'list') {
    return (
      <div
        onClick={() => abrir && abrir(promo)}
        style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 20, overflow: 'hidden', display: 'flex', cursor: 'pointer', transition: 'box-shadow 0.2s', fontFamily: A.font }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 32px -12px rgba(11,16,32,0.18)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
      >
        <div style={{ position: 'relative', width: 200, flexShrink: 0 }}>
          <ImagenConBadge promo={promo} imgHeight="100%" inMarketplace={inMarketplace} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ProveedorHeader promo={promo} size={38} />
          {reviewSlot}
          <FranjaAhorro ahorroEstimado={promo.ahorroEstimado} legend={ahorroLegend(promo)} />
          <PrecioYAcciones promo={promo} onOpen={abrir} onAddToCuponera={onAddToCuponera} />
        </div>
      </div>
    );
  }

  const card = (
    <div
      onClick={() => abrir && abrir(promo)}
      style={{ background: '#fff', border: inMarketplace ? 'none' : `1px solid ${A.line}`, borderRadius: inMarketplace ? 19 : 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', fontFamily: A.font, ...(fixedHeight ? { height: fixedHeight } : { flex: 1 }) }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 48px -16px rgba(11,16,32,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      <ProveedorHeader promo={promo} />
      <ImagenConBadge promo={promo} inMarketplace={inMarketplace} />
      {/* Con alto fijo, la reseña se expande y empuja franja+precio al fondo */}
      {fixedHeight
        ? <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{reviewSlot}</div>
        : reviewSlot}
      <FranjaAhorro ahorroEstimado={promo.ahorroEstimado} legend={ahorroLegend(promo)} />
      <PrecioYAcciones promo={promo} onOpen={abrir} onAddToCuponera={onAddToCuponera} hideActions={hideActions} />
    </div>
  );

  if (inMarketplace) {
    return (
      <div style={{ background: 'linear-gradient(to bottom, #d2e9f3, #2d44dd)', borderRadius: 21, padding: 2, display: 'flex' }}>
        {card}
      </div>
    );
  }
  return card;
}
