// ============================================================
//  src/components/PlanPicker.jsx
//  Selector de plan Gratis/Plus compartido entre SociosView.jsx
//  y LoginView.jsx (evita que el diseño se desalinee entre las
//  dos pantallas de alta, como pasó antes con el plan Black).
//
//  No hace ninguna llamada a Supabase para persistir la elección:
//  solo junta los datos y avisa al padre via onConfirmFree /
//  onConfirmPlus, porque en SociosView el negocio recién se crea
//  al final del formulario (todavía no hay negocioId acá).
// ============================================================
import { useState, useEffect } from 'react';
import { Smartphone, CreditCard, Building2, Upload } from 'lucide-react';
import { getPlanesConfig } from '../lib/planes';

const FONT = "'Inter', system-ui, sans-serif";
const GREY_LINE = '#E2E8F0';
const GREEN = '#10A36B';
const INK = '#0B1020';
const INK2 = '#3D4255';
const MUTED = '#6B7280';

// Copy propio de la tarjeta de pricing (encabezado con tagline, texto del CTA
// y link de ayuda). No vive en la tabla `planes` porque es texto de esta
// pantalla, no configuración de plan; nombre/precio/descripción/beneficios sí
// vienen de la DB vía getPlanesConfig().
const EXTRA_PLAN = {
  free: {
    encabezado: '¿Te interesa publicitar tu producto o servicio y buscás traccionar más público?',
    cta: 'Publicar ofertas GRATIS',
  },
  plus: {
    encabezado: 'Ideal para alojamientos, gastronómicos ó agencias de turismo.',
    cta: 'Regalar cuponeras SIN LÍMITE',
    ayuda: 'Conocé más',
  },
};

