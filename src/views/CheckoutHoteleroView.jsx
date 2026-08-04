// ============================================================
//  src/views/CheckoutHoteleroView.jsx
//  El otro lado del mostrador: la empresa que quiere regalarles el pase a sus
//  turistas — alojamiento, agencia de turismo, inmobiliaria o revendedor; ser
//  hotelero no es condición. Misma gramática que CheckoutPaseView — mismas tarjetas,
//  mismo tilde de selección, mismo captcha, mismo paso 2 — para que las dos
//  puertas del paso 0 se sientan el mismo producto.
//
//  El pago es MOCK, igual que el resto de la app.
//
//  Reemplaza al alta que vivía en SociosView (hero oscuro + modal), que era
//  de antes del pivot y hablaba otro idioma visual.
// ============================================================
import { useEffect, useState } from 'react';
import { Check, CreditCard, Loader2, MapPin } from 'lucide-react';
import CaptchaDeslizar from '../components/CaptchaDeslizar';
import Icono from '../components/Icono';
import { getPlanesPro, crearSuscripcionPro } from '../lib/planes';
import { altaSocio, ERRORES_ALTA } from '../lib/altaSocio';
import { loginConIdentificador, pareceEmail, getPerfil } from '../lib/auth';

// Misma paleta acotada que el checkout del pase.
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

// Qué clase de empresa se suscribe. Dejó de ser "tipo de alojamiento": el plan
// también lo contratan agencias de turismo, inmobiliarias y revendedores, así
// que ser hotelero no es condición. Lo único que sí es condición es tener
// cuenta.
// El `valor` es lo que va a `negocios.tipo` — vocabulario cerrado por el CHECK
// de la tabla (db/20260802_tipos_empresa_socio.sql).
const TIPOS_EMPRESA = [
  { valor: 'alojamiento',        label: 'Alojamiento' },
  { valor: 'Agencia de turismo', label: 'Agencia de turismo' },
  { valor: 'Inmobiliaria',       label: 'Inmobiliaria' },
  { valor: 'Revendedor',         label: 'Revendedor' },
  { valor: 'Otro',               label: 'Otros' },
];

const fmt = n => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;
const emailValido = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
// Teléfono opcional: si lo cargan, que al menos tenga 8 dígitos.
const telValido = v => !v.trim() || v.replace(/\D/g, '').length >= 8;

const inputSt = {
  width: '100%', boxSizing: 'border-box', padding: '13px 15px', borderRadius: 12,
  border: `1px solid ${C.line}`, fontSize: 15, fontFamily: C.font, color: C.ink,
  outline: 'none', background: '#fff',
};
const labelSt = { display: 'block', fontSize: 12.5, fontWeight: 700, color: C.ink2, marginBottom: 6 };

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

// ─── Ilustración: lo que el hotelero regala ──────────────────
// La mano con el celular y el cupón (/iconos/manopla.json): es exactamente la
// escena del check-in, el turista recibiendo el Pase en su teléfono.
// Va animada sola (`animar`) porque acá la ilustración ES el argumento, no un
// ícono de menú que espera el hover. Sin fondo propio: apoya directo sobre el
// degradé, en la esquina clara.
function IlustracionRegalo() {
  return (
    <Icono src="/iconos/manopla.json" animar
      label="Tu turista recibe el Pase en su celular"
      style={{ flex: '0 0 auto', width: 230, height: 230, maxWidth: '100%', display: 'block' }} />
  );
}

