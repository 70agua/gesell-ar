// ============================================================
//  src/components/CtaPase.jsx
//  El CTA de una oferta, contado desde el pase. Reemplaza al viejo
//  "Agregar a cuponera", que no distinguía nada. Hoy el destino es el carrito.
//
//  Cinco situaciones, según la regla de lib/pases.js (nivelEnPase) y el pase
//  del que mira (useMiPase):
//
//    SIN PASE   · incluida → "Incluido en el Cupon PASS"
//               · estadía  → "Tu estadía con el Cupon PASS: el Pase trae una"
//               · premium  → "Elegilo con el Cupon PASS", o sale la mitad
//    COMPRADO   · cupón suelto → "Canjear ahora" (no depende del Pase)
//    CON PASE   · con fecha  → "Coordinar fecha" (no exige pase activo)
//               · corriendo       → "Canjear ahora" (abre la cámara)
//               · dormido         → "Activar pase y canjear"
//               · incluida → "Ya lo tenés", sin gastar elección
//               · estadía  → "Usala como tu estadía: el Pase trae una"
//               · premium con elecciones → elegilo, usando una de las N
//               · premium sin elecciones → lo sumás a mitad de precio
//               · premium, Pase de 10+ días → sin tope, siempre "elegilo"
//
//  ⚠️ Una PREMIUM nunca se anuncia como "incluida": consume uno de los pocos
//  slots del turista, y "incluido" promete acceso ilimitado a algo limitado.
//  (Con Pase de 10+ días el slot deja de existir de verdad — ver
//  DIAS_PREMIUM_ILIMITADO en lib/pases.js — pero la oferta sigue sin ser
//  "incluida": hay que ELEGIRLA igual, sólo que sin tope de cuántas.)
//
//  El botón siempre hace algo: sumar el cupón al carrito (onSumar) o
//  gastar una elección premium (onElegir). El upsell nunca bloquea.
// ============================================================

import PaSSMark from './PaSSMark';
import { nivelEnPase, precioSueltoConPase, esOfertaEstadia } from '../lib/pases';
import { usePasePropio } from '../lib/pasePropio';

const C = {
  primary:     '#475BE1',
  primaryDark: '#3347C8',
  primarySoft: '#EEF0FD',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  green:       '#10A36B',
  font:        "'Inter', system-ui, sans-serif",
};

const fmt = n => `$${Math.round(Number(n) || 0).toLocaleString('es-AR')}`;

// Un renglón de contexto arriba del botón: es el lugar del upsell.
function Nota({ children, tono = 'info' }) {
  const fondo = tono === 'ok' ? '#EDFAF4' : C.primarySoft;
  const color = tono === 'ok' ? C.green : C.ink2;
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6, background: fondo, color, borderRadius: 12, padding: '10px 13px', fontSize: 12.5, lineHeight: 1.45, fontFamily: C.font, marginBottom: 10 }}>
      {children}
    </div>
  );
}

