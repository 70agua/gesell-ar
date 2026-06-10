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

// label (display) → val (coincide con item.type en BD)
const TIPOS_ALOJ = [
  { label: 'Hoteles',         val: 'Hotel' },
  { label: 'Cabañas',         val: 'Cabaña' },
  { label: 'Casas',           val: 'Casa' },
  { label: 'Departamentos',   val: 'Departamento' },
  { label: 'Dormis / Camping',val: 'Dormi' },
];
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
  return <img src="/cuponera-coin.svg" alt="crédito" width={size} height={size} style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0 }}/>;
}

// ─── Offer card (grid) ────────────────────────────────────────
function OfertaCardGrid({ promo, onClick, onAddToCuponera, inMarketplace = false }) {
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

  const card = (
    <div
      onClick={() => onClick && onClick(promo)}
      style={{ background: '#fff', border: inMarketplace ? 'none' : `1px solid ${A.line}`, borderRadius: inMarketplace ? 19 : 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', position: 'relative', flex: 1 }}
      onMouseEnter={e => { e.currentTarget.parentElement?.style && (e.currentTarget.parentElement.style.transform = 'translateY(-2px)'); e.currentTarget.style.boxShadow = '0 16px 48px -16px rgba(11,16,32,0.18)'; }}
      onMouseLeave={e => { e.currentTarget.parentElement?.style && (e.currentTarget.parentElement.style.transform = 'none'); e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Badge PROMOCIÓN — solo en marketplace */}
      {inMarketplace && (
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: '#d2e9f3', color: '#0c101f', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', padding: '3px 9px', borderRadius: 999 }}>
          PROMOCIÓN
        </div>
      )}
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

        {/* Badge "Exclusivo para huéspedes" — top */}
        {promo.exclusivoHuespedes && (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 64, background: 'linear-gradient(to bottom, rgba(5,10,25,0.72) 0%, transparent 100%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5" rx="1"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 400, color: '#fff', lineHeight: 1.35 }}>
                Exclusivo huéspedes {promo.exclusivoHuespedes}
              </span>
            </div>
          </>
        )}
        <div style={{ position: 'absolute', bottom: 12, left: 14, color: '#fff', fontSize: (promo.badge?.length || 0) > 5 ? 25 : 36, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1 }}>{promo.badge}</div>
        <div style={{ position: 'absolute', bottom: 10, right: 10 }}><HeartButton id={promo.id} /></div>
      </div>
      <div style={{ padding: '12px 14px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Localidad + zona */}
        {(promo.negocioLocalidad || promo.negocioZone) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, marginBottom: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgb(107,114,128)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
            <span style={{ color: 'rgb(107,114,128)', fontWeight: 600 }}>{promo.negocioLocalidad || promo.negocioZone}</span>
            {promo.negocioLocalidad && promo.negocioZone && <span style={{ color: A.muted }}> · {promo.negocioZone}</span>}
          </div>
        )}
        {/* Nombre del negocio — título principal */}
        <div style={{ fontSize: 18, fontWeight: 700, color: A.ink, lineHeight: 1.2, marginBottom: 4 }}>
          {promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()}
        </div>
        {/* Título de la promo */}
        <div style={{ fontSize: 14, fontWeight: 600, color: A.green, lineHeight: 1.3, marginBottom: 12 }}>
          {promo.title}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onAddToCuponera && onAddToCuponera(promo); }}
          style={{ width: '100%', background: A.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 0', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'background 0.15s', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = A.primaryDark}
          onMouseLeave={e => e.currentTarget.style.background = A.primary}
        >
          <IcoTicket /> Agregar a cuponera
        </button>

        {/* Cajita ahorro + créditos — siempre visible en marketplace */}
        {(() => {
          const tc = promo.tokens_costo;
          if (tc === 0) return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0FDF4', borderRadius: 9, padding: '9px 12px', border: '1px solid #BBF7D0', marginTop: 10, flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10A36B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#10A36B' }}>Cupón GRATIS</span>
            </div>
          );
          return (
            <div style={{ border: `1px solid ${A.line}`, borderRadius: 10, overflow: 'hidden', marginTop: 10, flexShrink: 0 }}>
              {promo.ahorroEstimado > 0 && <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: A.muted }}>Ahorro estimado</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: A.green }}>~${promo.ahorroEstimado.toLocaleString('es-AR')} aprox.</span>
                </div>
                <div style={{ height: 1, background: A.line }} />
              </>}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 12px' }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: A.muted, paddingTop: 3 }}>Lo activás con</span>
                {tc != null ? (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                      <CoinSVG size={14} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: A.ink }}>{tc} crédito{tc !== 1 ? 's' : ''}</span>
                    </div>
                    <div style={{ fontSize: 11, color: A.muted, marginTop: 2 }}>(${(tc * 2000).toLocaleString('es-AR')} + IVA)</div>
                  </div>
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 600, color: A.primary }}>Consultá las tarifas</span>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );

  if (inMarketplace) {
    return (
      <div style={{ background: 'linear-gradient(to bottom, #d2e9f3, #2d44dd)', borderRadius: 21, padding: 2, display: 'flex', transition: 'transform 0.2s' }}>
        {card}
      </div>
    );
  }
  return card;
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
        {/* Badge "Exclusivo para huéspedes" — top (card lista, gradiente vertical) */}
        {promo.exclusivoHuespedes && (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 64, background: 'linear-gradient(to bottom, rgba(5,10,25,0.72) 0%, transparent 100%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 12, left: 12, right: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5" rx="1"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 400, color: '#fff', lineHeight: 1.35 }}>
                Exclusivo huéspedes {promo.exclusivoHuespedes}
              </span>
            </div>
          </>
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
          {promo.categoria !== 'experiencia' && promo.negocioLocalidad ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 400, marginBottom: 4 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(107,114,128)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
              <span style={{ color: 'rgb(107,114,128)', fontWeight: 600 }}>{promo.negocioLocalidad}</span>
              {(promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()) && (
                <span style={{ color: A.muted }}> · {promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()}</span>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: A.muted, fontWeight: 400, marginBottom: 4 }}>
              {promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()}
            </div>
          )}
          <div style={{ fontSize: 16, fontWeight: 700, color: A.green, lineHeight: 1.3 }}>{promo.title}</div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
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
          {promo.tokens_costo != null && (
            promo.tokens_costo === 0
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#F0FDF4', borderRadius: 9, padding: '7px 11px', border: '1px solid #BBF7D0' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10A36B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#10A36B' }}>Cupón GRATIS</span>
                </div>
              : <div style={{ border: `1px solid ${A.line}`, borderRadius: 9, overflow: 'hidden' }}>
                  {promo.ahorroEstimado > 0 && <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 11px' }}>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: A.muted }}>Ahorro estimado</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: A.green }}>~${promo.ahorroEstimado.toLocaleString('es-AR')} aprox.</span>
                    </div>
                    <div style={{ height: 1, background: A.line }} />
                  </>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 11px' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: A.muted, paddingTop: 2 }}>Lo activás con</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                        <CoinSVG size={13} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: A.ink }}>{promo.tokens_costo} crédito{promo.tokens_costo !== 1 ? 's' : ''}</span>
                      </div>
                      <div style={{ fontSize: 11, color: A.muted, marginTop: 1 }}>(${(promo.tokens_costo * 2000).toLocaleString('es-AR')} + IVA)</div>
                    </div>
                  </div>
                </div>
          )}
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

function SideSection({ title, children }) {
  return (
    <div className="g-side-section" style={{ borderBottom: `1px solid ${A.line}`, paddingBottom: 16, marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: A.ink, letterSpacing: '0.04em', textTransform: 'uppercase', padding: '4px 0 10px' }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  VISTA PRINCIPAL
// ═══════════════════════════════════════════════════════════
// ─── Hook ancho de ventana ────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

export default function MarketplaceView({ onBack, onOpenDetail, initialFiltro = 'todos', initialLocalidad = 'todas', onVerOfertas }) {
  const { addCupon } = useCuponera();
  const [alojamientos, setAlojamientos] = useState([]);
  const [promos,       setPromos]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [vista,        setVista]        = useState('grilla');
  const [busqueda,     setBusqueda]     = useState('');
  const [orden,        setOrden]        = useState('relevancia');
  const [showOrden,    setShowOrden]    = useState(false);
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [stickyTop,    setStickyTop]    = useState(90);
  const sidebarRef = useRef(null);

  // Recalcula el top sticky según altura de sidebar vs viewport
  useEffect(() => {
    const calc = () => {
      if (!sidebarRef.current) return;
      const sH = sidebarRef.current.offsetHeight;
      const vH = window.innerHeight;
      const NAV = 90; // altura nav + padding top
      const BOT = 16; // margen inferior
      setStickyTop(Math.min(NAV, vH - sH - BOT));
    };
    calc();
    window.addEventListener('resize', calc);
    const ro = new ResizeObserver(calc);
    if (sidebarRef.current) ro.observe(sidebarRef.current);
    return () => { window.removeEventListener('resize', calc); ro.disconnect(); };
  }, []);

  // Filtros sidebar
  const [filtroLocalidades, setFiltroLocalidades] = useState(() => {
    if (!initialLocalidad || initialLocalidad === 'todas') return [];
    if (initialLocalidad.startsWith('__multi__:')) {
      return initialLocalidad.slice('__multi__:'.length).split(',').filter(Boolean);
    }
    return [initialLocalidad];
  });
  const [filtroTipos,     setFiltroTipos]     = useState(initialFiltro !== 'todos' ? new Set([initialFiltro]) : new Set());
  const [filtroServicios, setFiltroServicios] = useState(new Set());

  // Infinite scroll
  const [shownCount, setShownCount] = useState(10);
  const sentinelRef = useRef(null);
  const ordenRef = useRef(null);
  const winW = useWindowWidth();
  const isMobile = winW < 768;

  useEffect(() => {
    (async () => {
      const [aloj, proms] = await Promise.all([getAlojamientos(), getPromos(20)]);
      setAlojamientos(aloj);
      // Guardamos TODAS las categorías para la lógica de mezcla
      setPromos(proms);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const h = e => { if (ordenRef.current && !ordenRef.current.contains(e.target)) setShowOrden(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Infinite scroll ──────────────────────────────────────
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setShownCount(n => n + 10);
    }, { rootMargin: '200px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [sentinelRef.current]);

  // Filtrar + ordenar alojamientos ───────────────────────
  const alojFiltrados = alojamientos.filter(item => {
    const matchTipo      = filtroTipos.size === 0 || filtroTipos.has(item.type);
    const matchLocalidad = filtroLocalidades.length === 0 || filtroLocalidades.includes(item.localidad);
    const matchBusq      = !busqueda || (item.name || '').toLowerCase().includes(busqueda.toLowerCase());
    return matchTipo && matchLocalidad && matchBusq;
  }).sort((a, b) => {
    if (orden === 'precio_asc')  return (a.precioMin || 0) - (b.precioMin || 0);
    if (orden === 'precio_desc') return (b.precioMin || 0) - (a.precioMin || 0);
    return 0;
  });

  // ── Promos filtradas por localidad ──────────────────────
  const promosPorLocalidad = promos.filter(p =>
    filtroLocalidades.length === 0 || filtroLocalidades.includes(p.negocioLocalidad) || filtroLocalidades.includes(p.negocioZone)
  );

  // Separar por categoría + plan Black (usa plan del negocio en mock, siempre incluir)
  const esBlack = p => p.negocioPlan === 'BLACK' || p.esPlanBlack;
  const alojPromos  = promosPorLocalidad.filter(p => p.categoria === 'alojamiento');
  const gastroPromos = promosPorLocalidad.filter(p => p.categoria === 'gastronomia');
  const expPromos    = promosPorLocalidad.filter(p => p.categoria === 'experiencia');

  // ── Lógica de mezcla 50/20/20 + Black siempre completo ──
  const N = alojFiltrados.length;
  const pickPromos = (list, cuota) => {
    const black = list.filter(esBlack);
    const resto = list.filter(p => !esBlack(p)).slice(0, Math.max(0, cuota - black.length));
    return [...black, ...resto].map(p => ({ ...p, _esOferta: true, type: 'oferta', _inMarketplace: true }));
  };
  const alojOfertas  = pickPromos(alojPromos,  Math.floor(N * 0.5));
  const todasOfertas  = [...alojOfertas];

  // ── Intercalar ofertas de forma pareja entre alojamientos ──
  const visibles = [];
  if (todasOfertas.length === 0) {
    visibles.push(...alojFiltrados);
  } else {
    const ratio = Math.max(1, Math.floor(alojFiltrados.length / todasOfertas.length));
    let oIdx = 0;
    alojFiltrados.forEach((item, i) => {
      visibles.push(item);
      if ((i + 1) % ratio === 0 && oIdx < todasOfertas.length) {
        visibles.push(todasOfertas[oIdx++]);
      }
    });
    while (oIdx < todasOfertas.length) visibles.push(todasOfertas[oIdx++]);
  }

  // ── Tags de descuento para cada alojamiento ──────────────
  const discountTagsMap = {};
  alojFiltrados.forEach(item => {
    const loc = item.localidad;
    const hasGastro = gastroPromos.some(p => p.negocioLocalidad === loc || p.negocioZone === loc);
    const hasExp    = expPromos.some(p => p.negocioLocalidad === loc || p.negocioZone === loc);
    discountTagsMap[item.id] = { gastro: hasGastro, exp: hasExp };
  });

  // Reset paginado cuando cambian filtros/búsqueda
  const filterKey = `${busqueda}|${[...filtroTipos].join()}|${filtroLocalidades.join()}|${[...filtroServicios].join()}|${orden}`;
  useEffect(() => { setShownCount(10); }, [filterKey]);

  const visiblesPaged = visibles.slice(0, shownCount);
  const hayMas = shownCount < visibles.length;

  const vecinas = filtroLocalidades.length === 1 ? getVecinas(filtroLocalidades[0]) : [];

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
    setFiltroLocalidades([]);
    setFiltroTipos(new Set());
    setFiltroServicios(new Set());
    setBusqueda('');
  };

  const limpiarSecundarios = () => {
    setFiltroTipos(new Set());
    setFiltroServicios(new Set());
  };

  // Solo filtros secundarios (no destinos)
  const haySecundarios = filtroTipos.size > 0 || filtroServicios.size > 0;
  const hayFiltros = filtroLocalidades.length > 0 || haySecundarios || busqueda;

  const tipoLabel = (val) => TIPOS_ALOJ.find(t => t.val === val)?.label || val;

  // Chips solo de filtros secundarios
  const activeChips = [
    ...[...filtroTipos].map(t => ({ key: `t-${t}`, label: tipoLabel(t), clear: () => toggleTipo(t) })),
    ...[...filtroServicios].map(s => ({ key: `s-${s}`, label: SERVICIOS_LIST.find(x => x.id === s)?.label || s, clear: () => toggleServicio(s) })),
  ];

  const cols = isMobile ? 1 : winW < 1024 ? 2 : 3;
  const renderGrid = (items) => (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 16 : 22 }}>
      {items.map(item => item._esOferta
        ? <OfertaCardGrid key={`o-${item.id}-${item.categoria}`} promo={item} onClick={() => {}} onAddToCuponera={p => addCupon(p)} inMarketplace={item._inMarketplace} />
        : <AccommodationCard key={`a-${item.id}`} item={item} onClick={onOpenDetail} discountTags={discountTagsMap[item.id]} />
      )}
    </div>
  );

  const renderList = (items) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {items.map(item => item._esOferta
        ? <OfertaCardList key={`o-${item.id}-${item.categoria}`} promo={item} onClick={() => {}} onAddToCuponera={p => addCupon(p)} inMarketplace={item._inMarketplace} />
        : <AlojListCard key={`a-${item.id}`} item={item} onClick={onOpenDetail} discountTags={discountTagsMap[item.id]} />
      )}
    </div>
  );

  const renderItems = (items) => vista === 'grilla' ? renderGrid(items) : renderList(items);

  // ── Contenido del sidebar (reutilizado en desktop y drawer) ──
  const SidebarContent = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: `1px solid ${A.line}` }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: A.ink }}>Filtros</span>
        {isMobile && (
          <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: A.muted, display: 'flex', padding: 4 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        )}
      </div>

          {/* Bloque DESTINO */}
          <div style={{ padding: '14px 18px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: A.ink, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>Destino</div>

            <CheckRow
              label="Todos los destinos"
              checked={filtroLocalidades.length === 0 || filtroLocalidades.length === LOCALIDADES.length}
              onChange={() => setFiltroLocalidades(prev => (prev.length === 0 || prev.length === LOCALIDADES.length) ? [] : [...LOCALIDADES])}
            />
            {LOCALIDADES.map(loc => (
              <CheckRow
                key={loc}
                label={loc}
                checked={filtroLocalidades.includes(loc)}
                onChange={() => setFiltroLocalidades(prev =>
                  prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc]
                )}
              />
            ))}

            {/* Botón Ver sólo promociones */}
            <button
              onClick={() => onVerOfertas && onVerOfertas(filtroLocalidades)}
              style={{ marginTop: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, padding: '12px 0', background: '#fff', border: `1.5px solid ${A.line}`, borderRadius: 999, fontSize: 13, fontWeight: 600, color: A.ink, cursor: 'pointer', fontFamily: A.font, transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.color = A.primary; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.color = A.ink; }}
            >
              <img src="/ico-disc.svg" alt="" style={{ width: 24, height: 24, flexShrink: 0 }} />
              Ver sólo promociones
            </button>
          </div>

          {/* Divisor */}
          <div style={{ height: 1, background: A.line, margin: '4px 0' }} />

          {/* Bloque OTROS FILTROS */}
          <div style={{ padding: '14px 18px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: A.ink }}>Otros filtros</span>
              {haySecundarios && (
                <button onClick={limpiarSecundarios} style={{ background: 'none', border: 'none', fontSize: 12, color: A.primary, cursor: 'pointer', fontWeight: 600, fontFamily: A.font }}>
                  Limpiar
                </button>
              )}
            </div>

            {/* Chips de filtros activos */}
            {activeChips.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {activeChips.map(chip => (
                  <span key={chip.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: A.primarySoft, color: A.primary, borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                    {chip.label}
                    <button onClick={chip.clear} style={{ background: 'none', border: 'none', cursor: 'pointer', color: A.primary, display: 'flex', padding: 0, lineHeight: 1 }}>
                      <IcoX />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <SideSection title="Tipos de alojamiento">
              <CheckRow
                label="Todos los tipos"
                checked={filtroTipos.size === 0}
                onChange={() => setFiltroTipos(new Set())}
              />
              {TIPOS_ALOJ.map(t => (
                <CheckRow key={t.val} label={t.label} checked={filtroTipos.has(t.val)} onChange={() => toggleTipo(t.val)} />
              ))}
            </SideSection>
            <SideSection title="Servicios incluidos" defaultOpen={false}>
              {SERVICIOS_LIST.map(s => (
                <CheckRow key={s.id} label={s.label} checked={filtroServicios.has(s.id)} onChange={() => toggleServicio(s.id)} />
              ))}
            </SideSection>
          </div>
        </>
  );

  return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, color: A.ink, paddingTop: 70 }}>

      {/* ── Drawer mobile ── */}
      {isMobile && drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.4)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 300, background: '#fff', zIndex: 101, overflowY: 'auto', boxShadow: '4px 0 32px rgba(0,0,0,0.15)' }}>
            {SidebarContent}
          </div>
        </>
      )}

      {/* ── Body ── */}
      <div style={{ maxWidth: 1328, margin: '0 auto', padding: isMobile ? '16px 16px 72px' : '32px 40px 72px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* Sidebar desktop */}
        {!isMobile && (
          <div style={{ width: 260, flexShrink: 0, alignSelf: 'stretch' }}>
          <aside ref={sidebarRef} style={{ background: '#fff', borderRadius: 18, border: `1px solid ${A.line}`, overflow: 'hidden', position: 'sticky', top: stickyTop }}>
            {SidebarContent}
          </aside>
          </div>
        )}

        {/* ── RESULTS ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Fila: título + [filtros mobile] + search */}
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, color: A.ink, letterSpacing: '-0.02em', margin: 0 }}>Encontrá tu alojamiento ideal</h1>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {loading ? (
                  <span style={{ fontSize: 13, color: A.muted }}>Cargando...</span>
                ) : (
                  <>
                    <span style={{ fontSize: 13, color: A.muted }}>
                      {`${alojFiltrados.length} alojamiento${alojFiltrados.length !== 1 ? 's' : ''} disponible${alojFiltrados.length !== 1 ? 's' : ''}`}
                    </span>
                    {filtroLocalidades.length === 0 ? (
                      <span style={{ fontSize: 13, color: A.muted }}>en Villa Gesell y alrededores</span>
                    ) : (
                      <>
                        <span style={{ fontSize: 13, color: A.muted }}>en</span>
                        {filtroLocalidades.map(loc => (
                          <span key={loc} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', background: A.primarySoft, color: A.primary, borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                            {loc}
                            <button onClick={() => setFiltroLocalidades(prev => prev.filter(l => l !== loc))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: A.primary, display: 'flex', padding: 0, lineHeight: 1 }}>
                              <IcoX />
                            </button>
                          </span>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {isMobile && (
                <button
                  onClick={() => setDrawerOpen(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: hayFiltros ? A.primary : '#fff', color: hayFiltros ? '#fff' : A.ink, border: `1.5px solid ${hayFiltros ? A.primary : A.line}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
                  Filtros{hayFiltros ? ` (${(filtroTipos.size + filtroServicios.size + filtroLocalidades.length)})` : ''}
                </button>
              )}
              <div style={{ position: 'relative' }}>
                <input
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value)}
                  placeholder="Buscar en alojamientos"
                  style={{ width: isMobile ? 180 : 260, paddingLeft: 14, paddingRight: 40, paddingTop: 10, paddingBottom: 10, border: `1.5px solid ${A.line}`, borderRadius: 12, fontSize: 14, fontFamily: A.font, background: '#fff', color: A.ink, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = A.primary}
                  onBlur={e => e.target.style.borderColor = A.line}
                />
                <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: A.muted, display: 'flex', pointerEvents: 'none' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                </span>
              </div>
            </div>
          </div>

          {/* Controles: grilla/lista + orden */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
            {!isMobile && (
              <div style={{ display: 'flex', background: A.bg, padding: 3, borderRadius: 10, border: `1px solid ${A.line}` }}>
                <button onClick={() => setVista('grilla')} style={{ padding: '6px 10px', borderRadius: 7, background: vista === 'grilla' ? '#fff' : 'transparent', border: vista === 'grilla' ? `1px solid ${A.line}` : '1px solid transparent', color: vista === 'grilla' ? A.ink : A.muted, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <IcoGrid /> Grilla
                </button>
                <button onClick={() => setVista('lista')} style={{ padding: '6px 10px', borderRadius: 7, background: vista === 'lista' ? '#fff' : 'transparent', border: vista === 'lista' ? `1px solid ${A.line}` : '1px solid transparent', color: vista === 'lista' ? A.ink : A.muted, display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <IcoList /> Lista
                </button>
              </div>
            )}
            <span style={{ fontSize: 13, color: A.muted, fontWeight: 500 }}>Ordenar por</span>
            <div style={{ position: 'relative' }} ref={ordenRef}>
              <button onClick={() => setShowOrden(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fff', border: `1px solid ${A.line}`, borderRadius: 10, fontSize: 13, fontWeight: 500, color: A.ink, cursor: 'pointer', fontFamily: A.font }}>
                {ORDEN_OPTS.find(o => o.id === orden)?.label} <IcoChevD />
              </button>
              {showOrden && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#fff', border: `1px solid ${A.line}`, borderRadius: 14, boxShadow: '0 16px 48px -16px rgba(11,16,32,0.2)', zIndex: 50, overflow: 'hidden', minWidth: 200 }}>
                  {ORDEN_OPTS.map(opt => (
                    <button key={opt.id} onClick={() => { setOrden(opt.id); setShowOrden(false); }} style={{ width: '100%', textAlign: 'left', padding: '11px 16px', border: 'none', background: orden === opt.id ? A.primarySoft : 'transparent', color: orden === opt.id ? A.primary : A.ink2, fontSize: 13, fontWeight: orden === opt.id ? 600 : 500, cursor: 'pointer', fontFamily: A.font }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

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
              <button onClick={limpiarFiltros} style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Limpiar filtros
              </button>
            </div>
          ) : renderItems(visiblesPaged)}

          {/* Sentinel infinite scroll */}
          {hayMas && <div ref={sentinelRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, border: `3px solid ${A.line}`, borderTopColor: A.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          </div>}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          {/* Otras opciones cerca */}
          {!loading && filtroLocalidades.length === 1 && vecinas.length > 0 && (
            <div style={{ marginTop: 64 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
                <div style={{ flex: 1, height: 1, background: A.line }} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: A.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>También te puede interesar</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: A.ink }}>Otras opciones similares cerca de {filtroLocalidades[0]}</div>
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
                      <button onClick={() => setFiltroLocalidades([vecina])} style={{ background: 'none', border: 'none', color: A.primary, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
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
