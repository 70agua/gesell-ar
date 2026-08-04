// ============================================================
//  src/components/AvisosBell.jsx
//  Campanita de avisos. Un solo componente para turista y socio: el aviso ya
//  viene con su destino, así que no hace falta saber quién lo mira.
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { getAvisos, contarNoLeidos, marcarLeido, marcarTodosLeidos } from '../lib/avisos';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280',
  line: '#E7E9EE', primary: '#475BE1', primarySoft: '#EEF0FD',
  red: '#DC2626', font: "'Inter', system-ui, sans-serif",
};

const Campana = ({ s = 20 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const hace = (iso) => {
  const m = Math.round((Date.now() - new Date(iso)) / 6e4);
  if (m < 1)  return 'recién';
  if (m < 60) return `hace ${m} min`;
  const h = Math.round(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
};

export default function AvisosBell({ session, onIr }) {
  const [abierto, setAbierto] = useState(false);
  const [avisos, setAvisos]   = useState([]);
  const [noLeidos, setNoLeidos] = useState(0);

  const refrescar = useCallback(async () => {
    // Sin sesión no toca el estado: el componente ya no se pinta, y un
    // setState sincrónico acá dispara un re-render en cascada al montar.
    if (!session?.user?.id) return;
    const [lista, n] = await Promise.all([getAvisos(), contarNoLeidos()]);
    setAvisos(lista); setNoLeidos(n);
  }, [session]);

  // Al montar y cada 2 minutos. Sin realtime a propósito: para avisos que se
  // miden en horas —72 h de una solicitud, días de un vencimiento— una
  // suscripción viva es infraestructura que no compra nada.
  useEffect(() => {
    // La regla apunta a los setState en cascada; esto es un fetch al montar,
    // que es el caso que no sabe distinguir. Se pide una vez y se repite por
    // intervalo, no en respuesta a un render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refrescar();
    const t = setInterval(refrescar, 120000);
    return () => clearInterval(t);
  }, [refrescar]);

  if (!session?.user?.id) return null;

  const abrir = async (av) => {
    if (!av.leido) { await marcarLeido(av.id); refrescar(); }
    if (av.destino) { setAbierto(false); onIr?.(av.destino); }
  };

  return (
    <div style={{ position: 'relative', fontFamily: A.font }}>
      <button
        onClick={() => setAbierto(v => !v)}
        aria-label={noLeidos ? `${noLeidos} avisos sin leer` : 'Avisos'}
        style={{
          position: 'relative', display: 'grid', placeItems: 'center',
          width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
          border: `1px solid ${A.line}`, background: '#fff', color: A.ink,
        }}
      >
        <Campana />
        {noLeidos > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18,
            padding: '0 5px', borderRadius: 999, background: A.red, color: '#fff',
            fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center',
            border: '2px solid #fff',
          }}>{noLeidos > 9 ? '9+' : noLeidos}</span>
        )}
      </button>

      {abierto && (
        <>
          <div onClick={() => setAbierto(false)} style={{ position: 'fixed', inset: 0, zIndex: 9000 }} />
          <div style={{
            position: 'absolute', top: 46, right: 0, zIndex: 9001, width: 340, maxWidth: '90vw',
            maxHeight: 420, overflowY: 'auto', background: '#fff',
            border: `1px solid ${A.line}`, borderRadius: 16,
            boxShadow: '0 20px 50px -20px rgba(11,16,32,0.35)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: `1px solid ${A.line}` }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: A.ink }}>Avisos</span>
              {noLeidos > 0 && (
                <button onClick={async () => { await marcarTodosLeidos(); refrescar(); }}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontFamily: A.font, fontSize: 12, fontWeight: 700, color: A.primary }}>
                  Marcar todos leídos
                </button>
              )}
            </div>

            {/* Sin avisos se dice que no hay. No se inventa actividad. */}
            {avisos.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 13, color: A.muted }}>
                No tenés avisos todavía.
              </div>
            ) : avisos.map(av => (
              <button key={av.id} onClick={() => abrir(av)} style={{
                display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                padding: '12px 14px', border: 'none', borderBottom: `1px solid ${A.line}`,
                background: av.leido ? '#fff' : A.primarySoft, fontFamily: A.font,
              }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ flex: 1, fontSize: 13.5, fontWeight: av.leido ? 600 : 800, color: av.urgente ? A.red : A.ink }}>
                    {av.titulo}
                  </span>
                  <span style={{ fontSize: 11, color: A.muted, flexShrink: 0 }}>{hace(av.creadoEn)}</span>
                </div>
                <div style={{ fontSize: 12.5, color: A.ink2, lineHeight: 1.45, marginTop: 3 }}>{av.cuerpo}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
