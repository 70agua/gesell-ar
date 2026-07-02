// ============================================================
//  src/views/CheckoutView.jsx — Checkout estándar del turista
//  v1: sin reserva, sin códigos de descuento
// ============================================================
import React, { useState, useEffect } from 'react';
import { useCuponera } from '../lib/cuponera';
import { getWallet } from '../lib/gamificacion';

const A = {
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  primary:     '#2545E6',
  primaryDark: '#1731B8',
  primarySoft: '#EEF1FF',
  bg:          '#F7F7F8',
  yellow:      '#FFC93C',
  green:       '#10A36B',
  greenSoft:   '#ECFDF5',
  red:         '#EF4444',
  font:        "'Inter', system-ui, sans-serif",
};

const fmt = (n) => '$' + Math.round(n).toLocaleString('es-AR');

// ── Iconos ────────────────────────────────────────────────────

function ArrowLeftIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
}
function CheckCircleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <path d="M22 4 12 14.01l-3-3"/>
    </svg>
  );
}
function CreditCardIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="1" y="4" width="22" height="16" rx="2"/>
      <path d="M1 10h22"/>
    </svg>
  );
}
function BankIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  );
}
function CoinsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="8" cy="8" r="6"/>
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18"/>
      <path d="M7 6h1v4"/>
      <path d="m16.71 13.88.7.71-2.82 2.82"/>
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
function ClockIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
    </svg>
  );
}

// ── CuponRow: resumen de 1 cupón en el checkout ───────────────
function CuponRow({ c }) {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'flex-start',
      padding: '16px 0', borderBottom: `1px solid ${A.line}`,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12, flexShrink: 0,
        background: c.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: 11, fontWeight: 800, textAlign: 'center', lineHeight: 1.2, padding: 4,
      }}>
        {c.d}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: A.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.p}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: A.ink, marginTop: 2, lineHeight: 1.3 }}>{c.t}</div>
        <div style={{ fontSize: 12, color: A.muted, marginTop: 4 }}>{c.exp}</div>
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color: A.ink, flexShrink: 0 }}>{fmt(c.price)}</div>
    </div>
  );
}

// ── Vista de éxito post-pago (v1 inline, reemplazar con PostPagoView en ítem 4) ──
function SuccessState({ cupones, cashback, onDone }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: A.greenSoft, color: A.green,
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
      }}>
        <CheckCircleIcon width={36} height={36} />
      </div>
      <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: A.ink }}>
        ¡Cupones activados!
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 15, color: A.ink2, lineHeight: 1.5 }}>
        Tus {cupones.length === 1 ? 'cupón está listo' : `${cupones.length} cupones están listos'`} para canjear en el local.
      </p>

      {cashback > 0 && (
        <div style={{
          background: A.greenSoft, border: `1px solid #A7F3D0`,
          borderRadius: 14, padding: '14px 20px', marginBottom: 24,
          display: 'inline-flex', alignItems: 'center', gap: 10,
        }}>
          <CoinsIcon width={20} height={20} style={{ color: A.green }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: A.green }}>
            +{cashback} créditos de regalo acreditados en tu billetera
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cupones.map(c => (
          <div key={c.id} style={{
            background: A.bg, borderRadius: 12, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: c.accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 9, fontWeight: 800, textAlign: 'center',
            }}>{c.d}</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 12, color: A.muted }}>{c.p}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: A.ink }}>{c.t}</div>
            </div>
            <div style={{
              fontSize: 10, fontWeight: 700, color: A.green, textTransform: 'uppercase',
              letterSpacing: '0.06em', background: A.greenSoft, padding: '3px 8px', borderRadius: 6,
            }}>ACTIVO</div>
          </div>
        ))}
      </div>

      <button
        onClick={onDone}
        style={{
          marginTop: 32, width: '100%', background: A.primary, color: '#fff',
          border: 'none', borderRadius: 14, padding: '15px 0',
          fontFamily: A.font, fontSize: 15, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Ver mis cupones
      </button>
    </div>
  );
}

