// ============================================================
//  src/views/CanjearView.jsx
//  El turista llega acá escaneando el QR del comercio (?canjear=<negocioId>)
//  o tipeando el código de su cupón.
//
//  El comercio es PASIVO: no valida nada, no tiene pantalla. Todo el flujo
//  ocurre en el teléfono del turista, y lo que se muestra en el mostrador es
//  el comprobante.
//
//  Copy: nunca "reservá" ni "disponibilidad". Acá se USA un cupón, que es un
//  descuento ya comprado — no hay intermediación de ningún servicio.
// ============================================================
import { useState, useEffect } from 'react';
import { beneficiosEnNegocio, canjearBeneficio, buscarCuponPorCodigo, textoError } from '../lib/canjes';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280', line: '#E7E9EE',
  primary: '#475BE1', primarySoft: '#EEF0FD', bg: '#F7F7F8',
  green: '#10A36B', greenSoft: '#ECFDF5', red: '#EF4444',
  font: "'Inter', system-ui, sans-serif",
};
const fmt = n => '$' + Math.round(n || 0).toLocaleString('es-AR');

// ─── Comprobante ──────────────────────────────────────────────
// Lo único que ve el comercio. Grande, con el código y el ahorro.
function Comprobante({ res, onListo }) {
  return (
    <div style={{ maxWidth: 460, margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
      <div style={{
        width: 68, height: 68, borderRadius: '50%', background: A.greenSoft, color: A.green,
        display: 'grid', placeItems: 'center', margin: '0 auto 18px',
      }}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </div>

      <h1 style={{ margin: '0 0 6px', fontSize: 25, fontWeight: 800, letterSpacing: '-0.025em', color: A.ink }}>
        Cupón usado
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: 14.5, color: A.ink2, lineHeight: 1.5 }}>
        Mostrá esta pantalla en el mostrador.
      </p>

      <div style={{ background: '#fff', border: `2px solid ${A.green}`, borderRadius: 18, padding: '24px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Mostrale este código
        </div>
        <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: '0.16em', color: A.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {res.comprobante}
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${A.line}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: A.ink }}>{res.titulo}</div>
          <div style={{ fontSize: 13, color: A.muted, marginTop: 2 }}>{res.negocio}</div>
          {res.ahorro > 0 && (
            <div style={{ fontSize: 13.5, fontWeight: 700, color: A.green, marginTop: 8 }}>
              Ahorrás {fmt(res.ahorro)} aprox.
            </div>
          )}
        </div>
      </div>

      <button onClick={onListo} style={{
        width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
        background: A.ink, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: A.font,
      }}>Listo</button>
    </div>
  );
}

// ─── Confirmación ─────────────────────────────────────────────
// La advertencia es el punto: una vez usado no vuelve.
function Confirmacion({ item, negocio, onConfirmar, onCancelar, enviando }) {
  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ margin: '0 0 6px', fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', color: A.ink }}>
        ¿Usar este cupón ahora?
      </h1>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: A.muted, lineHeight: 1.5 }}>
        En {negocio?.nombre}
      </p>

      <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, padding: 18, marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: A.ink, lineHeight: 1.3 }}>{item.titulo}</div>
        {item.ahorro > 0 && (
          <div style={{ fontSize: 13.5, fontWeight: 700, color: A.green, marginTop: 6 }}>Ahorrás {fmt(item.ahorro)} aprox.</div>
        )}
      </div>

      {/* Fricción mínima, no bloqueante: nada impide confirmar desde casa,
          pero el cupón se gasta ahí. Decirlo antes evita el reclamo después. */}
      <div style={{ background: '#FFF7E5', border: '1px solid #F3D9A8', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#8A6412', marginBottom: 4 }}>
          El cupón se usa al confirmar, no al canjearlo en el local
        </div>
        <div style={{ fontSize: 12.5, color: '#8A6412', lineHeight: 1.5 }}>
          Confirmá <b>con el mozo o el mostrador delante</b>, para mostrarle el comprobante en el
          momento. Si lo confirmás antes de llegar, el cupón ya queda usado y no se puede volver atrás.
        </div>
      </div>

      <button onClick={onConfirmar} disabled={enviando} style={{
        width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
        background: enviando ? A.line : A.green, color: enviando ? A.muted : '#fff',
        fontSize: 15.5, fontWeight: 800, cursor: enviando ? 'not-allowed' : 'pointer', fontFamily: A.font,
      }}>{enviando ? 'Usando…' : 'Sí, usarlo ahora'}</button>

      <button onClick={onCancelar} disabled={enviando} style={{
        width: '100%', padding: '12px 0', marginTop: 10, borderRadius: 14,
        border: `1px solid ${A.line}`, background: '#fff', color: A.ink2,
        fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: A.font,
      }}>Todavía no</button>
    </div>
  );
}