export default function CtaPase({
  promo, precioLista, miPase,
  onSumar, onElegir, onComprarPase, onActivarPase,
  onCanjear, onSolicitarReserva, cuponPropio = null,
  compacto = false, sumado = false,
}) {
  const premium   = nivelEnPase(promo) === 'premium';
  // Alojamiento por debajo del umbral premium: no ocupa slot, pero el Pase
  // trae UNA sola estadía. Decirle "incluido" promete ilimitado.
  const estadia   = !premium && esOfertaEstadia(promo);
  const conPase   = !!miPase?.pase;
  // Comprado pero todavía sin activar: no se puede canjear, pero tampoco hay
  // que ofrecerle comprar el pase que ya tiene.
  const pendiente = !!miPase?.pendiente;
  const restantes = miPase?.restantes || 0;
  const mitad     = precioSueltoConPase(precioLista);

  // `useMiPase` (que llena `miPase`) no trae CUÁLES ofertas se eligieron, sólo
  // el conteo total — así que antes de esto, "¿ya elegí ESTA?" se adivinaba
  // con `restantes < total` (si gasté alguna elección, en cualquier oferta,
  // asumí que es ésta). Con un Pase sin tope, `restantes` y `total` son los
  // dos Infinity siempre, así que esa cuenta deja de poder distinguir nada.
  // Se reemplaza por el dato real —`elegidasIds`, que sí vive en
  // usePasePropio()— en vez de parchear el síntoma.
  const { elegidasIds: elegidasPropias, premiumIlimitado } = usePasePropio();
  const yaElegida = premium && elegidasPropias.includes(promo.id);

  const alto  = compacto ? '11px 0' : '13px 0';
  const cuerpo = compacto ? 14 : 15;

  const boton = (label, { accion, tono = 'primary' } = {}) => (
    <button
      onClick={accion}
      style={{
        width: '100%', padding: alto, borderRadius: 12, border: 'none', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        fontSize: cuerpo, fontWeight: 700, fontFamily: C.font,
        background: tono === 'ok' ? C.green : C.primary, color: '#fff',
        transition: 'background .15s',
      }}
      onMouseEnter={e => { if (tono !== 'ok') e.currentTarget.style.background = C.primaryDark; }}
      onMouseLeave={e => { if (tono !== 'ok') e.currentTarget.style.background = C.primary; }}
    >
      {label}
    </button>
  );

  if (sumado) return boton('Ya está en tu carrito', { accion: undefined, tono: 'ok' });

  // ─── Ya lo compró suelto ────────────────────────────────────
  // Va PRIMERO, antes que cualquier rama del Pase: un cupón pago es del
  // turista pase lo que pase, no depende de tener el Pase ni de que esté
  // activo. Mostrarle acá otra cosa —comprarlo de nuevo, o "elegilo con el
  // Pase"— sería venderle lo que ya tiene.
  if (cuponPropio && onCanjear) {
    return (
      <>
        <Nota tono="ok">
          <span>Ya es tuyo. Mostrá el QR del comercio para canjearlo — tu código es <b>{cuponPropio.codigo}</b>.</span>
        </Nota>
        {boton('Canjear ahora', { accion: onCanjear })}
      </>
    );
  }

  // ─── Con pase: primero, cómo se USA esta oferta ─────────────
  //
  // Estas tres ramas van ANTES que todo lo demás porque el que ya tiene el pase
  // no está decidiendo si comprar: está por usarlo, y en el mostrador o
  // planificando. Ofrecerle "sumalo al carrito" ahí es ruido.

  // Coordinar fecha. NO exige activar el pase: coordinar con el pase dormido es
  // justamente para lo que se hizo la activación programada — acordar el día
  // antes de viajar sin quemar días esperando respuestas.
  //
  // ⚠️ Copy no negociable (Ley 18.829): nunca "reservá", "reserva" ni
  // "disponibilidad". Cuponear TRANSMITE un pedido; confirma el comercio.
  if (conPase && (promo.requiereFecha || promo.requiereReserva) && onSolicitarReserva) {
    return (
      <>
        <Nota>
          <span>
            {estadia
              ? <>Es tu estadía del <PaSSMark size={11} conPrefijo />. Pedí el día y el comercio te responde.</>
              : <>Elegí el día y el comercio te responde. La fecha la confirma él, no nosotros.</>}
          </span>
        </Nota>
        {boton('Coordinar fecha', { accion: onSolicitarReserva })}
      </>
    );
  }

  // Pase corriendo: se canja en el mostrador. Un solo paso.
  if (conPase && !pendiente && onCanjear && (!premium || yaElegida)) {
    return (
      <>
        <Nota tono="ok"><span>Mostrá el QR del comercio para canjearlo.</span></Nota>
        {boton('Canjear ahora', { accion: onCanjear })}
      </>
    );
  }

  // Comprado y dormido: canjear obliga a arrancarlo, y eso no tiene vuelta
  // atrás. El aviso con la fecha lo maneja quien recibe onActivarPase.
  if (conPase && pendiente && onActivarPase) {
    return (
      <>
        <Nota>
          <span>Tu Pase todavía no arrancó. Canjear acá lo pone en marcha.</span>
        </Nota>
        {boton('Activar pase y canjear', { accion: onActivarPase })}
      </>
    );
  }

  // ─── Sin pase: acá vive el upsell ───────────────────────────
  if (!conPase) {
    return (
      <>
        <Nota>
          {premium ? (
            <span>
              Elegilo con el <PaSSMark size={11} conPrefijo />
              {mitad > 0 && <> — o sumalo suelto por <b>{fmt(mitad)}</b> en vez de {fmt(precioLista)}</>}.
            </span>
          ) : (
            <span>
              {estadia
                ? <>Tu estadía con el <PaSSMark size={11} conPrefijo />: el Pase trae una.</>
                : <>Incluido en <PaSSMark size={11} conPrefijo />.</>}
            </span>
          )}
        </Nota>
        {boton(precioLista > 0 ? `Sumarlo por ${fmt(precioLista)}` : 'Sumarlo a mi carrito', { accion: onSumar })}
        <button
          onClick={onComprarPase}
          style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: C.primary, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: C.font, padding: '4px 0' }}
        >
          Ver el Cupon PASS →
        </button>
      </>
    );
  }

  // ─── Pase comprado y sin activar ────────────────────────────
  if (pendiente) {
    return (
      <>
        <Nota tono="ok">
          <span>Ya tenés el Pase. Activalo cuando llegues y este cupón entra sin costo.</span>
        </Nota>
        {boton('Activar mi Pase', { accion: onActivarPase, tono: 'ok' })}
        <button
          onClick={onSumar}
          style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: C.muted, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, padding: '4px 0' }}
        >
          Comprarlo suelto igual
        </button>
      </>
    );
  }

  // ─── Con pase, oferta incluida ──────────────────────────────
  if (!premium) {
    return (
      <>
        <Nota tono="ok">
          <span>{estadia
            ? 'Usala como tu estadía: el Pase trae una, y no gasta ninguna elección.'
            : 'Ya lo tenés: entra en tu Pase sin gastar ninguna elección.'}</span>
        </Nota>
        {boton('Sumarlo a mi carrito', { accion: onSumar })}
      </>
    );
  }

  // ─── Con pase, premium con elecciones disponibles ───────────
  if (premiumIlimitado || restantes > 0) {
    return (
      <>
        <Nota>
          <span>
            {premiumIlimitado
              ? <>Elegilo con el <PaSSMark size={11} conPrefijo />: tenés todo el catálogo PREMIUM disponible, sin tope.</>
              : <>Elegilo con el <PaSSMark size={11} conPrefijo />. Te {restantes === 1 ? 'queda' : 'quedan'}{' '}
                  <b>{restantes}</b> {restantes === 1 ? 'elección' : 'elecciones'} de {miPase.total}.</>}
          </span>
        </Nota>
        {boton('Usar una de mis elecciones', { accion: onElegir })}
        {/* Pagar la mitad es la salida para cuando las elecciones se acaban.
            Con un Pase sin tope no hay motivo para ofrecerla: elegir sale
            gratis y siempre alcanza. */}
        {!premiumIlimitado && (
          <button
            onClick={onSumar}
            style={{ width: '100%', marginTop: 8, background: 'none', border: 'none', color: C.muted, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: C.font, padding: '4px 0' }}
          >
            Guardar mis elecciones y pagarlo {fmt(mitad)}
          </button>
        )}
      </>
    );
  }

  // ─── Con pase, premium sin elecciones ───────────────────────
  return (
    <>
      <Nota>
        <span>Ya usaste tus {miPase.total} elecciones. Este lo sumás a mitad de precio.</span>
      </Nota>
      {boton(`Sumarlo por ${fmt(mitad)}`, { accion: onSumar })}
      <div style={{ textAlign: 'center', marginTop: 8, fontSize: 12, color: C.muted, fontFamily: C.font }}>
        Precio sin pase: {fmt(precioLista)}
      </div>
    </>
  );
}
