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
import React, { useState, useEffect } from 'react';
import { getPlanesConfig } from '../lib/planes';

const FONT = "'Inter', system-ui, sans-serif";
const GREY_LINE = '#E2E8F0';
const GREEN = '#10A36B';
const INK = '#0B1020';
const INK2 = '#3D4255';
const MUTED = '#6B7280';

function Check({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, marginTop: 2 }}>
      <path d="m5 12 4.5 4.5L20 6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CardTarjeta({ primaryColor, unidades, setUnidades, onConfirmar, saving }) {
  const [titular, setTitular]       = useState('');
  const [numero, setNumero]         = useState(''); // solo últimos 4, se aclara en el label
  const [vencimiento, setVencimiento] = useState('');
  const [error, setError]           = useState('');

  const inp = {
    width: '100%', padding: '10px 12px', border: `1px solid ${GREY_LINE}`, borderRadius: 10,
    fontFamily: FONT, fontSize: 13, outline: 'none', boxSizing: 'border-box',
  };
  const lbl = { display: 'block', fontSize: 11.5, fontWeight: 700, color: MUTED, marginBottom: 5, fontFamily: FONT };

  function confirmar() {
    if (!titular.trim()) return setError('Ingresá el nombre del titular');
    if (!/^\d{4}$/.test(numero)) return setError('Ingresá los últimos 4 dígitos de la tarjeta');
    if (!/^\d{2}\/\d{2}$/.test(vencimiento)) return setError('Vencimiento en formato MM/AA');
    setError('');
    onConfirmar({ titular: titular.trim(), ultimos4: numero, vencimiento });
  }

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px dashed ${GREY_LINE}`, display: 'flex', flexDirection: 'column', gap: 10 }} onClick={e => e.stopPropagation()}>
      <p style={{ margin: 0, fontSize: 11.5, color: MUTED, lineHeight: 1.4 }}>
        No procesamos el cobro todavía — esto solo registra tu intención de pago. Nunca pedimos el número completo de tarjeta ni el CVV.
      </p>
      <div>
        <label style={lbl}>¿Cuántas unidades tenés? (habitaciones, mesas, cupo)</label>
        <input type="number" min="1" value={unidades} onChange={e => setUnidades(e.target.value)} style={inp} placeholder="Ej: 12" />
      </div>
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
          <input value={vencimiento} onChange={e => setVencimiento(e.target.value)} style={inp} placeholder="MM/AA" />
        </div>
      </div>
      {error && <div style={{ fontSize: 12, color: '#ef4444', fontFamily: FONT }}>{error}</div>}
      <button type="button" onClick={confirmar} disabled={saving}
        style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: primaryColor, color: '#fff', fontFamily: FONT, fontWeight: 800, fontSize: 13.5, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1 }}>
        Confirmar y continuar
      </button>
    </div>
  );
}

export default function PlanPicker({ value, onConfirmFree, onConfirmPlus, primaryColor = '#475be1', saving = false }) {
  const [planes, setPlanes]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState(false); // muestra el mini-form de tarjeta del plan Plus
  const [unidades, setUnidades]   = useState('');

  useEffect(() => {
    getPlanesConfig().then(p => { setPlanes(p); setLoading(false); });
  }, []);

  if (loading) {
    return <div style={{ padding: '30px 0', textAlign: 'center', fontFamily: FONT, fontSize: 13, color: MUTED }}>Cargando planes…</div>;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, alignItems: 'start' }}>
      {planes.map(p => {
        const esGratis = p.id === 'free';
        const accent   = esGratis ? GREEN : primaryColor;
        const selected = value === p.id || (!esGratis && expandido);
        const mesesTxt = p.mesesContrato ? `Contratando por ${p.mesesContrato} ${p.mesesContrato === 1 ? 'mes' : 'meses'}` : null;
        const bonoTxt  = p.mesesGratisBono ? `+ ${p.mesesGratisBono} ${p.mesesGratisBono === 1 ? 'mes extra' : 'meses extra'} SIN CARGO (luego del primer año)` : null;

        return (
          <div key={p.id}
            style={{
              background: '#fff', border: `2px solid ${selected ? accent : GREY_LINE}`, borderRadius: 18,
              padding: '20px 18px', display: 'flex', flexDirection: 'column', transition: 'border-color .15s',
            }}>
            <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 38, letterSpacing: '-0.02em', color: accent, lineHeight: 1 }}>
              {p.nombre}
            </div>

            {esGratis ? (
              <p style={{ fontFamily: FONT, fontSize: 16, color: INK, lineHeight: 1.45, margin: '10px 0 14px' }}>
                {p.descripcion}
              </p>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '10px 0 2px' }}>
                  <span style={{ fontFamily: FONT, fontWeight: 800, fontSize: 26, color: INK }}>
                    ${(p.precioMes || 0).toLocaleString('es-AR')}
                  </span>
                  <span style={{ fontFamily: FONT, fontSize: 13, color: MUTED }}>+ IVA / mes</span>
                </div>
                {mesesTxt && <p style={{ margin: '2px 0 0', fontFamily: FONT, fontSize: 12, color: MUTED }}>{mesesTxt}</p>}
                {bonoTxt && <p style={{ margin: '2px 0 12px', fontFamily: FONT, fontSize: 12, color: GREEN, fontWeight: 700 }}>{bonoTxt}</p>}
                <p style={{ fontFamily: FONT, fontSize: 13, color: INK2, lineHeight: 1.4, margin: '0 0 12px' }}>{p.descripcion}</p>
              </>
            )}

            {p.beneficios.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 16 }}>
                {p.beneficios.map(b => (
                  <div key={b} style={{ display: 'flex', gap: 7, fontFamily: FONT, fontSize: 12.5, color: INK2, lineHeight: 1.35 }}>
                    <Check color={accent} />{b}
                  </div>
                ))}
              </div>
            )}

            <div style={{ flex: 1 }} />

            <button type="button"
              onClick={() => {
                if (esGratis) { setExpandido(false); onConfirmFree(); }
                else { setExpandido(true); }
              }}
              style={{
                width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontFamily: FONT, fontWeight: 800, fontSize: 13.5,
                background: esGratis ? '#0f172a' : accent, color: '#fff',
              }}>
              Elegir este plan
            </button>

            {!esGratis && expandido && (
              <CardTarjeta
                primaryColor={primaryColor}
                unidades={unidades}
                setUnidades={setUnidades}
                saving={saving}
                onConfirmar={({ titular, ultimos4, vencimiento }) =>
                  onConfirmPlus({ titular, ultimos4, vencimiento, unidadesDeclaradas: Number(unidades) || 0 })
                }
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
