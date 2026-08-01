// ============================================================
//  src/views/socio/TabCanjes.jsx
//  El bloque de canje del socio. Dos cosas:
//
//   1. Su QR estático, para imprimir y dejar en el mostrador. Es el mismo
//      siempre: no se genera uno por cupón ni por venta.
//   2. El historial de lo que se canjeó, con el botón de "reportar canje
//      erróneo" — que NO anula: abre una cola del superadmin. Un canje
//      anulado es un error operativo y necesita alguien que lo verifique.
// ============================================================
import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { urlQrSocio, getCanjesDeNegocio, reportarCanjeErroneo } from '../../lib/canjes';

const FONT = "'Inter', system-ui, sans-serif";
const INK = '#0f172a', INK2 = '#475569', MUTED = '#94a3b8', LINE = '#e2e8f0';
const P = '#475be1', PS = '#eef0fd', BG = '#f8fafc', GREEN = '#10a36b';

const fmt = n => '$' + Math.round(n || 0).toLocaleString('es-AR');
const fmtFecha = iso => iso
  ? new Date(iso).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '';

const MOTIVOS = [
  'No había mesa / no se pudo dar el beneficio',
  'Se escaneó el cupón equivocado',
  'La venta no se concretó',
  'El turista se arrepintió antes de usarlo',
];

// ─── QR del comercio ──────────────────────────────────────────
function QrSocio({ negocioId, nombre }) {
  const canvasRef = useRef(null);
  const [listo, setListo] = useState(false);
  const url = urlQrSocio(negocioId);

  useEffect(() => {
    if (!canvasRef.current || !negocioId) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 220, margin: 1, color: { dark: '#0f172a', light: '#ffffff' } })
      .then(() => setListo(true))
      .catch(() => setListo(false));
  }, [url, negocioId]);

  function imprimir() {
    const w = window.open('', '_blank', 'width=600,height=800');
    if (!w) return;
    const img = canvasRef.current?.toDataURL('image/png');
    w.document.write(`
      <html><head><title>QR ${nombre || ''}</title></head>
      <body style="font-family:system-ui;text-align:center;padding:60px 20px">
        <h1 style="font-size:26px;margin:0 0 6px">${nombre || 'Cuponear'}</h1>
        <p style="font-size:16px;color:#475569;margin:0 0 28px">Escaneá para usar tu cupón</p>
        <img src="${img}" style="width:320px;height:320px"/>
        <p style="font-size:13px;color:#94a3b8;margin-top:28px">cuponear.ar</p>
      </body></html>`);
    w.document.close();
    w.focus();
    w.print();
  }

  return (
    <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 22 }}>
      <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: INK, marginBottom: 4 }}>
        Tu código QR
      </div>
      <div style={{ fontFamily: FONT, fontSize: 12.5, color: INK2, lineHeight: 1.5, marginBottom: 18 }}>
        Imprimilo y dejalo a la vista. El turista lo escanea, elige su cupón y te muestra el
        comprobante. <b>No tenés que validar nada</b>: es siempre el mismo QR.
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ background: '#fff', padding: 10, border: `1px solid ${LINE}`, borderRadius: 12 }}>
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <button onClick={imprimir} disabled={!listo} style={{
            background: P, color: '#fff', border: 'none', borderRadius: 11, padding: '11px 18px',
            fontFamily: FONT, fontSize: 13.5, fontWeight: 700, cursor: listo ? 'pointer' : 'not-allowed',
            opacity: listo ? 1 : 0.5,
          }}>Imprimir</button>
          <div style={{ fontFamily: FONT, fontSize: 11.5, color: MUTED, marginTop: 10, lineHeight: 1.5, wordBreak: 'break-all' }}>
            {url}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de reporte ─────────────────────────────────────────