// Las dos cosas que caracterizan a cada tramo, calculadas desde la fila de
// `planes`: qué te comprometés y qué créditos de arranque trae. La plata (mes y
// total) no entra acá — va del lado del precio, que es donde se compara.
// "Créditos" a secas no se entiende: siempre "créditos publicitarios".
function chipsTramo(p, mensual) {
  const ahorro      = mensual > 0 ? mensual * p.meses - p.total : 0;
  const bonificados = mensual > 0 ? Math.round(ahorro / mensual) : 0;
  const chips = [];
  if (p.meses === 1) chips.push('Sin permanencia');
  else if (bonificados > 0) chips.push(`${bonificados} ${bonificados === 1 ? 'mes bonificado' : 'meses bonificados'}`);
  else if (ahorro > 0) chips.push(`Ahorrás ${fmt(ahorro)}`);
  if (p.creditosBono > 0) chips.push(`+${p.creditosBono} créditos publicitarios de bienvenida`);
  return chips;
}

// ─── Un tramo de pago ────────────────────────────────────────
// Fila ancha, no columna: los tres tramos dicen lo mismo salvo el compromiso,
// y en columnas finitas esa diferencia se perdía entre texto apretado. Acá cada
// fila es tilde + nombre + sus dos o tres chips, con el precio grande a la
// derecha para poder compararlos de un vistazo.
function TramoPago({ p, mensual, activo, onSelect }) {
  return (
    <button
      type="button" role="radio" aria-checked={activo} onClick={onSelect}
      style={{
        position: 'relative', display: 'flex', alignItems: 'center', gap: 13, width: '100%',
        textAlign: 'left', padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
        background: activo ? C.primarySoft : '#fff',
        border: `1.5px solid ${activo ? C.primary : C.line}`,
        fontFamily: C.font, transition: 'all .15s',
      }}
    >
      <TildePlan activo={activo} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 800, color: activo ? C.primary : C.ink, lineHeight: 1.2 }}>
            {p.nombre}
          </span>
          {/* El "más elegido" sale de la base (planes.destacado), no de una
              constante acá: se cambia sin tocar código. */}
          {p.destacado && (
            <span style={{
              background: C.primary, color: '#fff', fontSize: 9.5, fontWeight: 800,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap',
            }}>
              El más elegido
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 7 }}>
          {chipsTramo(p, mensual).map(ch => (
            <span key={ch} style={{
              fontSize: 11.5, fontWeight: 600, color: C.ink2, lineHeight: 1.3,
              background: activo ? '#fff' : C.bg, border: `1px solid ${C.line}`,
              padding: '3px 9px', borderRadius: 999,
            }}>
              {ch}
            </span>
          ))}
        </div>
      </div>

      {/* Jerarquía de la plata: grande va el precio POR MES, que es lo único
          comparable entre los tres tramos (y lo que el hotelero tiene en la
          cabeza). El total por adelantado va abajo, chico: es un dato del
          tramo largo, no el número con el que se elige. */}
      <div style={{ flexShrink: 0, textAlign: 'right', maxWidth: 148 }}>
        <div style={{ fontSize: 21, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {fmt(p.precioMes)}
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 2, whiteSpace: 'nowrap' }}>+ IVA por mes</div>
        {p.meses > 1 && (
          <div style={{ fontSize: 11, fontWeight: 600, color: C.ink2, lineHeight: 1.35, marginTop: 6 }}>
            {fmt(p.total)} + IVA pagando por adelantado
          </div>
        )}
      </div>
    </button>
  );
}

// ─── Cómo funciona, contado desde el mostrador del hotel ─────
const PASOS = [
  { t: 'Elegís un plan',      d: 'Y completás el formulario con los datos de tu empresa' },
  { t: 'Tu cliente lée el QR de tu empresa, o carga el código de 6 dígitos.', d: 'El pase se le activará cuando lo apruebes.' },
  { t: '¡Listos para ahorrar!', d: 'Descuentos en los comercios adheridos durante toda la estadía.' },
];

