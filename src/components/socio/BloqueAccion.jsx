// ============================================================
//  src/components/socio/BloqueAccion.jsx
//  El CTA del panel de ofertas del socio. Depende del estado del USUARIO
//  respecto de ESTA oferta, nunca de la posición en la lista.
//
//  El doc describe tres estados (A sin nada / B con cupón / C con Pase), pero
//  entre B y C faltan dos que no son opcionales:
//
//    · premium sin elegir → el Pase NO la cubre todavía. Hay que gastar una
//      elección primero. Saltear este paso mostraría "Canjear ahora" sobre algo
//      que la RPC `canjear_beneficio` va a rechazar, porque mira
//      `pase_elecciones`.
//    · pase dormido → activar arranca la vigencia y no tiene vuelta atrás.
//
//  ⚠️ El pase dormido NO ofrece "activar y canjear" en un solo tap. Si el
//  turista lo toca el día que compró para curiosear el catálogo, quema días sin
//  canjear nada — el peor primer contacto posible con el producto. Botón
//  "Activar mi Pase" + confirmación obligatoria. Vale igual para el pase de
//  regalo del hotel: la vigencia corre desde la activación, no desde que el
//  hotel lo mandó.
//
//  Jerarquía de A deliberada (doc §4): el Pase es el producto hero y el cupón
//  suelto es la puerta de entrada, no al revés.
// ============================================================
import { useEffect, useState } from 'react';
import { ChevronDown, Gift } from 'lucide-react';
import PaSSMark from '../PaSSMark';
import { usePasePropio } from '../../lib/pasePropio';
import { activarPaseAhora, elegirPremium, getPasesDestino, nivelEnPase, precioSueltoConPase } from '../../lib/pases';
import { cuponPropioDe } from '../../lib/compras';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280',
  line: '#E7E9EE', primary: '#475BE1', primaryDark: '#3347C8',
  green: '#10A36B', dorado: '#FFB94A', font: "'Inter', system-ui, sans-serif",
};

const fmt = n => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;

// ─── Ahorro ───────────────────────────────────────────────────
// Vivía en PanelOfertasSocio, arriba del bloque. Se mudó acá porque en el
// estado A dejó de ser un renglón suelto: comparte fila con el CTA del cupón
// ("Con este cupón ahorrás $X" a la izquierda, "Quiero el cupón por $Y" a la
// derecha), y esa fila es la pregunta completa —cuánto ganás, cuánto cuesta—
// leída de una. En el resto de los estados sigue yendo sola arriba.
//
// El monto es SIEMPRE el ahorro que declaró el socio, sin restarle nada
// (2026-08-13). Antes, en los cupones de entrada (ahorro < $10.000), se
// mostraba la ganancia neta —ahorro menos precio— para que no se leyera
// "ahorrás $5.000" al lado de "pagás $2.500" e invitara a hacer la resta. El
// problema es que ese número ya no era el del socio: en una oferta de $5.000
// la pantalla decía "ahorrás $2.500", que es justo el mínimo publicable menos
// el precio, y se leía como un ahorro por debajo del mínimo. El dato que el
// socio carga es el que se muestra; la resta la hace el turista si quiere.
// Sin ahorro cargado no se muestra nada: no hay número de relleno (CLAUDE.md).
function LineaAhorro({ ahorro, style }) {
  if (!(ahorro > 0)) return null;
  const monto = ahorro;
  return (
    <span style={{
      fontFamily: A.font, fontSize: 12, fontWeight: 500,
      color: A.ink2, lineHeight: 1.4, whiteSpace: 'nowrap', ...style,
    }}>
      Con este cupón ahorrás <b style={{ color: A.green, fontWeight: 800 }}>{fmt(monto)}</b> aprox.
    </span>
  );
}

