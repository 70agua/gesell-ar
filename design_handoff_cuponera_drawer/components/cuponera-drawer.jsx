// Cuponera Drawer — 3 diseños de checkout lateral para gesell.ar · Aire
// Se abre apenas se agrega una oferta. Lista con miniatura + detalle + CTA al pago.
// Reusa el sistema "Aire" (A, Icon, Photo, AOfertaDetalle ya en window).

const { useState, useEffect, useRef } = React;

// ── Iconos puntuales que no están en primitives ──
const XIcon = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>);
const Trash = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/></svg>);
const Lock = (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>);

const fmt = (n) => '$' + n.toLocaleString('es-AR');

// ── Datos de la cuponera (item 0 = recién agregado) ──
const CUPONES = [
  { id: 'c1', d: '−35%', t: 'Hot Sale frente al mar · 3 noches', p: 'Hotel Spa Las Olas', ph: 'pool',    price: 165750, was: 255000, exp: 'Vence 30 Ene', accent: A.primary },
  { id: 'c2', d: '2×1',  t: 'Pintas artesanales en la barra',     p: 'Cervecería Dublín',  ph: 'cerveza', price: 3900,   was: 7800,   exp: 'Vence 15 Feb', accent: A.ink },
  { id: 'c3', d: '−15%', t: 'Cabalgata al atardecer',             p: 'Rancho Los Pinos',   ph: 'bosque',  price: 12750,  was: 15000,  exp: 'Vence 12 Feb', accent: A.green },
];
const sum   = (list, f) => list.reduce((s, c) => s + f(c), 0);
const TOTAL = sum(CUPONES, (c) => c.price);
const SAVED = sum(CUPONES, (c) => c.was - c.price);

// ───────────────────────── Shell genérico (scrim + panel deslizante) ─────────────────────────
function Drawer({ open, onClose, children, dark }) {
  // Montaje directo en posición final — sin animación dependiente del reloj (robusto en cualquier entorno)
  if (!open) return null;
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 80,
          background: 'rgba(11,16,32,0.45)', backdropFilter: 'blur(2px)',
        }}
      />
      <aside
        className="drawer-panel"
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh', width: 444, maxWidth: '92vw', zIndex: 81,
          background: dark ? A.bg : '#fff',
          boxShadow: '-30px 0 80px -40px rgba(11,16,32,0.5)',
          transform: 'translateX(0)',
          display: 'flex', flexDirection: 'column', fontFamily: A.font, color: A.ink,
        }}
      >
        {children}
      </aside>
    </>
  );
}

function CloseBtn({ onClose, light }) {
  return (
    <button onClick={onClose} aria-label="Cerrar" style={{
      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
      background: light ? 'rgba(255,255,255,0.12)' : '#fff',
      border: light ? '1px solid rgba(255,255,255,0.18)' : `1px solid ${A.line}`,
      color: light ? '#fff' : A.ink2, display: 'grid', placeItems: 'center',
    }}>
      <XIcon width={17} height={17} />
    </button>
  );
}

function CountChip({ n }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: A.primarySoft, color: A.primary, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
      <Icon.ticket width={13} height={13} /> {n} cupones
    </span>
  );
}

// CTA grande al pago — compartido
function PayCTA({ label = 'Ir al pago' }) {
  return (
    <button style={{
      width: '100%', background: A.primary, color: '#fff', border: 'none', borderRadius: 14,
      padding: '15px 0', fontFamily: A.font, fontWeight: 600, fontSize: 15.5, letterSpacing: '-0.01em',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
      boxShadow: '0 14px 30px -12px rgba(37,69,230,0.6)',
    }}>
      {label} <Icon.arrowR width={18} height={18} />
    </button>
  );
}

function TrustLine() {
  return (
    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 11.5, color: A.muted }}>
      <Lock width={13} height={13} /> Pago protegido · Garantía gesell.ar
    </div>
  );
}

