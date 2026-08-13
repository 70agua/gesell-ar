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
import { ArrowLeft, Building2, Check, CreditCard, Home, Loader2, MapPin, MoreHorizontal, Plane } from 'lucide-react';
import CaptchaAuto from '../components/CaptchaAuto';
import Icono from '../components/Icono';
import PaSSMark from '../components/PaSSMark';
import { getPlanesPro } from '../lib/planes';
import { altaSocio, ERRORES_ALTA } from '../lib/altaSocio';

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
// también lo contratan agencias de turismo e inmobiliarias, así que ser
// hotelero no es condición.
// `label`/`icono` son sólo de esta ficha (2026-08-11 noche, "Industria" en
// vez de un <select> "Tipo de empresa" — ver el JSX más abajo); `valor` es lo
// que va a `negocios.tipo` y NO cambió: sigue siendo el vocabulario cerrado
// por el CHECK de la tabla (db/20260802_tipos_empresa_socio.sql), así que
// "Real Estate" guarda 'Inmobiliaria', no un valor nuevo. "Revendedor" (un
// valor válido igual) se sacó de estas cuatro fichas a pedido; sigue
// aceptado por la base para quien se dé de alta por otro lado.
const TIPOS_EMPRESA = [
  { valor: 'alojamiento',        label: 'Hotelería',        icono: Building2 },
  { valor: 'Agencia de turismo', label: 'Agencia de viajes', icono: Plane },
  { valor: 'Inmobiliaria',       label: 'Real Estate',       icono: Home },
  { valor: 'Otro',               label: 'Otra',              icono: MoreHorizontal },
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

// Vive DENTRO del contenedor del plan, así que no trae marco propio: el borde
// y el fondo blanco los pone la tarjeta grande. El padding de abajo es generoso
// a propósito: con poco, el paso 3 quedaba montado sobre la línea divisoria.
function ComoFunciona({ embebido, onVolver }) {
  return (
    <div style={{ padding: '22px 22px 30px' }}>
      {/* Logo GIFT PaSS PRO, arriba del título (2026-08-11) — mismo lockup, y
          mismo dorado (#FFB94A, el moño de giftpass-logo.svg), que usa el
          panel de regalo de la home: es la MISMA marca GIFT PaSS en los dos
          caminos, no dos logos distintos. La etiqueta PRO, en cambio, va
          fija en PRIMARY relleno + texto blanco (ver el prop `pro` en
          PaSSMark) — se probaron dos vueltas (outline siguiendo `color`,
          después dorado) y quedó en esto: un fondo sólido que la distingue
          del lockup dorado, no un tono que lo siga.
          La flecha a la izquierda (2026-08-11) sólo aparece embebido: es la
          salida completa del flujo de regalo, de vuelta a la home base —no
          "un paso atrás" como el círculo de .pv3-regalo-cerrar (ese sigue
          existiendo, en la esquina de .pv3-hc-stage, y vuelve sólo al paso
          1).
          Círculo outline (2026-08-12, a pedido): mismo look que la cruz del
          paso 1 en el hero (.gp-gift-cerrar en HeroPase.jsx) — 32px, borde
          1.5px negro, sin relleno en reposo, se invierte al hover (se
          rellena de negro, el ícono pasa a blanco). Mismo tamaño de ícono
          (18) y grosor de trazo (2.5) que esa cruz también, para que las dos
          "salidas" del flujo se lean como el mismo control. */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        {embebido && onVolver && (
          <button
            type="button" onClick={onVolver} aria-label="Volver al inicio"
            style={{
              position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
              display: 'grid', placeItems: 'center', width: 32, height: 32,
              border: `1.5px solid ${C.ink}`, borderRadius: '50%',
              background: 'none', color: C.ink, cursor: 'pointer', transition: 'background .15s ease, color .15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = C.ink; e.currentTarget.style.color = '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = C.ink; }}
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
          </button>
        )}
        <PaSSMark size={26} conGesell prefijo="GIft" pro color="#FFB94A" />
      </div>
      {/* Reemplaza a "¿Cómo funciona la suscripción?" + los 3 pasos
          (2026-08-11 noche): un solo argumento, contado con la misma
          ilustración de la mano con el celular que ya se usaba en la banda
          promocional de la página completa (IlustracionRegalo) — acá más
          chica, al lado del texto en vez de sola en una esquina.
          Ancho subido de 50% a 68% y tamaño bajado de 22 a 19px (a pedido):
          con 50% el párrafo cortaba antes de lo que el ancho real disponible
          permitía —quedaba aire de sobra al lado sin usar—, y ese ancho
          angosto forzaba un renglón de más además del <br/> a propósito de
          acá abajo. El corte queda fijo en dos líneas balanceadas, no en el
          wrap natural del navegador: a cualquier ancho razonable del panel
          (embebido o página completa) tiene que seguir leyéndose en dos. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '28px 0 20px' }}>
        <Icono src="/iconos/manopla.json" animar
          label="Tu turista recibe el Pase en su celular"
          style={{ flex: '0 0 auto', width: 140, height: 140, display: 'block' }} />
        <div style={{ width: '68%', fontSize: 19, fontWeight: 500, fontStyle: 'italic', color: C.ink, letterSpacing: '-0.01em', textAlign: 'left', lineHeight: 1.32 }}>
          El huésped canjea tu código promocional al contratar Cupon PASS
        </div>
      </div>
    </div>
  );
}

// `embebido` (2026-08-11): la home lo usa así para mostrar el flujo completo
// DENTRO del sidebar blanco de "Suscripción PRO", sobre los cupones cayendo
// (ver HeroPase.jsx) — sin navegar a otra vista. Cambia sólo el ENVOLTORIO,
// nunca el adentro: se saca el wrapper de página completa (min-height:100vh,
// padding-top para la navbar fija) y la banda de gradiente con la
// ilustración y el "Regalá descuentos y beneficios a tus clientes" — eso lo
// reemplaza, afuera, el título en cursiva liviana sobre la lluvia de
// cupones. Todo lo demás —desde ComoFunciona—, mismo
// componente, mismo estado, misma lógica de alta: es la razón de que esto
// sea un prop y no una vista aparte, para no mantener el formulario
// duplicado en dos lugares.
// `onVolverAlInicio` (2026-08-11): sólo tiene sentido embebido — pinta la
// flecha de ComoFunciona que cierra TODO el flujo de regalo y vuelve a la
// home base (ver esa nota, más abajo). La vista completa no la recibe: ahí
// "volver al inicio" ya es literalmente cualquier link del sitio.
export default function CheckoutHoteleroView({ onListo, embebido = false, onVolverAlInicio }) {
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
  // (2026-08-11 noche) El formulario dejó de tener puerta "Ya tengo cuenta"
  // —ver la nota junto a la tarjeta de alta, más abajo—: se asume siempre
  // alta nueva, así que ya no hace falta el estado que distinguía un camino
  // del otro (esNuevo, usuario, pideEmpresa/conEmpresa).
  const [nombrePersona, setNombrePersona] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
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

    if (!tipo)                        return setError('Elegí qué tipo de empresa es.');
    if (!nombre.trim())               return setError('Poné el nombre de tu empresa.');
    if (!nombrePersona.trim() || !apellido.trim()) return setError('Completá tu nombre y apellido.');
    if (!emailValido(email))          return setError('Revisá el mail: no parece válido.');
    if (!telValido(telefono))         return setError('Revisá el teléfono: faltan dígitos.');
    if (password.length < 6)          return setError('La contraseña tiene que tener al menos 6 caracteres.');
    if (password !== password2)       return setError('Las contraseñas no coinciden.');
    if (!humano)                      return setError('Deslizá el control de seguridad para confirmar que sos un humano.');

    setEnviando(true);

    const r = await altaSocio({
      negocio: { nombre, tipo },
      cuenta:  { email, password },
      persona: { nombre: nombrePersona, apellido, telefono },
      codigoPlan: planId,
    });

    setEnviando(false);
    if (!r.ok) return setError(ERRORES_ALTA[r.error] || 'No se pudo completar el alta. Probá de nuevo.');

    setListo({ nombre, plan });
  }

  // ── Paso 2: dado de alta y operativo ──
  // El wrapper de página completa (minHeight/paddingTop, la columna de 720)
  // sólo va cuando esto ES la página — embebido ya vive dentro del sidebar
  // de HeroPase, que pone su propio ancho y padding (ver .gp-panel).
  if (listo) {
    return (
      <div style={embebido ? undefined : { minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
        <div style={embebido ? { padding: '4px 0 8px' } : { maxWidth: 720, margin: '0 auto', padding: '60px 24px 100px' }}>
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
    <div style={embebido ? undefined : { minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
      <div style={embebido ? undefined : { maxWidth: 720, margin: '0 auto', padding: '36px 24px 100px' }}>

        {/* Sin título ni bajada arriba: la banda del plan ya abre la pantalla y
            dice lo mismo. La identidad Cuponear ahora vive adentro de esa banda
            — acá el que compra es el socio, y lo que contrata es su lugar en la
            plataforma. */}

        {/* Plan PRO — un solo contenedor: primero por qué te conviene, después
            qué incluye, y recién al final cómo lo pagás. Antes eran tres
            columnas finitas, cada una repitiendo el producto entero: el
            argumento no entraba y la diferencia entre tramos se perdía.
            Embebido (dentro del sidebar de HeroPase) pierde el marco propio —
            border/fondo/radio— porque ya está adentro de OTRO blanco (el
            .gp-panel del sidebar); dos tarjetas blancas una dentro de la otra
            se leían como un error de anidado, no como jerarquía. */}
        <div style={embebido ? undefined : { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>

          {/* Tira de cobertura + banda promocional (logo, tag, título,
              ilustración): sólo en la página completa. Embebido, ese mensaje
              lo dice —afuera, sobre la lluvia de cupones— el título en
              cursiva liviana que arma HeroPase; repetirlo acá adentro sería
              lo mismo dicho dos veces en la misma pantalla. */}
          {!embebido && (
            <>
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
            </>
          )}

          <ComoFunciona embebido={embebido} onVolver={onVolverAlInicio} />

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
          </div>
        </div>

        {/* Alta: una sola tarjeta, siempre alta nueva (2026-08-11 noche): se
            sacó el encabezado "INGRESÁ A CUPONEAR" y la tab-bar Soy
            nuevo/Ya tengo cuenta — se asume que el que llega hasta acá no
            tiene cuenta todavía, y el que ya la tiene puede seguir entrando
            por Ingresar y contratando el plan desde su panel. Ser hotelero
            no es condición; del negocio se piden dos datos y nada más (qué es
            y cómo se llama): el resto de la ficha se completa después del
            pago, desde el panel.
            Embebido pierde el marco propio, mismo criterio que la tarjeta
            del plan más arriba (2026-08-11 noche, a pedido: "la caja blanca
            debe continuar hacia abajo, recién al final —el precio— se ve el
            pie con bordes redondeados"). Con tres tarjetas blancas propias
            adentro de OTRO blanco (.gp-panel) se veían tres cajas cortadas,
            cada una con su propia esquina redondeada — acá sólo queda un
            divisor (borderTop) entre secciones, y el único borde redondeado
            visible es el de .gp-panel, al final de todo. */}
        <div style={embebido
          ? { borderTop: `1px solid ${C.line}`, padding: '20px 0 0' }
          : { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: 20, marginBottom: 16 }}>
            {/* "Industria" en fichas de un click (2026-08-11 noche, reemplaza
                al <select> "Tipo de empresa"): elegir es más rápido tocando
                una tarjeta que abriendo un desplegable, y las cuatro entran
                cómodas en un grid 2x2. Sin default: que arranque ya
                seleccionada una sería volver a dar por sentado quién se
                suscribe. */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelSt}>Industria</label>
              {/* Píldoras chicas en fila, no fichas (2026-08-12, a pedido:
                  "no hace falta que sean bloques, pueden ser más
                  minimalistas") — mismo ícono+label de antes, pero sin la
                  caja cuadrada (padding grande, ícono de 22px arriba del
                  texto): ahora es una fila de pills bajitas, ícono y texto en
                  la misma línea, que se van a la línea siguiente solas si no
                  entran las cuatro (flexWrap) en vez de forzar un grid 2x2. */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TIPOS_EMPRESA.map(t => {
                  const activo = tipo === t.valor;
                  const Icon = t.icono;
                  return (
                    <button
                      key={t.valor} type="button" onClick={() => setTipo(t.valor)}
                      aria-pressed={activo}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
                        border: `1px solid ${activo ? C.primary : C.line}`,
                        background: activo ? C.primarySoft : '#fff',
                        fontFamily: C.font, transition: 'all .15s',
                      }}
                    >
                      <Icon size={15} strokeWidth={2} color={activo ? C.primary : C.ink2} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: activo ? C.primary : C.ink }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelSt} htmlFor="hot-nombre">Nombre de la empresa</label>
              <input id="hot-nombre" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Cómo se llama tu empresa" style={inputSt}
                onFocus={e => e.currentTarget.style.borderColor = C.primary}
                onBlur={e => e.currentTarget.style.borderColor = C.line} />
            </div>

            {/* Nombre y apellido de la PERSONA. Nada de esto se usa como default
                del negocio: el que atiende no se llama igual que la empresa. */}
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

            <div style={{ marginBottom: 14 }}>
              <label style={labelSt} htmlFor="hot-user">Mail</label>
              <input id="hot-user" type="email" autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="vos@tuempresa.com" style={inputSt}
                onFocus={e => e.currentTarget.style.borderColor = C.primary}
                onBlur={e => e.currentTarget.style.borderColor = C.line} />
            </div>

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

            <div>
              <label style={labelSt} htmlFor="hot-tel">Teléfono <span style={{ fontWeight: 500, color: C.muted }}>(opcional)</span></label>
              <input id="hot-tel" type="tel" inputMode="tel" autoComplete="tel"
                value={telefono} onChange={e => setTelefono(e.target.value)}
                placeholder="11 5555 5555" style={inputSt}
                onFocus={e => e.currentTarget.style.borderColor = C.primary}
                onBlur={e => e.currentTarget.style.borderColor = C.line} />
            </div>

            <div style={{ marginTop: 16, maxWidth: 320, marginInline: 'auto' }}>
              <CaptchaAuto verificado={humano} onVerificar={setHumano} />
            </div>
        </div>

        {/* Total + alta. Última sección: embebido, es acá donde por fin se ve
            un borde redondeado propio (heredado de .gp-panel, no de esta
            tarjeta) — ver la nota junto a la tarjeta de Alta, más arriba. */}
        <div style={embebido
          ? { borderTop: `1px solid ${C.line}`, padding: '20px 0 0' }
          : { background: '#fff', border: `1px solid ${C.line}`, borderRadius: 20, padding: '22px 24px' }}>
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