function Primario({ children, onClick, disabled }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      background: A.primary, color: '#fff', fontFamily: A.font,
      fontSize: 15, fontWeight: 700, cursor: disabled ? 'default' : 'pointer',
      opacity: disabled ? 0.6 : 1, transition: 'background .15s',
    }}>{children}</button>
  );
}

function Secundario({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: '100%', marginTop: 8, padding: '10px 16px', borderRadius: 12,
      border: `1px solid ${A.line}`, background: '#fff', color: A.ink,
      fontFamily: A.font, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
    }}>{children}</button>
  );
}

function Nota({ children, tono = 'info' }) {
  return (
    <p style={{
      margin: '0 0 10px', fontFamily: A.font, fontSize: 13, lineHeight: 1.5,
      color: tono === 'ok' ? A.green : A.ink2,
    }}>{children}</p>
  );
}

// ─── Selector del Pase — días y precio en una sola fila ────────
// Vive acá y no en el hero de la home (HeroPase.jsx): ahí el precio es
// "vidriera" (texto fijo, de marketing), pero acá es una decisión de compra
// al lado de un cupón con precio real — tiene que salir de la tabla `pases`,
// nunca de un número escrito a mano.
function SelectorPaseInline({ onComprarPase }) {
  const [pases, setPases]     = useState(null);
  const [elegido, setElegido] = useState('');

  useEffect(() => {
    let vivo = true;
    getPasesDestino().then(data => {
      if (!vivo) return;
      setPases(data);
      if (data[0]) setElegido(String(data[0].duracion_dias));
    });
    return () => { vivo = false; };
  }, []);

  // Mientras carga no hay nada que mostrar: ni un selector vacío ni un precio
  // inventado (regla de datos faltantes en CLAUDE.md).
  if (!pases?.length) return null;

  const activo = pases.find(p => String(p.duracion_dias) === elegido);

  return (
    <div style={{ display: 'flex', gap: 11, marginTop: 16 }}>
      {/* El <select> nativo va TRANSPARENTE encima de una carátula pintada a
          mano. Hace falta porque el diseño pide pesos mezclados adentro del
          control ("Pase **3 días** | $20.000") y el nativo pinta su texto con
          un solo peso. Un menú propio lo resolvería, pero a cambio de
          reescribir teclado, foco y el picker del sistema en mobile; así se
          queda con las dos cosas. La carátula va aria-hidden y el que anuncia
          es el select real. */}
      <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
        <div aria-hidden="true" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px 10px 16px', borderRadius: 12,
          border: `1px solid ${A.line}`, background: '#fff',
          fontFamily: A.font, fontSize: 13.5, color: A.ink, whiteSpace: 'nowrap',
        }}>
          <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activo ? (
              <>
                Pase <b style={{ fontWeight: 800 }}>{activo.duracion_dias} días</b>
                <span style={{ color: A.line, margin: '0 8px' }}>|</span>
                {fmt(activo.precio_final)}
              </>
            ) : 'Más días (a medida)'}
          </span>
          <ChevronDown size={18} color={A.muted} style={{ flexShrink: 0 }} />
        </div>
        <select
          value={elegido}
          onChange={e => setElegido(e.target.value)}
          aria-label="Duración del Pase"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0, appearance: 'none', border: 'none', background: 'transparent',
            fontFamily: A.font, fontSize: 13.5, cursor: 'pointer',
          }}
        >
          {pases.map(p => (
            <option key={p.id ?? p.duracion_dias} value={p.duracion_dias}>
              {p.duracion_dias} días · {fmt(p.precio_final)}
            </option>
          ))}
          <option value="custom">Más días (a medida)</option>
        </select>
      </div>
      <button
        type="button"
        onClick={() => onComprarPase?.(elegido === 'custom' ? 'custom' : Number(elegido))}
        style={{
          flexShrink: 0, padding: '10px 22px', borderRadius: 12, border: 'none',
          background: A.primary, color: '#fff', fontFamily: A.font,
          fontSize: 14, fontWeight: 800, cursor: 'pointer',
        }}
      >
        Comprar
      </button>
    </div>
  );
}