// ════════════════════════════ VARIANTE 1 — CLÁSICO ════════════════════════════
function DrawerClasico({ onClose }) {
  return (
    <>
      {/* header */}
      <div style={{ padding: '22px 24px 18px', borderBottom: `1px solid ${A.line}`, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '-0.025em' }}>Tu cuponera</h2>
            <CountChip n={CUPONES.length} />
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: A.muted }}>Revisá y pasá al pago. Canjeás con QR durante tu estadía.</p>
        </div>
        <CloseBtn onClose={onClose} />
      </div>

      {/* lista */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {CUPONES.map((c, i) => (
          <div key={i} style={{
            display: 'flex', gap: 14, padding: '18px 24px',
            borderBottom: `1px solid ${A.line}`,
            background: i === 0 ? A.primarySoft : '#fff',
          }}>
            <div style={{ position: 'relative', width: 78, height: 78, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
              <Photo kind={c.ph} />
              <div style={{ position: 'absolute', left: 7, bottom: 7, background: A.ink, color: '#fff', padding: '2px 7px', borderRadius: 7, fontSize: 12, fontWeight: 800, letterSpacing: '-0.02em' }}>{c.d}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
              {i === 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, alignSelf: 'flex-start', color: A.primary, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 3 }}>
                  <Icon.check width={12} height={12} /> Recién agregado
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, color: A.ink }}>{c.t}</div>
              <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>{c.p}</div>
              <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: A.ink, letterSpacing: '-0.02em' }}>{fmt(c.price)}</span>
                <span style={{ fontSize: 12, color: A.muted, textDecoration: 'line-through' }}>{fmt(c.was)}</span>
              </div>
            </div>
            <button aria-label="Quitar" style={{ alignSelf: 'flex-start', width: 30, height: 30, borderRadius: 8, background: 'transparent', border: 'none', color: A.muted, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
              <Trash width={16} height={16} />
            </button>
          </div>
        ))}

        {/* agregar más */}
        <button onClick={onClose} style={{ width: '100%', padding: '16px 24px', background: 'transparent', border: 'none', borderBottom: `1px solid ${A.line}`, color: A.primary, fontFamily: A.font, fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon.plus width={16} height={16} /> Seguir explorando ofertas
        </button>
      </div>

      {/* footer */}
      <div style={{ borderTop: `1px solid ${A.line}`, padding: '18px 24px 22px', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: A.ink2 }}>
          <span>Subtotal · {CUPONES.length} cupones</span>
          <span style={{ fontWeight: 600 }}>{fmt(TOTAL)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: 13, color: A.green, fontWeight: 600 }}>
          <span>Ahorrás</span><span>{fmt(SAVED)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '14px 0 16px', paddingTop: 14, borderTop: `1px dashed ${A.line}` }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Total</span>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>{fmt(TOTAL)}</span>
        </div>
        <PayCTA />
        <TrustLine />
      </div>
    </>
  );
}

// ════════════════════════════ VARIANTE 2 — CONFIRMACIÓN ════════════════════════════
function DrawerConfirmacion({ onClose, animKey }) {
  const just = CUPONES[0];
  const rest = CUPONES.slice(1);
  return (
    <>
      {/* header mínimo */}
      <div style={{ padding: '18px 24px', display: 'flex', justifyContent: 'flex-end' }}>
        <CloseBtn onClose={onClose} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px 8px' }}>
        {/* éxito */}
        <div key={animKey} style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,163,107,0.12)', color: A.green, display: 'grid', placeItems: 'center', margin: '0 auto' }}>
            <Icon.check width={28} height={28} />
          </div>
          <h2 style={{ margin: '14px 0 4px', fontSize: 21, fontWeight: 700, letterSpacing: '-0.025em' }}>¡Sumaste un cupón!</h2>
          <p style={{ margin: 0, fontSize: 13.5, color: A.muted }}>Ya está en tu cuponera. Lo guardaste sin pagar de más.</p>
        </div>

        {/* tarjeta del recién agregado */}
        <div key={'card' + animKey} style={{ marginTop: 20, border: `1px solid ${A.line}`, borderRadius: 18, overflow: 'hidden', boxShadow: '0 18px 40px -26px rgba(11,16,32,0.4)' }}>
          <div style={{ position: 'relative', height: 140 }}>
            <Photo kind={just.ph} />
            <div style={{ position: 'absolute', top: 12, left: 12, background: A.ink, color: A.yellow, padding: '4px 10px', borderRadius: 999, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Icon.bolt width={11} height={11} /> Flash Sale
            </div>
            <div style={{ position: 'absolute', bottom: 12, left: 14, color: '#fff' }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9 }}>{just.p}</div>
              <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{just.d}</div>
            </div>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.3 }}>{just.t}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' }}>{fmt(just.price)}</span>
              <span style={{ fontSize: 12, color: A.muted, textDecoration: 'line-through' }}>{fmt(just.was)}</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: A.green, fontWeight: 700 }}>Ahorrás {fmt(just.was - just.price)}</span>
            </div>
          </div>
        </div>

        {/* resto de la cuponera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 10px' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: A.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>También en tu cuponera</span>
          <span style={{ fontSize: 12, color: A.muted }}>{rest.length} más</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rest.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, border: `1px solid ${A.line}`, borderRadius: 14 }}>
              <div style={{ position: 'relative', width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}>
                <Photo kind={c.ph} />
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', fontSize: 13, fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{c.d}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.t}</div>
                <div style={{ fontSize: 11.5, color: A.muted, marginTop: 1 }}>{c.p}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: '-0.02em' }}>{fmt(c.price)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* footer */}
      <div style={{ borderTop: `1px solid ${A.line}`, padding: '16px 24px 22px', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11.5, color: A.muted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Total · {CUPONES.length} cupones</div>
            <div style={{ fontSize: 13, color: A.green, fontWeight: 600, marginTop: 2 }}>Ahorrás {fmt(SAVED)}</div>
          </div>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>{fmt(TOTAL)}</span>
        </div>
        <PayCTA />
        <button onClick={onClose} style={{ width: '100%', marginTop: 8, background: 'transparent', border: 'none', color: A.ink2, fontFamily: A.font, fontSize: 13.5, fontWeight: 600, padding: '6px 0' }}>
          Seguir explorando ofertas
        </button>
      </div>
    </>
  );
}

