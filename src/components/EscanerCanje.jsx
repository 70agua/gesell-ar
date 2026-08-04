// ============================================================
//  src/components/EscanerCanje.jsx
//  Cámara para leer el QR del comercio, con su código a mano.
//
//  Las dos vías llegan al mismo lugar: el id del negocio. El QR lo codifica en
//  una URL (`?canjear=<uuid>`), el código corto lo resuelve contra la base. De
//  ahí en adelante el flujo es idéntico — por eso este componente devuelve un
//  negocioId y nada más, y no sabe nada de canjes.
//
//  El código manual NO está escondido detrás de "¿problemas?": en un mostrador
//  la cámara falla seguido —permiso denegado, poca luz, QR gastado— y esconder
//  la salida convierte un tropiezo en un abandono.
//
//  El código es el DEL COMERCIO, 8 caracteres — no confundir con el socio_alias
//  de 6 dígitos del pase-regalo, que es otra cosa.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { buscarNegocioPorCodigo, textoError } from '../lib/canjes';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280',
  line: '#E7E9EE', primary: '#475BE1', red: '#DC2626',
  font: "'Inter', system-ui, sans-serif",
};

const CAJA = 'lector-qr-canje';

// El QR del socio es una URL con ?canjear=<uuid>. Se acepta también el uuid
// pelado por si alguna vez se imprime así.
function negocioDeTexto(txt) {
  const uuid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  try {
    const u = new URL(txt);
    const q = u.searchParams.get('canjear');
    if (q && uuid.test(q)) return q;
  } catch { /* no era una URL: sigue abajo */ }
  const m = String(txt || '').match(uuid);
  return m ? m[0] : null;
}

export default function EscanerCanje({ onNegocio, onCerrar }) {
  const [estado, setEstado] = useState('iniciando'); // iniciando | leyendo | sin_camara
  const [codigo, setCodigo] = useState('');
  const [error, setError]   = useState(null);
  const lectorRef = useRef(null);
  const vivoRef   = useRef(true);

  useEffect(() => {
    vivoRef.current = true;
    let lector;
    (async () => {
      try {
        // Import dinámico: son ~80kb que sólo hacen falta si el turista llega
        // a canjear. No tienen por qué viajar en el bundle de la home.
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!vivoRef.current) return;
        lector = new Html5Qrcode(CAJA, { verbose: false });
        lectorRef.current = lector;
        await lector.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 230, height: 230 } },
          (texto) => {
            const id = negocioDeTexto(texto);
            if (!id) return;                    // otro QR cualquiera: se ignora
            lector.stop().catch(() => {});
            onNegocio?.(id);
          },
          () => {},                             // cada frame sin QR: no es error
        );
        if (vivoRef.current) setEstado('leyendo');
      } catch {
        // Permiso denegado, sin cámara, o contexto no seguro. No es un error
        // que haya que explicar: se ofrece la otra vía y listo.
        if (vivoRef.current) setEstado('sin_camara');
      }
    })();

    return () => {
      vivoRef.current = false;
      const l = lectorRef.current;
      if (l) { try { l.stop().then(() => l.clear()).catch(() => {}); } catch { /* ya estaba parado */ } }
    };
  }, [onNegocio]);

  const porCodigo = async (e) => {
    e.preventDefault();
    setError(null);
    const r = await buscarNegocioPorCodigo(codigo);
    if (!r.ok) { setError(textoError(r.error)); return; }
    lectorRef.current?.stop().catch(() => {});
    onNegocio?.(r.negocio.id);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9500, background: 'rgba(5,10,25,0.92)', display: 'flex', flexDirection: 'column', fontFamily: A.font }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', color: '#fff' }}>
        <span style={{ fontSize: 16, fontWeight: 800 }}>Escaneá el QR del comercio</span>
        <button onClick={onCerrar} aria-label="Cerrar" style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 18px', gap: 14 }}>
        {/* El contenedor existe siempre: html5-qrcode lo necesita montado antes
            de arrancar, y se oculta si no hubo cámara. */}
        <div id={CAJA} style={{ width: '100%', maxWidth: 340, borderRadius: 18, overflow: 'hidden', display: estado === 'sin_camara' ? 'none' : 'block' }} />

        {estado === 'iniciando' && (
          <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)' }}>Pidiendo permiso de cámara…</span>
        )}
        {estado === 'sin_camara' && (
          <div style={{ maxWidth: 340, textAlign: 'center', color: 'rgba(255,255,255,0.8)', fontSize: 13.5, lineHeight: 1.5 }}>
            No pudimos usar la cámara. Pedile su código al comercio.
          </div>
        )}
      </div>

      <form onSubmit={porCodigo} style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '18px 18px 24px' }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: A.ink, marginBottom: 8 }}>
          Ingresar código del comercio
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={codigo}
            onChange={e => { setCodigo(e.target.value.toUpperCase().replace(/[^23456789BCDFGHJKMNPQRSTVWXYZ]/g, '').slice(0, 8)); setError(null); }}
            autoCapitalize="characters"
            placeholder="XXXXXXXX"
            style={{
              flex: 1, minWidth: 0, padding: '13px 16px', border: `1px solid ${error ? A.red : A.line}`,
              borderRadius: 12, fontFamily: A.font, fontSize: 19, fontWeight: 800,
              letterSpacing: '0.22em', textAlign: 'center',
            }}
          />
          <button type="submit" disabled={codigo.length !== 8} style={{
            flexShrink: 0, padding: '0 22px', borderRadius: 12, border: 'none',
            background: codigo.length === 8 ? A.primary : A.line,
            color: codigo.length === 8 ? '#fff' : A.muted,
            fontFamily: A.font, fontSize: 14.5, fontWeight: 800,
            cursor: codigo.length === 8 ? 'pointer' : 'default',
          }}>Ir</button>
        </div>
        {error && <div style={{ marginTop: 8, fontSize: 12.5, color: A.red, fontWeight: 600 }}>{error}</div>}
      </form>
    </div>
  );
}