// ─── Confirmación de activación ───────────────────────────────
// No es un "¿estás seguro?" de trámite: es el único momento en que se puede
// avisar que el reloj arranca. Por eso dice la cantidad real de días.
function ConfirmarActivacion({ dias, ocupado, onCancelar, onConfirmar }) {
  return (
    <div onClick={onCancelar} style={{
      position: 'fixed', inset: 0, zIndex: 9400, background: 'rgba(5,10,25,0.6)',
      display: 'grid', placeItems: 'center', padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true" style={{
        width: '100%', maxWidth: 380, background: '#fff', borderRadius: 20,
        padding: '24px 22px 20px', fontFamily: A.font,
        boxShadow: '0 30px 70px -20px rgba(5,10,25,0.6)',
      }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: A.ink, letterSpacing: '-0.02em', marginBottom: 10 }}>
          ¿Activamos tu Pase?
        </div>
        <p style={{ fontSize: 14.5, color: A.ink2, lineHeight: 1.55, margin: '0 0 20px' }}>
          Al activarlo arrancan tus <b style={{ color: A.ink }}>{dias} días</b>. Activalo cuando llegues a Gesell.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancelar} disabled={ocupado} style={{
            flex: 1, padding: '13px 16px', borderRadius: 12, border: `1px solid ${A.line}`,
            background: '#fff', color: A.ink2, fontFamily: A.font, fontSize: 14.5, fontWeight: 700, cursor: 'pointer',
          }}>Todavía no</button>
          <button onClick={onConfirmar} disabled={ocupado} style={{
            flex: 1, padding: '13px 16px', borderRadius: 12, border: 'none',
            background: A.primary, color: '#fff', fontFamily: A.font, fontSize: 14.5, fontWeight: 800,
            cursor: ocupado ? 'default' : 'pointer', opacity: ocupado ? 0.6 : 1,
          }}>{ocupado ? 'Activando…' : 'Activar ahora'}</button>
        </div>
      </div>
    </div>
  );
}

