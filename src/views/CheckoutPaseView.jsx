// ============================================================
//  src/views/CheckoutPaseView.jsx
//  Compra directa del Cupon PASS, sin cuenta: elegís duración y dejás tu
//  mail — el pago no pide contraseña. El alta como turista se completa
//  DESPUÉS de pagar, en la pantalla de confirmación (brief checkout
//  2026-08-18, §D): `comprarPaseAnonimo()` no necesita cuenta (RLS
//  pública en `pase_compras`), así que pedirla antes de cobrar era
//  fricción autoinfligida.
//  El pago es MOCK, igual que el resto de la app.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import {
  getPasesDestino, comprarPaseAnonimo, vincularComprasPase,
  contarIncluidasEnPase, getEstimacionAhorro, ahorroEstimadoPase,
} from '../lib/pases';
import { usePasePropio } from '../lib/pasePropio';
import useScope from '../hooks/useScope';
import CupopacksParaPase from '../components/CupopacksParaPase';
import Icono from '../components/Icono';
import CaptchaDeslizar from '../components/CaptchaDeslizar';
import ResumenPase from '../components/pase/ResumenPase';
import SelectorDuracion, { DIAS_CUSTOM_INICIAL, DIAS_BASE_PRORRATEO } from '../components/pase/SelectorDuracion';
import DatosCompra from '../components/pase/DatosCompra';
import { C, fmt, redondear, inputSt, labelSt, datosCompraValidos } from '../components/pase/checkoutTokens';
import { loginConIdentificador, pareceEmail, registrarTurista, recuperarPassword, getSession } from '../lib/auth';

