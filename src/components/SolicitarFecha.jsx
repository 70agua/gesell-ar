// ============================================================
//  src/components/SolicitarFecha.jsx
//  El turista pide fecha para un beneficio premium que la requiere.
//
//  SIN TEXTO LIBRE: fecha, horario y composición del grupo, nada más. Es lo
//  que hace que el socio pueda contestar con tres botones.
//
//  Qué se pregunta lo define la OFERTA: un restaurante pide horario y un
//  alojamiento no; un alojamiento pide niños, bebés y mascotas y una sesión de
//  masaje no pregunta nada porque es de a uno. El socio lo configura en su
//  editor.
//
//  ⚠️ COPY — no negociable. Cuponear TRANSMITE la solicitud, no reserva ni
//  confirma nada (Ley 18.829). Nunca "reservá" ni "disponibilidad".
// ============================================================
import { useState } from 'react';
import { enviarSolicitud, textoError } from '../lib/solicitudes';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280', line: '#E7E9EE',
  primary: '#475BE1', primarySoft: '#EEF0FD', green: '#10A36B', bg: '#F7F7F8',
  font: "'Inter', system-ui, sans-serif",
};

// Un contador de a uno. Los bebés y las mascotas arrancan en 0 y los adultos
// en 1: nadie coordina una fecha para cero adultos, pero sí para cero bebés.
function Contador({ label, valor, min = 0, max = 20, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '9px 0' }}>
      <span style={{ fontSize: 14, color: A.ink }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <button type="button" onClick={() => onChange(Math.max(min, valor - 1))} disabled={valor <= min}
          style={{ ...btnPaso, opacity: valor <= min ? 0.4 : 1 }}>−</button>
        <span style={{ fontSize: 17, fontWeight: 800, color: A.ink, minWidth: 26, textAlign: 'center' }}>{valor}</span>
        <button type="button" onClick={() => onChange(Math.min(max, valor + 1))} disabled={valor >= max}
          style={{ ...btnPaso, opacity: valor >= max ? 0.4 : 1 }}>+</button>
      </div>
    </div>
  );
}

export default function SolicitarFecha({ oferta, origenId = null, fechaSugerida = '', onCerrar, onEnviada }) {
  const [fecha, setFecha]   = useState(fechaSugerida);
  const [hora, setHora]     = useState('');
  const [adultos, setAdultos]   = useState(2);
  const [ninos, setNinos]       = useState(0);
  const [bebes, setBebes]       = useState(0);
  const [mascotas, setMascotas] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [error, setError]       = useState(null);

  // Con cantidad fija no se pregunta NADA del grupo: una sesión de masaje para
  // uno no necesita saber cuántos son, y preguntarlo invita a contestar mal.
  const fijas = oferta.personasFijas || null;
  const pideGrupo = !fijas && (oferta.pideAdultos || oferta.pideNinos || oferta.pideBebes || oferta.pideMascotas);
  const faltaHora = oferta.pideHorario && !hora;

  async function enviar() {
    setEnviando(true); setError(null);
    const r = await enviarSolicitud({
      promocionId: oferta.id, fecha, origenId,
      hora:     oferta.pideHorario ? hora : null,
      // Lo que la oferta no pregunta viaja en null, no en 0: null es "no se
      // preguntó" y 0 es "ninguno", y el socio necesita poder distinguirlos.
      adultos:  fijas ? null : (oferta.pideAdultos  ? adultos  : null),
      ninos:    fijas ? null : (oferta.pideNinos    ? ninos    : null),
      bebes:    fijas ? null : (oferta.pideBebes    ? bebes    : null),
      mascotas: fijas ? null : (oferta.pideMascotas ? mascotas : null),
    });
    setEnviando(false);
    if (!r.ok) return setError(textoError(r.error));
    onEnviada?.(r);
  }

  const trabado = !fecha || faltaHora || enviando;

  return (
    <div onClick={onCerrar} style={{
      position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.55)', zIndex: 9999,
      display: 'grid', placeItems: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 20, padding: 26, width: 440, maxWidth: '100%',
        maxHeight: '90vh', overflowY: 'auto', fontFamily: A.font,
      }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: A.ink, letterSpacing: '-0.02em' }}>
          Coordiná tu fecha
        </div>
        <div style={{ fontSize: 13.5, color: A.ink2, lineHeight: 1.55, marginTop: 6, marginBottom: 20 }}>
          {oferta.title || oferta.titulo} — <b>{oferta.proveedorNombre}</b>.
          El comercio te va a responder; puede confirmarte el día o proponerte otro.
        </div>

        <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
          ¿Qué día?
        </label>
        <input type="date" value={fecha} min={hoyISO()}
          onChange={e => setFecha(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box', padding: '13px 15px', borderRadius: 12,
            border: `1.5px solid ${A.line}`, fontFamily: A.font, fontSize: 15, color: A.ink, outline: 'none',
          }} />

        {oferta.pideHorario && (
          <>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '18px 0 6px' }}>
              ¿A qué hora?
            </label>
            <input type="time" value={hora} onChange={e => setHora(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '13px 15px', borderRadius: 12,
                border: `1.5px solid ${A.line}`, fontFamily: A.font, fontSize: 15, color: A.ink, outline: 'none',
              }} />
          </>
        )}

        {pideGrupo && (
          <>
            <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '18px 0 2px' }}>
              ¿Quiénes van?
            </label>
            <div style={{ borderTop: `1px solid ${A.line}` }}>
              {oferta.pideAdultos  && <Contador label="Adultos"  valor={adultos}  min={1} onChange={setAdultos} />}
              {oferta.pideNinos    && <Contador label="Niños"    valor={ninos}    onChange={setNinos} />}
              {oferta.pideBebes    && <Contador label="Bebés"    valor={bebes}    onChange={setBebes} />}
              {oferta.pideMascotas && <Contador label="Mascotas" valor={mascotas} max={5} onChange={setMascotas} />}
            </div>
          </>
        )}

        {fijas && (
          <div style={{ marginTop: 18, padding: '11px 14px', background: A.primarySoft, borderRadius: 12, fontSize: 13, color: A.ink2 }}>
            Este beneficio es para <b style={{ color: A.ink }}>{fijas} {fijas === 1 ? 'persona' : 'personas'}</b>.
          </div>
        )}

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

        <button onClick={enviar} disabled={trabado} style={{
          width: '100%', marginTop: 18, padding: '14px 0', borderRadius: 13, border: 'none',
          background: trabado ? A.line : A.primary,
          color: trabado ? A.muted : '#fff',
          fontSize: 15, fontWeight: 800, cursor: trabado ? 'not-allowed' : 'pointer', fontFamily: A.font,
        }}>{enviando ? 'Enviando…' : 'Coordinar fecha'}</button>

        <button onClick={onCerrar} style={{
          width: '100%', marginTop: 9, padding: '10px 0', background: 'none', border: 'none',
          color: A.muted, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: A.font,
        }}>Ahora no</button>
      </div>
    </div>
  );
}

// El piso del calendario. Va afuera para no ensuciar el render con un
// `new Date()` inline; recalcularlo en cada pintada es inofensivo porque no se
// deriva estado de él, sólo limita el input.
function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

const btnPaso = {
  width: 38, height: 38, borderRadius: 10, border: `1px solid ${A.line}`,
  background: '#fff', color: A.ink, fontSize: 19, fontWeight: 700, cursor: 'pointer', fontFamily: A.font,
};
