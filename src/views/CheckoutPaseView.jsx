// ============================================================
//  src/views/CheckoutPaseView.jsx
//  Compra directa del Cupon PASS, sin cuenta: elegís duración, dejás mail y
//  teléfono, pagás. El alta como turista viene después (paso 2), y ahí la
//  compra se vincula al usuario recién creado.
//  El pago es MOCK, igual que el resto de la app.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { Check, CreditCard, Loader2, Minus, Plus } from 'lucide-react';
import { getPasesDestino, comprarPaseAnonimo, vincularComprasPase, eleccionesPremium, esPremiumIlimitado, contarIncluidasEnPase } from '../lib/pases';
import { usePasePropio } from '../lib/pasePropio';
import CupopacksParaPase from '../components/CupopacksParaPase';
import PaSSMark from '../components/PaSSMark';
import Icono from '../components/Icono';
import CaptchaDeslizar from '../components/CaptchaDeslizar';
import { loginConIdentificador, pareceEmail, registrarTurista, recuperarPassword, getSession } from '../lib/auth';

// Paleta acotada a la línea de la marca: primary, negro, blanco y los grises
// que se desprenden de ahí. Sin amarillo ni navy — el checkout es la pantalla
// de plata y tiene que leerse sobria.
const C = {
  primary:     '#475BE1',
  primaryDark: '#3347C8',
  primarySoft: '#EEF0FD',
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
// El selector arranca posicionado en 10 y no en el mínimo: es la cantidad de
// días que el negocio quiere mostrar primero (aunque el turista pueda igual
// bajarlo a 9 u 8 con el paso a paso). Un default != mínimo es una decisión de
// producto, no un olvido — por eso queda como constante nombrada y no un
// número suelto en el useState.
const DIAS_CUSTOM_INICIAL = 10;
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

// ─── Botón −/+ del pase a medida ─────────────────────────────
function StepBtn({ children, label, disabled, onClick }) {
  return (
    <button
      type="button" aria-label={label} disabled={disabled}
      onClick={e => { e.stopPropagation(); onClick(); }}
      style={{
        display: 'grid', placeItems: 'center', width: 26, height: 26, flexShrink: 0,
        borderRadius: 8, border: `1px solid ${C.line}`, background: '#475BE1',
        color: disabled ? '#5f76ea' : C.line, cursor: disabled ? 'not-allowed' : 'pointer',
        padding: 0, fontFamily: C.font,
      }}
    >
      {children}
    </button>
  );
}

// ─── Ícono de la aclaración de reserva previa ────────────────
// Uno solo, el del calendario: lo que hay que entender acá es "con fecha por
// adelantado", no el catálogo de rubros. Es Lottie con animar (loop permanente,
// no espera hover) y el canvas cuadrado necesita ancho explícito.
const ICONO_RESERVA = { src: '/iconos/fecha.json', label: 'Fecha coordinada', lado: 54 };

// ─── Tilde de selección, arriba a la derecha de cada tarjeta ─
// El borde y el fondo azul ya marcan cuál está elegido, pero de reojo se
// confunden entre tres cajas iguales. El tilde lo dice sin ambigüedad y, como
// es redondo y hay uno solo prendido, se lee como lo que es: excluyente.
function TildePase({ activo }) {
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

// ─── Qué trae cada pase, al pie de su tarjeta ────────────────
// Dos renglones, en el orden en que se entiende la oferta: primero el catálogo
// que entra entero (igual para todos los pases, sale del catálogo vivo) y
// después las elecciones premium, que sí crecen con los días.
// Si el conteo de incluidas todavía no llegó (o dio 0), esa línea no se pinta.
//
// Desde DIAS_PREMIUM_ILIMITADO (10 días) las dos líneas se reemplazan por una
// sola: a esa duración no hay "N descuentos premium" que contar, porque no hay
// tope — reportar un número ahí sería inventarle un límite que no tiene.
function Incluye({ incluidas, dias }) {
  if (esPremiumIlimitado(dias)) {
    return (
      <div style={{ fontSize: 11.5, color: C.primary, fontWeight: 700, lineHeight: 1.35, marginTop: 6 }}>
        Todo el catálogo disponible
      </div>
    );
  }
  return (
    <div style={{ fontSize: 11.5, fontWeight: 500, color: C.muted, marginTop: 6 }}>
      {incluidas > 0 && <div>{incluidas} descuentos incluidos</div>}
      <div style={{ fontSize: 11.5, color: C.primary, fontWeight: 700, lineHeight: 1.35 }}>+ {eleccionesPremium(dias)} descuentos PREMIUM</div>
    </div>
  );
}

// ─── Cómo funciona: los tres pasos, antes de elegir nada ─────
const PASOS = [
  { t: 'Elegí un pase',              d: '¿Cuántos días te quedás? Pagás online, completás tus datos y el pase queda a tu nombre.' },
  { t: 'Activá el pase o programá su activación', d: '¿Cuando llegás a destino? Elegís una fecha y se activa sola.' },
  { t: '¡Explorás las ofertas!', d: 'Mostrá el pase en el local y el descuento se aplica al toque, las veces que quieras mientras esté activo.' },
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
      {/* Reserva previa: el ícono hace de ilustración de a qué se refiere */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '18px 0 0', padding: '14px 16px', background: C.bg, borderRadius: 12 }}>
        <Icono src={ICONO_RESERVA.src} label={ICONO_RESERVA.label} animar
          style={{ height: ICONO_RESERVA.lado, width: ICONO_RESERVA.lado, display: 'block', flexShrink: 0 }} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>Canjeá con tiempo las ofertas que requieran fecha y hora.</div>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: C.ink2, lineHeight: 1.5 }}>
            Desde la ficha del cupón podés asegurarte por anticipado que los servicios que requieran confirmación estarán disponibles en la fecha que desées (alojamientos, masajes, una cabalgata, etc). Deberás esperar la respuesta del comercio.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Paso 0: ¿de qué lado del mostrador estás? ───────────────
