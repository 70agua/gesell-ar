// ============================================================
//  src/components/SolicitarFecha.jsx
//  El turista pide fecha para un beneficio premium que la requiere.
//
//  SIN TEXTO LIBRE: fecha y cantidad de personas, nada más. Es lo que hace
//  que el socio pueda contestar con tres botones.
//
//  ⚠️ COPY — no negociable. Cuponear TRANSMITE la solicitud, no reserva ni
//  confirma nada (Ley 18.829). Nunca "reservá" ni "disponibilidad".
// ============================================================
import { useState } from 'react';
import { enviarSolicitud, textoError } from '../lib/solicitudes';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280', line: '#E7E9EE',
  primary: '#2545E6', primarySoft: '#EEF1FF', green: '#10A36B', bg: '#F7F7F8',
  font: "'Inter', system-ui, sans-serif",
};

export default function SolicitarFecha({ oferta, origenId = null, fechaSugerida = '', onCerrar, onEnviada }) {
  const [fecha, setFecha]       = useState(fechaSugerida);
  const [personas, setPersonas] = useState(2);
  const [enviando, setEnviando] = useState(false);
  const [error, setError]       = useState(null);

  async function enviar() {
    setEnviando(true); setError(null);
    const r = await enviarSolicitud({
      promocionId: oferta.id, fecha, personas, origenId,
    });
    setEnviando(false);
    if (!r.ok) return setError(textoError(r.error));
    onEnviada?.(r);
  }

  return (
    <div onClick={onCerrar} style={{
      position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.55)', zIndex: 9999,
      display: 'grid', placeItems: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, padding: 26, width: 440, maxWidth: '100%', fontFamily: A.font,
      }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: A.ink, letterSpacing: '-0.02em' }}>
          Pedí tu fecha
        </div>
        <div style={{ fontSize: 13.5, color: A.ink2, lineHeight: 1.55, marginTop: 6, marginBottom: 20 }}>
          {oferta.title || oferta.titulo} — <b>{oferta.proveedorNombre}</b>.
          El comercio te va a responder; puede confirmarte o proponerte otra fecha.
        </div>

        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          ¿Qué día?
        </label>
        <input type="date" value={fecha} min={new Date().toISOString().slice(0, 10)}
          onChange={e => setFecha(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '13px 15px', borderRadius: 12,
            border: `1.5px solid ${A.line}`, fontFamily: A.font, fontSize: 15, color: A.ink, outline: 'none',
          }} />

        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '18px 0 6px' }}>
          ¿Cuántas personas?
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setPersonas(n => Math.max(1, n - 1))} style={btnPaso}>−</button>
          <span style={{ fontSize: 20, fontWeight: 800, color: A.ink, minWidth: 32, textAlign: 'center' }}>{personas}</span>
          <button onClick={() => setPersonas(n => Math.min(50, n + 1))} style={btnPaso}>+</button>
        </div>

        <div style={{ background: A.bg, borderRadius: 12, padding: '12px 14px', marginTop: 20 }}>
          <div style={{ fontSize: 12.5, color: A.ink2, lineHeight: 1.5 }}>
            Mientras esperás la respuesta, este beneficio queda apartado de tu Pase.
            Si el comercio no puede, se libera y elegís otro.
          </div>
        </div>

        {error && (
          <div style={{ marginTop: 14, padding: '11px 14px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, fontSize: 13, color: '#B91C1C' }}>
            {error}
          </div>
        )}

        <button onClick={enviar} disabled={!fecha || enviando} style={{
          width: '100%', marginTop: 18, padding: '14px 0', borderRadius: 13, border: 'none',
          background: !fecha || enviando ? A.line : A.primary,
          color: !fecha || enviando ? A.muted : '#fff',
          fontSize: 15, fontWeight: 800, cursor: !fecha || enviando ? 'not-allowed' : 'pointer', fontFamily: A.font,
        }}>{enviando ? 'Enviando…' : 'Enviar solicitud'}</button>

        <button onClick={onCerrar} style={{
          width: '100%', marginTop: 9, padding: '10px 0', background: 'none', border: 'none',
          color: A.muted, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: A.font,
        }}>Ahora no</button>
      </div>
    </div>
  );
}

const btnPaso = {
  width: 38, height: 38, borderRadius: 10, border: `1px solid ${A.line}`,
  background: '#fff', color: A.ink, fontSize: 19, fontWeight: 700, cursor: 'pointer', fontFamily: A.font,
};
