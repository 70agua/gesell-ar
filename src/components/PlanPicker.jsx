// ============================================================
//  src/components/PlanPicker.jsx
//  Selector de plan compartido entre SociosView.jsx y LoginView.jsx
//  (evita que el diseño se desalinee entre las dos pantallas de alta).
//
//  UN SOLO MODELO: los tramos PRO (pro_1 / pro_6 / pro_12) que salen de la
//  tabla `planes`. El viejo Gratis/Plus ya no existe. "Seguir sin plan" no es
//  un plan que se contrata: deja el negocio publicado con `negocios.plan`
//  en 'free', que es el estado de quien todavía no pagó.
//
//  No hace ninguna llamada a Supabase para persistir la elección: solo junta
//  los datos y avisa al padre vía onConfirmFree / onConfirmPlus, porque en
//  SociosView el negocio recién se crea al final del formulario (todavía no
//  hay negocioId acá).
// ============================================================
import { useState, useEffect } from 'react';
import { Smartphone, CreditCard, Building2, Upload } from 'lucide-react';
import { getPlanesPro } from '../lib/planes';

const FONT = "'Inter', system-ui, sans-serif";
const GREY_LINE = '#E2E8F0';
const GREEN = '#10A36B';
const INK = '#0B1020';
const INK2 = '#3D4255';
const MUTED = '#6B7280';

const fmt = n => `$${Math.round(n || 0).toLocaleString('es-AR')}`;

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

// Lo que distingue a un tramo del otro: el compromiso y los créditos de
// arranque. El precio va aparte, que es donde se comparan.
// "Créditos" a secas no se entiende: siempre "créditos publicitarios".
function chipsTramo(p, mensual) {
  const ahorro      = mensual > 0 ? mensual * p.meses - p.total : 0;
  const bonificados = mensual > 0 ? Math.round(ahorro / mensual) : 0;
  const chips = [];
  if (p.meses === 1) chips.push('Sin permanencia');
  else if (bonificados > 0) chips.push(`${bonificados} ${bonificados === 1 ? 'mes bonificado' : 'meses bonificados'}`);
  else if (ahorro > 0) chips.push(`Ahorrás ${fmt(ahorro)}`);
  if (p.creditosMes > 0) chips.push(`${p.creditosMes} créditos publicitarios por mes`);
  if (p.creditosBono > 0) chips.push(`+${p.creditosBono} de bienvenida`);
  return chips;
}

function Tilde({ activo, color }) {
  return (
    <span style={{
      width: 19, height: 19, borderRadius: 999, flexShrink: 0, display: 'grid', placeItems: 'center',
      border: `1.5px solid ${activo ? color : GREY_LINE}`, background: activo ? color : '#fff',
    }}>
      {activo && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
          <path d="m5 12 4.5 4.5L20 6" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

// ─── Una fila de tramo ───────────────────────────────────────
function TramoRow({ p, mensual, activo, color, onSelect }) {
  // Por ley el precio se muestra CON impuestos y se aclara el valor sin
  // impuestos justo debajo.
  const conIva = Math.round((p.precioMes || 0) * 1.21);
  return (
    <button
      type="button" role="radio" aria-checked={activo} onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left',
        padding: '14px 16px', borderRadius: 14, cursor: 'pointer', fontFamily: FONT,
        background: activo ? `${color}0f` : '#fff',
        border: `1.5px solid ${activo ? color : GREY_LINE}`,
        transition: 'all .15s',
      }}>
      <Tilde activo={activo} color={color} />

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: activo ? color : INK, lineHeight: 1.2 }}>{p.nombre}</span>
          {/* El "más elegido" sale de la base (planes.destacado), no de una
              constante acá: se cambia sin tocar código. */}
          {p.destacado && (
            <span style={{
              background: color, color: '#fff', fontSize: 9.5, fontWeight: 800, letterSpacing: '0.04em',
              textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap',
            }}>El más elegido</span>
          )}
        </span>
        <span style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
          {chipsTramo(p, mensual).map(ch => (
            <span key={ch} style={{
              fontSize: 11.5, fontWeight: 600, color: INK2, lineHeight: 1.3,
              background: activo ? '#fff' : '#F7F7F8', border: `1px solid ${GREY_LINE}`,
              padding: '3px 9px', borderRadius: 999,
            }}>{ch}</span>
          ))}
        </span>
      </span>

      <span style={{ textAlign: 'right', flexShrink: 0 }}>
        <span style={{ display: 'block', fontSize: 17, fontWeight: 900, color: activo ? color : INK, letterSpacing: '-0.02em' }}>
          {fmt(conIva)}
        </span>
        <span style={{ display: 'block', fontSize: 11, color: MUTED, marginTop: 2 }}>por mes</span>
        <span style={{ display: 'block', fontSize: 10.5, fontStyle: 'italic', color: MUTED, marginTop: 3 }}>
          sin imp. {fmt(p.precioMes)}
        </span>
      </span>
    </button>
  );
}