// ─── Paso 0: ¿de qué lado del mostrador estás? ───────────────
// Sólo aparece cuando se entra por "Planes y suscripción", que es la puerta
// genérica: ahí todavía no sabemos si viene a comprarse un pase o a venderlos.
// Los CTA de "Pase x N días" ya traen la respuesta implícita y saltean el paso.
const PERFILES = [
  {
    id: 'turista',
    titulo: 'Soy viajero',
    bajada: 'Vengo unos días y quiero mi pase con todos los descuentos.',
    cta: 'Ver los pases',
    icono: '/iconos/sombrilla.svg',
  },
  {
    id: 'hotelero',
    titulo: 'Soy hotelero',
    bajada: 'Quiero regalarles el pase a mis viajeros y sumar mi alojamiento.',
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

// ─── Post-pago: crear la contraseña ──────────────────────────
// El alta se completa acá, sobre un usuario que ya convirtió y pagó — no
// antes. `modo` cubre el caso borde de quien ya tenía cuenta con ese mail
// (typeó "Soy nuevo" por error, o el mail coincide con una cuenta vieja):
// si `registrarTurista` devuelve "ya existe", se le ofrece iniciar sesión
// en el momento en vez de trabarlo con un error sin salida.
function CrearContrasena({ nombre, email, onListo }) {
  const [modo, setModo] = useState('crear'); // 'crear' | 'login'
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [humano, setHumano] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function confirmar() {
    setError('');
    if (modo === 'crear') {
      if (password.length < 6) { setError('La contraseña tiene que tener al menos 6 caracteres.'); return; }
      if (password !== password2) { setError('Las contraseñas no coinciden.'); return; }
      if (!humano) { setError('Deslizá el control de seguridad para confirmar que no sos un robot.'); return; }
      setCargando(true);
      try {
        await registrarTurista({ nombre, apellido: '', email, password });
      } catch (e) {
        setCargando(false);
        const msg = String(e?.message || '').toLowerCase();
        if (msg.includes('already')) { setModo('login'); setError('Ese mail ya tiene cuenta. Iniciá sesión para vincular tu pase.'); return; }
        setError('No se pudo crear la cuenta. Probá de nuevo.');
        return;
      }
    } else {
      if (password.length < 6) { setError('La contraseña tiene que tener al menos 6 caracteres.'); return; }
      setCargando(true);
      try {
        await loginConIdentificador(email, password);
      } catch {
        setCargando(false);
        setError('Contraseña incorrecta.');
        return;
      }
    }

    const sesion = await getSession();
    if (sesion?.user?.id) await vincularComprasPase(sesion.user.id, email);
    setCargando(false);
    onListo(!!sesion?.user?.id);
  }

  return (
    <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${C.line}`, textAlign: 'left' }}>
      <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginBottom: 4 }}>
        {modo === 'crear' ? 'Creá tu contraseña' : 'Iniciá sesión'}
      </div>
      <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, margin: '0 0 14px' }}>
        {modo === 'crear'
          ? <>Para entrar la próxima vez a <strong>{email}</strong>.</>
          : <>Ya existe una cuenta con <strong>{email}</strong>.</>}
      </p>

      {modo === 'crear' ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelSt} htmlFor="post-pass">Contraseña</label>
            <input id="post-pass" type="password" autoComplete="new-password"
              value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres" style={inputSt} />
          </div>
          <div>
            <label style={labelSt} htmlFor="post-pass2">Repetir contraseña</label>
            <input id="post-pass2" type="password" autoComplete="new-password"
              value={password2} onChange={e => setPassword2(e.target.value)}
              placeholder="Otra vez" style={inputSt} />
          </div>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <label style={labelSt} htmlFor="post-pass-login">Contraseña</label>
          <input id="post-pass-login" type="password" autoComplete="current-password"
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Tu contraseña" style={inputSt} />
        </div>
      )}

      {modo === 'crear' && (
        <div style={{ marginBottom: 12, maxWidth: 320, marginInline: 'auto' }}>
          <CaptchaDeslizar verificado={humano} onVerificar={setHumano} />
        </div>
      )}

      {error && (
        <div style={{ background: '#FDECEC', color: '#B42318', fontSize: 13, padding: '10px 13px', borderRadius: 10, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <button
        onClick={confirmar}
        disabled={cargando}
        style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none',
          background: cargando ? C.line : C.ink, color: cargando ? C.muted : '#fff',
          fontSize: 15, fontWeight: 800, cursor: cargando ? 'not-allowed' : 'pointer', fontFamily: C.font,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {cargando ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Un momento…</>
          : (modo === 'crear' ? 'Crear cuenta y ver mi pase' : 'Iniciar sesión')}
      </button>
    </div>
  );
}

export default function CheckoutPaseView({ paseDias = 7, onListo, onSoyHotelero, preguntarPerfil = false }) {
  // null = todavía no contestó el paso 0. Si no hay que preguntar, entra
  // derecho como turista, que es lo que venía haciendo hasta ahora.
  const [perfil, setPerfil] = useState(preguntarPerfil ? null : 'turista');
  const { region, ciudades } = useScope();
  // Paso visible del checkout (2026-08-18, a pedido: "no sé si comprar o
  // registrarme primero"). Elegir el pase y dejar tus datos dejaron de ser
  // la MISMA pantalla — el que ya tiene sesión no pasa por 'datos', no hay
  // nada que pedirle.
  const [paso, setPaso] = useState('duracion'); // 'duracion' | 'datos'
  const [pases, setPases]     = useState(null);
  const [elegido, setElegido] = useState(paseDias); // nº de días, o 'custom'
  const [diasCustom, setDiasCustom] = useState(DIAS_CUSTOM_INICIAL);
  const [esNuevo, setEsNuevo] = useState(true); // pestaña nuevo / ya registrado
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [email, setEmail]     = useState('');
  const [usuario, setUsuario] = useState(''); // "ya tengo cuenta": mail o teléfono
  const [password, setPassword] = useState(''); // sólo lo usa "ya tengo cuenta"
  const [avisoReset, setAvisoReset] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError]     = useState('');
  const [pagando, setPagando] = useState(false);
  const [listo, setListo]     = useState(null); // { pase, precio, dias, email, ... }
  const [sesionActiva, setSesionActiva] = useState(undefined); // undefined = todavía no se chequeó
  // Descuentos incluidos (capa base) del catálogo vivo: mismo número para los
  // tres pases, porque esa capa no se raciona.
  const [incluidas, setIncluidas] = useState(0);
  const [estimacion, setEstimacion] = useState({ premiumOrdenado: [] });
  const customRef = useRef(null);

  // Con sesión activa no hay nada que pedirle (§D): se detecta una sola vez
  // al aterrizar, y el formulario de contacto directamente no se muestra.
  useEffect(() => {
    let vivo = true;
    getSession().then(s => { if (vivo) setSesionActiva(s || null); });
    return () => { vivo = false; };
  }, []);

  useEffect(() => {
    let vivo = true;
    // Sin región resuelta todavía no hay nada que pedir — el efecto de abajo
    // reacciona solo cuando `region.id` cambia.
    if (!region) return undefined;
    getPasesDestino(undefined, region.id).then(data => {
      if (!vivo) return;
      setPases(data);
      // El pase a medida no es una fila de `pases` (se prorratea), así que
      // nunca cae en el fallback de abajo.
      if (paseDias === 'custom') return;
      // Si el pase que venía por parámetro no existe en ESTA región, cae al
      // primero vigente. Cambiar de región reseteando la elección: los días
      // de una región no prometen nada sobre la otra (§A).
      if (!data.some(p => p.duracion_dias === elegido) && data[0]) setElegido(data[0].duracion_dias);
    });
    return () => { vivo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paseDias, region?.id]);

  useEffect(() => {
    let vivo = true;
    contarIncluidasEnPase(region?.id).then(n => { if (vivo) setIncluidas(n); });
    getEstimacionAhorro(region?.id).then(e => { if (vivo) setEstimacion(e); });
    return () => { vivo = false; };
  }, [region?.id]);

  // Entrada por el "+ días" del hero: el pase a medida ya viene elegido, pero
  // el selector de duración queda debajo del resumen — hay que traerlo a la
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
  const nombrePase = esCustom ? `Pase x ${diasCustom} días` : (pase?.nombre_comercial || 'Total');
  const ahorroEstimado = ahorroEstimadoPase(estimacion, dias);
  // Con sesión no hay paso 'datos' — no hay nada que pedirle, así que el
  // botón siempre cobra directo. Sin sesión, el primer click sólo avanza.
  const necesitaContinuar = !sesionActiva && paso === 'duracion';

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

  // Paso 1 → 2: sólo valida que haya un pase elegido. Los datos de
  // contacto todavía no están en pantalla en este paso, así que no hay
  // nada más que chequear acá — eso lo hace pagar(), un paso después.
  function continuar() {
    setError('');
    if (!pase) { setError('Elegí un pase para continuar.'); return; }
    setPaso('datos');
  }

  async function pagar() {
    setError(''); setAvisoReset('');
    // Si el chequeo de sesión del montaje todavía no resolvió, se pide acá:
    // pagar() no puede arriesgarse a tratar a alguien logueado como anónimo
    // por una carrera de milisegundos.
    const sesionInicial = sesionActiva !== undefined ? sesionActiva : await getSession();
    const motivo = datosCompraValidos({ sesionActiva: sesionInicial, esNuevo, nombreUsuario, email, usuario, password, telefono });
    if (motivo) { setError(motivo); return; }
    if (!pase) { setError('No se pudo cargar el pase. Recargá la página.'); return; }

    setPagando(true);

    // Con sesión, el mail ya se sabe. Sin sesión y ya registrado, hay que
    // loguearlo ANTES de cobrar — es el único camino que todavía necesita
    // contraseña antes del pago, porque hace falta la sesión para vincular
    // la compra al toque. El nuevo, en cambio, paga sin cuenta: la crea
    // después (§D).
    let sesionParaLink = sesionInicial;
    let emailCompra;

    if (sesionInicial) {
      emailCompra = sesionInicial.user.email;
    } else if (!esNuevo) {
      try {
        await loginConIdentificador(usuario, password);
      } catch {
        setPagando(false);
        setError('Usuario o contraseña incorrectos.');
        return;
      }
      sesionParaLink = await getSession();
      emailCompra = sesionParaLink?.user?.email || (pareceEmail(usuario) ? usuario : '');
      if (!emailCompra) {
        setPagando(false);
        setError('Tu cuenta no tiene un mail asociado. Entrá con tu mail para comprar el pase.');
        return;
      }
    } else {
      emailCompra = email.trim();
    }

    // MOCK de pago: no hay pasarela real. La referencia la genera la lib.
    const nuevoSinCuenta = esNuevo && !sesionInicial;
    const { ok, error: err } = await comprarPaseAnonimo({
      paseId: pase.id, precio, email: emailCompra, dias,
      telefono: nuevoSinCuenta ? telefono : null,
      nombre:   nuevoSinCuenta ? nombreUsuario.trim() : null,
    });
    if (!ok) {
      setPagando(false);
      setError(err === 'datos_incompletos' ? 'Faltan datos.' : 'No se pudo registrar la compra. Probá de nuevo.');
      return;
    }

    if (sesionParaLink?.user?.id) await vincularComprasPase(sesionParaLink.user.id, emailCompra);

    setPagando(false);
    setListo({
      pase, nombre: nombrePase, precio, dias, email: emailCompra,
      conSesion: !!sesionParaLink?.user?.id,
      // Nuevo y sin sesión: pagó sin cuenta. Falta crear la contraseña.
      pendienteRegistro: nuevoSinCuenta,
      nombreUsuario: nombreUsuario.trim(),
    });
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

  // ── Paso 2: pagado, falta (a veces) el registro ──
  if (listo) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '60px 24px 100px' }}>
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

            {listo.pendienteRegistro ? (
              <CrearContrasena
                nombre={listo.nombreUsuario}
                email={listo.email}
                onListo={conSesion => setListo(l => ({ ...l, conSesion, pendienteRegistro: false }))}
              />
            ) : (
              <>
                <p style={{ fontSize: 15, color: C.ink2, lineHeight: 1.6, margin: '0 0 28px' }}>
                  {/* El viajero no activa nada a mano: el pase arranca solo con
                      el primer descuento. El texto viejo prometía un botón de
                      "activar" que no existe y generaba consultas. */}
                  Ya está cargado en tu cuenta (<strong>{listo.email}</strong>). Se activa solo con tu primer descuento.
                </p>
                <button
                  onClick={() => onListo?.()}
                  style={{ width: '100%', padding: '15px', borderRadius: 14, border: 'none', background: C.ink, color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: C.font }}
                  onMouseEnter={e => e.currentTarget.style.background = C.primary}
                  onMouseLeave={e => e.currentTarget.style.background = C.ink}
                >
                  Empezar a explorar
                </button>
              </>
            )}
          </div>

          {/* El momento principal del Cupopack (§6 de docs/3-cupopacks.md):
              acaba de pagar y tiene los slots vacíos. Podemos ofrecerlo acá
              porque desde la Fase 8 se eligen premium con el pase todavía sin
              activar — antes había que activarlo y eso quemaba días de viaje.

              Sólo con sesión: sin cuenta todavía no hay a qué colgarle las
              elecciones — aparece solo cuando `conSesion` pasa a true, ya sea
              porque venía de antes o porque acaba de crear la contraseña. */}
          {listo.conSesion && <OfertaPostCompra />}
        </div>
      </div>
    );
  }

  // ── Paso 1: elegir pase + datos de contacto + pago ──
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
      <div className="checkout-pase-grid" style={{ maxWidth: 1040, margin: '0 auto', padding: '36px 24px 100px' }}>

        {/* Título: el símbolo del hero, centrado, solo e inclinado igual que allá */}
        <div className="checkout-pase-col-principal">
          <div style={{ textAlign: 'center', margin: '18px 0 32px' }}>
            <img src="/cupon-pass.svg" alt="Cupon PASS" style={{ width: 210, maxWidth: '70%', height: 'auto', display: 'inline-block' }} />
          </div>

          <SelectorDuracion
            pases={pases} elegido={elegido} setElegido={setElegido}
            diasCustom={diasCustom} setDiasCustom={setDiasCustom}
            incluidas={incluidas} estimacion={estimacion} customRef={customRef}
            precioCustom={precioCustom}
          />

          {/* Hasta que se resuelva si hay sesión, no se muestra nada de esto:
              a alguien ya logueado no le tiene que asomar ni un instante el
              alta que no le corresponde.
              Con sesión, DatosCompra es sólo una línea de confirmación —no
              pide nada—, así que se queda siempre a la vista. Sin sesión, es
              un formulario de verdad y se posterga al paso 'datos' (a
              pedido: "no sé si comprar o registrarme primero" — elegir el
              pase no puede compartir pantalla con esa pregunta). */}
          {sesionActiva !== undefined && (sesionActiva || paso === 'datos') && (
            <>
              {!sesionActiva && (
                <button type="button" onClick={() => setPaso('duracion')} style={{
                  background: 'none', border: 'none', padding: '0 0 12px', color: C.ink2,
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  ← Volver a elegir tu pase
                </button>
              )}
              <DatosCompra
                sesionActiva={sesionActiva}
                esNuevo={esNuevo} setEsNuevo={setEsNuevo}
                nombreUsuario={nombreUsuario} setNombreUsuario={setNombreUsuario}
                email={email} setEmail={setEmail}
                usuario={usuario} setUsuario={setUsuario}
                password={password} setPassword={setPassword}
                telefono={telefono} setTelefono={setTelefono}
                avisoReset={avisoReset}
                onOlvideLaClave={olvideLaClave}
              />
            </>
          )}
        </div>

        <div className="checkout-pase-col-resumen">
          <div className="checkout-pase-resumen-sticky">
            <ResumenPase
              region={region} ciudades={ciudades}
              pase={pase} dias={dias} precio={precio} nombre={nombrePase} esCustom={esCustom}
              incluidas={incluidas} ahorroEstimado={ahorroEstimado}
              error={error} pagando={pagando}
              onPagar={necesitaContinuar ? continuar : pagar}
              ctaLabel={necesitaContinuar ? 'Continuar' : null}
            />
          </div>
        </div>
      </div>

      {/* Barra fija de mobile: mismo precio y mismo CTA, siempre a mano —
          el resumen completo (región, ahorro, leyenda) sigue en el flujo
          arriba, esto es sólo el atajo para pagar sin tener que volver a
          scrollear (§C). El error se repite acá: si "Pagar" se toca desde
          la barra, el aviso de arriba puede estar fuera de pantalla. */}
      <div className="checkout-pase-barra-movil">
        {error && (
          <div style={{ position: 'absolute', left: 12, right: 12, bottom: '100%', marginBottom: 8, background: '#FDECEC', color: '#B42318', fontSize: 12.5, padding: '9px 12px', borderRadius: 10, boxShadow: '0 8px 20px -10px rgba(11,16,32,0.25)' }}>
            {error}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombrePase}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{pase ? fmt(precio) : '—'}</div>
        </div>
        <button
          onClick={necesitaContinuar ? continuar : pagar}
          disabled={pagando || !pase}
          style={{
            flexShrink: 0, padding: '13px 22px', borderRadius: 12, border: 'none',
            background: pagando || !pase ? C.line : C.primary,
            color: pagando || !pase ? C.muted : '#fff',
            fontSize: 14.5, fontWeight: 800, cursor: pagando || !pase ? 'not-allowed' : 'pointer',
            fontFamily: C.font, display: 'flex', alignItems: 'center', gap: 8,
          }}
        >
          {pagando ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
          {necesitaContinuar ? 'Continuar' : 'Pagar'}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .checkout-pase-barra-movil { display: none; }

        @media (min-width: 1024px) {
          .checkout-pase-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 380px;
            gap: 28px;
            align-items: start;
          }
          .checkout-pase-resumen-sticky { position: sticky; top: 90px; }
        }

        @media (max-width: 1023px) {
          .checkout-pase-col-resumen { margin-top: 16px; }
          .checkout-pase-grid { padding-bottom: 110px !important; }
          .checkout-pase-barra-movil {
            display: flex; align-items: center; justify-content: space-between; gap: 14px;
            position: fixed; left: 0; right: 0; bottom: 0; z-index: 40;
            background: #fff; border-top: 1px solid ${C.line}; padding: 12px 18px;
            box-shadow: 0 -8px 24px -12px rgba(11,16,32,0.18);
          }
        }
      `}</style>
    </div>
  );
}
