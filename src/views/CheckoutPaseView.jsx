// ============================================================
//  src/views/CheckoutPaseView.jsx
//  Compra directa del Gesell PaSS, sin cuenta: elegís duración, dejás mail y
//  teléfono, pagás. El alta como turista viene después (paso 2), y ahí la
//  compra se vincula al usuario recién creado.
//  El pago es MOCK, igual que el resto de la app.
// ============================================================
import { useEffect, useState } from 'react';
import { Check, CreditCard, Loader2, Minus, Plus } from 'lucide-react';
import { getPasesDestino, comprarPaseAnonimo, vincularComprasPase } from '../lib/pases';
import { loginConIdentificador, pareceEmail, registrarTurista, recuperarPassword, getSession } from '../lib/auth';

// Paleta acotada a la línea de la marca: primary, negro, blanco y los grises
// que se desprenden de ahí. Sin amarillo ni navy — el checkout es la pantalla
// de plata y tiene que leerse sobria.
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

// Tercera opción: pase a medida. Arranca donde termina el de 7 días y se cobra
// proporcional a ese pase (mismo precio por día), sin recargo ni descuento.
const DIAS_CUSTOM_MIN = 8;
const DIAS_CUSTOM_MAX = 30;
const DIAS_BASE_PRORRATEO = 7;

const fmt = n => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;
// Redondeo a la centena para que el prorrateo no escupa precios con cifras sueltas.
const redondear = n => Math.round((Number(n) || 0) / 100) * 100;
const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
// Teléfono opcional: si lo cargan, que al menos tenga 8 dígitos.
const telValido = v => !v.trim() || v.replace(/\D/g, '').length >= 8;

const inputSt = {
  width: '100%', boxSizing: 'border-box', padding: '13px 15px', borderRadius: 12,
  border: `1px solid ${C.line}`, fontSize: 15, fontFamily: C.font, color: C.ink,
  outline: 'none', background: '#fff',
};
const labelSt = { display: 'block', fontSize: 12.5, fontWeight: 700, color: C.ink2, marginBottom: 6 };

// ─── Marca "PaSS" ────────────────────────────────────────────
// Misma construcción que en la home: la Nauryz en blanco sobre una pastilla
// primary. La pastilla va corrida por su cuenta porque la fuente trae los
// glifos descentrados dentro de su caja; los offsets escalan con el cuerpo.
const NAURYZ = "'NauryzRedkeds', sans-serif";

function PaSSMark({ size = 20, conGesell = false }) {
  const k = size / 20; // los offsets están calibrados a 20px
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 * k, lineHeight: 1 }}>
      {conGesell && (
        <span style={{ fontFamily: NAURYZ, fontSize: size, letterSpacing: k, color: C.primary, lineHeight: 1 }}>GESELL</span>
      )}
      <span style={{ position: 'relative', display: 'inline-block', fontSize: size, lineHeight: 1, padding: `${5 * k}px ${13 * k}px ${6 * k}px` }}>
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, transform: `translate(${-7 * k}px, ${-2 * k}px)`, background: C.primary, borderRadius: 999 }} />
        {/* La fuente va también acá: index.css tiene un `* { font-family: Inter }`
            que le gana a la herencia. */}
        <span style={{ position: 'relative', left: -5 * k, fontFamily: NAURYZ, fontSize: size, letterSpacing: k, color: '#fff', lineHeight: 1 }}>PaSS</span>
      </span>
    </span>
  );
}

// ─── Botón −/+ del pase a medida ─────────────────────────────
function StepBtn({ children, label, disabled, onClick }) {
  return (
    <button
      type="button" aria-label={label} disabled={disabled}
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        display: 'grid', placeItems: 'center', width: 26, height: 26, flexShrink: 0,
        borderRadius: 8, border: `1px solid ${C.line}`, background: '#fff',
        color: disabled ? C.line : C.ink2, cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0, fontFamily: C.font,
      }}
    >
      {children}
    </button>
  );
}