// ─── Pantalla de pago (reemplaza la lista de tramos al elegir uno) ─
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

  // El tramo elegido viaja con los datos de pago: es lo que define la
  // suscripción que se crea del otro lado.
  const base = { unidadesDeclaradas, codigoPlan: plan?.id, nombrePlan: plan?.nombre };

  function confirmarTarjeta() {
    if (!titular.trim()) return setError('Ingresá el nombre del titular');
    if (!/^\d{4}$/.test(numero)) return setError('Ingresá los últimos 4 dígitos de la tarjeta');
    if (!/^\d{2}\/\d{2}$/.test(vencimiento)) return setError('Vencimiento en formato MM/AA');
    setError('');
    onConfirmar({ ...base, titular: titular.trim(), ultimos4: numero, vencimiento, formaPago: 'tarjeta' });
  }

  function confirmarMercadoPago() {
    setConectando(true);
    setTimeout(() => {
      onConfirmar({ ...base, titular: 'Mercado Pago', ultimos4: '0000', vencimiento: '', formaPago: 'mercadopago' });
    }, 900);
  }

  function confirmarTransferencia() {
    if (!comprobanteFile) return setError('Subí el comprobante de la transferencia para continuar');
    setError('');
    onConfirmar({ ...base, titular: 'Transferencia', ultimos4: '0000', vencimiento: '', formaPago: 'transferencia', comprobanteFile });
  }

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', background: '#fff', border: `1px solid ${GREY_LINE}`, borderRadius: 20, padding: '24px 22px' }}>
      <button type="button" onClick={onVolver} style={{ background: 'none', border: 'none', color: MUTED, fontFamily: FONT, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 14 }}>
        ← Volver a los planes
      </button>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontFamily: FONT, fontSize: 15, fontWeight: 800, color: INK }}>{plan?.nombre}</span>
        <span style={{ fontFamily: FONT, fontSize: 14, fontWeight: 800, color: primaryColor }}>
          {fmt(plan?.precioMes)}<span style={{ fontSize: 11, fontWeight: 600, color: MUTED }}> +IVA/mes</span>
        </span>
      </div>
      {plan?.meses > 1 && (
        <div style={{ fontFamily: FONT, fontSize: 12, color: MUTED, marginBottom: 4 }}>
          {plan.meses} meses por adelantado · {fmt(plan.total)} +IVA en total
        </div>
      )}
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
            Tu cuenta queda operativa al instante, con todo lo que incluye el plan. El comprobante es solo para nuestra administración.
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

export default function PlanPicker({ planInicial = null, onConfirmFree, onConfirmPlus, primaryColor = '#475be1', saving = false, unidadesDeclaradas = 0 }) {
  const [planes, setPlanes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [elegido, setElegido] = useState(null);   // codigo del tramo seleccionado
  const [pagando, setPagando] = useState(false);  // muestra la pantalla de pago

  useEffect(() => {
    getPlanesPro().then(ps => {
      setPlanes(ps);
      // Manda el tramo con el que el usuario entró; si no vino ninguno, el
      // destacado de la base.
      const inicial = ps.find(p => p.id === planInicial) || ps.find(p => p.destacado) || ps[0];
      setElegido(inicial?.id || null);
      setLoading(false);
    }).catch(() => { setPlanes([]); setLoading(false); });
  }, [planInicial]);

  if (loading) {
    return <div style={{ padding: '30px 0', textAlign: 'center', fontFamily: FONT, fontSize: 13, color: MUTED }}>Cargando planes…</div>;
  }

  const plan = planes.find(p => p.id === elegido) || null;

  if (pagando && plan) {
    return (
      <PantallaPago
        plan={plan}
        primaryColor={primaryColor}
        unidadesDeclaradas={unidadesDeclaradas}
        saving={saving}
        onVolver={() => setPagando(false)}
        onConfirmar={onConfirmPlus}
      />
    );
  }

  // Referencia para calcular meses bonificados: el tramo más caro por mes
  // (el mensual sin permanencia) es el precio "de lista".
  const mensual = Math.max(...planes.map(p => p.precioMes || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div role="radiogroup" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {planes.map(p => (
          <TramoRow key={p.id} p={p} mensual={mensual} color={primaryColor}
            activo={p.id === elegido} onSelect={() => setElegido(p.id)} />
        ))}
      </div>

      {planes.length === 0 && (
        <div style={{ fontFamily: FONT, fontSize: 13, color: MUTED, textAlign: 'center', padding: '20px 0' }}>
          No hay planes disponibles en este momento.
        </div>
      )}

      {plan && (
        <button type="button" onClick={() => setPagando(true)}
          style={{
            width: '100%', padding: '15px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
            fontFamily: FONT, fontWeight: 800, fontSize: 15, background: primaryColor, color: '#fff', marginTop: 4,
          }}>
          Contratar {plan.nombre}
        </button>
      )}

      {/* No es un plan: es seguir sin contratar. Publicar no cuesta nada, así
          que esto tiene que estar siempre disponible y no esconderse. */}
      <button type="button" onClick={onConfirmFree}
        style={{
          width: '100%', padding: '12px 0', borderRadius: 14, cursor: 'pointer',
          fontFamily: FONT, fontWeight: 700, fontSize: 13.5, background: 'none',
          border: `1px solid ${GREY_LINE}`, color: INK2,
        }}>
        Seguir sin plan — publicar es gratis
      </button>
    </div>
  );
}