export default function BloqueAccion({
  promo, session, precio, cuponesTotal = 0,
  onComprarPase, onSumarCupon, onCanjear, onCoordinarFecha, onVerPase, onRegalarPase,
}) {
  const { pase, activo, pendiente, libres, total, elegidasIds, premiumIlimitado, refrescar } = usePasePropio();

  const [cuponPropio, setCuponPropio] = useState(null);
  const [confirmando, setConfirmando] = useState(false);
  const [ocupado, setOcupado]         = useState(false);
  const [aviso, setAviso]             = useState('');

  // Al cambiar de oferta hay que olvidar el cupón de la anterior AHORA, no
  // después del efecto: si no, entre el cambio y el fetch se pinta un render
  // que le dice "ya es tuyo" sobre una oferta que no compró.
  const [promoPrev, setPromoPrev] = useState(promo?.id);
  if (promoPrev !== promo?.id) { setPromoPrev(promo?.id); setCuponPropio(null); setAviso(''); }

  // ¿Ya compró un cupón de ESTA oferta y sigue sin canjear? Es lo que separa el
  // estado A del B. Se pregunta por oferta, y por eso vive en el panel
  // expandido y no en cada fila colapsada.
  useEffect(() => {
    let vivo = true;
    if (!session?.user?.id || !promo?.id) return;
    cuponPropioDe(promo.id).then(c => { if (vivo) setCuponPropio(c); });
    return () => { vivo = false; };
  }, [session?.user?.id, promo?.id]);

  const premium    = nivelEnPase(promo) === 'premium';
  const conPase    = !!pase;
  const yaElegida  = premium && elegidasIds.includes(promo.id);
  const pideFecha  = !!(promo.requiereFecha || promo.requiereReserva);
  const cubierta   = !premium || yaElegida;
  const mitad      = precioSueltoConPase(precio);

  const activar = async () => {
    if (!pase || ocupado) return;
    setOcupado(true); setAviso('');
    const r = await activarPaseAhora(pase.id);
    setOcupado(false); setConfirmando(false);
    if (!r?.ok) { setAviso('No pudimos activar tu Pase. Probá de nuevo.'); return; }
    // Recién ahora el bloque pasa al estado C.
    refrescar();
  };

  const elegir = async () => {
    if (!pase || ocupado) return;
    setOcupado(true); setAviso('');
    const r = await elegirPremium(pase.id, promo.id);
    setOcupado(false);
    if (!r?.ok) {
      setAviso(r?.error === 'max_elecciones'
        ? 'Ya usaste todas tus elecciones PREMIUM.'
        : 'No se pudo elegir. Probá de nuevo.');
      return;
    }
    refrescar();
  };

  const error = aviso && (
    <div style={{ marginTop: 8, fontSize: 12.5, color: '#B91C1C', fontFamily: A.font, textAlign: 'center' }}>{aviso}</div>
  );

  // El ahorro encabeza todos los estados menos A, que lo pone en la misma fila
  // que su CTA. Va por función y no repetido en cada rama para que no se
  // desincronicen entre ellas.
  const ahorro = promo?.ahorroEstimado || 0;
  const conAhorro = cuerpo => (
    <div>
      <LineaAhorro ahorro={ahorro} style={{ display: 'block', marginBottom: 12 }} />
      {cuerpo}
    </div>
  );

  const botonCanjear = (
    <Primario onClick={onCanjear}>
      <img src="/iconos/qr-code.svg" alt="" width={19} height={19}
           style={{ display: 'block', flexShrink: 0, filter: 'brightness(0) invert(1)' }} />
      Canjear ahora
    </Primario>
  );

  // ─── B · ya lo compró suelto ────────────────────────────────
  // Va primero, antes que cualquier rama del Pase: un cupón pago es del turista
  // pase lo que pase. Mostrarle otra cosa sería venderle lo que ya tiene.
  if (cuponPropio) {
    return conAhorro(
      <>
        <Nota tono="ok">Ya es tuyo. Mostrá el QR del comercio para canjearlo.</Nota>
        {botonCanjear}
        <div style={{ marginTop: 8, fontSize: 12, color: A.muted, textAlign: 'center', fontFamily: A.font }}>
          Tu código: <b style={{ color: A.ink, letterSpacing: '0.08em' }}>{cuponPropio.codigo}</b>
        </div>
        {error}
      </>
    );
  }

  // ─── A · no tiene Pase ──────────────────────────────────────
  // Dos bloques separados por una línea, y no una pila de botones (rediseño
  // 2026-08-13): arriba el cupón suelto —cuánto ahorrás y cuánto cuesta, en un
  // solo renglón—, abajo el Pase con su propio encabezado.
  //
  // El cupón perdió el botón con borde y quedó como texto: dos botones, uno
  // arriba del otro, se leían como dos versiones de lo mismo. Ahora el único
  // relleno azul de la pantalla es el del Pase, que es el producto hero
  // (doc §4), y el cupón suelto queda como la puerta de entrada que es.
  if (!conPase) {
    return (
      <div>
        {/* Los dos lados van en un renglón: juntos son la pregunta completa
            —cuánto ganás, cuánto cuesta— y separarlos la parte al medio. La
            columna del panel mide ~410px y ahí adentro los dos textos entran
            recién a 12/13px; el diseño estaba dibujado sobre una card bastante
            más ancha, así que el cuerpo bajó para respetar la fila. `wrap`
            queda como red: con un ahorro de seis cifras o en una pantalla más
            angosta, apilarse es mejor que desbordar. */}
        <div style={{
          display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
          gap: 12, flexWrap: 'wrap',
        }}>
          <LineaAhorro ahorro={ahorro} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
            <button
              type="button"
              onClick={() => onSumarCupon?.(promo)}
              style={{
                padding: 0, border: 'none', background: 'none', cursor: 'pointer',
                fontFamily: A.font, fontSize: 13, fontWeight: 500, color: A.ink,
                lineHeight: 1.4, textAlign: 'left', whiteSpace: 'nowrap',
              }}
            >
              <b style={{ fontWeight: 800 }}>Comprar</b>{precio > 0 ? ` por ${fmt(precio)}` : ''}
            </button>
            {/* El neto, ahora rotulado. Arriba se muestra el ahorro que declaró
                el socio y al lado lo que cuesta el cupón; la resta de los dos
                es el dato que al turista le importa de verdad, y hacerla en su
                cabeza no es obvio. Antes esta cuenta se colaba SIN rótulo en el
                lugar del ahorro —"ahorrás $2.500" sobre una oferta de $5.000—,
                que es lo que hacía parecer que el socio había cargado un ahorro
                por debajo del mínimo.
                Sale de `ahorro − precio` y no de `gananciaNeta(ahorro)`, que
                recalcula desde la escalera: así la resta cierra con los dos
                números que están en pantalla, incluso cuando el superadmin
                fijó un `precio_manual` que no sale de la escalera.
                Chiquito, itálico y gris: es la nota al pie de la fila, no un
                tercer número compitiendo con los otros dos. */}
            {precio > 0 && ahorro > precio && (
              <span style={{
                fontFamily: A.font, fontSize: 10.5, fontStyle: 'italic',
                fontWeight: 400, color: A.muted, lineHeight: 1.3, whiteSpace: 'nowrap',
              }}>
                Ahorro final: {fmt(ahorro - precio)} aprox.
              </span>
            )}
          </div>
        </div>

        <div style={{ height: 1, background: A.line, margin: '18px 0 20px' }} />

        {/* El número es el catálogo ENTERO, no el de la localidad (2026-08-13).
            Antes decía "N cupones en la zona" con el conteo de
            `promosLocalidad`, que en Mar Azul o Las Gaviotas daba un puñado y
            hacía ver chico justo lo que el pase tiene de grande. Lo que el pase
            habilita no está limitado a la zona, así que el número honesto y el
            número alto son el mismo: el total vigente, contado por
            `contarDescuentosDelPase()` — el mismo que muestra la home en "Ver
            los N descuentos", para que no haya dos cifras distintas del mismo
            catálogo dando vueltas.
            Sin locativo: el conteo ya no es de ningún lugar en particular, y
            cambiarlo por "en toda la red" sería agregar una promesa que la
            frase no necesita.
            Si todavía no cargó, no va la línea: acá un dato que falta se
            muestra vacío, nunca redondeado ni inventado. La frase encabeza el
            bloque del Pase y termina en dos puntos porque presenta al selector
            que viene abajo. */}
        {cuponesTotal > 0 && (
          <div style={{
            textAlign: 'center', fontFamily: A.font, fontSize: 15, fontWeight: 700,
            color: A.ink2, letterSpacing: '-0.01em', lineHeight: 1.4,
          }}>
            Ó desbloqueá <b style={{ color: A.primary, fontWeight: 800 }}>{cuponesTotal} cupones</b> en todo el catálogo:
          </div>
        )}

        <SelectorPaseInline onComprarPase={onComprarPase} />

       

        <div style={{
          marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 13, fontFamily: A.font, fontSize: 13.5,
        }}>
          <button type="button" onClick={onRegalarPase} style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: 0, border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: A.font, fontSize: 13.5, fontWeight: 500, color: A.ink,
          }}>
            <Gift size={20} color={A.dorado} strokeWidth={2.2} aria-hidden="true" />
            Regalar pass
          </button>
          <span aria-hidden="true" style={{ color: A.line }}>|</span>
          <button type="button" onClick={onVerPase} style={{
            padding: 0, border: 'none', background: 'none', cursor: 'pointer',
            fontFamily: A.font, fontSize: 13.5, fontWeight: 500, color: A.ink,
          }}>
            Conocé más
          </button>
        </div>
         <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <PaSSMark size={12} conPrefijo />
        </div>
        {error}
      </div>
    );
  }

  // ─── Coordinar fecha ────────────────────────────────────────
  // NO exige activar el pase: coordinar con el pase dormido es justamente para
  // lo que se hizo la activación programada — acordar el día antes de viajar
  // sin quemar días esperando respuestas.
  //
  // ⚠️ Copy no negociable (Ley 18.829): nunca "reservá" ni "disponibilidad".
  // Cuponear TRANSMITE un pedido; confirma el comercio.
  if (pideFecha && onCoordinarFecha) {
    return conAhorro(
      <>
        <Nota>Elegí el día y el comercio te responde. La fecha la confirma él, no nosotros.</Nota>
        <Primario onClick={() => onCoordinarFecha(promo)}>Coordinar fecha</Primario>
        {error}
      </>
    );
  }

  // ─── Premium que todavía no eligió ──────────────────────────
  // Con Pase de 10+ días el tope desaparece, pero la oferta sigue sin ser
  // "incluida": hay que ELEGIRLA igual, sólo que sin tope de cuántas.
  if (!cubierta) {
    if (premiumIlimitado || libres > 0) {
      return conAhorro(
        <>
          <Nota>
            {premiumIlimitado
              ? <>Tenés todo el catálogo PREMIUM disponible, sin tope.</>
              : <>Te {libres === 1 ? 'queda' : 'quedan'} <b style={{ color: A.ink }}>{libres}</b> {libres === 1 ? 'elección' : 'elecciones'} PREMIUM de {total}.</>}
          </Nota>
          <Primario onClick={elegir} disabled={ocupado}>
            {ocupado ? 'Eligiendo…' : 'Usar una de mis elecciones'}
          </Primario>
          {!premiumIlimitado && (
            <Secundario onClick={() => onSumarCupon?.(promo)}>
              Guardar mis elecciones y pagarlo {fmt(mitad)}
            </Secundario>
          )}
          {error}
        </>
      );
    }
    return conAhorro(
      <>
        <Nota>Ya usaste tus {total} elecciones PREMIUM. Este lo sumás a mitad de precio.</Nota>
        <Primario onClick={() => onSumarCupon?.(promo)}>Sumarlo por {fmt(mitad)}</Primario>
        <div style={{ marginTop: 8, fontSize: 12, color: A.muted, textAlign: 'center', fontFamily: A.font }}>
          Precio sin Pase: {fmt(precio)}
        </div>
        {error}
      </>
    );
  }

  // ─── Pase comprado y todavía dormido ────────────────────────
  if (pendiente) {
    const dias = pase.dias ?? pase.pases?.duracion_dias ?? 7;
    return (
      <div>
        <Nota>Ya tenés tu Pase. Activalo cuando estés en Gesell para empezar a canjear.</Nota>
        <Primario onClick={() => setConfirmando(true)}>Activar mi Pase</Primario>
        {error}
        {confirmando && (
          <ConfirmarActivacion
            dias={dias} ocupado={ocupado}
            onCancelar={() => setConfirmando(false)}
            onConfirmar={activar}
          />
        )}
      </div>
    );
  }

  // ─── C · el Pase la cubre y está corriendo ──────────────────
  // Sin precio a la vista en ningún lado: ya lo pagó con el Pase.
  return (
    <div>
      <Nota tono="ok">
        {yaElegida ? 'La elegiste con tu Pase. ' : 'Entra en tu Pase. '}
        Mostrá el QR del comercio para canjearla.
      </Nota>
      {activo ? botonCanjear : <Nota>Activá tu Pase para poder canjear.</Nota>}
      {error}
    </div>
  );
}