// ─── Íconos de la aclaración de reserva previa ───────────────
// Tabler Icons (MIT): home, massage y beach — lucide no trae ni masaje ni
// tabla de surf. Van inline para que hereden color y tamaño del contenedor.
const svgBase = { width: 30, height: 30, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };

const IcoCasa = () => (
  <svg {...svgBase}>
    <path d="M5 12l-2 0l9 -9l9 9l-2 0" />
    <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
    <path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
  </svg>
);
const IcoMasaje = () => (
  <svg {...svgBase}>
    <path d="M3 17a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M8 5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
    <path d="M4 22l4 -2v-3h12" />
    <path d="M11 20h9" />
    <path d="M8 14l3 -2l1 -4c3 1 3 4 3 6" />
  </svg>
);
const IcoTabla = () => (
  <svg {...svgBase}>
    <path d="M17.553 16.75a7.5 7.5 0 0 0 -10.606 0" />
    <path d="M18 3.804a6 6 0 0 0 -8.196 2.196l10.392 6a6 6 0 0 0 -2.196 -8.196" />
    <path d="M16.732 10c1.658 -2.87 2.225 -5.644 1.268 -6.196c-.957 -.552 -3.075 1.326 -4.732 4.196" />
    <path d="M15 9l-3 5.196" />
    <path d="M3 19.25a2.4 2.4 0 0 1 1 -.25a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 1 .25" />
  </svg>
);

const ICONOS_RESERVA = [
  { Ico: IcoCasa,   label: 'Alojamiento' },
  { Ico: IcoMasaje, label: 'Spa y masajes' },
  { Ico: IcoTabla,  label: 'Clases y excursiones' },
];

// ─── Cómo funciona: los tres pasos, antes de elegir nada ─────
const PASOS = [
  { t: 'Pagás',              d: 'Dejás tu mail, pagás online y el pase queda a tu nombre.' },
  { t: 'Activás la cuponera', d: 'Cuando llegás a destino, ó elegís una fecha y se activa sola.' },
  { t: 'Explorás las ofertas y armás tu cuponera', d: 'Usás los descuentos en todo el catálogo mientras dure tu pase.' },
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
      {/* Reserva previa: los íconos hacen de ilustración de a qué se refiere */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '18px 0 0', padding: '14px 16px', background: C.bg, borderRadius: 12 }}>
        <div style={{ display: 'flex', gap: 14, flexShrink: 0, color: C.primary }}>
          {ICONOS_RESERVA.map(({ Ico, label }) => (
            <span key={label} title={label} style={{ display: 'grid', placeItems: 'center' }}>
              <Ico />
            </span>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 13, color: C.ink2, lineHeight: 1.5 }}>
          Podés reservar anticipadamente los descuentos en servicios que requieran reserva previa.
        </p>
      </div>
    </div>
  );
}