// ════════════════════════════ VARIANTE 3 — TICKET / WALLET ════════════════════════════
function TicketCard({ c, onRemove }) {
  const NOTCH = A.bg; // color del fondo del drawer, para simular el troquel
  return (
    <div style={{ position: 'relative', display: 'flex', background: '#fff', borderRadius: 16, boxShadow: '0 10px 26px -18px rgba(11,16,32,0.4)', overflow: 'hidden' }}>
      {/* stub */}
      <div style={{ width: 104, flexShrink: 0, background: c.accent, color: '#fff', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '16px 8px' }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{c.d}</div>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 6, opacity: 0.85 }}>Cupón</div>
      </div>
      {/* troquel */}
      <div style={{ position: 'absolute', left: 104, top: 0, bottom: 0, width: 0, borderLeft: `2px dashed ${A.line}` }} />
      <div style={{ position: 'absolute', left: 104, top: -8, width: 16, height: 16, borderRadius: '50%', background: NOTCH, transform: 'translateX(-50%)' }} />
      <div style={{ position: 'absolute', left: 104, bottom: -8, width: 16, height: 16, borderRadius: '50%', background: NOTCH, transform: 'translateX(-50%)' }} />
      {/* main */}
      <div style={{ flex: 1, minWidth: 0, padding: '14px 44px 14px 20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, color: A.muted, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{c.p}</div>
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, marginTop: 3 }}>{c.t}</div>
        <div style={{ marginTop: 'auto', paddingTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, color: A.muted }}>
            <Icon.calendar width={12} height={12} /> {c.exp}
          </span>
          <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em' }}>{fmt(c.price)}</span>
        </div>
      </div>
      {/* quitar cupón */}
      <button
        onClick={() => onRemove(c.id)}
        aria-label={`Quitar ${c.t}`}
        title="Quitar cupón"
        style={{
          position: 'absolute', top: 10, right: 10, width: 26, height: 26, borderRadius: 8,
          background: '#fff', border: `1px solid ${A.line}`, color: A.muted,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}
      >
        <XIcon width={13} height={13} />
      </button>
    </div>
  );
}

