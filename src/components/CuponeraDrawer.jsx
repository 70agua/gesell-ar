// ============================================================
//  src/components/CuponeraDrawer.jsx — Variante Ticket / Wallet
// ============================================================
import React, { useEffect, useCallback } from 'react';
import { useCuponera } from '../lib/cuponera';

// ── Tokens ──
const A = {
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  primaryDark: '#1731B8',
  bg:          '#F7F7F8',
  yellow:      '#FFC93C',
  green:       '#10A36B',
  font:        "'Inter', system-ui, sans-serif",
};

const fmt = (n) => '$' + n.toLocaleString('es-AR');

// ── Iconos SVG inline ──
function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 6l12 12M18 6 6 18"/>
    </svg>
  );
}
function LockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="10" width="16" height="11" rx="2"/>
      <path d="M8 10V7a4 4 0 0 1 8 0v3"/>
    </svg>
  );
}
function BoltIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  );
}
function CalendarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M16 2v4M8 2v4M3 10h18"/>
    </svg>
  );
}
function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5v14M5 12h14"/>
    </svg>
  );
}
function ArrowRightIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}
function TicketIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v2z"/>
    </svg>
  );
}

// ── TicketCard ──
function TicketCard({ c, onRemove }) {
  const NOTCH = A.bg; // color de fondo del área de tickets — simula troquel

  // Escala el font-size del badge según la longitud del texto
  const badgeLen = c.d.replace(/\s+/g, '').length;
  const badgeFontSize = badgeLen <= 4 ? 26 : badgeLen <= 7 ? 20 : 15;

  return (
    <div style={{
      position: 'relative', display: 'flex', background: '#fff',
      borderRadius: 16, boxShadow: '0 10px 26px -18px rgba(11,16,32,0.4)',
      overflow: 'hidden',
    }}>
      {/* Stub (talón) */}
      <div style={{
        width: 104, flexShrink: 0, background: c.accent, color: '#fff',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        alignItems: 'center', padding: '16px 8px', textAlign: 'center',
        overflow: 'hidden',
      }}>
        <div style={{
          fontSize: badgeFontSize, fontWeight: 800,
          letterSpacing: badgeLen <= 4 ? '-0.03em' : '-0.01em',
          lineHeight: 1.15,
          wordBreak: 'break-word', overflowWrap: 'break-word',
          width: '100%',
        }}>{c.d}</div>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6, opacity: 0.85 }}>Cupón</div>
      </div>

      {/* Troquel — línea punteada */}
      <div style={{ position: 'absolute', left: 104, top: 0, bottom: 0, borderLeft: `2px dashed ${A.line}` }} />
      {/* Muescas circulares */}
      <div style={{ position: 'absolute', left: 104, top: -8, width: 16, height: 16, borderRadius: '50%', background: NOTCH, transform: 'translateX(-50%)' }} />
      <div style={{ position: 'absolute', left: 104, bottom: -8, width: 16, height: 16, borderRadius: '50%', background: NOTCH, transform: 'translateX(-50%)' }} />

      {/* Cuerpo principal */}
      <div style={{ flex: 1, minWidth: 0, padding: '14px 44px 14px 20px', display: 'flex', flexDirection: 'column' }}>
        {/* Socio — 1 línea con ellipsis */}
        <div style={{
          fontSize: 10, color: A.muted, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{c.p}</div>
        {/* Título — máximo 2 líneas */}
        <div style={{
          fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginTop: 3, color: A.ink,
          display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2,
          overflow: 'hidden',
        }}>{c.t}</div>
        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: A.muted }}>
            <CalendarIcon width={12} height={12} /> {c.exp}
          </span>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: A.ink }}>{fmt(c.price)}</span>
        </div>
      </div>

      {/* Botón quitar */}
      <button
        onClick={() => onRemove(c.id)}
        aria-label={`Quitar ${c.t}`}
        style={{
          position: 'absolute', top: 10, right: 10,
          width: 26, height: 26, borderRadius: 8,
          background: '#fff', border: `1px solid ${A.line}`,
          color: A.muted, display: 'grid', placeItems: 'center',
          cursor: 'pointer', padding: 0,
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = A.ink2; e.currentTarget.style.color = A.ink; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.color = A.muted; }}
      >
        <XIcon width={13} height={13} />
      </button>
    </div>
  );
}