// Vive DENTRO del contenedor del plan, así que no trae marco propio: el borde
// y el fondo blanco los pone la tarjeta grande. El padding de abajo es generoso
// a propósito: con poco, el paso 3 quedaba montado sobre la línea divisoria.
function ComoFunciona() {
  return (
    <div style={{ padding: '22px 22px 30px' }}>
      <div style={{ fontSize: 22, fontWeight: 500, fontStyle: 'italic', color: C.primary, letterSpacing: '-0.01em', textAlign: 'center', margin: '2px 0 20px' }}>
        ¿Cómo funciona la suscripción?
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

  // De la empresa, acá, sólo lo que la identifica: qué es y cómo se llama. El
  // resto de la ficha (localidad, descripción, unidades, fotos) se carga
  // después del pago, desde el panel — pedirla en el checkout alargaba el
  // formulario justo antes de cobrar.
  const [nombre, setNombre]           = useState('');
  const [tipo, setTipo]               = useState('');

  // De la persona: los mismos datos que se le piden a un turista nuevo. Nunca
  // se mezclan con los del negocio — son dos entidades distintas.
  const [esNuevo, setEsNuevo]   = useState(true);
  const [nombrePersona, setNombrePersona] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail]       = useState('');
  const [usuario, setUsuario]   = useState('');       // "ya tengo cuenta"
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [humano, setHumano]     = useState(false);

  const [error, setError]     = useState('');
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo]     = useState(null);

  // El que entra con cuenta hecha normalmente ya tiene su empresa colgada del
  // perfil, así que no se le pide nada de eso. La excepción es el turista que
  // se convierte en socio: recién al validar la contraseña sabemos que no tiene
  // ninguna, y ahí sí le mostramos los dos campos.
  const [pideEmpresa, setPideEmpresa] = useState(false);
  const conEmpresa = esNuevo || pideEmpresa;

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

    if (conEmpresa) {
      if (!tipo)                        return setError('Elegí qué tipo de empresa es.');
      if (!nombre.trim())               return setError('Poné el nombre de tu empresa.');
    }
    if (esNuevo) {
      if (!nombrePersona.trim() || !apellido.trim()) return setError('Completá tu nombre y apellido.');
      if (!emailValido(email))          return setError('Revisá el mail: no parece válido.');
      if (!telValido(telefono))         return setError('Revisá el teléfono: faltan dígitos.');
      if (password.length < 6)          return setError('La contraseña tiene que tener al menos 6 caracteres.');
      if (password !== password2)       return setError('Las contraseñas no coinciden.');
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

      // Si esa cuenta ya tiene su empresa, no se crea otra: sólo se le contrata
      // el plan a la que ya está. Es el socio sin plan que viene a pagar.
      const perfil = await getPerfil();
      if (perfil?.negocio_id) {
        await crearSuscripcionPro(perfil.negocio_id, { codigoPlan: planId });
        setEnviando(false);
        return setListo({ nombre: perfil.negocios?.nombre || 'Tu empresa', plan });
      }

      // Cuenta sin empresa (el turista que se convierte en socio): recién acá
      // sabemos que hay que pedirle los dos datos.
      if (!pideEmpresa) {
        setPideEmpresa(true);
        setEnviando(false);
        return setError('Tu cuenta todavía no tiene una empresa: contanos qué es y cómo se llama.');
      }
    }

    const r = await altaSocio({
      negocio: { nombre, tipo },
      cuenta:  { email, password },
      // Al que ya tenía cuenta no le mandamos persona: sus datos ya están en el
      // perfil y este formulario no se los pidió.
      persona: esNuevo ? { nombre: nombrePersona, apellido, telefono } : null,
      codigoPlan: planId,
    });

    setEnviando(false);
    if (!r.ok) return setError(ERRORES_ALTA[r.error] || 'No se pudo completar el alta. Probá de nuevo.');

    setListo({ nombre, plan });
  }

  // ── Paso 2: dado de alta y operativo ──
  if (listo) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px 100px' }}>
          <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '34px 26px', textAlign: 'center' }}>
            <span style={{ display: 'grid', placeItems: 'center', width: 54, height: 54, borderRadius: '50%', background: C.primarySoft, color: C.primary, margin: '0 auto 18px' }}>
              <Check size={26} strokeWidth={3} />
            </span>
            <div style={{ fontSize: 22, fontWeight: 800, color: C.ink, letterSpacing: '-0.01em' }}>
              {listo.nombre} quedó registrada
            </div>
            <p style={{ fontSize: 14.5, color: C.muted, lineHeight: 1.6, margin: '10px auto 0', maxWidth: 460 }}>
              Los datos que faltan —ubicación, descripción y fotos— los completás
              cuando quieras desde tu panel.
              {' Tu código de 6 dígitos para regalar pases ya está ahí.'}
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

        {/* Sin título ni bajada arriba: la banda del plan ya abre la pantalla y
            dice lo mismo. La identidad Cuponear ahora vive adentro de esa banda
            — acá el que compra es el socio, y lo que contrata es su lugar en la
            plataforma. */}

        {/* Plan PRO — un solo contenedor: primero por qué te conviene, después
            qué incluye, y recién al final cómo lo pagás. Antes eran tres
            columnas finitas, cada una repitiendo el producto entero: el
            argumento no entraba y la diferencia entre tramos se perdía. */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>

          {/* Tira de cobertura, arriba de todo: quién es el destinatario y hasta
              dónde llega el beneficio, antes de cualquier argumento de venta. */}
          <div style={{
            background: C.primarySoft, color: C.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 20px', fontSize: 13, fontWeight: 700,
            lineHeight: 1.4, textAlign: 'center',
          }}>
            <MapPin size={15} strokeWidth={2.4} style={{ flexShrink: 0 }} />
            Beneficios para empresas de Villa Gesell, Mar de las Pampas, Mar Azul y Las Gaviotas.
          </div>

          {/* Banda promocional. El primary se mantiene plano hasta la mitad —
              toda la franja del texto — y recién ahí arranca el degradé hacia el
              azul claro, que cae en la esquina de la ilustración. Así el blanco
              nunca se apoya sobre el tramo claro. */}
          <div style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primary} 50%, #7186F2 100%)`,
            padding: '26px 24px 22px', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
          }}>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              {/* Versión del logo para fondos oscuros */}
              <img src="/logo-cuponear-wh.svg" alt="Cuponear"
                style={{ width: 172, maxWidth: '70%', height: 'auto', display: 'block', marginBottom: 16 }} />
              <span style={{
                display: 'inline-block', background: 'rgba(255,255,255,0.16)',
                fontSize: 10.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '4px 10px', borderRadius: 999, marginBottom: 12,
              }}>
                Regalá pases a tus clientes
              </span>
              <div style={{ fontSize: 25, fontWeight: 800, letterSpacing: '0.01em', lineHeight: 1.15 }}>
                Regalá descuentos y beneficios a tus clientes
              </div>
              {/* El margen negativo le presta 20px del gap: el párrafo cortaba
                  antes de tiempo y la línea quedaba corta al lado del titular. */}
              <p style={{ fontSize: 14, lineHeight: 1.55, margin: '10px -20px 0 0', color: 'rgba(255,255,255,0.88)' }}>
                Se activa con un código que vos le das y lo puede usar en todos los comercios y experiencias turísticas adheridas.
              </p>
            </div>
            <IlustracionRegalo />
          </div>

          <ComoFunciona />

          {/* Los tramos de pago. Sin título ni bajada: las tres filas con su
              tilde ya se leen como lo que son, una elección. */}
          <div style={{ padding: '22px 22px 22px', borderTop: `1px solid ${C.line}` }}>
            {planes === null ? (
              <div style={{ color: C.muted, fontSize: 14, padding: '10px 0' }}>Cargando planes…</div>
            ) : (
              <div role="radiogroup" aria-label="Elegí cómo pagarlo"
                style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {planes.map(p => (
                  <TramoPago
                    key={p.id}
                    p={p}
                    // El tramo mensual es el precio de referencia contra el que
                    // se miden las bonificaciones de los otros dos.
                    mensual={planes.find(x => x.meses === 1)?.precioMes || 0}
                    activo={p.id === planId}
                    onSelect={() => setPlanId(p.id)}
                  />
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button type="button" onClick={onSoyTurista}
                style={{ background: 'none', border: 'none', padding: 0, color: C.primary, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: C.font }}>
                ¿Sos turista? <b style={{ fontWeight: 800 }}>Comprá tu pase acá</b>
              </button>
            </div>
          </div>
        </div>

        {/* Alta: una sola tarjeta, y lo primero es la cuenta. Antes arrancaba
            con un bloque "TU ALOJAMIENTO" que daba por sentado que el que se
            suscribe es un hotelero — y no lo es: también contratan agencias de
            turismo, inmobiliarias y revendedores. Ser hotelero no es condición;
            tener cuenta sí. Del negocio se piden dos datos y nada más (qué es y
            cómo se llama): el resto de la ficha se completa después del pago,
            desde el panel. */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
            <div style={{ ...labelSt, display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
              INGRESÁ A
              <img src="/logo-cuponear.svg" alt="Cuponear" style={{ height: 17, width: 'auto', display: 'block' }} />
            </div>

            <div role="tablist" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, padding: 4, background: C.bg, borderRadius: 12, marginBottom: 16 }}>
              {[{ id: true, label: 'Soy nuevo' }, { id: false, label: 'Ya tengo cuenta' }].map(t => (
                <button key={t.label} role="tab" aria-selected={esNuevo === t.id}
                  onClick={() => { setEsNuevo(t.id); setError(''); setPideEmpresa(false); }}
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

            {/* La empresa: qué es y cómo se llama. Alcanza para contratar. */}
            {conEmpresa && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={labelSt} htmlFor="hot-tipo">Tipo de empresa</label>
                  {/* Sin default: que arranque en "Alojamiento" sería volver a
                      dar por sentado quién se suscribe. */}
                  <select id="hot-tipo" value={tipo} onChange={e => setTipo(e.target.value)}
                    style={{ ...inputSt, color: tipo ? C.ink : C.muted }}>
                    <option value="">Elegí una opción</option>
                    {TIPOS_EMPRESA.map(t => <option key={t.valor} value={t.valor}>{t.label}</option>)}
                  </select>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label style={labelSt} htmlFor="hot-nombre">Nombre de la empresa</label>
                  <input id="hot-nombre" value={nombre} onChange={e => setNombre(e.target.value)}
                    placeholder="Cómo se llama tu empresa" style={inputSt}
                    onFocus={e => e.currentTarget.style.borderColor = C.primary}
                    onBlur={e => e.currentTarget.style.borderColor = C.line} />
                </div>
              </>
            )}

            {/* Nombre y apellido de la PERSONA. Nada de esto se usa como default
                del negocio: el que atiende no se llama igual que la empresa. */}
            {esNuevo && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelSt} htmlFor="hot-pnombre">Nombre del titular</label>
                  <input id="hot-pnombre" type="text" autoComplete="given-name"
                    value={nombrePersona} onChange={e => setNombrePersona(e.target.value)}
                    placeholder="Tu nombre" style={inputSt}
                    onFocus={e => e.currentTarget.style.borderColor = C.primary}
                    onBlur={e => e.currentTarget.style.borderColor = C.line} />
                </div>
                <div>
                  <label style={labelSt} htmlFor="hot-apellido">Apellido</label>
                  <input id="hot-apellido" type="text" autoComplete="family-name"
                    value={apellido} onChange={e => setApellido(e.target.value)}
                    placeholder="Tu apellido" style={inputSt}
                    onFocus={e => e.currentTarget.style.borderColor = C.primary}
                    onBlur={e => e.currentTarget.style.borderColor = C.line} />
                </div>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={labelSt} htmlFor="hot-user">{esNuevo ? 'Mail' : 'Mail o teléfono'}</label>
              <input id="hot-user" type={esNuevo ? 'email' : 'text'} autoComplete={esNuevo ? 'email' : 'username'}
                value={esNuevo ? email : usuario}
                onChange={e => (esNuevo ? setEmail : setUsuario)(e.target.value)}
                placeholder={esNuevo ? 'vos@tuempresa.com' : 'vos@tuempresa.com, ó 1155555555'} style={inputSt}
                onFocus={e => e.currentTarget.style.borderColor = C.primary}
                onBlur={e => e.currentTarget.style.borderColor = C.line} />
            </div>

            {/* El nuevo crea la contraseña con confirmación; el que ya tiene
                cuenta la usa para entrar. */}
            {esNuevo ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={labelSt} htmlFor="hot-pass">Contraseña</label>
                  <input id="hot-pass" type="password" autoComplete="new-password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres" style={inputSt}
                    onFocus={e => e.currentTarget.style.borderColor = C.primary}
                    onBlur={e => e.currentTarget.style.borderColor = C.line} />
                </div>
                <div>
                  <label style={labelSt} htmlFor="hot-pass2">Repetir contraseña</label>
                  <input id="hot-pass2" type="password" autoComplete="new-password"
                    value={password2} onChange={e => setPassword2(e.target.value)}
                    placeholder="Otra vez" style={inputSt}
                    onFocus={e => e.currentTarget.style.borderColor = C.primary}
                    onBlur={e => e.currentTarget.style.borderColor = C.line} />
                </div>
              </div>
            ) : (
              <div>
                <label style={labelSt} htmlFor="hot-pass">Contraseña</label>
                <input id="hot-pass" type="password" autoComplete="current-password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Tu contraseña" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </div>
            )}

            {/* Teléfono sólo al nuevo: del que ya tiene cuenta ya lo tenemos. */}
            {esNuevo && (
              <div>
                <label style={labelSt} htmlFor="hot-tel">Teléfono <span style={{ fontWeight: 500, color: C.muted }}>(opcional)</span></label>
                <input id="hot-tel" type="tel" inputMode="tel" autoComplete="tel"
                  value={telefono} onChange={e => setTelefono(e.target.value)}
                  placeholder="11 5555 5555" style={inputSt}
                  onFocus={e => e.currentTarget.style.borderColor = C.primary}
                  onBlur={e => e.currentTarget.style.borderColor = C.line} />
              </div>
            )}

            {esNuevo && (
              <div style={{ marginTop: 16, maxWidth: 320, marginInline: 'auto' }}>
                <CaptchaDeslizar verificado={humano} onVerificar={setHumano} />
              </div>
            )}
        </div>

        {/* Total + alta */}
        <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '22px 24px' }}>
          {plan?.nombre && (
              <div style={{ fontSize: 13, color: C.primary, fontWeight: 600, marginTop: 2,textAlign: 'center' }}>{plan.nombre}</div>
            )}
            {/* Lo que se paga hoy, que en los tramos largos NO es el precio por
              mes: es el total por adelantado. Mostrarlo acá evita la sorpresa. */}
          <div style={{ textAlign: 'center', marginBottom: 18, marginTop: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: C.muted, letterSpacing: '0.03em' }}>
              {plan ? (plan.meses === 1 ? 'PAGÁS POR MES' : `Pagás hoy, cubrís los próximos ${plan.meses} meses`) : 'TOTAL'}
            </div>
            <div style={{ fontSize: 27, fontWeight: 800, color: C.ink, letterSpacing: '-0.02em', marginTop: 4 }}>
              {plan ? `${fmt(plan.total)} + IVA` : '—'}
            </div>
            
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
            El resto de los datos de tu empresa te los pedimos después, desde tu panel.
          </p>
        </div>
      </div>
    </div>
  );
}
