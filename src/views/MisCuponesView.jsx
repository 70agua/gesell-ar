// ============================================================
//  src/views/MisCuponesView.jsx
//  Los cupones que compró el turista.
//
//  El código que se muestra acá es EL MISMO que ve el comercio al canjear:
//  no hay dos códigos. Sirve para dos cosas —encontrar el cupón a mano si no
//  se puede escanear el QR, y como comprobante en el mostrador—, y por eso va
//  grande y con botón de copiar.
// ============================================================
import { useState, useEffect } from 'react';
import { getMisCupones, getComprasPendientes } from '../lib/compras';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280', line: '#E7E9EE',
  primary: '#2545E6', primarySoft: '#EEF1FF', bg: '#F7F7F8',
  green: '#10A36B', greenSoft: '#ECFDF5',
  font: "'Inter', system-ui, sans-serif",
};

const fmt = n => '$' + Math.round(n || 0).toLocaleString('es-AR');
const fmtFecha = iso => iso
  ? new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })
  : null;

const ESTADOS = {
  activo:   { label: 'Activo',   bg: '#ECFDF5', color: '#10A36B' },
  canjeado: { label: 'Canjeado', bg: '#F1F5F9', color: '#64748B' },
  vencido:  { label: 'Vencido',  bg: '#FEF2F2', color: '#DC2626' },
};

function CodigoCupon({ codigo, apagado }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch { /* sin permiso de portapapeles: el código igual está a la vista */ }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      background: apagado ? A.bg : A.primarySoft, borderRadius: 12, padding: '12px 14px',
      opacity: apagado ? 0.6 : 1,
    }}>
      <span style={{
        fontSize: 20, fontWeight: 800, letterSpacing: '0.16em',
        color: apagado ? A.muted : A.ink, fontVariantNumeric: 'tabular-nums',
      }}>{codigo}</span>
      {!apagado && (
        <button onClick={copiar} style={{
          background: 'none', border: `1px solid ${A.line}`, borderRadius: 8,
          padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
          color: copiado ? A.green : A.primary, fontFamily: A.font, whiteSpace: 'nowrap',
        }}>
          {copiado ? '¡Copiado!' : 'Copiar'}
        </button>
      )}
    </div>
  );
}

function CuponCard({ c }) {
  const est = ESTADOS[c.estado] || ESTADOS.activo;
  const apagado = c.estado !== 'activo';

  return (
    <div style={{
      background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', gap: 14, padding: 16 }}>
        {c.imagen && (
          <img src={c.imagen} alt="" style={{
            width: 68, height: 68, borderRadius: 12, objectFit: 'cover', flexShrink: 0,
            filter: apagado ? 'grayscale(1)' : 'none',
          }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span style={{
              background: est.bg, color: est.color, fontSize: 10.5, fontWeight: 800,
              padding: '3px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>{est.label}</span>
            {c.personas && (
              <span style={{ fontSize: 11.5, color: A.muted, fontWeight: 600 }}>{c.personas} personas</span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: A.ink, lineHeight: 1.3 }}>{c.titulo}</div>
          <div style={{ fontSize: 12.5, color: A.muted, marginTop: 2 }}>
            {c.negocio}{c.localidad ? ` · ${c.localidad}` : ''}
          </div>
        </div>
      </div>

      <div style={{ padding: '0 16px 16px' }}>
        <CodigoCupon codigo={c.codigo} apagado={apagado} />

        <div style={{ display: 'flex', gap: 18, marginTop: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: A.muted }}>
            Pagaste <b style={{ color: A.ink2 }}>{fmt(c.precioPagado)}</b>
          </span>
          {c.ahorro > 0 && (
            <span style={{ fontSize: 12, color: A.muted }}>
              Ahorro <b style={{ color: A.green }}>{fmt(c.ahorro)}</b>
            </span>
          )}
          {c.estado === 'canjeado' && c.canjeadoEn && (
            <span style={{ fontSize: 12, color: A.muted }}>Canjeado el {fmtFecha(c.canjeadoEn)}</span>
          )}
          {c.estado === 'activo' && c.venceEl && (
            <span style={{ fontSize: 12, color: A.muted }}>Vence el {fmtFecha(c.venceEl)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MisCuponesView({ session, onBack, onExplorar }) {
  const [cupones, setCupones]       = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filtro, setFiltro]         = useState('activo');

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) { setLoading(false); return; }
    let vivo = true;
    Promise.all([getMisCupones(uid), getComprasPendientes(uid)])
      .then(([cs, ps]) => { if (!vivo) return; setCupones(cs); setPendientes(ps); setLoading(false); })
      .catch(() => { if (vivo) setLoading(false); });
    return () => { vivo = false; };
  }, [session]);

  const activos  = cupones.filter(c => c.estado === 'activo');
  const usados   = cupones.filter(c => c.estado !== 'activo');
  const listados = filtro === 'activo' ? activos : usados;

  const FILTROS = [
    { id: 'activo',  label: `Para usar (${activos.length})` },
    { id: 'historial', label: `Historial (${usados.length})` },
  ];

  return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, paddingTop: 70 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px 80px' }}>

        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: A.ink2, cursor: 'pointer',
          fontSize: 14, fontWeight: 600, padding: 0, marginBottom: 18, fontFamily: A.font,
        }}>← Volver</button>

        <h1 style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 800, letterSpacing: '-0.025em', color: A.ink }}>
          Mis cupones
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 14.5, color: A.muted, lineHeight: 1.5 }}>
          Escaneá el QR del comercio para usar tu cupón. Si no podés escanear, este mismo código
          te sirve para encontrarlo a mano — y es el que ve el comercio cuando lo usás.
        </p>

        {pendientes.length > 0 && (
          <div style={{
            background: '#FFF7E5', border: '1px solid #F3D9A8', borderRadius: 14,
            padding: '14px 16px', marginBottom: 20,
          }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#8A6412' }}>
              {pendientes.length === 1 ? 'Tenés una compra esperando el pago' : `Tenés ${pendientes.length} compras esperando el pago`}
            </div>
            <div style={{ fontSize: 12.5, color: '#8A6412', marginTop: 3, lineHeight: 1.45 }}>
              Los cupones se emiten cuando nos figure la transferencia.
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: A.muted, fontSize: 14 }}>Cargando tus cupones…</div>
        ) : cupones.length === 0 ? (
          <div style={{
            background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16,
            padding: '48px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: A.ink, marginBottom: 6 }}>Todavía no compraste cupones</div>
            <div style={{ fontSize: 13.5, color: A.muted, marginBottom: 20, lineHeight: 1.5 }}>
              Cuando compres uno, el código te queda acá.
            </div>
            <button onClick={onExplorar} style={{
              background: A.primary, color: '#fff', border: 'none', borderRadius: 12,
              padding: '12px 22px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: A.font,
            }}>Explorar ofertas</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {FILTROS.map(f => (
                <button key={f.id} onClick={() => setFiltro(f.id)} style={{
                  border: `1px solid ${filtro === f.id ? A.primary : A.line}`,
                  background: filtro === f.id ? A.primarySoft : '#fff',
                  color: filtro === f.id ? A.primary : A.ink2,
                  borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: A.font,
                }}>{f.label}</button>
              ))}
            </div>

            {listados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: A.muted, fontSize: 13.5 }}>
                {filtro === 'activo' ? 'No te queda ningún cupón para usar.' : 'Todavía no usaste ninguno.'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {listados.map(c => <CuponCard key={c.id} c={c} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