function ModalReporte({ canje, onCerrar, onEnviado, showToast }) {
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setEnviando(true);
    const res = await reportarCanjeErroneo(canje.id, motivo);
    setEnviando(false);
    if (!res.ok) return showToast(`No se pudo reportar: ${res.error}`, 'err');
    showToast('Reporte enviado. Lo revisa el equipo de Cuponear.', 'ok');
    onEnviado();
  }

  return (
    <div onClick={onCerrar} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.55)', zIndex: 9999,
      display: 'grid', placeItems: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 18, padding: 24, width: 440, maxWidth: '100%', fontFamily: FONT,
      }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: INK, marginBottom: 6 }}>Reportar canje erróneo</div>
        <div style={{ fontSize: 13, color: INK2, lineHeight: 1.5, marginBottom: 18 }}>
          Esto no anula el canje: lo revisa Cuponear y, si corresponde, le devuelve el cupón al turista.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {MOTIVOS.map(m => (
            <label key={m} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 11,
              border: `1.5px solid ${motivo === m ? P : LINE}`, background: motivo === m ? PS : '#fff',
              cursor: 'pointer', fontSize: 13.5, color: INK2,
            }}>
              <input type="radio" checked={motivo === m} onChange={() => setMotivo(m)} />
              {m}
            </label>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={enviar} disabled={enviando} style={{
            flex: 1, padding: '12px 0', borderRadius: 11, border: 'none', background: P, color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FONT, opacity: enviando ? 0.6 : 1,
          }}>{enviando ? 'Enviando…' : 'Enviar reporte'}</button>
          <button onClick={onCerrar} style={{
            padding: '12px 18px', borderRadius: 11, border: `1px solid ${LINE}`, background: '#fff',
            color: INK2, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
          }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab ──────────────────────────────────────────────────────
export default function TabCanjes({ negocio, showToast }) {
  const [canjes, setCanjes]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [reportando, setReportando] = useState(null);

  async function cargar() {
    if (!negocio?.id) { setLoading(false); return; }
    setCanjes(await getCanjesDeNegocio(negocio.id));
    setLoading(false);
  }
  useEffect(() => { cargar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [negocio?.id]);

  const confirmados = canjes.filter(c => c.estado === 'confirmado');
  const ahorroTotal = confirmados.reduce((a, c) => a + (Number(c.ahorro_monto) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <QrSocio negocioId={negocio?.id} nombre={negocio?.nombre} />

      <div style={{ background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${LINE}`, background: BG }}>
          <div style={{ fontFamily: FONT, fontSize: 15, fontWeight: 700, color: INK }}>Canjes</div>
          <div style={{ fontFamily: FONT, fontSize: 12.5, color: INK2, marginTop: 2 }}>
            {confirmados.length} canje{confirmados.length !== 1 ? 's' : ''} · {fmt(ahorroTotal)} de ahorro entregado
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', fontFamily: FONT, fontSize: 13, color: MUTED }}>Cargando…</div>
        ) : canjes.length === 0 ? (
          <div style={{ padding: '36px 20px', textAlign: 'center', fontFamily: FONT, fontSize: 13, color: MUTED }}>
            Todavía no canjeó nadie.
          </div>
        ) : canjes.map((c, i) => (
          <div key={c.id} style={{
            display: 'flex', alignItems: 'center', gap: 14, padding: '13px 20px', flexWrap: 'wrap',
            borderBottom: i === canjes.length - 1 ? 'none' : `1px solid ${LINE}`,
            opacity: c.estado === 'anulado' ? 0.55 : 1,
          }}>
            <div style={{
              fontFamily: FONT, fontSize: 14, fontWeight: 800, letterSpacing: '0.1em',
              color: INK, minWidth: 76,
            }}>{c.comprobante}</div>

            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 600, color: INK }}>
                {c.promociones?.titulo || 'Oferta'}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 11.5, color: MUTED, marginTop: 1 }}>
                {fmtFecha(c.canjeado_el)} · {c.origen === 'cupon' ? 'cupón comprado' : c.origen === 'estadia' ? 'estadía del Pase' : 'con el Pase'}
              </div>
            </div>

            <div style={{ fontFamily: FONT, fontSize: 13, fontWeight: 700, color: GREEN }}>{fmt(c.ahorro_monto)}</div>

            {c.estado === 'anulado' ? (
              <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: '#DC2626', background: '#FEF2F2', padding: '3px 9px', borderRadius: 999 }}>Anulado</span>
            ) : c.reporte_estado === 'pendiente' ? (
              <span style={{ fontFamily: FONT, fontSize: 11, fontWeight: 700, color: '#8A6412', background: '#FFF7E5', padding: '3px 9px', borderRadius: 999 }}>Reportado</span>
            ) : (
              <button onClick={() => setReportando(c)} style={{
                background: 'none', border: `1px solid ${LINE}`, borderRadius: 9, padding: '6px 11px',
                fontFamily: FONT, fontSize: 11.5, fontWeight: 600, color: INK2, cursor: 'pointer',
              }}>Reportar error</button>
            )}
          </div>
        ))}
      </div>

      {reportando && (
        <ModalReporte canje={reportando} showToast={showToast}
          onCerrar={() => setReportando(null)}
          onEnviado={() => { setReportando(null); cargar(); }} />
      )}
    </div>
  );
}
