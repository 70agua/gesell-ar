// ============================================================
//  src/views/CanjearRegaloView.jsx
//  El turista llega con un código de 6 dígitos que le dictó el alojamiento al hacer
//  el check-in. Dos pasos y nada más:
//
//    1) Escribe el código. Al sexto dígito se valida solo — no hay botón,
//       porque no hay nada que decidir: el gesto ya terminó.
//    2) Crea su cuenta (o entra con la que tiene) y el pase se le activa.
//
//  El orden importa: primero el código y después la cuenta. Al revés le
//  pediríamos que se registre para después decirle que el código no servía.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { Check, Gift, Loader2 } from 'lucide-react';
import CaptchaDeslizar from '../components/CaptchaDeslizar';
import { validarAliasRegalo, activarRegalo } from '../lib/pases';
import { registrarTurista, loginConIdentificador, pareceEmail } from '../lib/auth';

const C = {
  primary:     '#2545E6',
  primaryDark: '#1731B8',
  primarySoft: '#EEF1FF',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  font:        "'Inter', system-ui, sans-serif",
};

const LARGO_CODIGO = 6;

// El código se guarda siempre como 6 dígitos pelados — es lo que espera la
// RPC. El guión existe sólo en pantalla: parte el número en dos bloques de
// tres, que es como se dicta y como se retiene mientras se tipea.
const conGuion = d => (d.length > 3 ? `${d.slice(0, 3)}-${d.slice(3)}` : d);

const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

const inputSt = {
  width: '100%', boxSizing: 'border-box', padding: '13px 15px', borderRadius: 12,
  border: `1px solid ${C.line}`, fontSize: 15, fontFamily: C.font, color: C.ink,
  outline: 'none', background: '#fff',
};
const labelSt = { display: 'block', fontSize: 12.5, fontWeight: 700, color: C.ink2, marginBottom: 6 };

const ERRORES = {
  formato:          'El código tiene que tener 6 números.',
  inexistente:      'Ese código no existe. Revisalo con tu alojamiento.',
  negocio_inactivo: 'El alojamiento que te lo dio no está activo en este momento.',
  cupo_agotado:     'Tu alojamiento ya usó todos sus pases de regalo de este mes.',
  rpc:              'No pudimos validar el código. Probá de nuevo.',
  no_auth:          'Necesitás tener la sesión abierta para activar el pase.',
  pase_inexistente: 'No hay un pase disponible para este destino.',
};

