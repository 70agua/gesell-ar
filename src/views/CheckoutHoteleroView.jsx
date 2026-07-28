// ============================================================
//  src/views/CheckoutHoteleroView.jsx
//  El otro lado del mostrador: el alojamiento que quiere regalarles el pase
//  a sus huéspedes. Misma gramática que CheckoutPaseView — mismas tarjetas,
//  mismo tilde de selección, mismo captcha, mismo paso 2 — para que las dos
//  puertas del paso 0 se sientan el mismo producto.
//
//  El pago es MOCK, igual que el resto de la app.
//
//  Reemplaza al alta que vivía en SociosView (hero oscuro + modal), que era
//  de antes del pivot y hablaba otro idioma visual.
// ============================================================
import { useEffect, useState } from 'react';
import { Check, CreditCard, Loader2, Minus, Plus } from 'lucide-react';
import CaptchaDeslizar from '../components/CaptchaDeslizar';
import { getPlanesPro } from '../lib/planes';
import { altaSocio, ERRORES_ALTA, DESC_MIN } from '../lib/altaSocio';
import { loginConIdentificador, pareceEmail, getSession } from '../lib/auth';

// Misma paleta acotada que el checkout del pase.
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

const TIPOS_ALOJ  = ['Hotel', 'Cabaña', 'Departamento', 'Domo', 'Dormi', 'Carpa', 'Hostel', 'Glamping'];
const LOCALIDADES = ['Villa Gesell', 'Mar de las Pampas', 'Las Gaviotas', 'Mar Azul'];

const UNIDADES_MIN = 1;
const UNIDADES_MAX = 300;

const fmt = n => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;
const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

const inputSt = {
  width: '100%', boxSizing: 'border-box', padding: '13px 15px', borderRadius: 12,
  border: `1px solid ${C.line}`, fontSize: 15, fontFamily: C.font, color: C.ink,
  outline: 'none', background: '#fff',
};
const labelSt = { display: 'block', fontSize: 12.5, fontWeight: 700, color: C.ink2, marginBottom: 6 };

// ─── Botón −/+ de las unidades ───────────────────────────────
function StepBtn({ children, label, disabled, onClick }) {
  return (
    <button
      type="button" aria-label={label} disabled={disabled} onClick={onClick}
      style={{
        display: 'grid', placeItems: 'center', width: 30, height: 30, flexShrink: 0,
        borderRadius: 9, border: `1px solid ${C.line}`, background: '#fff',
        color: disabled ? C.line : C.ink2, cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0, fontFamily: C.font,
      }}
    >
      {children}
    </button>
  );
}

// ─── Tilde de selección — el mismo del checkout del pase ─────
function TildePlan({ activo }) {
  return (
    <span aria-hidden="true"
      style={{
        flexShrink: 0, display: 'grid', placeItems: 'center',
        width: 20, height: 20, borderRadius: '50%',
        border: `1.5px solid ${activo ? C.primary : C.line}`,
        background: activo ? C.primary : '#fff',
        transition: 'all .15s',
      }}
    >
      {activo && <Check size={12} color="#fff" strokeWidth={3.5} />}
    </span>
  );
}

// ─── Cómo funciona, contado desde el mostrador del hotel ─────
const PASOS = [
  { t: 'Sumás tu alojamiento',      d: 'Cargás los datos, lo revisamos y queda publicado en Cuponear.' },
  { t: 'Le regalás el pase a tu huésped', d: 'Le pasás tu código de 6 dígitos al hacer el check-in y el pase se le activa solo.' },
  { t: 'Tu huésped ahorra en todo el pueblo', d: 'Usa los descuentos de los comercios adheridos durante su estadía, y tu alojamiento aparece adentro del pase.' },
];