// ── Vista de transferencia pendiente ──────────────────────────
function PendingState({ onDone }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: '#FEF3C7', color: '#D97706',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
      }}>
        <ClockIcon width={36} height={36} />
      </div>
      <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: A.ink }}>
        Compra pendiente
      </h2>
      <p style={{ margin: '0 0 24px', fontSize: 15, color: A.ink2, lineHeight: 1.5 }}>
        Tu compra está pendiente. Revisaremos tu comprobante y activaremos el cupón en breve.
      </p>
      <div style={{
        background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 14,
        padding: '16px 20px', marginBottom: 24, textAlign: 'left',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>Datos para transferir:</div>
        <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.8 }}>
          <div><strong>CBU:</strong> 0000003100050000000000</div>
          <div><strong>Alias:</strong> CUPONEAR.GESELL</div>
          <div><strong>Titular:</strong> Cuponear S.A.S.</div>
        </div>
      </div>
      <button
        onClick={onDone}
        style={{
          width: '100%', background: A.ink, color: '#fff',
          border: 'none', borderRadius: 14, padding: '15px 0',
          fontFamily: A.font, fontSize: 15, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Entendido
      </button>
    </div>
  );
}

// ── Checkout principal ────────────────────────────────────────
export default function CheckoutView({ session, onBack, onSuccess }) {
  const { cupones, clearCuponera } = useCuponera();

  const [creditosDisponibles, setCreditosDisponibles] = useState(0);
  const [aplicarCreditos, setAplicarCreditos]         = useState(false);
  const [metodoPago, setMetodoPago]                   = useState(null); // 'tarjeta' | 'transferencia'
  const [step, setStep]                               = useState('checkout'); // 'checkout' | 'success' | 'pending'
  const [procesando, setProcesando]                   = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    getWallet(session.user.id).then(w => setCreditosDisponibles(w.balance || 0));
  }, [session]);

  const subtotal      = cupones.reduce((s, c) => s + c.price, 0);
  const descCreditos  = aplicarCreditos ? Math.min(creditosDisponibles * 2000, subtotal) : 0;
  const totalFinal    = Math.max(0, subtotal - descCreditos);
  const cashback      = Math.round(totalFinal * 0.05 / 2000); // créditos que gana (5% del total)

  const handlePagar = async () => {
    if (!metodoPago) return;
    setProcesando(true);

    // Simular latencia de procesamiento
    await new Promise(r => setTimeout(r, 1200));

    if (metodoPago === 'tarjeta') {
      clearCuponera();
      setStep('success');
    } else {
      clearCuponera();
      setStep('pending');
    }
    setProcesando(false);
  };

  if (!cupones.length && step === 'checkout') {
    return (
      <div style={{ textAlign: 'center', padding: '80px 24px', fontFamily: A.font }}>
        <p style={{ color: A.muted, fontSize: 15 }}>No tenés cupones en tu cuponera.</p>
        <button onClick={onBack} style={{ marginTop: 16, background: 'none', border: 'none', color: A.primary, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
          ← Explorar ofertas
        </button>
      </div>
    );
  }

  if (step === 'success') return <SuccessState cupones={cupones} cashback={cashback} onDone={onSuccess} />;
  if (step === 'pending') return <PendingState onDone={onSuccess} />;

  return (
    <div style={{ fontFamily: A.font, minHeight: '100vh', background: A.bg }}>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${A.line}`, padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: A.ink2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, padding: 0 }}
        >
          <ArrowLeftIcon width={18} height={18} /> Volver
        </button>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em', color: A.ink }}>Confirmar compra</h1>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 60px' }}>

        {/* ── Bloque 1: Detalle de cupones ── */}
        <section style={{ background: '#fff', borderRadius: 16, padding: '20px 20px 4px', marginBottom: 16, boxShadow: '0 1px 4px rgba(11,16,32,0.06)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {cupones.length === 1 ? 'Tu cupón' : `Tus ${cupones.length} cupones`}
          </h2>
          {cupones.map(c => <CuponRow key={c.id} c={c} />)}
        </section>

        {/* ── Bloque 2: Resumen de pago ── */}
        <section style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(11,16,32,0.06)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Resumen</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Row label="Precio de cupones" value={fmt(subtotal)} />
            {aplicarCreditos && descCreditos > 0 && (
              <Row label={`Créditos aplicados (${Math.min(creditosDisponibles, Math.ceil(subtotal / 2000))})`} value={`-${fmt(descCreditos)}`} valueColor={A.green} />
            )}
            <div style={{ borderTop: `1px solid ${A.line}`, margin: '4px 0' }} />
            <Row label="Total a pagar" value={fmt(totalFinal)} bold />
            {cashback > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
                background: A.greenSoft, borderRadius: 10, padding: '8px 12px',
              }}>
                <CoinsIcon width={16} height={16} style={{ color: A.green, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: A.green, fontWeight: 600 }}>
                  Ganás +{cashback} créditos de regalo con esta compra
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── Bloque 3: Créditos disponibles ── */}
        {creditosDisponibles > 0 && (
          <section style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: '0 1px 4px rgba(11,16,32,0.06)' }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tus créditos</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: A.ink }}>
                  {creditosDisponibles} créditos disponibles
                </div>
                <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>
                  Equivalen a {fmt(creditosDisponibles * 2000)}
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <span style={{ fontSize: 13, color: A.ink2, fontWeight: 500 }}>Aplicar descuento</span>
                <div
                  onClick={() => setAplicarCreditos(v => !v)}
                  style={{
                    width: 44, height: 24, borderRadius: 12,
                    background: aplicarCreditos ? A.primary : A.line,
                    position: 'relative', cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 2, left: aplicarCreditos ? 22 : 2,
                    width: 20, height: 20, borderRadius: '50%', background: '#fff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    transition: 'left 0.2s',
                  }} />
                </div>
              </label>
            </div>
          </section>
        )}

        {/* ── Bloque 4: Aviso legal ── */}
        <section style={{
          background: A.primarySoft, border: `1px solid #C7D2FE`,
          borderRadius: 14, padding: '14px 16px', marginBottom: 16,
          fontSize: 12.5, color: '#3730A3', lineHeight: 1.6,
        }}>
          <strong>¿Qué estás comprando?</strong> Un cupón de descuento, no el servicio en sí.
          El comercio te aplicará el descuento al momento del canje.{' '}
          Contactate con el proveedor ante cualquier consulta previa.
        </section>

        {/* ── Bloque 5: Método de pago ── */}
        <section style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 24, boxShadow: '0 1px 4px rgba(11,16,32,0.06)' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Método de pago</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <MetodoBtn
              icon={<CreditCardIcon width={20} height={20} />}
              label="Tarjeta de crédito / débito"
              desc="Procesado por MercadoPago · Acreditación inmediata"
              selected={metodoPago === 'tarjeta'}
              onSelect={() => setMetodoPago('tarjeta')}
            />
            <MetodoBtn
              icon={<BankIcon width={20} height={20} />}
              label="Transferencia bancaria"
              desc="El cupón se activa al confirmar el pago (hasta 24 hs)"
              selected={metodoPago === 'transferencia'}
              onSelect={() => setMetodoPago('transferencia')}
            />
          </div>
        </section>

        {/* CTA final */}
        <button
          disabled={!metodoPago || procesando}
          onClick={handlePagar}
          style={{
            width: '100%',
            background: !metodoPago || procesando ? A.line : A.primary,
            color: !metodoPago || procesando ? A.muted : '#fff',
            border: 'none', borderRadius: 14, padding: '16px 0',
            fontFamily: A.font, fontSize: 16, fontWeight: 700,
            cursor: !metodoPago || procesando ? 'not-allowed' : 'pointer',
            boxShadow: !metodoPago || procesando ? 'none' : '0 14px 30px -12px rgba(37,69,230,0.55)',
            transition: 'background 0.18s',
            letterSpacing: '-0.01em',
          }}
        >
          {procesando ? 'Procesando…' : totalFinal === 0 ? 'Activar gratis con créditos' : `Pagar ${fmt(totalFinal)}`}
        </button>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontSize: 12, color: A.muted }}>
          <LockIcon width={13} height={13} /> Pago protegido · Garantía Cuponear
        </div>
      </div>
    </div>
  );
}

// ── Helpers ──
function Row({ label, value, bold, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 14, color: bold ? A.ink : A.ink2, fontWeight: bold ? 700 : 400 }}>{label}</span>
      <span style={{ fontSize: bold ? 20 : 14, fontWeight: bold ? 800 : 500, color: valueColor || (bold ? A.ink : A.ink2), letterSpacing: bold ? '-0.02em' : 0 }}>{value}</span>
    </div>
  );
}

function MetodoBtn({ icon, label, desc, selected, onSelect }) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%', textAlign: 'left',
        background: selected ? A.primarySoft : A.bg,
        border: `2px solid ${selected ? A.primary : A.line}`,
        borderRadius: 12, padding: '14px 16px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
        transition: 'border-color 0.15s, background 0.15s',
        fontFamily: A.font,
      }}
    >
      <div style={{ color: selected ? A.primary : A.muted, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: A.ink }}>{label}</div>
        <div style={{ fontSize: 12, color: A.muted, marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
        border: `2px solid ${selected ? A.primary : A.line}`,
        background: selected ? A.primary : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
      </div>
    </button>
  );
}