// Sólo aparece cuando se entra por "Planes y suscripción", que es la puerta
// genérica: ahí todavía no sabemos si viene a comprarse un pase o a venderlos.
// Los CTA de "Pase x N días" ya traen la respuesta implícita y saltean el paso.
const PERFILES = [
  {
    id: 'turista',
    titulo: 'Soy turista',
    bajada: 'Vengo unos días y quiero mi pase con todos los descuentos.',
    cta: 'Ver los pases',
    icono: '/iconos/sombrilla.svg',
  },
  {
    id: 'hotelero',
    titulo: 'Soy hotelero',
    bajada: 'Quiero regalarles el pase a mis turistas y sumar mi alojamiento.',
    cta: 'Ver los planes',
    icono: '/iconos/cabania.json',
  },
];

function PasoPerfil({ onElegir }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px 100px' }}>

        <div style={{ textAlign: 'center', margin: '18px 0 34px' }}>
          <img src="/cupon-pass.svg" alt="Cupon PASS" style={{ width: 210, maxWidth: '70%', height: 'auto', display: 'inline-block' }} />
        </div>

        <div style={{ fontSize: 22, fontWeight: 500, fontStyle: 'italic', color: C.primary, letterSpacing: '-0.01em', textAlign: 'center', margin: '0 0 6px' }}>
          ¿Con cuál te identificás?
        </div>
        <p style={{ textAlign: 'center', fontSize: 14, color: C.muted, margin: '0 0 24px', lineHeight: 1.5 }}>
          Según de qué lado estés, el pase se compra o se regala.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
          {PERFILES.map(p => (
            <button
              key={p.id} type="button" onClick={() => onElegir(p.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 10,
                background: '#fff', border: `1.5px solid ${C.line}`, borderRadius: 20,
                padding: '28px 22px 24px', cursor: 'pointer', fontFamily: C.font,
                transition: 'border-color .15s, box-shadow .15s, transform .15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = C.primary;
                e.currentTarget.style.boxShadow = '0 14px 32px -22px rgba(11,16,32,0.55)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = C.line;
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              {/* El SVG es vertical y se dibuja con width:'auto'; el Lottie
                  corre sobre un canvas cuadrado y necesita ancho explícito.
                  hoverEn="padre": el mouse entra por la tarjeta, no por el ícono. */}
              <Icono src={p.icono} hoverEn="padre"
                style={{ height: 58, width: p.icono.endsWith('.json') ? 58 : 'auto', display: 'block' }} />
              <span style={{ fontSize: 18, fontWeight: 800, color: C.ink, letterSpacing: '-0.01em' }}>{p.titulo}</span>
              <span style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.5 }}>{p.bajada}</span>
              <span style={{ marginTop: 6, fontSize: 13.5, fontWeight: 800, color: C.primary }}>{p.cta} →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// El provider ya estaba montado cuando la compra ni existía, así que su lectura
// es vieja: hay que pedirle que vuelva a mirar una vez, al aterrizar acá.
function OfertaPostCompra() {
  const { pase, libres, total, premiumIlimitado, elegidasIds, refrescar } = usePasePropio();
  const [listo, setListo] = useState(false);

  useEffect(() => { refrescar().then(() => setListo(true)); }, [refrescar]);

  // `libres <= 0` sigue funcionando con libres=Infinity (§infinito en
  // lib/pasePropio.jsx): la comparación numérica no necesita casos especiales.
  if (!listo || !pase || libres <= 0) return null;
  return (
    <div style={{ marginTop: 16 }}>
      <CupopacksParaPase
        paseId={pase.id} libres={libres} total={total} premiumIlimitado={premiumIlimitado}
        elegidasIds={elegidasIds} onCambio={refrescar} />
    </div>
  );
}

export default function CheckoutPaseView({ paseDias = 7, onListo, onSoyHotelero, preguntarPerfil = false }) {
  // null = todavía no contestó el paso 0. Si no hay que preguntar, entra
  // derecho como turista, que es lo que venía haciendo hasta ahora.
  const [perfil, setPerfil] = useState(preguntarPerfil ? null : 'turista');
  const [pases, setPases]     = useState(null);
  const [elegido, setElegido] = useState(paseDias); // nº de días, o 'custom'
  const [diasCustom, setDiasCustom] = useState(DIAS_CUSTOM_INICIAL);
  const [esNuevo, setEsNuevo] = useState(true); // pestaña nuevo / ya registrado
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail]     = useState('');
  const [usuario, setUsuario] = useState(''); // "ya tengo cuenta": mail o teléfono
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [humano, setHumano] = useState(false); // captcha de arrastre, sólo al registrarse
  const [avisoReset, setAvisoReset] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError]     = useState('');
  const [pagando, setPagando] = useState(false);
  const [listo, setListo]     = useState(null); // { compra, pase }
  // Descuentos incluidos (capa base) del catálogo vivo: mismo número para los
  // tres pases, porque esa capa no se raciona.
  const [incluidas, setIncluidas] = useState(0);
  const customRef = useRef(null);

  useEffect(() => {
    let vivo = true;
    getPasesDestino().then(data => {
      if (!vivo) return;
      setPases(data);
      // El pase a medida no es una fila de `pases` (se prorratea), así que
      // nunca cae en el fallback de abajo.
      if (paseDias === 'custom') return;
      // Si el pase que venía por parámetro no existe, cae al primero vigente.
      if (!data.some(p => p.duracion_dias === paseDias) && data[0]) setElegido(data[0].duracion_dias);
    });
    return () => { vivo = false; };
  }, [paseDias]);

  useEffect(() => {
    let vivo = true;
    contarIncluidasEnPase().then(n => { if (vivo) setIncluidas(n); });
    return () => { vivo = false; };
  }, []);

  // Entrada por el "+ días" del hero: el pase a medida ya viene elegido, pero
  // la caja de duración queda debajo del "cómo funciona" — hay que traerla a la
  // vista o el usuario aterriza en una pantalla que parece no haberlo escuchado.
  useEffect(() => {
    if (paseDias !== 'custom' || !pases?.length) return;
    const t = setTimeout(() => {
      customRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => clearTimeout(t);
  }, [paseDias, pases]);

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
      if (!humano) { setError('Deslizá el control de seguridad para confirmar que no sos un robot.'); return; }
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
      paseId: pase.id, precio, email: emailCompra, telefono, dias,
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

  // ── Paso 0: turista o hotelero ──
  // Va antes que todo: el hotelero no tiene que ver ni de refilón el checkout
  // de compra, que no es lo que vino a buscar.
  if (perfil === null) {
    return (
      <PasoPerfil
        onElegir={id => { if (id === 'hotelero') onSoyHotelero?.(); else setPerfil('turista'); }}
      />
    );
  }

  // ── Paso 2: pagado, falta el registro ──
  if (listo) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 100px' }}>
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

          {/* El momento principal del Cupopack (§6 de docs/3-cupopacks.md):
              acaba de pagar y tiene los slots vacíos. Podemos ofrecerlo acá
              porque desde la Fase 8 se eligen premium con el pase todavía sin
              activar — antes había que activarlo y eso quemaba días de viaje.

              Sólo con sesión: sin cuenta el pase queda esperando a que confirme
              el mail, y todavía no hay a qué colgarle las elecciones. */}
          {listo.conSesion && <OfertaPostCompra />}
        </div>
      </div>
    );
  }

  // ── Paso 1: elegir pase + datos de contacto + pago ──
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px 100px' }}>

        {/* Título: el símbolo del hero, centrado, solo e inclinado igual que allá */}
        <div style={{ textAlign: 'center', margin: '18px 0 40px' }}>
          <img src="/cupon-pass.svg" alt="Cupon PASS" style={{ width: 210, maxWidth: '70%', height: 'auto', display: 'inline-block' }} />
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
            <div role="radiogroup" aria-label="Elegí tu pase"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${pases.length + 1}, 1fr)`, gap: 12 }}>
              {pases.map(p => {
                const activo = !esCustom && p.duracion_dias === elegido;
                return (
                  <button key={p.id} onClick={() => setElegido(p.duracion_dias)}
                    role="radio" aria-checked={activo}
                    style={{
                      textAlign: 'left', padding: '16px 14px 14px', borderRadius: 16, cursor: 'pointer',
                      background: activo ? C.primarySoft : '#fff',
                      border: `1.5px solid ${activo ? C.primary : C.line}`,
                      fontFamily: C.font, transition: 'all .15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <PaSSMark size={12} />
                      <TildePase activo={activo} />
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: activo ? C.primary : C.ink, marginTop: 10 }}>
                      {p.duracion_dias} días
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', marginTop: 4 }}>
                      {fmt(p.precio_final)}
                    </div>
                    <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>por única vez</div>
                    <Incluye incluidas={incluidas} dias={p.duracion_dias} />
                  </button>
                );
              })}

              {/* A medida: elegís los días y el precio sale proporcional al de 7 */}
              <div
                ref={customRef}
                role="radio" aria-checked={esCustom} tabIndex={0}
                onClick={() => setElegido('custom')}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setElegido('custom'); } }}
                style={{
                  textAlign: 'left', padding: '16px 14px 14px', borderRadius: 16, cursor: 'pointer',
                  background: esCustom ? C.primarySoft : '#fff',
                  border: `1.5px solid ${esCustom ? C.primary : C.line}`,
                  fontFamily: C.font, transition: 'all .15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <PaSSMark size={12} />
                  <TildePase activo={esCustom} />
                </div>
                {/* Sin rótulo propio: el selector ocupa el lugar del "N días" de
                    los otros pases, así las tres cajas quedan renglón a renglón. */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <StepBtn
                    label="Un día menos"
                    disabled={diasCustom <= DIAS_CUSTOM_MIN}
                    onClick={() => { setElegido('custom'); setDiasCustom(d => Math.max(DIAS_CUSTOM_MIN, d - 1)); }}
                  ><Minus size={18} /></StepBtn>
                  <span style={{ flex: 1, textAlign: 'center', fontSize: 15, fontWeight: 800, color: esCustom ? C.primary : C.ink, whiteSpace: 'nowrap' }}>
                    {diasCustom} días
                  </span>
                  <StepBtn
                    label="Un día más"
                    disabled={diasCustom >= DIAS_CUSTOM_MAX}
                    onClick={() => { setElegido('custom'); setDiasCustom(d => Math.min(DIAS_CUSTOM_MAX, d + 1)); }}
                  ><Plus size={18} /></StepBtn>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', marginTop: 4 }}>
                  {fmt(precioCustom)}
                </div>
                <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>por única vez</div>
                <Incluye incluidas={incluidas} dias={diasCustom} />
              </div>
            </div>
          )}

        </div>

        {/* Contacto */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
          {/* Mismo tratamiento que "¿Cómo funciona?": itálica, centrado y en
              primary. Los dos son títulos de sección del checkout y antes
              tenían pesos distintos —uno de rótulo, otro de titular—, así que
              se leían como si uno mandara sobre el otro.

              El nombre va con la marca y no escrito: es el único lugar del
              checkout donde aparece el nombre de la empresa. */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: '20px 0 40px' }}>
            <span style={{ fontSize: 22, fontWeight: 500, fontStyle: 'italic', color: C.primary, letterSpacing: '-0.01em' }}>
              Ingresá a
            </span>
            <img src="/logo-cuponear.svg" alt="Cuponear" style={{ height: 44, width: 'auto', display: 'block' }} />
          </div>

          {/* Nuevo vs. ya registrado: al que ya tiene cuenta no le pedimos
              nombre — esos datos ya están en su perfil y la compra se le
              vincula sola por mail. */}
          <div role="tablist" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, background: C.bg, borderRadius: 12, marginBottom: 16 }}>
            {[{ id: true, label: 'Soy nuevo' }, { id: false, label: 'Ya tengo cuenta' }].map(t => (
              <button
                key={t.label} role="tab" aria-selected={esNuevo === t.id}
                onClick={() => { setEsNuevo(t.id); setError(''); }}
                style={{
                  padding: '13px 10px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: C.font,
                  fontSize: 16, fontWeight: 800, letterSpacing: '-0.01em', transition: 'background .15s, color .15s',
                  background: esNuevo === t.id ? '#fff' : 'transparent',
                  // El inactivo en ink2 y no en muted: son sólo dos opciones y
                  // la de al lado tiene que leerse como algo elegible, no como
                  // un texto apagado.
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
                <label style={labelSt} htmlFor="pase-nombre">Nombre</label>
                <input id="pase-nombre" type="text" autoComplete="given-name"
                  value={nombreUsuario} onChange={e => setNombreUsuario(e.target.value)}
                  placeholder="Tu nombre" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </div>
              <div>
                <label style={labelSt} htmlFor="pase-apellido">Apellido</label>
                <input id="pase-apellido" type="text" autoComplete="family-name"
                  value={apellido} onChange={e => setApellido(e.target.value)}
                  placeholder="Tu apellido" style={inputSt}
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
                  placeholder="ejemplo@mail.com" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </>
            ) : (
              <>
                <label style={labelSt} htmlFor="pase-usuario">Mail o teléfono</label>
                <input id="pase-usuario" type="text" autoComplete="username"
                  value={usuario} onChange={e => setUsuario(e.target.value)}
                  placeholder="ejemplo@mail.com, ó 1155555555" style={inputSt}
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

          {/* Último paso del alta, justo antes del botón de pago. Sólo para el
              que se registra: al que ya tiene cuenta lo frena su contraseña.
              Sin rótulo: el propio texto de la pista dice para qué es. A media
              caja y centrado — el gesto es corto y una pista de ancho completo
              lo hacía parecer más trabajo del que es. */}
          {esNuevo && (
            <div style={{ marginTop: 16, maxWidth: 320, marginInline: 'auto' }}>
              <CaptchaDeslizar verificado={humano} onVerificar={setHumano} />
            </div>
          )}
        </div>

        {/* Total + pago */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
            <PaSSMark size={14} conGesell />
            {dias > 0 && <span style={{ fontSize: 14, fontWeight: 800, color: C.ink2 }}>x {dias} días</span>}
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