// ── Drawer principal ──
export default function CuponeraDrawer() {
  const { cupones, drawerOpen, removeCupon, closeDrawer, handleCheckout } = useCuponera();

  const total = cupones.reduce((s, c) => s + c.price, 0);
  const saved = cupones.reduce((s, c) => s + (c.was - c.price), 0);
  const empty = cupones.length === 0;

  // Escape cierra el drawer
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') closeDrawer();
  }, [closeDrawer]);

  useEffect(() => {
    if (drawerOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [drawerOpen, handleKeyDown]);

  if (!drawerOpen) return null;

  return (
    <>
      {/* Scrim */}
      <div
        onClick={closeDrawer}
        style={{
          position: 'fixed', inset: 0, zIndex: 8000,
          background: 'rgba(11,16,32,0.45)',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
          animation: 'cuponeraScrimIn 320ms ease forwards',
        }}
      />

      {/* Panel */}
      <aside
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh',
          width: 444, maxWidth: '92vw', zIndex: 8001,
          background: A.bg,
          boxShadow: '-30px 0 80px -40px rgba(11,16,32,0.5)',
          display: 'flex', flexDirection: 'column',
          fontFamily: A.font, color: A.ink,
          animation: 'cuponeraSlideIn 420ms cubic-bezier(.22,1,.36,1) forwards',
        }}
      >
        {/* ── ZONA 1: Header oscuro tipo wallet ── */}
        <div style={{
          background: A.ink, color: '#fff',
          padding: '20px 24px 22px',
          position: 'relative', overflow: 'hidden', flexShrink: 0,
        }}>
          {/* Círculos decorativos */}
          <div style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(125,161,255,0.18)' }} />
          <div style={{ position: 'absolute', top: 20, right: 30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,201,60,0.22)' }} />

          {/* Fila top: overline + close */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
              MI CUPONERA
            </div>
            <button
              onClick={closeDrawer}
              aria-label="Cerrar cuponera"
              style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff', display: 'grid', placeItems: 'center',
                cursor: 'pointer', padding: 0,
              }}
            >
              <XIcon width={17} height={17} />
            </button>
          </div>

          {/* Contador grande */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8, position: 'relative' }}>
            <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {cupones.length}
            </span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>
              {cupones.length === 1 ? 'cupón listo para canjear' : 'cupones listos para canjear'}
            </span>
          </div>

          {/* Chip de ahorro (solo si hay cupones) */}
          {!empty && (
            <div style={{
              marginTop: 14, position: 'relative',
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'rgba(255,201,60,0.16)', color: A.yellow,
              padding: '6px 12px', borderRadius: 999,
              fontSize: 12, fontWeight: 700,
            }}>
              <BoltIcon width={12} height={12} />
              Ahorrás {fmt(saved)} en total
            </div>
          )}
        </div>

        {/* ── ZONA 2: Lista de tickets (scrolleable) ── */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '20px 22px',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {empty ? (
            /* Estado vacío */
            <div style={{ margin: 'auto 0', textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: A.primarySoft, color: A.primary,
                display: 'grid', placeItems: 'center',
                margin: '0 auto 14px',
              }}>
                <TicketIcon width={26} height={26} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: A.ink, letterSpacing: '-0.02em' }}>
                Tu cuponera está vacía
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: A.muted, lineHeight: 1.5 }}>
                Sumá ofertas y aparecerán acá como cupones listos para canjear.
              </p>
            </div>
          ) : (
            cupones.map((c) => (
              <TicketCard key={c.id} c={c} onRemove={removeCupon} />
            ))
          )}

          {/* Botón agregar otro / explorar */}
          <button
            onClick={closeDrawer}
            style={{
              marginTop: 2, padding: '13px 0',
              background: '#fff', border: `1px dashed ${A.line}`,
              borderRadius: 14, color: A.primary,
              fontFamily: A.font, fontSize: 13.5, fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
            }}
          >
            <PlusIcon width={16} height={16} />
            {empty ? 'Explorar ofertas' : 'Agregar otro cupón'}
          </button>
        </div>

        {/* ── ZONA 3: Footer fijo ── */}
        <div style={{ borderTop: `1px solid ${A.line}`, padding: '16px 22px 22px', background: '#fff', flexShrink: 0 }}>
          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: A.ink }}>Total a pagar</span>
            <span style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-0.03em', color: A.ink }}>{fmt(total)}</span>
          </div>

          {/* CTA primario */}
          <button
            disabled={empty}
            onClick={empty ? undefined : handleCheckout}
            style={{
              width: '100%',
              background: empty ? A.line : A.primary,
              color: empty ? A.muted : '#fff',
              border: 'none', borderRadius: 14,
              padding: '15px 0', fontFamily: A.font,
              fontWeight: 600, fontSize: 15.5, letterSpacing: '-0.01em',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              cursor: empty ? 'not-allowed' : 'pointer',
              boxShadow: empty ? 'none' : '0 14px 30px -12px rgba(37,69,230,0.6)',
              transition: 'background 0.18s',
            }}
            onMouseEnter={e => { if (!empty) e.currentTarget.style.background = A.primaryDark; }}
            onMouseLeave={e => { if (!empty) e.currentTarget.style.background = A.primary; }}
          >
            {empty
              ? 'Agregá un cupón para pagar'
              : `Confirmar y pagar ${cupones.length} ${cupones.length === 1 ? 'cupón' : 'cupones'}`
            }
            {!empty && <ArrowRightIcon width={18} height={18} />}
          </button>

          {/* TrustLine */}
          {!empty && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 11.5, color: A.muted }}>
              <LockIcon width={13} height={13} /> Pago protegido · Garantía Cuponear
            </div>
          )}
        </div>
      </aside>

      {/* Keyframes de animación */}
      <style>{`
        @keyframes cuponeraSlideIn {
          from { transform: translateX(105%); }
          to   { transform: translateX(0); }
        }
        @keyframes cuponeraScrimIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
}