function ComoFunciona() {
  return (
    <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '22px 22px 20px', marginBottom: 16 }}>
      <div style={{ fontSize: 22, fontWeight: 500, fontStyle: 'italic', color: C.primary, letterSpacing: '-0.01em', textAlign: 'center', margin: '2px 0 20px' }}>
        ¿Cómo funciona?
      </div>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {PASOS.map((p, i) => (
          <li key={p.t} style={{ display: 'flex', alignItems: 'flex-start', gap: 13 }}>
            <span style={{ flexShrink: 0, display: 'grid', placeItems: 'center', width: 26, height: 26, borderRadius: '50%', background: C.primarySoft, color: C.primary, fontSize: 13, fontWeight: 800 }}>
              {i + 1}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{p.t}</div>
              <div style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.5, marginTop: 2 }}>{p.d}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function CheckoutHoteleroView({ onListo, onSoyTurista }) {
  const [planes, setPlanes]   = useState(null);
  const [planId, setPlanId]   = useState('pro_12');
  const [unidades, setUnidades] = useState(10);

  const [nombre, setNombre]           = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo]               = useState(TIPOS_ALOJ[0]);
  const [localidad, setLocalidad]     = useState(LOCALIDADES[0]);

  const [esNuevo, setEsNuevo]   = useState(true);
  const [email, setEmail]       = useState('');
  const [usuario, setUsuario]   = useState('');       // "ya tengo cuenta"
  const [password, setPassword] = useState('');
  const [humano, setHumano]     = useState(false);

  const [error, setError]     = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo]     = useState(null);

  useEffect(() => {
    getPlanesPro()
      .then(ps => {
        setPlanes(ps);
        // El destacado manda sobre el default de arranque: si mañana el
        // "más elegido" pasa a ser otro tramo, no hay que tocar código.
        const dest = ps.find(p => p.destacado);
        if (dest) setPlanId(dest.id);
      })
      .catch(() => setPlanes([]));
  }, []);

  const plan = (planes || []).find(p => p.id === planId) || null;

  async function enviar() {
    setError('');

    if (!nombre.trim())                 return setError('Poné el nombre de tu alojamiento.');
    if (descripcion.trim().length < DESC_MIN) return setError(`Contanos de qué se trata, con al menos ${DESC_MIN} caracteres.`);
    if (esNuevo) {
      if (!emailValido(email))          return setError('Revisá el mail: no parece válido.');
      if (password.length < 6)          return setError('La contraseña tiene que tener al menos 6 caracteres.');
      if (!humano)                      return setError('Deslizá el control de seguridad para confirmar que sos un humano.');
    } else {
      if (!pareceEmail(usuario) && usuario.replace(/\D/g, '').length < 8) {
        return setError('Escribí tu mail o tu teléfono.');
      }
      if (password.length < 6)          return setError('Escribí tu contraseña.');
    }

    setEnviando(true);

    // El que ya tiene cuenta entra primero: altaSocio necesita la sesión viva
    // para colgarle el negocio al perfil que ya existe.
    if (!esNuevo) {
      const { error: errLogin } = await loginConIdentificador(usuario, password);
      if (errLogin) { setEnviando(false); return setError('Usuario o contraseña incorrectos.'); }
    }

    const r = await altaSocio({
      negocio: { nombre, descripcion, tipo, localidad },
      cuenta:  { email, password },
      codigoPlan: planId,
      unidadesDeclaradas: unidades,
    });

    setEnviando(false);
    if (!r.ok) return setError(ERRORES_ALTA[r.error] || 'No se pudo completar el alta. Probá de nuevo.');

    const sesion = await getSession();
    setListo({ nombre, plan, conSesion: !!sesion?.user?.id });
  }

  // ── Paso 2: dado de alta, esperando moderación ──
  if (listo) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 100px' }}>
          <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '34px 26px', textAlign: 'center' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 54, height: 54, borderRadius: '50%', background: C.primarySoft, color: C.primary, margin: '0 auto 18px' }}>
              <Check size={26} strokeWidth={3} />
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.01em' }}>
              {listo.nombre} quedó registrado
            </div>
            <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.6, margin: '10px auto 0', maxWidth: 460 }}>
              Lo revisamos antes de publicarlo — te avisamos por mail cuando esté en línea.
              {' Tu código de 6 dígitos para regalar pases ya está en tu panel.'}
            </p>
            <button
              onClick={onListo}
              style={{ width: '100%', marginTop: 26, padding: 15, borderRadius: 14, border: 'none', background: C.ink, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: C.font }}
              onMouseEnter={e => e.currentTarget.style.background = C.primary}
              onMouseLeave={e => e.currentTarget.style.background = C.ink}
            >
              Ir a mi panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Paso 1 ──
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px 100px' }}>

        {/* Identidad Cuponear, no la del pase: acá el que compra es el socio,
            y lo que contrata es su lugar en la plataforma. */}
        <div style={{ textAlign: 'center', margin: '18px 0 14px' }}>
          <img src="/logo-cuponera.svg" alt="Cuponear" style={{ width: 230, maxWidth: '72%', height: 'auto', display: 'inline-block' }} />
        </div>
        <h1 style={{ textAlign: 'center', fontSize: 30, fontWeight: 700, letterSpacing: '-0.025em', color: C.ink, margin: '0 0 8px', lineHeight: 1.15 }}>
          Sumá tu alojamiento y empezá a regalar
        </h1>
        <p style={{ textAlign: 'center', fontSize: 15.5, color: C.ink2, lineHeight: 1.55, margin: '0 auto 30px', maxWidth: 480 }}>
          Obsequiá descuentos de toda nuestra red, y que tu lugar
          aparezca donde el turista busca antes de reservar.
        </p>

        <ComoFunciona />

        {/* Plan */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ ...labelSt, marginBottom: 4 }}>ELEGÍ TU PLAN PRO</div>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, margin: '0 0 16px' }}>
            Es el mismo plan en los tres casos. Lo que cambia es cuánto te comprometés
            — y cuánto menos pagás por mes.
          </p>
          {planes === null ? (
            <div style={{ color: C.muted, fontSize: 14, padding: '10px 0' }}>Cargando planes…</div>
          ) : (
            <div role="radiogroup" aria-label="Elegí tu plan"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, paddingTop: 10 }}>
              {planes.map(p => {
                const activo = p.id === planId;
                // Ahorro contra el tramo mensual, que es el precio de referencia.
                const mensual = planes.find(x => x.meses === 1)?.precioMes || 0;
                const ahorro  = mensual > 0 ? mensual * p.meses - p.total : 0;
                return (
                  <button key={p.id} onClick={() => setPlanId(p.id)}
                    role="radio" aria-checked={activo}
                    style={{
                      position: 'relative', textAlign: 'left', padding: '16px 14px 14px', borderRadius: 16, cursor: 'pointer',
                      background: activo ? C.primarySoft : '#fff',
                      border: `1.5px solid ${activo ? C.primary : C.line}`,
                      fontFamily: C.font, transition: 'all .15s',
                    }}
                  >
                    {/* El "más elegido" sale de la base (planes.destacado), no
                        de una constante acá: se cambia sin tocar código. */}
                    {p.destacado && (
                      <span style={{
                        position: 'absolute', top: -10, left: 14,
                        background: C.primary, color: '#fff', fontSize: 10.5, fontWeight: 800,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                        padding: '3px 10px', borderRadius: 999, whiteSpace: 'nowrap',
                      }}>
                        El más elegido
                      </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: activo ? C.primary : C.ink, lineHeight: 1.2 }}>
                        {p.nombre}
                      </span>
                      <TildePlan activo={activo} />
                    </div>

                    <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', marginTop: 8 }}>
                      {fmt(p.precioMes)}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>+ IVA por mes</div>

                    <div style={{ fontSize: 12, color: C.ink2, fontWeight: 600, marginTop: 6, lineHeight: 1.4 }}>
                      {p.meses === 1 ? 'Sin permanencia' : `${fmt(p.total)} + IVA por adelantado`}
                    </div>
                    {ahorro > 0 && (
                      <div style={{ fontSize: 12, color: C.primary, fontWeight: 800, marginTop: 2 }}>
                        Ahorrás {fmt(ahorro)}
                      </div>
                    )}

                    {p.creditosBono > 0 && (
                      <div style={{ fontSize: 11.5, color: C.primary, fontWeight: 700, marginTop: 6, lineHeight: 1.35 }}>
                        + {p.creditosBono} créditos de regalo para impulsar tus ofertas
                      </div>
                    )}

                    {p.beneficios?.length > 0 && (
                      <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {p.beneficios.map((b, i) => (
                          <li key={i} style={{ display: 'flex', gap: 6, fontSize: 11.5, color: C.muted, lineHeight: 1.35 }}>
                            <Check size={11} color={C.primary} strokeWidth={3} style={{ flexShrink: 0, marginTop: 3 }} />{b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button type="button" onClick={onSoyTurista}
              style={{ background: 'none', border: 'none', padding: 0, color: C.primary, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>
              ¿Sos turista? <b style={{ fontWeight: 800 }}>Comprá tu pase acá</b>
            </button>
          </div>
        </div>

        {/* Alojamiento */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ ...labelSt, marginBottom: 14 }}>TU ALOJAMIENTO</div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelSt} htmlFor="hot-nombre">Nombre</label>
            <input id="hot-nombre" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Hotel Las Dunas" style={inputSt}
              onFocus={e => e.currentTarget.style.borderColor = C.primary}
              onBlur={e => e.currentTarget.style.borderColor = C.line} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelSt} htmlFor="hot-tipo">Tipo</label>
              <select id="hot-tipo" value={tipo} onChange={e => setTipo(e.target.value)} style={inputSt}>
                {TIPOS_ALOJ.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelSt} htmlFor="hot-loc">Localidad</label>
              <select id="hot-loc" value={localidad} onChange={e => setLocalidad(e.target.value)} style={inputSt}>
                {LOCALIDADES.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelSt} htmlFor="hot-desc">De qué se trata</label>
            <textarea id="hot-desc" rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)}
              placeholder="Contale al turista qué va a encontrar."
              style={{ ...inputSt, resize: 'vertical', lineHeight: 1.5 }}
              onFocus={e => e.currentTarget.style.borderColor = C.primary}
              onBlur={e => e.currentTarget.style.borderColor = C.line} />
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 4 }}>
              {descripcion.trim().length}/{DESC_MIN} caracteres mínimos
            </div>
          </div>

          {/* Unidades: es lo que queda declarado junto al código de 6 dígitos */}
          <div>
            <label style={labelSt}>Unidades / habitaciones</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StepBtn label="Una menos" disabled={unidades <= UNIDADES_MIN}
                onClick={() => setUnidades(u => Math.max(UNIDADES_MIN, u - 1))}><Minus size={14} /></StepBtn>
              <span style={{ minWidth: 46, textAlign: 'center', fontSize: 16, fontWeight: 800, color: C.ink }}>{unidades}</span>
              <StepBtn label="Una más" disabled={unidades >= UNIDADES_MAX}
                onClick={() => setUnidades(u => Math.min(UNIDADES_MAX, u + 1))}><Plus size={14} /></StepBtn>
              <span style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.4 }}>
                Nos sirve para dimensionar cuántos pases vas a regalar.
              </span>
            </div>
          </div>
        </div>

        {/* Cuenta */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
            INGRESÁ A
            <img src="/logo-cuponera.svg" alt="Cuponear" style={{ height: 17, width: 'auto', display: 'block' }} />
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

          <div style={{ marginBottom: 14 }}>
            <label style={labelSt} htmlFor="hot-user">{esNuevo ? 'Mail' : 'Mail o teléfono'}</label>
            <input id="hot-user" type={esNuevo ? 'email' : 'text'} autoComplete={esNuevo ? 'email' : 'username'}
              value={esNuevo ? email : usuario}
              onChange={e => (esNuevo ? setEmail : setUsuario)(e.target.value)}
              placeholder={esNuevo ? 'vos@tualojamiento.com' : 'vos@tualojamiento.com'} style={inputSt}
              onFocus={e => e.currentTarget.style.borderColor = C.primary}
              onBlur={e => e.currentTarget.style.borderColor = C.line} />
          </div>

          <div>
            <label style={labelSt} htmlFor="hot-pass">Contraseña</label>
            <input id="hot-pass" type="password" autoComplete={esNuevo ? 'new-password' : 'current-password'}
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" style={inputSt}
              onFocus={e => e.currentTarget.style.borderColor = C.primary}
              onBlur={e => e.currentTarget.style.borderColor = C.line} />
          </div>

          {esNuevo && (
            <div style={{ marginTop: 16, maxWidth: 320, marginInline: 'auto' }}>
              <CaptchaDeslizar verificado={humano} onVerificar={setHumano} />
            </div>
          )}
        </div>

        {/* Total + alta */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '22px 24px' }}>
          {/* Lo que se paga hoy, que en los tramos largos NO es el precio por
              mes: es el total por adelantado. Mostrarlo acá evita la sorpresa. */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, letterSpacing: '0.03em' }}>
              {plan ? (plan.meses === 1 ? 'PAGÁS POR MES' : `PAGÁS HOY, POR ${plan.meses} MESES`) : 'TOTAL'}
            </div>
            <div style={{ fontSize: 27, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', marginTop: 4 }}>
              {plan ? `${fmt(plan.total)} + IVA` : '—'}
            </div>
            {plan?.nombre && (
              <div style={{ fontSize: 13, color: C.ink2, fontWeight: 600, marginTop: 2 }}>{plan.nombre}</div>
            )}
          </div>

          {error && (
            <div style={{ background: '#FDECEC', color: '#B42318', fontSize: 13, padding: '10px 13px', borderRadius: 10, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button
            onClick={enviar} disabled={enviando}
            style={{
              width: '100%', padding: 16, borderRadius: 14, border: 'none',
              background: enviando ? C.line : C.primary,
              color: enviando ? C.muted : '#fff',
              fontSize: 16, fontWeight: 800, cursor: enviando ? 'not-allowed' : 'pointer',
              fontFamily: C.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              transition: 'background .15s',
            }}
            onMouseEnter={e => { if (!enviando) e.currentTarget.style.background = C.primaryDark; }}
            onMouseLeave={e => { if (!enviando) e.currentTarget.style.background = C.primary; }}
          >
            {enviando
              ? <><Loader2 size={18} className="animate-spin" /> Dando de alta…</>
              : <><CreditCard size={18} /> Contratar {plan?.nombre || 'PRO'}</>}
          </button>

          <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 1.5, margin: '12px 0 0' }}>
            Revisamos cada alojamiento antes de publicarlo.
          </p>
        </div>
      </div>
    </div>
  );
}