function Check({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="m5 12 4.5 4.5L20 6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const FORMAS_PAGO = [
  { id: 'mercadopago',   label: 'Mercado Pago', icon: <Smartphone size={18} />, desc: 'Suscripción con tu cuenta MP' },
  { id: 'tarjeta',       label: 'Tarjeta',      icon: <CreditCard size={18} />, desc: 'Crédito o débito' },
  { id: 'transferencia', label: 'Transferencia', icon: <Building2 size={18} />, desc: 'Con comprobante' },
];

function formatVencimiento(raw) {
  const digitos = raw.replace(/\D/g, '').slice(0, 4);
  if (digitos.length <= 2) return digitos;
  return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
}

// ─── Pantalla de pago (reemplaza el grid de planes al elegir Plus) ─
function PantallaPago({ plan, primaryColor, unidadesDeclaradas, onConfirmar, onVolver, saving }) {
  const [formaPago, setFormaPago]   = useState('mercadopago');
  const [titular, setTitular]       = useState('');
  const [numero, setNumero]         = useState(''); // solo últimos 4, se aclara en el label
  const [vencimiento, setVencimiento] = useState('');
  const [conectando, setConectando] = useState(false);
  const [error, setError]           = useState('');
  const [comprobanteFile, setComprobanteFile] = useState(null);

  const inp = {
    width: '100%', padding: '11px 13px', border: `1px solid ${GREY_LINE}`, borderRadius: 10,
    fontFamily: FONT, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const lbl = { display: 'block', fontSize: 11.5, fontWeight: 700, color: MUTED, marginBottom: 5, fontFamily: FONT };

  function confirmarTarjeta() {
    if (!titular.trim()) return setError('Ingresá el nombre del titular');
    if (!/^\d{4}$/.test(numero)) return setError('Ingresá los últimos 4 dígitos de la tarjeta');
    if (!/^\d{2}\/\d{2}$/.test(vencimiento)) return setError('Vencimiento en formato MM/AA');
    setError('');
    onConfirmar({ titular: titular.trim(), ultimos4: numero, vencimiento, unidadesDeclaradas, formaPago: 'tarjeta' });
  }

  function confirmarMercadoPago() {
    setConectando(true);
    setTimeout(() => {
      onConfirmar({ titular: 'Mercado Pago', ultimos4: '0000', vencimiento: '', unidadesDeclaradas, formaPago: 'mercadopago' });
    }, 900);
  }

  function confirmarTransferencia() {
    if (!comprobanteFile) return setError('Subí el comprobante de la transferencia para continuar');
    setError('');
    onConfirmar({ titular: 'Transferencia', ultimos4: '0000', vencimiento: '', unidadesDeclaradas, formaPago: 'transferencia', comprobanteFile });
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', background: '#fff', border: `1px solid ${GREY_LINE}`, borderRadius: 20, padding: '24px 22px' }}>
      <button type="button" onClick={onVolver} style={{ background: 'none', border: 'none', color: MUTED, fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 14 }}>
        ← Volver a los planes
      </button>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: INK }}>Plan {plan.nombre}</span>
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: primaryColor }}>${(plan.precioMes || 0).toLocaleString('es-AR')}<span style={{ fontSize: 11, fontWeight: 600, color: MUTED }}> +IVA/mes</span></span>
      </div>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: MUTED, fontFamily: FONT }}>No procesamos el cobro todavía — esto solo registra tu intención de pago. Nunca pedimos el número completo de tarjeta ni el CVV.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {FORMAS_PAGO.map(f => (
          <button key={f.id} type="button" onClick={() => setFormaPago(f.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 9px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
              border: `1.5px solid ${formaPago === f.id ? primaryColor : GREY_LINE}`, background: formaPago === f.id ? `${primaryColor}0f` : '#fff' }}>
            <span style={{ color: formaPago === f.id ? primaryColor : MUTED, flexShrink: 0 }}>{f.icon}</span>
            <span style={{ minWidth: 0 }}>
              <div style={{ fontFamily: FONT, fontSize: 11.5, fontWeight: 700, color: formaPago === f.id ? primaryColor : INK2 }}>{f.label}</div>
              <div style={{ fontFamily: FONT, fontSize: 9.5, color: MUTED }}>{f.desc}</div>
            </span>
          </button>
        ))}
      </div>

      {formaPago === 'mercadopago' && (
        <button type="button" onClick={confirmarMercadoPago} disabled={saving || conectando}
          style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', background: '#009EE3', color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 13.5, cursor: (saving || conectando) ? 'not-allowed' : 'pointer', opacity: (saving || conectando) ? 0.7 : 1 }}>
          {conectando ? 'Conectando con Mercado Pago…' : 'Continuar con Mercado Pago'}
        </button>
      )}

      {formaPago === 'tarjeta' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} onClick={e => e.stopPropagation()}>
          <div>
            <label style={lbl}>Titular de la tarjeta</label>
            <input value={titular} onChange={e => setTitular(e.target.value)} style={inp} placeholder="Como figura en la tarjeta" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Últimos 4 dígitos</label>
              <input value={numero} onChange={e => setNumero(e.target.value.replace(/\D/g, '').slice(0, 4))} style={inp} placeholder="1234" inputMode="numeric" />
            </div>
            <div>
              <label style={lbl}>Vencimiento</label>
              <input value={vencimiento} onChange={e => setVencimiento(formatVencimiento(e.target.value))} style={inp} placeholder="MM/AA" inputMode="numeric" maxLength={5} />
            </div>
          </div>
          {error && <div style={{ fontSize: 12, color: '#ef4444', fontFamily: FONT }}>{error}</div>}
          <button type="button" onClick={confirmarTarjeta} disabled={saving}
            style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', background: primaryColor, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 13.5, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
            Confirmar pago
          </button>
        </div>
      )}

      {formaPago === 'transferencia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} onClick={e => e.stopPropagation()}>
          <div style={{ background: '#f8fafc', border: `1px solid ${GREY_LINE}`, borderRadius: 12, padding: '12px 14px', fontFamily: FONT, fontSize: 12.5, color: INK2, lineHeight: 1.7 }}>
            <div><b>CBU:</b> 0000003100089489894505</div>
            <div><b>Alias:</b> CUPONEAR</div>
            <div><b>Banco:</b> Banco Galicia</div>
            <div><b>Razón social:</b> Cuponear SRL</div>
          </div>
          <p style={{ margin: 0, fontSize: 11.5, color: MUTED, fontFamily: FONT, lineHeight: 1.4 }}>
            Tu cuenta queda operativa al instante, pero no vas a poder publicar cuponeras regalo hasta que aprobemos el comprobante.
          </p>
          <div>
            <label style={lbl}>Comprobante de transferencia</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 13px', border: `1.5px dashed ${comprobanteFile ? GREEN : GREY_LINE}`, borderRadius: 10, cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, color: comprobanteFile ? GREEN : MUTED }}>
              <Upload size={15} />
              {comprobanteFile ? comprobanteFile.name : 'Subir imagen o PDF'}
              <input type="file" accept="image/*,.pdf" onChange={e => setComprobanteFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
            </label>
          </div>
          {error && <div style={{ fontSize: 12, color: '#ef4444', fontFamily: FONT }}>{error}</div>}
          <button type="button" onClick={confirmarTransferencia} disabled={saving || !comprobanteFile}
            style={{ width: '100%', padding: '13px 0', borderRadius: 12, border: 'none', background: primaryColor, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 13.5, cursor: (saving || !comprobanteFile) ? 'not-allowed' : 'pointer', opacity: (saving || !comprobanteFile) ? 0.5 : 1 }}>
            Confirmar pago
          </button>
        </div>
      )}
    </div>
  );
}