export default function CheckoutPaseView({ paseDias = 7, onListo, onSoyHotelero }) {
  const [pases, setPases]     = useState(null);
  const [elegido, setElegido] = useState(paseDias); // nº de días, o 'custom'
  const [diasCustom, setDiasCustom] = useState(DIAS_CUSTOM_MIN);
  const [esNuevo, setEsNuevo] = useState(true); // pestaña nuevo / ya registrado
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail]     = useState('');
  const [usuario, setUsuario] = useState(''); // "ya tengo cuenta": mail o teléfono
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [avisoReset, setAvisoReset] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError]     = useState('');
  const [pagando, setPagando] = useState(false);
  const [listo, setListo]     = useState(null); // { compra, pase }

  useEffect(() => {
    let vivo = true;
    getPasesDestino().then(data => {
      if (!vivo) return;
      setPases(data);
      // Si el pase que venía por parámetro no existe, cae al primero vigente.
      if (!data.some(p => p.duracion_dias === paseDias) && data[0]) setElegido(data[0].duracion_dias);
    });
    return () => { vivo = false; };
  }, [paseDias]);

  const esCustom = elegido === 'custom';

  // El pase a medida se cobra proporcional al de 7 días: ese es el precio/día
  // de referencia. Si esa duración no existiera, se usa el pase más largo.
  const paseProrrateo = (pases || []).find(p => p.duracion_dias === DIAS_BASE_PRORRATEO)
    || (pases || [])[(pases || []).length - 1]
    || null;
  const precioPorDia = paseProrrateo ? paseProrrateo.precio_final / paseProrrateo.duracion_dias : 0;
  const precioCustom = redondear(precioPorDia * diasCustom);

  // `pase` es la fila de `pases` contra la que se registra la compra; a medida
  // se apoya en la del prorrateo y solo cambia el precio.
  const pase   = esCustom ? paseProrrateo : ((pases || []).find(p => p.duracion_dias === elegido) || null);
  const dias   = esCustom ? diasCustom : (pase?.duracion_dias || 0);
  const precio = esCustom ? precioCustom : (pase?.precio_final || 0);
  const nombre = esCustom ? `Pase x ${diasCustom} días` : (pase?.nombre_comercial || 'Total');

  // Link "olvidé mi contraseña": manda el mail de recuperación al que esté
  // escrito arriba, sin sacar al comprador de la pantalla. Solo sirve con mail
  // — es lo único a lo que Supabase puede mandar el link.
  async function olvideLaClave() {
    setError(''); setAvisoReset('');
    if (!pareceEmail(usuario)) { setError('Escribí tu mail arriba y volvé a tocar el link.'); return; }
    try {
      await recuperarPassword(usuario);
      setAvisoReset('Te mandamos un mail para que la cambies.');
    } catch {
      setError('No se pudo enviar el mail de recuperación. Probá de nuevo.');
    }
  }

  async function pagar() {
    setError(''); setAvisoReset('');
    if (esNuevo) {
      if (!nombreUsuario.trim() || !apellido.trim()) { setError('Completá nombre y apellido.'); return; }
      if (!emailValido(email)) { setError('Revisá el mail: no parece válido.'); return; }
      if (!telValido(telefono)) { setError('Revisá el teléfono: faltan dígitos.'); return; }
      if (password !== password2) { setError('Las contraseñas no coinciden.'); return; }
    } else if (!pareceEmail(usuario) && usuario.replace(/\D/g, '').length < 8) {
      setError('Escribí tu mail o tu teléfono.'); return;
    }
    if (password.length < 6) { setError('La contraseña tiene que tener al menos 6 caracteres.'); return; }
    if (!pase) { setError('No se pudo cargar el pase. Recargá la página.'); return; }

    setPagando(true);

    // Antes de cobrar, la cuenta: si es nuevo se crea, si ya existe se valida
    // la contraseña. Así el pase termina en una cuenta real y no en el limbo.
    try {
      if (esNuevo) {
        await registrarTurista({ nombre: nombreUsuario.trim(), apellido: apellido.trim(), email, password });
      } else {
        await loginConIdentificador(usuario, password);
      }
    } catch (e) {
      setPagando(false);
      const msg = String(e?.message || '').toLowerCase();
      if (esNuevo && msg.includes('already')) setError('Ese mail ya tiene cuenta. Entrá por "Ya tengo cuenta".');
      else if (!esNuevo) setError('Usuario o contraseña incorrectos.');
      else setError('No se pudo crear la cuenta. Probá de nuevo.');
      return;
    }

    // Con sesión (login, o alta sin confirmación pendiente) el pase pasa a la
    // cuenta ahí mismo. Si no, queda esperando a que confirme el mail: App.jsx
    // lo vincula al primer ingreso.
    const sesion = await getSession();
    // La compra se guarda contra un mail; si entró con teléfono, sale del
    // usuario de la sesión.
    const emailCompra = esNuevo ? email : (sesion?.user?.email || (pareceEmail(usuario) ? usuario : ''));
    if (!emailCompra) {
      setPagando(false);
      setError('Tu cuenta no tiene un mail asociado. Entrá con tu mail para comprar el pase.');
      return;
    }

    // MOCK de pago: no hay pasarela real. La referencia la genera la lib.
    const { ok, compra, error: err } = await comprarPaseAnonimo({
      paseId: pase.id, precio, email: emailCompra, telefono,
      // Al que ya tiene cuenta no se los pedimos: van en null.
      nombre:   esNuevo ? nombreUsuario : null,
      apellido: esNuevo ? apellido : null,
    });
    if (!ok) {
      setPagando(false);
      setError(err === 'datos_incompletos' ? 'Faltan datos.' : 'No se pudo registrar la compra. Probá de nuevo.');
      return;
    }

    if (sesion?.user?.id) await vincularComprasPase(sesion.user.id, emailCompra);

    setPagando(false);
    setListo({ compra, pase, nombre, precio, dias, email: emailCompra, conSesion: !!sesion?.user?.id });
  }

  // ── Paso 2: pagado, falta el registro ──
  if (listo) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '60px 24px 100px' }}>
          <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 24, padding: '40px 36px', textAlign: 'center' }}>
            <div style={{ width: 62, height: 62, borderRadius: '50%', background: C.primarySoft, display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
              <Check size={30} color={C.primary} strokeWidth={3} />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: C.ink, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
              ¡Listo, tu pase está pago!
            </h1>
            <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.6, margin: '0 0 8px' }}>
              {listo.nombre} · {fmt(listo.precio)}
            </p>
            <p style={{ fontSize: 15, color: C.ink2, lineHeight: 1.6, margin: '0 0 28px' }}>
              {listo.conSesion
                ? <>Ya está cargado en tu cuenta (<strong>{listo.email}</strong>). Activalo cuando llegues o programá la fecha.</>
                : <>Te mandamos un mail a <strong>{listo.email}</strong> para confirmar tu cuenta. Cuando la confirmes, el pase te aparece cargado.</>}
            </p>
            <button
              onClick={() => onListo?.()}
              style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: C.ink, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: C.font }}
              onMouseEnter={e => e.currentTarget.style.background = C.primary}
              onMouseLeave={e => e.currentTarget.style.background = C.ink}
            >
              {listo.conSesion ? 'Empezar a explorar' : 'Volver al inicio'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Paso 1: elegir pase + datos de contacto + pago ──
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '36px 24px 100px' }}>

        {/* Título: el símbolo del hero, centrado, solo e inclinado igual que allá */}
        <div style={{ textAlign: 'center', margin: '18px 0 40px' }}>
          <img src="/gesell-pass-03.svg" alt="Gesell PaSS" style={{ width: 210, maxWidth: '70%', height: 'auto', display: 'inline-block', transform: 'rotate(-25deg)' }} />
        </div>

        {/* Cómo funciona — antes de elegir nada */}
        <ComoFunciona />

        {/* Duración */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ ...labelSt, marginBottom: 12 }}>ELEGÍ TU PASE</div>
          {pases === null ? (
            <div style={{ color: C.muted, fontSize: 14, padding: '10px 0' }}>Cargando pases…</div>
          ) : pases.length === 0 ? (
            <div style={{ color: C.muted, fontSize: 14, padding: '10px 0' }}>No hay pases disponibles por ahora.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pases.length + 1}, 1fr)`, gap: 12 }}>
              {pases.map(p => {
                const activo = !esCustom && p.duracion_dias === elegido;
                return (
                  <button key={p.id} onClick={() => setElegido(p.duracion_dias)}
                    style={{
                      textAlign: 'left', padding: '16px 14px 14px', borderRadius: 16, cursor: 'pointer',
                      background: activo ? C.primarySoft : '#fff',
                      border: `1.5px solid ${activo ? C.primary : C.line}`,
                      fontFamily: C.font, transition: 'all .15s',
                    }}
                  >
                    <PaSSMark size={15} />
                    <div style={{ fontSize: 15, fontWeight: 800, color: activo ? C.primary : C.ink, marginTop: 10 }}>
                      {p.duracion_dias} días
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', marginTop: 4 }}>
                      {fmt(p.precio_final)}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>por única vez</div>
                  </button>
                );
              })}

              {/* A medida: elegís los días y el precio sale proporcional al de 7 */}
              <div
                role="button" tabIndex={0}
                onClick={() => setElegido('custom')}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setElegido('custom'); } }}
                style={{
                  textAlign: 'left', padding: '16px 14px 14px', borderRadius: 16, cursor: 'pointer',
                  background: esCustom ? C.primarySoft : '#fff',
                  border: `1.5px solid ${esCustom ? C.primary : C.line}`,
                  fontFamily: C.font, transition: 'all .15s',
                }}
              >
                <PaSSMark size={15} />
                {/* Sin rótulo propio: el selector ocupa el lugar del "N días" de
                    los otros pases, así las tres cajas quedan renglón a renglón. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <StepBtn
                    label="Un día menos"
                    disabled={diasCustom <= DIAS_CUSTOM_MIN}
                    onClick={() => { setElegido('custom'); setDiasCustom(d => Math.max(DIAS_CUSTOM_MIN, d - 1)); }}
                  ><Minus size={13} /></StepBtn>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 800, color: esCustom ? C.primary : C.ink, whiteSpace: 'nowrap' }}>
                    {diasCustom} días
                  </span>
                  <StepBtn
                    label="Un día más"
                    disabled={diasCustom >= DIAS_CUSTOM_MAX}
                    onClick={() => { setElegido('custom'); setDiasCustom(d => Math.min(DIAS_CUSTOM_MAX, d + 1)); }}
                  ><Plus size={13} /></StepBtn>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', marginTop: 4 }}>
                  {fmt(precioCustom)}
                </div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>desde {DIAS_CUSTOM_MIN} días</div>
              </div>
            </div>
          )}

          {/* Salida para el otro lado del mostrador: el hotelero no compra un
              pase, se suscribe para regalárselos a sus huéspedes. */}
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <button
              type="button" onClick={onSoyHotelero}
              style={{ background: 'none', border: 'none', padding: 0, color: C.primary, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, textDecoration: 'underline', textUnderlineOffset: 3 }}
            >
              ¿Sos hotelero? Seguí este enlace
            </button>
          </div>
        </div>

        {/* Contacto */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
          <div style={{ ...labelSt, marginBottom: 14 }}>INGRESÁ A CUPONEAR</div>

          {/* Nuevo vs. ya registrado: al que ya tiene cuenta no le pedimos
              nombre — esos datos ya están en su perfil y la compra se le
              vincula sola por mail. */}
          <div role="tablist" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, background: C.bg, borderRadius: 12, marginBottom: 16 }}>
            {[{ id: true, label: 'Soy nuevo' }, { id: false, label: 'Ya tengo cuenta' }].map(t => (
              <button
                key={t.label} role="tab" aria-selected={esNuevo === t.id}
                onClick={() => { setEsNuevo(t.id); setError(''); }}
                style={{
                  padding: '9px 10px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: C.font,
                  fontSize: 13.5, fontWeight: 700, transition: 'background .15s, color .15s',
                  background: esNuevo === t.id ? '#fff' : 'transparent',
                  color: esNuevo === t.id ? C.primary : C.muted,
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
                <label style={labelSt} htmlFor="pase-nombre">Nombre</label>
                <input id="pase-nombre" type="text" autoComplete="given-name"
                  value={nombreUsuario} onChange={e => setNombreUsuario(e.target.value)}
                  placeholder="Camila" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </div>
              <div>
                <label style={labelSt} htmlFor="pase-apellido">Apellido</label>
                <input id="pase-apellido" type="text" autoComplete="family-name"
                  value={apellido} onChange={e => setApellido(e.target.value)}
                  placeholder="Gómez" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </div>
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            {esNuevo ? (
              <>
                <label style={labelSt} htmlFor="pase-email">Mail</label>
                <input id="pase-email" type="email" inputMode="email" autoComplete="email"
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="tunombre@mail.com" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </>
            ) : (
              <>
                <label style={labelSt} htmlFor="pase-usuario">Mail o teléfono</label>
                <input id="pase-usuario" type="text" autoComplete="username"
                  value={usuario} onChange={e => setUsuario(e.target.value)}
                  placeholder="tunombre@mail.com · 11 5555 5555" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </>
            )}
          </div>
          {/* Contraseña: el nuevo la crea (con confirmación), el que ya tiene
              cuenta la usa para entrar. */}
          {esNuevo ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelSt} htmlFor="pase-pass">Contraseña</label>
                <input id="pase-pass" type="password" autoComplete="new-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </div>
              <div>
                <label style={labelSt} htmlFor="pase-pass2">Repetir contraseña</label>
                <input id="pase-pass2" type="password" autoComplete="new-password"
                  value={password2} onChange={e => setPassword2(e.target.value)}
                  placeholder="Otra vez" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt} htmlFor="pase-pass">Contraseña</label>
              <input id="pase-pass" type="password" autoComplete="current-password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Tu contraseña" style={inputSt}
                onFocus={e => e.currentTarget.style.borderColor = C.primary}
                onBlur={e => e.currentTarget.style.borderColor = C.line} />
              <button
                type="button" onClick={olvideLaClave}
                style={{ background: 'none', border: 'none', padding: '8px 0 0', color: C.primary, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: C.font }}
              >
                Olvidé mi contraseña
              </button>
              {avisoReset && (
                <p style={{ fontSize: 12.5, color: C.ink2, margin: '4px 0 0', lineHeight: 1.5 }}>{avisoReset}</p>
              )}
            </div>
          )}

          {/* El teléfono solo se le pide al nuevo: del que ya tiene cuenta ya
              lo tenemos en su perfil. */}
          {esNuevo ? (
            <div>
              <label style={labelSt} htmlFor="pase-tel">Teléfono <span style={{ fontWeight: 500, color: C.muted }}>(opcional)</span></label>
              <input id="pase-tel" type="tel" inputMode="tel" autoComplete="tel"
                value={telefono} onChange={e => setTelefono(e.target.value)}
                placeholder="11 5555 5555" style={inputSt}
                onFocus={e => e.currentTarget.style.borderColor = C.primary}
                onBlur={e => e.currentTarget.style.borderColor = C.line} />
            </div>
          ) : (
            <p style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.5, margin: '2px 0 0' }}>
              El pase te queda cargado en tu cuenta, sin hacer nada más.
            </p>
          )}
        </div>

        {/* Total + pago */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <PaSSMark size={14} conGesell />
            {dias > 0 && <span style={{ fontSize: 14, color: C.ink2 }}>x {dias} días</span>}
          </div>

          {error && (
            <div style={{ background: '#FDECEC', color: '#B42318', fontSize: 13, padding: '10px 13px', borderRadius: 10, marginBottom: 14 }}>
              {error}
            </div>
          )}

          <button
            onClick={pagar}
            disabled={pagando || !pase}
            style={{
              width: '100%', padding: '16px', borderRadius: 14, border: 'none',
              background: pagando || !pase ? C.line : C.primary,
              color: pagando || !pase ? C.muted : '#fff',
              fontSize: 16, fontWeight: 800, cursor: pagando || !pase ? 'not-allowed' : 'pointer',
              fontFamily: C.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
              transition: 'background .15s',
            }}
            onMouseEnter={e => { if (!pagando && pase) e.currentTarget.style.background = C.primaryDark; }}
            onMouseLeave={e => { if (!pagando && pase) e.currentTarget.style.background = C.primary; }}
          >
            {pagando
              ? <><Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} /> Procesando…</>
              : <><CreditCard size={17} /> Pagar {pase ? fmt(precio) : ''}</>}
          </button>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>
  );
}