// ─── Fallback: código a mano ──────────────────────────────────
function PorCodigo({ onEncontrado }) {
  const [codigo, setCodigo] = useState('');
  const [error, setError]   = useState(null);
  const [buscando, setBuscando] = useState(false);

  async function buscar() {
    setBuscando(true); setError(null);
    const res = await buscarCuponPorCodigo(codigo);
    setBuscando(false);
    if (!res.ok) return setError(textoError(res.error));
    if (res.cupon.estado !== 'activo') return setError('Ese cupón ya fue usado o venció.');
    onEncontrado(res.cupon);
  }

  return (
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ margin: '0 0 6px', fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', color: A.ink }}>
        Usar un cupón
      </h1>
      <p style={{ margin: '0 0 20px', fontSize: 14, color: A.muted, lineHeight: 1.5 }}>
        Escaneá el QR del comercio, o escribí el código de tu cupón.
      </p>

      <input
        value={codigo}
        onChange={e => setCodigo(e.target.value.toUpperCase().slice(0, 8))}
        placeholder="ABCD1234"
        style={{
          width: '100%', boxSizing: 'border-box', padding: '16px 18px', borderRadius: 14,
          border: `1.5px solid ${A.line}`, fontSize: 22, fontWeight: 800, letterSpacing: '0.14em',
          textAlign: 'center', fontFamily: A.font, color: A.ink, outline: 'none', textTransform: 'uppercase',
        }}
      />

      {error && (
        <div style={{ marginTop: 12, padding: '11px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, fontSize: 13, color: '#B91C1C' }}>
          {error}
        </div>
      )}

      <button onClick={buscar} disabled={codigo.length < 6 || buscando} style={{
        width: '100%', marginTop: 16, padding: '14px 0', borderRadius: 14, border: 'none',
        background: codigo.length < 6 || buscando ? A.line : A.primary,
        color: codigo.length < 6 || buscando ? A.muted : '#fff',
        fontSize: 15, fontWeight: 700, cursor: codigo.length < 6 || buscando ? 'not-allowed' : 'pointer', fontFamily: A.font,
      }}>{buscando ? 'Buscando…' : 'Continuar'}</button>
    </div>
  );
}

// ─── Vista principal ──────────────────────────────────────────
export default function CanjearView({ session, negocioId, onSalir, onLoginRequired }) {
  const [cargando, setCargando]   = useState(!!negocioId);
  const [negocio, setNegocio]     = useState(null);
  const [items, setItems]         = useState([]);
  const [elegido, setElegido]     = useState(null);
  const [resultado, setResultado] = useState(null);
  const [error, setError]         = useState(null);
  const [enviando, setEnviando]   = useState(false);

  useEffect(() => {
    if (!session) { onLoginRequired?.(); return; }
    if (!negocioId) { setCargando(false); return; }
    let vivo = true;
    beneficiosEnNegocio(negocioId).then(res => {
      if (!vivo) return;
      if (!res.ok) setError(textoError(res.error));
      else { setNegocio(res.negocio); setItems(res.items); }
      setCargando(false);
    });
    return () => { vivo = false; };
  }, [negocioId, session, onLoginRequired]);

  async function confirmar() {
    setEnviando(true); setError(null);
    const res = await canjearBeneficio({ tipo: elegido.tipo, ref: elegido.ref });
    setEnviando(false);
    if (!res.ok) { setError(textoError(res.error)); setElegido(null); return; }
    setResultado(res);
  }

  const marco = hijo => (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, paddingTop: 70 }}>{hijo}</div>
  );

  if (resultado) return marco(<Comprobante res={resultado} onListo={onSalir} />);

  if (elegido) return marco(
    <Confirmacion item={elegido} negocio={negocio} enviando={enviando}
      onConfirmar={confirmar} onCancelar={() => setElegido(null)} />
  );

  // Sin QR: entrada por código.
  if (!negocioId) return marco(
    <PorCodigo onEncontrado={c => {
      setNegocio({ nombre: c.negocios?.nombre });
      setElegido({ tipo: 'cupon', ref: c.id, titulo: c.titulo, ahorro: Number(c.ahorro) || 0 });
    }} />
  );

  if (cargando) return marco(
    <div style={{ textAlign: 'center', padding: '80px 20px', color: A.muted, fontSize: 14 }}>Buscando tus cupones…</div>
  );

  return marco(
    <div style={{ maxWidth: 460, margin: '0 auto', padding: '32px 20px 60px' }}>
      <h1 style={{ margin: '0 0 6px', fontSize: 23, fontWeight: 800, letterSpacing: '-0.02em', color: A.ink }}>
        {negocio?.nombre || 'Comercio'}
      </h1>
      <p style={{ margin: '0 0 22px', fontSize: 14, color: A.muted, lineHeight: 1.5 }}>
        {items.length === 0
          ? 'No tenés cupones para usar acá.'
          : 'Elegí qué querés usar.'}
      </p>

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 15px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, fontSize: 13.5, color: '#B91C1C' }}>
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, padding: '36px 22px', textAlign: 'center' }}>
          <div style={{ fontSize: 13.5, color: A.muted, lineHeight: 1.5, marginBottom: 18 }}>
            Comprá un cupón de este comercio, o activá tu Pase para acceder a sus descuentos.
          </div>
          <button onClick={onSalir} style={{
            background: A.primary, color: '#fff', border: 'none', borderRadius: 12,
            padding: '12px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: A.font,
          }}>Ver ofertas</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map(it => (
            <button key={`${it.tipo}-${it.ref}`} onClick={() => setElegido(it)} style={{
              display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%',
              background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, padding: 16,
              cursor: 'pointer', fontFamily: A.font,
            }}>
              {it.imagen && (
                <img src={it.imagen} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
              )}
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  display: 'inline-block', fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
                  textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999, marginBottom: 5,
                  background: it.tipo === 'cupon' ? A.primarySoft : A.greenSoft,
                  color: it.tipo === 'cupon' ? A.primary : A.green,
                }}>{it.tipo === 'cupon' ? 'Tu cupón' : 'Con tu Pase'}</span>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: A.ink, lineHeight: 1.3 }}>{it.titulo}</span>
                {it.ahorro > 0 && (
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: A.green, marginTop: 3 }}>
                    Ahorrás {fmt(it.ahorro)} aprox.
                  </span>
                )}
              </span>
              <span style={{ color: A.muted, flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