export default function PlanPicker({ onConfirmFree, onConfirmPlus, primaryColor = '#475be1', saving = false, unidadesDeclaradas = 0 }) {
  const [planes, setPlanes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(false); // muestra la pantalla de pago del plan Plus

  useEffect(() => {
    getPlanesConfig().then(p => { setPlanes(p); setLoading(false); });
  }, []);

  if (loading) {
    return <div style={{ padding: '30px 0', textAlign: 'center', fontFamily: FONT, fontSize: 13, color: MUTED }}>Cargando planes…</div>;
  }

  if (expandido) {
    const planPlus = planes.find(p => p.id !== 'free');
    return (
      <PantallaPago
        plan={planPlus}
        primaryColor={primaryColor}
        unidadesDeclaradas={unidadesDeclaradas}
        saving={saving}
        onVolver={() => setExpandido(false)}
        onConfirmar={onConfirmPlus}
      />
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, alignItems: 'stretch' }}>
      {planes.map(p => {
        const esGratis = p.id === 'free';
        const accent   = esGratis ? GREEN : primaryColor;
        const extra    = EXTRA_PLAN[esGratis ? 'free' : 'plus'] || {};
        // Por ley el precio se muestra CON impuestos (+21% IVA) y se aclara el
        // valor sin impuestos justo debajo.
        const sinImp   = p.precioMes || 0;
        const precio   = Math.round(sinImp * 1.21).toLocaleString('es-AR');

        return (
          <div key={p.id}
            style={{
              background: '#fff', border: `1px solid ${GREY_LINE}`, borderRadius: 22,
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 18px 50px -32px rgba(11,16,32,0.30)',
            }}>

            {/* Encabezado con tagline: lavanda suave (Gratis) o color pleno (Plus) */}
            <div style={{ padding: '22px 26px', background: esGratis ? `${primaryColor}12` : accent }}>
              <p style={{ margin: 0, fontFamily: FONT, fontStyle: 'italic', fontWeight: 600, fontSize: 14, lineHeight: 1.4, color: esGratis ? INK : '#fff' }}>
                {extra.encabezado}
              </p>
            </div>

            {/* Cuerpo */}
            <div style={{ padding: '24px 26px 26px', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ fontFamily: FONT, fontWeight: 800, fontSize: 24, letterSpacing: '0.02em', color: accent, lineHeight: 1 }}>
                {p.nombre}
              </div>

              <p style={{ fontFamily: FONT, fontSize: 14, fontWeight: 600,color: INK2, lineHeight: 1.5, margin: '12px 0 18px' }}>
                {p.descripcion}
              </p>

              {/* Precio (con IVA) + aclaración sin impuestos */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <span style={{ fontFamily: FONT, fontSize: 19, fontWeight: 800, color: accent }}>AR$</span>
                  <span style={{ fontFamily: FONT, fontSize: 34, fontWeight: 900, color: accent, letterSpacing: '-0.02em', lineHeight: 1 }}>{precio}</span>
                  <span style={{ fontFamily: FONT, fontSize: 15, color: MUTED }}>/por mes</span>
                </div>
                <div style={{ fontFamily: FONT, fontSize: 12.5, fontStyle: 'italic', color: MUTED, marginTop: 5 }}>
                  Precio sin impuestos: ${sinImp.toLocaleString('es-AR')}
                </div>
              </div>

              {/* Beneficios */}
              {p.beneficios.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 24 }}>
                  {p.beneficios.map(b => (
                    <div key={b} style={{ display: 'flex', gap: 10, fontFamily: FONT, fontSize: 14, color: INK2, lineHeight: 1.4 }}>
                      <Check color={GREEN} />{b}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ flex: 1 }} />

              <button type="button"
                onClick={() => { if (esGratis) onConfirmFree(); else setExpandido(true); }}
                style={{
                  width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
                  fontFamily: FONT, fontWeight: 800, fontSize: 15, background: accent, color: '#fff',
                }}>
                {extra.cta}
              </button>

              {/* Slot de altura fija bajo el CTA: mantiene los dos botones
                  alineados aunque sólo Plus tenga el link "¿Cómo funciona?". */}
              <div style={{ minHeight: 20, marginTop: 14, textAlign: 'center' }}>
                {extra.ayuda && (
                  <span style={{ fontFamily: FONT, fontSize: 14, color: INK2 }}>
                    ¿Cómo funciona?{' '}
                    <button type="button" onClick={() => setExpandido(true)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: FONT, fontSize: 14, fontWeight: 700, fontStyle: 'italic', color: accent }}>
                      {extra.ayuda}
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