export default function CanjearRegaloView({ onListo, onComprarPase }) {
  const [codigo, setCodigo]     = useState('');
  const [validando, setValidando] = useState(false);
  const [regalo, setRegalo]     = useState(null);   // { negocio_id, negocio_nombre }
  const [errorCodigo, setErrorCodigo] = useState('');

  const [esNuevo, setEsNuevo]   = useState(true);
  const [nombre, setNombre]     = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail]       = useState('');
  const [usuario, setUsuario]   = useState('');
  const [password, setPassword] = useState('');
  const [humano, setHumano]     = useState(false);

  const [error, setError]       = useState('');
  const [activando, setActivando] = useState(false);
  const [listo, setListo]       = useState(false);

  const codigoRef = useRef(null);
  useEffect(() => { codigoRef.current?.focus(); }, []);

  // El submit lo dispara el sexto dígito, no un click. Con un largo fijo y un
  // único campo no hay ambigüedad sobre cuándo terminó de escribir.
  async function validar(valor) {
    setValidando(true);
    setErrorCodigo('');
    const r = await validarAliasRegalo(valor);
    setValidando(false);
    if (r?.ok) { setRegalo(r); return; }
    setErrorCodigo(ERRORES[r?.error] || 'No pudimos validar el código.');
  }

  function onCodigoChange(e) {
    const limpio = e.target.value.replace(/\D/g, '').slice(0, LARGO_CODIGO);
    setCodigo(limpio);
    setErrorCodigo('');
    if (limpio.length === LARGO_CODIGO) validar(limpio);
  }

  async function activar() {
    setError('');
    if (esNuevo) {
      if (!nombre.trim() || !apellido.trim()) return setError('Completá nombre y apellido.');
      if (!emailValido(email))                return setError('Revisá el mail: no parece válido.');
      if (password.length < 6)                return setError('La contraseña tiene que tener al menos 6 caracteres.');
      if (!humano)                            return setError('Deslizá el control de seguridad para confirmar que sos un humano.');
    } else {
      if (!pareceEmail(usuario) && usuario.replace(/\D/g, '').length < 8) {
        return setError('Escribí tu mail o tu teléfono.');
      }
      if (!password)                          return setError('Escribí tu contraseña.');
    }

    setActivando(true);

    // La RPC de activación exige auth.uid(): la cuenta va primero, sí o sí.
    try {
      if (esNuevo) {
        await registrarTurista({ nombre: nombre.trim(), apellido: apellido.trim(), email, password });
      } else {
        const { error: errLogin } = await loginConIdentificador(usuario, password);
        if (errLogin) throw new Error('login');
      }
    } catch (e) {
      setActivando(false);
      const msg = String(e?.message || '');
      if (msg === 'login')            return setError('Usuario o contraseña incorrectos.');
      if (msg.includes('already'))    return setError('Ese mail ya tiene cuenta. Entrá por "Ya tengo cuenta".');
      return setError('No se pudo crear la cuenta. Probá de nuevo.');
    }

    const r = await activarRegalo({ origenNegocioId: regalo.negocio_id });
    setActivando(false);
    if (!r?.ok) return setError(ERRORES[r?.error] || 'No se pudo activar el pase. Probá de nuevo.');

    setListo(true);
  }

  // ── Listo ──
  if (listo) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 100px' }}>
          <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '34px 26px', textAlign: 'center' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 54, height: 54, borderRadius: '50%', background: C.primarySoft, color: C.primary, margin: '0 auto 18px' }}>
              <Check size={26} strokeWidth={3} />
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.01em' }}>
              Tu Pase está activo
            </div>
            <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.6, margin: '10px auto 0', maxWidth: 440 }}>
              Te la regaló {regalo?.negocio_nombre}. Ya podés usar los descuentos de
              todos los comercios adheridos.
            </p>
            <button
              onClick={onListo}
              style={{ width: '100%', marginTop: 26, padding: 15, borderRadius: 14, border: 'none', background: C.ink, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: C.font }}
              onMouseEnter={e => e.currentTarget.style.background = C.primary}
              onMouseLeave={e => e.currentTarget.style.background = C.ink}
            >
              Ver mis descuentos
            </button>
          </div>
        </div>
      </div>
    );
  }

  const codigoOk = !!regalo;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px 100px' }}>

        <div style={{ textAlign: 'center', margin: '18px 0 14px' }}>
          <img src="/logo-cuponear.svg" alt="Cuponear" style={{ width: 230, maxWidth: '72%', height: 'auto', display: 'inline-block' }} />
        </div>
        <h1 style={{ textAlign: 'center', fontSize: 30, fontWeight: 800, letterSpacing: '-0.025em', color: C.ink, margin: '0 0 8px', lineHeight: 1.15 }}>
          Te regalaron un Pase
        </h1>
        <p style={{ textAlign: 'center', fontSize: 15.5, color: C.ink2, lineHeight: 1.55, margin: '0 auto 30px', maxWidth: 460 }}>
          Poné el código de 6 números que te dio tu alojamiento.
        </p>

        {/* Paso 1: el código */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '26px 22px', marginBottom: 16 }}>
          <label htmlFor="cod-regalo" style={{ ...labelSt, textAlign: 'center' }}>TU CÓDIGO</label>
          <input
            id="cod-regalo" ref={codigoRef}
            value={conGuion(codigo)} onChange={onCodigoChange}
            disabled={codigoOk || validando}
            inputMode="numeric" autoComplete="one-time-code"
            placeholder="000-000" maxLength={LARGO_CODIGO + 1}
            style={{
              width: '100%', maxWidth: 400, margin: '0 auto', display: 'block', boxSizing: 'border-box',
              padding: '22px 16px', borderRadius: 16, textAlign: 'center',
              // Menos tracking que antes: el guión ya separa los dos bloques,
              // así que abrir tanto las letras sólo desarmaba el número.
              fontSize: 44, fontWeight: 500, letterSpacing: '0.34em', textIndent: '0.14em',
              fontFamily: C.font, color: C.ink, background: codigoOk ? C.primarySoft : '#fff',
              // Sin cursor: el campo entra enfocado, y a 44px el caret titilando
              // en el medio del cuadro es lo primero que se ve al llegar. Dónde
              // estás parado ya lo dice el número, que se llena de izquierda a
              // derecha y no se puede editar por el medio.
              caretColor: 'transparent',
              border: `1.5px solid ${errorCodigo ? '#B42318' : codigoOk ? C.primary : C.line}`,
              outline: 'none', transition: 'border-color .15s, background .15s',
            }}
            onFocus={e => { if (!errorCodigo && !codigoOk) e.currentTarget.style.borderColor = C.primary; }}
            onBlur={e => { if (!errorCodigo && !codigoOk) e.currentTarget.style.borderColor = C.line; }}
          />

          <div style={{ textAlign: 'center', marginTop: 12, minHeight: 22 }}>
            {validando && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, color: C.muted, fontWeight: 600 }}>
                <Loader2 size={15} className="animate-spin" /> Validando…
              </span>
            )}
            {errorCodigo && (
              <span style={{ fontSize: 13.5, color: '#B42318', fontWeight: 600 }}>{errorCodigo}</span>
            )}
            {codigoOk && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: C.primary, fontWeight: 700 }}>
                <Gift size={16} /> Te la regala {regalo.negocio_nombre}
              </span>
            )}
          </div>

          {codigoOk && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button type="button"
                onClick={() => { setRegalo(null); setCodigo(''); setErrorCodigo(''); codigoRef.current?.focus(); }}
                style={{ background: 'none', border: 'none', padding: 0, color: C.muted, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, textDecoration: 'underline' }}>
                No es este, cambiar el código
              </button>
            </div>
          )}
        </div>

        {/* Paso 2: la cuenta. Sólo aparece con el código ya validado. */}
        {codigoOk && (
          <>
            <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
              <div style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
                INGRESÁ A
                <img src="/logo-cuponear.svg" alt="Cuponear" style={{ height: 17, width: 'auto', display: 'block' }} />
              </div>

              <div role="tablist" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, background: C.bg, borderRadius: 12, marginBottom: 16 }}>
                {[{ id: true, label: 'Soy nuevo' }, { id: false, label: 'Ya tengo cuenta' }].map(t => (
                  <button key={t.label} role="tab" aria-selected={esNuevo === t.id}
                    onClick={() => { setEsNuevo(t.id); setError(''); }}
                    style={{
                      padding: '13px 10px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: C.font,
                      fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', transition: 'background .15s, color .15s',
                      background: esNuevo === t.id ? '#fff' : 'transparent',
                      color: esNuevo === t.id ? C.primary : C.ink2,
                      boxShadow: esNuevo === t.id ? '0 1px 3px rgba(11,16,32,0.12)' : 'none',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {esNuevo && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label style={labelSt} htmlFor="reg-nombre">Nombre</label>
                    <input id="reg-nombre" autoComplete="given-name" value={nombre}
                      onChange={e => setNombre(e.target.value)} placeholder="Camila" style={inputSt} />
                  </div>
                  <div>
                    <label style={labelSt} htmlFor="reg-apellido">Apellido</label>
                    <input id="reg-apellido" autoComplete="family-name" value={apellido}
                      onChange={e => setApellido(e.target.value)} placeholder="Pérez" style={inputSt} />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 14 }}>
                <label style={labelSt} htmlFor="reg-user">{esNuevo ? 'Mail' : 'Mail o teléfono'}</label>
                <input id="reg-user" type={esNuevo ? 'email' : 'text'} autoComplete={esNuevo ? 'email' : 'username'}
                  value={esNuevo ? email : usuario}
                  onChange={e => (esNuevo ? setEmail : setUsuario)(e.target.value)}
                  placeholder="vos@mail.com" style={inputSt} />
              </div>

              <div>
                <label style={labelSt} htmlFor="reg-pass">Contraseña</label>
                <input id="reg-pass" type="password" autoComplete={esNuevo ? 'new-password' : 'current-password'}
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres" style={inputSt} />
              </div>

              {esNuevo && (
                <div style={{ marginTop: 16, maxWidth: 320, marginInline: 'auto' }}>
                  <CaptchaDeslizar verificado={humano} onVerificar={setHumano} />
                </div>
              )}
            </div>

            <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '22px 24px' }}>
              {error && (
                <div style={{ background: '#FDECEC', color: '#B42318', fontSize: 13, padding: '10px 13px', borderRadius: 10, marginBottom: 14 }}>
                  {error}
                </div>
              )}
              <button
                onClick={activar} disabled={activando}
                style={{
                  width: '100%', padding: 16, borderRadius: 14, border: 'none',
                  background: activando ? C.line : C.primary,
                  color: activando ? C.muted : '#fff',
                  fontSize: 16, fontWeight: 800, cursor: activando ? 'not-allowed' : 'pointer',
                  fontFamily: C.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                  transition: 'background .15s',
                }}
                onMouseEnter={e => { if (!activando) e.currentTarget.style.background = C.primaryDark; }}
                onMouseLeave={e => { if (!activando) e.currentTarget.style.background = C.primary; }}
              >
                {activando
                  ? <><Loader2 size={18} className="animate-spin" /> Activando…</>
                  : <><Gift size={18} /> Activar mi Pase</>}
              </button>
              <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 1.5, margin: '12px 0 0' }}>
                El Pase es gratis: te lo paga tu alojamiento.
              </p>
            </div>
          </>
        )}

        {!codigoOk && (
          <div style={{ textAlign: 'center' }}>
            <button type="button" onClick={onComprarPase}
              style={{ background: 'none', border: 'none', padding: 0, color: C.primary, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>
              ¿No te regalaron ninguna? <b style={{ fontWeight: 800 }}>Comprá tu pase acá</b>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