function DrawerTicket({ onClose, cupones, onRemove }) {
  const total = sum(cupones, (c) => c.price);
  const saved = sum(cupones, (c) => c.was - c.price);
  const empty = cupones.length === 0;
  return (
    <>
      {/* header oscuro tipo wallet */}
      <div style={{ background: A.ink, color: '#fff', padding: '20px 24px 22px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(125,161,255,0.18)' }} />
        <div style={{ position: 'absolute', top: 20, right: 30, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,201,60,0.22)' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>Mi cuponera</div>
          <CloseBtn onClose={onClose} light />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8, position: 'relative' }}>
          <span style={{ fontSize: 48, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1 }}>{cupones.length}</span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>{cupones.length === 1 ? 'cupón listo para canjear' : 'cupones listos para canjear'}</span>
        </div>
        {!empty && (
          <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,201,60,0.16)', color: A.yellow, padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, position: 'relative' }}>
            <Icon.bolt width={12} height={12} /> Ahorrás {fmt(saved)} en total
          </div>
        )}
      </div>

      {/* tickets */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {empty ? (
          <div style={{ margin: 'auto 0', textAlign: 'center', padding: '40px 20px', color: A.muted }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: A.primarySoft, color: A.primary, display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
              <Icon.ticket width={26} height={26} />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: A.ink, letterSpacing: '-0.02em' }}>Tu cuponera está vacía</div>
            <p style={{ margin: '6px 0 0', fontSize: 13 }}>Sumá ofertas y aparecerán acá como cupones listos para canjear.</p>
          </div>
        ) : (
          cupones.map((c) => <TicketCard key={c.id} c={c} onRemove={onRemove} />)
        )}
        <button onClick={onClose} style={{ marginTop: 2, padding: '13px 0', background: '#fff', border: `1px dashed ${A.line}`, borderRadius: 14, color: A.primary, fontFamily: A.font, fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Icon.plus width={16} height={16} /> {empty ? 'Explorar ofertas' : 'Agregar otro cupón'}
        </button>
      </div>

      {/* footer */}
      <div style={{ borderTop: `1px solid ${A.line}`, padding: '16px 22px 22px', background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Total a pagar</span>
          <span style={{ fontSize: 27, fontWeight: 800, letterSpacing: '-0.03em' }}>{fmt(total)}</span>
        </div>
        <button disabled={empty} style={{
          width: '100%', background: empty ? A.line : A.primary, color: empty ? A.muted : '#fff',
          border: 'none', borderRadius: 14, padding: '15px 0', fontFamily: A.font, fontWeight: 600, fontSize: 15.5, letterSpacing: '-0.01em',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9,
          cursor: empty ? 'not-allowed' : 'pointer',
          boxShadow: empty ? 'none' : '0 14px 30px -12px rgba(37,69,230,0.6)',
        }}>
          {empty ? 'Agregá un cupón para pagar' : `Pagar y activar ${cupones.length} ${cupones.length === 1 ? 'cupón' : 'cupones'}`}
          {!empty && <Icon.arrowR width={18} height={18} />}
        </button>
        {!empty && <TrustLine />}
      </div>
    </>
  );
}

// ───────────────────────── Host ─────────────────────────
const VARIANTS = [
  { id: 1, name: 'Clásico',       sub: 'Lista + resumen' },
  { id: 2, name: 'Confirmación',  sub: 'Éxito + recién agregado' },
  { id: 3, name: 'Ticket',        sub: 'Cuponera tipo wallet' },
];

function App() {
  const [variant, setVariant] = useState(1);
  const [open, setOpen] = useState(false);
  const [cupones, setCupones] = useState(CUPONES);
  const removeCupon = (id) => setCupones((list) => list.filter((c) => c.id !== id));
  const [animKey, setAnimKey] = useState(0);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState(0);
  const pageRef = useRef(null);
  const innerRef = useRef(null);
  const variantRef = useRef(variant);
  variantRef.current = variant;

  const trigger = () => { setOpen(true); setAnimKey((k) => k + 1); };

  // fit-to-width de la página de oferta (1440)
  useEffect(() => {
    const fit = () => setScale(Math.min(1, window.innerWidth / 1440));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  useEffect(() => {
    const el = innerRef.current;
    if (!el || !window.ResizeObserver) return;
    const ro = new ResizeObserver(() => setH(el.offsetHeight));
    ro.observe(el);
    setH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // delegación: cualquier botón "Añadir a cuponera" dentro de la página abre el drawer
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const onClick = (e) => {
      const btn = e.target.closest('button');
      if (btn && /cuponera/i.test(btn.textContent || '')) {
        e.preventDefault();
        trigger();
      }
    };
    el.addEventListener('click', onClick);
    return () => el.removeEventListener('click', onClick);
  }, []);

  // Esc cierra
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: A.bg }}>
      {/* Página de oferta real, escalada al ancho */}
      <div style={{ width: 1440 * scale, height: h * scale, margin: '0 auto', position: 'relative' }}>
        <div ref={(n) => { pageRef.current = n; innerRef.current = n; }} style={{ width: 1440, transform: `scale(${scale})`, transformOrigin: 'top left', position: 'absolute', top: 0, left: 0 }}>
          <AOfertaDetalle />
        </div>
      </div>

      {/* Drawer */}
      <Drawer open={open} onClose={() => setOpen(false)} dark={variant === 3}>
        {variant === 1 && <DrawerClasico onClose={() => setOpen(false)} />}
        {variant === 2 && <DrawerConfirmacion onClose={() => setOpen(false)} animKey={animKey} />}
        {variant === 3 && <DrawerTicket onClose={() => setOpen(false)} cupones={cupones} onRemove={removeCupon} />}
      </Drawer>

      {/* Barra de control flotante */}
      <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 90, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, padding: 8, boxShadow: '0 24px 60px -24px rgba(11,16,32,0.45)', fontFamily: A.font, maxWidth: '94vw' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0 4px 0 8px' }}>Diseño</span>
        <div style={{ display: 'flex', gap: 4, background: A.bg, borderRadius: 11, padding: 4 }}>
          {VARIANTS.map((v) => (
            <button key={v.id} onClick={() => { setVariant(v.id); setOpen(true); setAnimKey((k) => k + 1); }} style={{
              padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: variant === v.id ? A.ink : 'transparent',
              color: variant === v.id ? '#fff' : A.ink2,
              fontFamily: A.font, fontWeight: 600, fontSize: 13, lineHeight: 1.1, textAlign: 'left',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ opacity: 0.6, fontSize: 11 }}>{v.id}</span> {v.name}</div>
            </button>
          ))}
        </div>
        <div style={{ width: 1, height: 30, background: A.line }} />
        <button onClick={trigger} style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 11, padding: '11px 16px', fontFamily: A.font, fontWeight: 600, fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
          <Icon.ticket width={16} height={16} /> Añadir a cuponera
        </button>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
