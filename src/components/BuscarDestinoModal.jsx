// ============================================================
//  src/components/BuscarDestinoModal.jsx
//  "Buscar en el resto del país": buscador con desambiguación en vivo
//  sobre toda la Argentina (georef). Al elegir un destino y presionar
//  "Buscar ofertas de viaje" siempre respondemos que Cuponear todavía no
//  llegó, y ofrecemos dejar el email. Cada búsqueda se releva como demanda
//  (con email si lo deja, o solo el destino si no) para planificar la
//  expansión. Ver src/lib/demanda.js.
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { buscarDestinosAr } from '../lib/geoAr';
import { registrarDemandaDestino, completarEmailDemanda } from '../lib/demanda';
const A = {
  primary:     '#475BE1',
  primaryDark: '#3347C8',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  green:       '#10A36B',
  font:        "'Inter', system-ui, sans-serif",
};

const TIPO_LABEL = { provincia: 'Provincia', municipio: 'Municipio', localidad: 'Localidad' };
const emailValido = v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

const IcoPin = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

export default function BuscarDestinoModal({ categoria = null, onClose }) {
  const [q, setQ]                 = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando]   = useState(false);
  const [sel, setSel]             = useState(null);
  const [fase, setFase]           = useState('search'); // search | done
  const [enviando, setEnviando]   = useState(false);
  const [email, setEmail]         = useState('');
  const [emailOk, setEmailOk]     = useState(false);
  const [demandaId, setDemandaId] = useState(null);
  const abortRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Cerrar con Escape
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // Búsqueda en vivo con debounce; si ya hay un destino elegido no re-busca.
  useEffect(() => {
    if (sel) { setResultados([]); setBuscando(false); return; }
    const term = q.trim();
    if (term.length < 2) { setResultados([]); setBuscando(false); return; }
    setBuscando(true);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const r = await buscarDestinosAr(term, ctrl.signal);
      if (!ctrl.signal.aborted) { setResultados(r); setBuscando(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [q, sel]);

  const elegir = (d) => { setSel(d); setQ(d.nombre); setResultados([]); };

  async function buscarOfertas() {
    if (!sel || enviando) return;
    setEnviando(true);
    const id = await registrarDemandaDestino({
      destino:   sel.nombre,
      provincia: sel.provincia,
      tipo:      sel.tipo,
      georefId:  sel.id,
      categoria,
    });
    setDemandaId(id);
    setEnviando(false);
    setFase('done');
  }

  async function enviarEmail(e) {
    e?.preventDefault?.();
    const val = email.trim();
    if (!emailValido(val) || enviando) return;
    setEnviando(true);
    await completarEmailDemanda(demandaId, val);
    setEnviando(false);
    setEmailOk(true);
  }

  const destinoLabel = sel ? `${sel.nombre}${sel.provincia && sel.provincia !== sel.nombre ? `, ${sel.provincia}` : ''}` : '';

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.5)', zIndex: 300, backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(480px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 48px)', overflowY: 'auto', background: '#fff', borderRadius: 20, zIndex: 301, boxShadow: '0 24px 64px rgba(11,16,32,0.28)', fontFamily: A.font }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '22px 24px 0' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: A.ink, margin: 0, letterSpacing: '-0.01em' }}>Buscar en el resto del país</h2>
            <p style={{ fontSize: 13, color: A.muted, margin: '5px 0 0' }}>Escribí tu destino: provincia, ciudad o localidad de toda la Argentina.</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" style={{ background: 'none', border: 'none', cursor: 'pointer', color: A.muted, display: 'flex', padding: 4, marginLeft: 8, flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {fase === 'search' ? (
          <div style={{ padding: '18px 24px 24px' }}>
            {/* Buscador */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: A.muted, display: 'flex', pointerEvents: 'none' }}><IcoPin /></span>
              <input
                ref={inputRef}
                value={q}
                onChange={e => { setSel(null); setQ(e.target.value); }}
                placeholder="Ej: Bariloche, Mendoza, Puerto Madryn…"
                style={{ width: '100%', boxSizing: 'border-box', padding: '13px 40px 13px 40px', border: `1.5px solid ${sel ? A.primary : A.line}`, borderRadius: 12, fontSize: 15, fontFamily: A.font, color: A.ink, outline: 'none', background: '#fff' }}
                onFocus={e => e.target.style.borderColor = A.primary}
                onBlur={e => e.target.style.borderColor = sel ? A.primary : A.line}
              />
              {q && (
                <button onClick={() => { setSel(null); setQ(''); setResultados([]); inputRef.current?.focus(); }} aria-label="Limpiar" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: A.muted, display: 'flex', padding: 2 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              )}
            </div>

            {/* Resultados en vivo */}
            {!sel && q.trim().length >= 2 && (
              <div style={{ marginTop: 8, border: `1px solid ${A.line}`, borderRadius: 12, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
                {buscando && resultados.length === 0 ? (
                  <div style={{ padding: '14px 16px', fontSize: 13, color: A.muted }}>Buscando destinos…</div>
                ) : resultados.length === 0 ? (
                  <div style={{ padding: '14px 16px', fontSize: 13, color: A.muted }}>No encontramos ese destino. Probá con otro nombre.</div>
                ) : resultados.map(d => (
                  <button
                    key={d.id}
                    onClick={() => elegir(d)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '11px 16px', background: '#fff', border: 'none', borderBottom: `1px solid ${A.line}`, cursor: 'pointer', fontFamily: A.font }}
                    onMouseEnter={e => e.currentTarget.style.background = A.bg}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  >
                    <span style={{ color: A.primary, display: 'flex', flexShrink: 0 }}><IcoPin /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: A.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.nombre}</span>
                      {d.provincia && d.provincia !== d.nombre && <span style={{ display: 'block', fontSize: 12, color: A.muted }}>{d.provincia}</span>}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: A.muted, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0 }}>{TIPO_LABEL[d.tipo] || ''}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Destino elegido */}
            {sel && (
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: A.primary + '10', border: `1px solid ${A.primary}40`, borderRadius: 12 }}>
                <span style={{ color: A.primary, display: 'flex' }}><IcoPin /></span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: A.ink }}>{destinoLabel}</span>
              </div>
            )}

            <button
              onClick={buscarOfertas}
              disabled={!sel || enviando}
              style={{ marginTop: 18, width: '100%', padding: '14px 0', border: 'none', borderRadius: 12, background: sel ? A.primary : A.line, color: sel ? '#fff' : A.muted, fontSize: 15, fontWeight: 700, cursor: sel && !enviando ? 'pointer' : 'default', fontFamily: A.font, transition: 'background 0.15s', opacity: enviando ? 0.7 : 1 }}
            >
              Buscar ofertas de viaje
            </button>
          </div>
        ) : (
          /* ── Fase resultado: coming soon + captura de email ── */
          <div style={{ padding: '20px 24px 26px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, lineHeight: 1, margin: '6px 0 12px' }}>🧳</div>
            <p style={{ fontSize: 15.5, fontWeight: 600, color: A.ink, lineHeight: 1.5, margin: 0 }}>
              ¡Cuponear llegará pronto a todos los destinos del país! Dejanos tu e-mail y enterate apenas lleguemos a{' '}
              <span style={{ color: A.primary, fontWeight: 800 }}>{sel?.nombre || 'ese lugar'}</span>.
            </p>

            {emailOk ? (
              <div style={{ marginTop: 20, padding: '16px', background: A.green + '14', border: `1px solid ${A.green}40`, borderRadius: 12, color: A.green, fontSize: 14, fontWeight: 700 }}>
                ¡Listo! Te vamos a avisar apenas lleguemos a {sel?.nombre}. 🙌
              </div>
            ) : (
              <form onSubmit={enviarEmail} style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px', border: `1.5px solid ${A.line}`, borderRadius: 12, fontSize: 15, fontFamily: A.font, color: A.ink, outline: 'none', textAlign: 'center' }}
                  onFocus={e => e.target.style.borderColor = A.primary}
                  onBlur={e => e.target.style.borderColor = A.line}
                />
                <button
                  type="submit"
                  disabled={!emailValido(email.trim()) || enviando}
                  style={{ width: '100%', padding: '14px 0', border: 'none', borderRadius: 12, background: emailValido(email.trim()) ? A.primary : A.line, color: emailValido(email.trim()) ? '#fff' : A.muted, fontSize: 15, fontWeight: 700, cursor: emailValido(email.trim()) && !enviando ? 'pointer' : 'default', fontFamily: A.font, opacity: enviando ? 0.7 : 1 }}
                >
                  {enviando ? 'Enviando…' : 'Avisame cuando llegue'}
                </button>
                <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: A.muted, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font, padding: '4px 0' }}>
                  Ahora no
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
}
