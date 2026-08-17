// ============================================================
//  src/components/landing/HeroPase.jsx
//  Hero de la home, a DOS columnas:
//   · Izquierda: el ticket como marca del producto (también dispara el
//     reveal manual del navbar, ver el botón más abajo), el título —cuya
//     tercera línea es un ticker de rubros que se tipean solos en bucle,
//     ver TICKER_PALABRAS/TickerPalabras más abajo—, y —recién con el
//     scroll, ver pintarReveal()— un pretítulo con los dos pases con su
//     precio adentro y una línea de letra chica. El carril de hotelería
//     que vivía al pie se mudó entero a HeroCoupons (ver más abajo,
//     2026-08-07).
//   · Derecha: galería masonry (tipo Pinterest) inclinada 10°, con parallax al
//     scrollear; fotos random del pool src/assets/grilla por carga.
//
//  Las reglas de jerarquía que sostienen este orden, para no romperlas sin
//  querer al agregar cosas:
//   1. Un solo protagonista: el turista. El título le habla a él ("Viví
//      cuponeando a precio de local"), así que la primera acción que se cruza
//      también es suya. Hotelería ya no comparte espacio con él en este
//      slide —tiene el suyo propio, HeroCoupons—.
//   2. El precio entra DENTRO del botón: es la decisión, no letra chica.
//   3. Sin párrafo de apoyo aparte: las categorías (alojamiento, excursiones,
//      gastronomía, compras) ya las dice la galería, no hace falta un texto
//      chico repitiéndolas en la columna de la izquierda.
//   4. Dos pesos de acción y no más: azul lleno = comprar; link subrayado =
//      todo lo demás.
//   5. El ticket es la marca del producto, no un adorno al costado: por eso va
//      arriba del título y se inclina en el mismo sentido que la galería.
//   6. El número de cupones del catálogo, que llegó a pasar por varios
//      formatos acá (ficha flotante, stat junto al ticket, frase suelta al
//      pie, protagonista de un slide de transición propio), se sacó del
//      todo: no hay ningún dato vivo mostrándose en este hero.
//
//  PRUEBA (2026-08-04 a 2026-08-10, revertida): el hero vivió "pineado" un
//  tramo extra de scroll — ver el comentario "EX-PRUEBA" junto a
//  PANEL_G1/G2/G3, más abajo, para el cómo, el porqué, y por qué se sacó
//  entero (hacía un salto raro al scrollear). Volvió a scroll nativo.
//  (2026-08-06: el pin llegó a tener un segundo copy —la propuesta para
//  alojamientos/agencias— que entraba por cross-fade a mitad del recorrido.
//  Ese copy se mudó a su propia sección, HeroCoupons.
//  2026-08-07: el pretítulo + botones, que antes estaban visibles desde el
//  arranque, ahora aparecen recién con el scroll pineado —ver
//  pintarReveal()— para que el primer instante del hero sea sólo ticket,
//  título y párrafo de apoyo, con la galería rolleando sola. El carril de
//  hotelería ("¿Tenés un alojamiento...") se sacó entero de acá: esa
//  propuesta ahora ES HeroCoupons.
//  2026-08-09: se probaron, en orden, un barrido diagonal (CurtainReveal,
//  después clip-path acá mismo), un panel primary que subía tapando todo, y
//  una galería que se corría a la derecha con translate3d (se veía
//  horizontal en vez de diagonal, por más que compusiera con la rotación de
//  la galería). Ninguno de los tres dio buen resultado y se sacaron enteros
//  —también el número de cupones, ver punto 6 más arriba, y la pregunta
//  para hotelería/agencias que este tramo llegó a mostrar centrada: quedaba
//  duplicada con la MISMA pregunta que ya hace su propio wipe-reveal en
//  HeroCoupons, el slide siguiente—. La versión actual (ver
//  pintarFadeGaleria() más abajo) hace que cada columna se desvanezca a
//  transparente con un mask-image que barre en el mismo ángulo que la
//  inclinación de la galería (FADE_ANGLE, ya se usaba para el fundido del
//  borde) —mismo mecanismo, sólo que animado por scroll—, las tres en
//  cascada, con el contenido de la izquierda disolviéndose a mitad de esa
//  animación. Atrás no queda un blanco "puesto": es el degradé de
//  .pv3-hero, que ya estaba ahí siempre.
//  2026-08-09 (tarde): lo de arriba —fundido de galería, categorías,
//  pregunta, panel— seguía atado 1:1 al scroll real, así que frenar a
//  mitad de cualquiera de esas animaciones dejaba una "instancia
//  intermedia" a la vista (cosas cargadas a la mitad, algunas ya
//  desaparecidas). Se reemplazó por POSTAS: sólo tres puntos de reposo
//  (fin de categorías / pregunta centrada / panel completo), el salto
//  entre uno y el siguiente lo hace una rampa por TIEMPO con el scroll
//  bloqueado de punta a punta —el scroll ya NO es la posición, sólo el
//  gatillo de "para qué lado". Ver el comentario grande junto a POSTAS,
//  en el useEffect principal, para el detalle.)
//  2026-08-09 (noche): dos ajustes sobre las postas de arriba, a pedido:
//  (1) la posta 1 (pregunta centrada) quedaba muy estática en el reposo —
//  la lluvia de cupones, que había arrancado a medio camino en la
//  transición, se congelaba del todo. Ahora sigue cayendo sola ahí, en
//  cámara lenta, hasta un tope bien por debajo de donde caen los cupones
//  grandes (ver IDLE_CAP/idleHc, junto a POSTAS) — nunca se ve el reparto
//  completo, sólo se sostiene con vida un rato antes de pausarse. (2) un
//  paginador de 3 circulitos arriba, uno por posta, que se apaga entero
//  al soltar el scroll de verdad hacia "Cuponeá antes de pagar" — y que
//  vuelve a engancharse (aterrizando siempre en la posta del panel, no
//  más atrás) si se scrollea hacia arriba desde ahí. Ver dotActivo y el
//  reingreso en el IntersectionObserver, al final del useEffect.
//  2026-08-09 (más tarde): la posta de la pregunta centrada y la del panel
//  se fusionaron en UNA sola —"tardamos mucho en llegar al resto del
//  sitio"—, así que POSTAS pasó de tres puntos de reposo a dos (bloque de
//  decisión asentado / panel completo) y el paginador de 3 circulitos a 2.
//  Con eso, IDLE_CAP/idleHc del punto anterior dejaron de tener sentido
//  —esa pieza sostenía viva la lluvia de cupones DURANTE el reposo de la
//  pregunta, que ya no existe como parada— y se sacaron enteras. La
//  pregunta ya no queda centrada esperando: se escribe alineada a la
//  izquierda (misma columna que .hc__eyebrow, ver hero-coupons.css) con
//  los cupones ya cayendo atrás, y al terminar de escribirse se
//  "desescribe" (el wipe cerrándose, no un fade) antes de que aparezca el
//  panel con la ceja de verdad —la misma frase, a su tamaño real—, todo
//  en una única transición continua sin parada en el medio. Ver
//  QUESTION_WIPE (ver más abajo, esa pieza se sacó entera después — ver la
//  nota de más tarde ese mismo día).
//  2026-08-09 (noche): se sacaron las categorías que caían sobre la
//  galería (CATEGORIAS) y la ceja de localidades bajo el ticket — ese
//  rubro ahora vive en una tercera línea del título, "en [rubro]", con el
//  rubro tipeándose y borrándose solo en bucle (mismo mecanismo de
//  clip-path que tenía la pregunta del segundo acto, pero por tiempo, no
//  por scroll — ver TICKER_PALABRAS/TickerPalabras). Orden al azar por
//  visita, con el mínimo de repetición posible: se baraja una vez al
//  montar y se recorre en ese orden fijo, así ninguna palabra puede
//  volver a salir antes de que salieran las otras ocho. Se sacó también
//  el AUTO_TOPE viejo (0.34, calzado al final de las categorías) — bajó a
//  0.24.
//  2026-08-10: la pregunta grande que se escribía/desescribía sola,
//  alineada a la izquierda, quedaba "sola, casi un segundo, en el medio"
//  de la transición fusionada — no agregaba nada que la ceja del panel
//  (mismo texto, ver .hc__eyebrow) no dijera ya. Se sacó entera: ahora los
//  cupones caen solos hasta que arranca el panel, sin texto de por medio.
//  QUESTION_WIPE/QUESTION_WIPE_OUT (couponRain.config.js) quedaron sin uso
//  acá —HeroCoupons.jsx, que ya estaba sin uso en la home, las sigue
//  teniendo importadas, con nombres viejos que ya ni existen; ver la nota
//  en ese archivo—. De paso, "Conocé el catálogo" pasó a decir "Regalá
//  pases" y ya no navega a otra vista: salta a este mismo panel (ver
//  irAPostaRef, el botón vive en el JSX más abajo).
//  2026-08-10 (más tarde): tres ajustes al primer slide, a pedido. (1) Se
//  sacó la mancha decorativa (sellote-10.svg, "ese fondo tipo splash de
//  abajo a la izquierda") entera — JSX, CSS y el pintarSellote() que la
//  animaba. (2) El pretítulo "¿Cuánto dura tu viaje?" se mudó de la
//  columna izquierda a ser el primer hijo de .pv3-cta-full, centrado
//  —ya no hace falta el cálculo de centrado vertical que tenía
//  (calcularDeltaCentrado(), también se sacó) porque ahora vive en flujo
//  normal adentro del bloque contra el que antes se centraba. (3) Debajo
//  del título se suman dos accesos directos —"Conocé todas las ofertas"
//  y "Pases de regalo"— ver .pv3-accesos en el JSX.
//
//  Estilos responsive inyectados inline (<style> local, clases .pv3-*).
// ============================================================

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ArrowLeft, ArrowDown, Gift, X, MapPin, ChevronDown } from 'lucide-react';
import Lenis from 'lenis';
import { SCROLL_SUAVE } from '../../lib/efectos';
import CouponRain from '../hero/CouponRain';
import PaSSMark from '../PaSSMark';
import CheckoutHoteleroView from '../../views/CheckoutHoteleroView';
import { COUPON_BASE_WIDTH } from '../hero/couponRain.config';
import { subProgress } from '../hero/useScrollProgress';
import { useLoading } from '../../lib/loading';
import { LOCALIDADES } from '../../lib/localidades';
import { DESTINOS } from '../hero/destinosRegalo';
import '../hero/hero-coupons.css';

// ─── Design tokens ───────────────────────────────────────────
const A = {
  primary:     '#475BE1',
  primaryDark: '#3347C8',
  // Mismo valor que el primarySoft de HomeView — es el azul clarito que ya
  // usa el resto del sitio para fondos sutiles, no un tono nuevo inventado
  // para el hover de los accesos.
  primarySoft: '#EEF0FD',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  line:        '#EEF0FD',
  font:        "'Inter', system-ui, sans-serif",
};

const NAURYZ = "'NauryzRedkeds', 'Inter', sans-serif";

// ─── Los dos pases ──────────────────────────────────────────
// `dias` es la clave real: es lo que se busca en la tabla `pases` al entrar al
// checkout, de donde sale el precio que se cobra. El precio de acá es sólo
// vidriera. `dias` en negrita + precio al lado: el botón dice la decisión
// completa, sin letra chica debajo.
// El dorado del moño de giftpass-logo.svg, sacado del propio SVG. Ya se usaba
// en la flecha del acceso "Pases de regalo" del slide 1; ahora también pinta el
// lockup GIft PaSS del panel, así el acceso y el destino comparten color.
const DORADO_GIFT = '#FFB94A';

// Las dos puertas del panel "Pases de regalo". La bifurcación no es de tamaño
// (uno o muchos pases) sino de PRODUCTO: una es una compra suelta y la otra es
// una suscripción mensual, y de ahí para adelante no se parecen en nada. Por eso
// es la primera pregunta del formulario y no un detalle a resolver después.
//
// Las tarjetas en sí (DESTINOS) se mudaron a hero/destinosRegalo.js: el panel
// de ofertas del socio abre el mismo drawer (ver PaseRegaloDrawer), y dos
// copias de esta lista se despegan al primer retoque de copy en una sola.

const PASES = [
  { id: 'x3', dias: 3, label: '3 días', precio: '$20.000' },
  { id: 'x7', dias: 7, label: '7 días', precio: '$35.000' },
];

// ─── Barra de scroll sutil (2026-08-11) ────────────────────────
// El panel embebido de Suscripción PRO scrollea con el overflow-y nativo de
// .gp-panel (ver hero-coupons.css), pero la barra del navegador —gris,
// cuadrada, ancha en algunos sistemas— desentona con el resto del diseño.
// Esta la reemplaza: una tira redondeada en primary, angosta, directamente
// sobre el blanco del panel (la nativa se oculta por CSS, ver .gp-panel).
//
// ARRIBA_PX es a propósito, no 0: "que comience a la altura de ¿Cómo
// funciona la suscripción?" — el logo GIFT PaSS PRO de más arriba es
// cabezal, no contenido que se recorre, así que no necesita indicador de
// scroll pegado al lado.
//
// Sin librería: track + thumb posicionados por número, recalculados por
// scroll (posición) y por ResizeObserver (tamaño — el contenido cambia de
// alto cuando terminan de cargar los planes, que son async, sin que dispare
// un scroll). Arrastrable: mousedown en el thumb + mousemove en window,
// mismo patrón que cualquier drag hecho a mano en este archivo.
const ARRIBA_SCROLLBAR_PX = 150;

function ScrollbarSutil({ objetivoRef }) {
  const [thumb, setThumb] = useState({ alto: 0, top: 0, visible: false });
  const arrastreRef = useRef(null);

  useEffect(() => {
    const el = objetivoRef.current;
    if (!el) return;

    const medir = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight <= clientHeight + 1) { setThumb(t => (t.visible ? { alto: 0, top: 0, visible: false } : t)); return; }
      const trackAlto = clientHeight - ARRIBA_SCROLLBAR_PX;
      const altoThumb = Math.max(28, (clientHeight / scrollHeight) * trackAlto);
      const recorrido = Math.max(0, trackAlto - altoThumb);
      const progreso = scrollTop / (scrollHeight - clientHeight);
      setThumb({ alto: altoThumb, top: progreso * recorrido, visible: true });
    };

    medir();
    el.addEventListener('scroll', medir, { passive: true });
    // El propio .gp-panel no cambia de tamaño (lo fija .gp-wrap--alto), pero
    // su CONTENIDO sí —los planes llegan async—, así que se observa el
    // primer hijo, no el panel.
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);

    return () => { el.removeEventListener('scroll', medir); ro.disconnect(); };
  }, [objetivoRef]);

  const onDragStart = (e) => {
    const el = objetivoRef.current;
    if (!el) return;
    e.preventDefault();
    arrastreRef.current = { y0: e.clientY, scrollTop0: el.scrollTop };
    const onMove = (ev) => {
      const a = arrastreRef.current;
      if (!a) return;
      const trackAlto = el.clientHeight - ARRIBA_SCROLLBAR_PX;
      const altoThumb = Math.max(28, (el.clientHeight / el.scrollHeight) * trackAlto);
      const recorrido = Math.max(1, trackAlto - altoThumb);
      const deltaScroll = ((ev.clientY - a.y0) / recorrido) * (el.scrollHeight - el.clientHeight);
      el.scrollTop = a.scrollTop0 + deltaScroll;
    };
    const onUp = () => {
      arrastreRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  if (!thumb.visible) return null;

  return (
    <div className="gp-scrollbar-track" aria-hidden="true">
      <div
        className="gp-scrollbar-thumb"
        style={{ height: thumb.alto, transform: `translateY(${thumb.top}px)` }}
        onMouseDown={onDragStart}
      />
    </div>
  );
}

// ─── Ticker de rubros, en el propio título ────────────────────
// (2026-08-09) Reemplaza a las palabras grandes que caían sobre la
// galería (CATEGORIAS, se sacó entera): ahora la última línea del título
// es "en [rubro]", con el rubro tipeándose y borrándose solo, en bucle —
// misma referencia visual que https://ticker-text.webflow.io/ (headline
// con una palabra final que rota). El orden es al azar por visita (se
// baraja una sola vez, al montar, ver TickerPalabras) — a pedido, no
// tiene que ser siempre el mismo recorrido.
const TICKER_PALABRAS = [
  'alojamiento', 'excursiones', 'gastronomía', 'compras',
  'masajes', 'aventuras', 'conciertos', 'salidas', 'teatro',
];

// Tipeo/borrado con el mismo mecanismo que ya usa la pregunta del segundo
// acto (pintarHC(), más abajo): un clip-path que revela de izquierda a
// derecha y, para "borrar", vuelve sobre sus pasos — ahí es progreso de
// scroll; acá es sólo tiempo, así que alcanza con un <span> cuyo clip-path
// anima por transition de CSS al alternar entre 0% y 100% — el navegador
// interpola solo, sin necesidad de pintar frame a frame como el resto del
// archivo (que sí lo necesita porque está atado al scroll, no al reloj).
function TickerPalabras({ reducedMotion }) {
  const [palabras] = useState(() => shuffle(TICKER_PALABRAS));
  const [idx, setIdx] = useState(0);
  const [tipeado, setTipeado] = useState(true);

  useEffect(() => {
    if (reducedMotion) return; // queda quieta en la primera palabra, ya tipeada
    let vivo = true;
    let timer;
    const TIPEAR_MS = 450; // calzado con la duración de la transition en CSS
    const SOSTENER_MS = 1500;
    const BORRAR_MS = 450;
    const paso = () => {
      timer = setTimeout(() => {
        if (!vivo) return;
        setTipeado(false); // arranca a "borrarse"
        timer = setTimeout(() => {
          if (!vivo) return;
          setIdx(i => (i + 1) % palabras.length);
          setTipeado(true); // la próxima entra tipeándose
          timer = setTimeout(paso, TIPEAR_MS);
        }, BORRAR_MS);
      }, SOSTENER_MS);
    };
    timer = setTimeout(paso, TIPEAR_MS); // deja terminar el primer tipeo antes de sostener
    return () => { vivo = false; clearTimeout(timer); };
  }, [palabras, reducedMotion]);

  return (
    <span className="pv3-ticker-word" style={{ clipPath: `inset(0 ${tipeado ? 0 : 100}% 0 0)` }}>
      {palabras[idx]}
    </span>
  );
}

// ─── Buscador de ubicación (2026-08-12) ────────────────────────
// Reemplaza a los dos accesos que vivían acá abajo del título ("Obtener
// pases diarios" / "Regalar pases", ver la nota junto a .pv3-gift-icon-btn
// más abajo para dónde se mudó el segundo). Arranca en Villa Gesell —sede
// del catálogo— y deja elegir cualquier otra de LOCALIDADES
// (lib/localidades.js, la misma lista que usan los filtros del resto del
// sitio) desde un desplegable simple. RADIO_KM es una constante y no
// todavía un control: el diseño lo muestra como dato fijo ("+20km
// alrededor"), no como un slider — si en algún momento se vuelve
// editable, este es el único lugar que hay que tocar.
const RADIO_KM = 20;

// Aire mínimo entre el desplegable y el borde de la ventana, y separación
// entre el botón y el desplegable. Los dos entran en la cuenta del alto
// disponible (ver medir()).
const MENU_AIRE = 16;
const MENU_GAP = 8;
// Debajo de esto no vale la pena abrir hacia abajo: si no entra ni un par de
// ítems, conviene abrir hacia arriba (ver medir()).
const MENU_ALTO_MIN = 160;

function BuscadorUbicacion() {
  const [localidad, setLocalidad] = useState('Villa Gesell');
  const [abierto, setAbierto] = useState(false);
  // Coordenadas del desplegable en el viewport — el menú va por portal a
  // <body> (ver abajo), así que no las hereda de nadie: se miden a mano.
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);

  // Medir contra el viewport: dónde arranca el menú y CUÁNTO ALTO tiene
  // permitido. El alto no es una constante a ojo — es lo que queda hasta el
  // borde de la ventana, así que la lista nunca se desborda de la pantalla
  // (se pedía: "la lista es tan grande que queda por debajo de la sección
  // Cuponeá"). Lo que no entra se scrollea adentro (overflow-y en
  // .pv3-buscador-menu). Si abajo no queda casi nada y arriba hay más, se
  // abre hacia arriba en vez de achicarse a una franja inútil.
  const medir = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // Si el botón se fue de pantalla (scroll largo con el menú abierto), el
    // desplegable queda colgado de la nada: se cierra en vez de seguir
    // flotando pegado a un ancla que ya no se ve.
    if (r.bottom < 0 || r.top > window.innerHeight) { setAbierto(false); return; }
    const abajo  = window.innerHeight - r.bottom - MENU_GAP - MENU_AIRE;
    const arriba = r.top - MENU_GAP - MENU_AIRE;
    const haciaArriba = abajo < MENU_ALTO_MIN && arriba > abajo;
    setPos({
      left: r.left,
      width: r.width,
      haciaArriba,
      top:    haciaArriba ? undefined : r.bottom + MENU_GAP,
      bottom: haciaArriba ? window.innerHeight - r.top + MENU_GAP : undefined,
      maxHeight: Math.max(MENU_ALTO_MIN, haciaArriba ? arriba : abajo),
    });
  }, []);

  // Medir ANTES de pintar (useLayoutEffect, no useEffect): con el menú ya en
  // el DOM pero sin posición, un frame intermedio lo mostraría pegado a la
  // esquina superior izquierda de la página.
  useLayoutEffect(() => {
    if (abierto) medir();
  }, [abierto, medir]);

  // Cerrar al clickear afuera o con Escape — mismo patrón que cualquier
  // desplegable liviano hecho a mano en este archivo (ver onDragStart de
  // ScrollbarSutil para el mismo criterio de listeners en window/document).
  // El menú ya no está adentro de wrapRef (vive en <body>), así que "afuera"
  // se pregunta contra los dos nodos: si no, el mousedown sobre un ítem lo
  // desmontaría antes de que llegue su click y no se podría elegir nada.
  //
  // Reposicionar en scroll y resize: position:fixed no acompaña al botón
  // cuando la página se mueve. Va en captura porque el scroll de un
  // contenedor interno no burbujea, y passive porque sólo lee.
  useEffect(() => {
    if (!abierto) return;
    const onFuera = (e) => {
      if (wrapRef.current?.contains(e.target)) return;
      if (menuRef.current?.contains(e.target)) return;
      setAbierto(false);
    };
    const onEsc = (e) => { if (e.key === 'Escape') setAbierto(false); };
    document.addEventListener('mousedown', onFuera);
    document.addEventListener('keydown', onEsc);
    window.addEventListener('scroll', medir, { capture: true, passive: true });
    window.addEventListener('resize', medir);
    return () => {
      document.removeEventListener('mousedown', onFuera);
      document.removeEventListener('keydown', onEsc);
      window.removeEventListener('scroll', medir, { capture: true });
      window.removeEventListener('resize', medir);
    };
  }, [abierto, medir]);

  return (
    <div className="pv3-buscador" ref={wrapRef}>
      <button
        type="button"
        className="pv3-buscador-btn"
        aria-expanded={abierto}
        aria-haspopup="listbox"
        onClick={() => setAbierto(a => !a)}
      >
        <MapPin size={18} strokeWidth={2.2} className="pv3-buscador-pin" aria-hidden="true" />
        <span className="pv3-buscador-localidad">{localidad}</span>
        <span className="pv3-buscador-radio">+{RADIO_KM}km alrededor</span>
        <ChevronDown size={16} strokeWidth={2.2} className="pv3-buscador-chevron" aria-hidden="true" />
      </button>
      {/* Portal a <body>, no hijo del botón (2026-08-12): dentro del hero el
          desplegable NO puede quedar por encima de todo, por más z-index que
          se le ponga. La <section> del hero lleva zIndex:0 inline y
          position:relative, o sea que es la raíz de su propio stacking
          context, y la sección siguiente ("Cuponeá", HomeView) es
          position:relative con zIndex:1 — todo el hero pinta por debajo de
          ella como bloque, y eso es a propósito (ver la nota en HomeView,
          tapa las imágenes de la galería). El z-index de acá adentro sólo
          ordenaba contra los hermanos del hero, nunca contra esa sección.
          Colgado de <body> el menú queda fuera de esa trampa y su z-index es
          absoluto. Los estilos siguen viniendo del <style> de este archivo,
          que es global (no scopeado). */}
      {abierto && pos && createPortal(
        <div
          ref={menuRef}
          className="pv3-buscador-menu"
          role="listbox"
          /* Lenis (scroll suave global, ver useLenisSmoothScroll.js)
             intercepta la rueda y mueve la página aunque el cursor esté
             sobre un contenedor scrolleable: allowNestedScroll está apagado
             salvo con la página bloqueada. data-lenis-prevent le dice que no
             toque los wheel de acá adentro y los deje al scroll nativo —para
             una lista de seis ítems no hace falta la instancia propia con
             inercia que sí tiene .gp-panel (ver el useEffect de
             lenisPanelRef). */
          data-lenis-prevent
          style={{
            left: pos.left, width: pos.width,
            top: pos.top, bottom: pos.bottom,
            maxHeight: pos.maxHeight,
          }}
        >
          {LOCALIDADES.map(loc => (
            <button
              key={loc}
              type="button"
              role="option"
              aria-selected={loc === localidad}
              className={`pv3-buscador-item${loc === localidad ? ' pv3-buscador-item--activa' : ''}`}
              onClick={() => { setLocalidad(loc); setAbierto(false); }}
            >
              {loc}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

// ─── Panel "Pases de regalo" (ex-segundo acto) ─────────────────
// (2026-08-10) Dejó de ser una posta del scroll-jack — ver la nota fechada
// ese mismo día al principio del archivo. Ahora es un panel propio que se
// abre al clickear el acceso "Pases de regalo" (ver .pv3-acceso--regalo en
// el JSX) y se anima por TIEMPO, no por progreso de pin — mismas ventanas
// que antes (PANEL_G1/G2/G3), reescaladas a la duración fija de esa rampa
// (ver el useEffect que la corre, más abajo). El logo+ceja+título entran
// juntos, subtítulo después, botón al final — mismo criterio en cascada.
const PANEL_G1 = [0.05, 0.45];
const PANEL_G2 = [0.35, 0.75];
const PANEL_G3 = [0.65, 1];

// ─── EX-PRUEBA: hero "pineado" con scroll-jack (revertida) ────
// Entre el 2026-08-04 y el 2026-08-10 el hero vivió pineado: position:sticky
// + un scroll-jack por "postas" (rampas por tiempo, scroll bloqueado) que en
// distintas vueltas llegó a alojar un reveal escalonado del bloque de
// decisión, la galería desvaneciéndose en tres pasos, y hasta el acto
// completo de HeroCoupons (pregunta grande, panel de suscripción, lluvia de
// cupones) fusionado adentro. Se revirtió entera el 2026-08-10: hacía un
// "salto" perceptible al scrollear —el instante en que se soltaba el pin y
// la página seguía desde otro punto— que no se pudo afinar. El hero volvió a
// vivir en flujo normal con scroll nativo del navegador (ver el useEffect de
// drift de la galería, que es lo único que sigue siendo tiempo-driven). El
// panel "Pases de regalo" (antes HeroCoupons) tampoco es una posta del
// scroll: ver PANEL_G1/G2/G3 y la nota fechada 2026-08-10 al principio del
// archivo.

// ─── Galería derecha: masonry tipo Pinterest ─────────────────
// Pool = TODO lo que haya en src/assets/grilla-web, que son las versiones
// livianas (≤900px) de los originales de src/assets/grilla. Tirás una foto
// nueva en grilla/, corrés `npm run fotos` y la galería se actualiza sola, sin
// tocar código. Vite resuelve el glob en build — por eso las fotos viven en
// src/assets y no en public/ (ahí no hay glob posible), y de paso salen con
// hash y cacheo largo.
const GRILLA_MODULES = import.meta.glob(
  '../../assets/grilla-web/*.{jpg,jpeg,png,webp,avif}',
  { eager: true, query: '?url', import: 'default' },
);
const GRILLA_IMGS = Object.values(GRILLA_MODULES);
const foto = (nombre) => GRILLA_MODULES[`../../assets/grilla-web/${nombre}`];

// Orden = orden visual, izquierda a derecha. La primera entrada de cada
// array de acá es la columna nueva, a la izquierda de las dos que ya había.
const COL_ASPECT = [
  [1.25, 1.50, 1.33, 1.25],
  [1.33, 1.50, 1.25, 1.50],
  [1.50, 1.33, 1.50, 1.25],
];
const COL_META = [
  { speed: 0.65, dir: 'down', opacity: 0.7 }, // nueva: más lenta que le vecina y atenuada
  { speed: 0.55, dir: 'up' },
  { speed: 0.8,  dir: 'down' },
];
const NUM_COLS = COL_META.length;
const BUFFER = 220;
const TILT = -10;
const OVERHANG = Math.ceil(460 * Math.abs(Math.sin((TILT * Math.PI) / 180)));
const FADE_ANGLE = 90 + TILT;
const FADE_START = 20;
const FADE = 100;

const CAPAS = {
  lejos: { opacity: 0.65, shadow: '0 10px 26px -24px rgba(11,16,32,0.22)' },
  medio: { opacity: 0.75, shadow: '0 18px 38px -30px rgba(11,16,32,0.26)' },
  cerca: { opacity: 0.85, shadow: '0 22px 44px -28px rgba(11,16,32,0.34)' },
};
const PESOS_CAPA = [
  ['medio', 'cerca', 'cerca', 'medio', 'lejos'],
  ['lejos', 'lejos', 'medio', 'medio', 'cerca'],
  ['cerca', 'cerca', 'medio', 'medio', 'lejos'],
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildColumns() {
  const imgs = shuffle(GRILLA_IMGS);
  const cols = Array.from({ length: NUM_COLS }, () => []);
  imgs.forEach((src, i) => {
    const ci = i % NUM_COLS;
    const pesos = PESOS_CAPA[ci];
    cols[ci].push({ src, capa: pesos[Math.floor(Math.random() * pesos.length)] });
  });
  return cols;
}

const MOBILE_DECO = [
  { src: foto('mar3.jpg'),  style: { top: -6, left: -6, width: 120, height: 140 }, radius: '0 0 40px 26px' },
  { src: foto('kite.jpeg'), style: { top: -6, right: -6, width: 110, height: 128 }, radius: '0 0 26px 40px' },
].filter(d => d.src);

// `onSuscripcionLista` (2026-08-11): lo que hace HomeView→App.jsx cuando
// CheckoutHoteleroView embebido termina el alta (equivalente al `onListo`
// que recibe la vista completa en App.jsx) — refresca sesión/perfil y manda
// al panel. Vive en App.jsx porque ahí están `setSession`/`setPerfil`, que
// HeroPase no tiene ni debería tener.
export default function HeroPase({ onComprarPase, onSuscripcionLista }) {
  const [cols] = useState(buildColumns);
  const heroRef = useRef(null);
  // .pv3-cta-full ("¿Cuánto dura tu viaje?") — ver el useEffect de
  // ctaFullAsentada, más abajo, para el porqué de este ref.
  const ctaFullRef = useRef(null);
  const colRefs = useRef([]);
  const colWrapRefs = useRef([]);
  const halfHeights = useRef([]);
  // Panel "Pases de regalo" (ex-segundo acto/HeroCoupons, ver PANEL_G1/G2/G3
  // arriba del componente): opacity/transform por JS igual que el resto del
  // archivo, en tres grupos que entran en cascada — cabezal / opciones /
  // botón. La lluvia de cupones ya no depende de acá: se anima sola, adentro
  // de CouponRain (2026-08-11). Era la única excepción del archivo, un
  // useState escrito en cada frame, y dejó de ser sostenible al pasar la
  // caída a 22 segundos.
  const hcG1Ref = useRef(null);
  const hcG2Ref = useRef(null);
  const hcG3Ref = useRef(null);
  // El .gp-panel de la suscripción PRO embebida — lo necesita ScrollbarSutil
  // (ver arriba del componente) para leer/mover su scroll.
  const panelEmbebidoRef = useRef(null);
  // Leído una sola vez (lazy initializer): CouponRain lo necesita como prop
  // en el render, no dentro del useEffect de más abajo — el resto del
  // archivo sí lo recalcula ahí porque no le hace falta en JSX.
  const [reducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  // Panel "Pases de regalo" (2026-08-10): ya no es una posta del scroll —ver
  // la nota fechada ese día al principio del archivo—, es un slide propio
  // que se abre con el acceso del mismo nombre (ver .pv3-acceso--regalo) y
  // se cierra con el botón de volver o Escape (ver los useEffect de más
  // abajo). regaloAbiertoRef espeja el estado para el useEffect grande —sus
  // listeners de wheel/keydown viven en closures armadas una sola vez y
  // necesitan leer el valor VIVO, no el que tenían capturado al armarse.
  const [regaloAbierto, setRegaloAbierto] = useState(false);
  const regaloAbiertoRef = useRef(false);
  useEffect(() => { regaloAbiertoRef.current = regaloAbierto; }, [regaloAbierto]);
  // Paso 1 de "Pases de regalo" (2026-08-11): clickear el acceso ya no salta
  // directo al slide completo (regaloAbierto) — primero dissuelve el bloque
  // "¿Cuánto dura tu viaje?" y abre el drawer GIFT PaSS desde la derecha
  // (ver .pv3-gift-drawer). Elegir una de sus dos opciones es lo que
  // recién ahí dispara regaloAbierto, el slide grande que ya existía. Viven
  // separados porque son dos preguntas distintas: "¿mostrar la caja?" vs
  // "¿correr toda la pantalla?" — regaloAbierto puede estar en true con
  // giftAbierto en true (van juntos en el camino normal), pero no al revés.
  const [giftAbierto, setGiftAbierto] = useState(false);

  // Qué camino se eligió en el paso 1/2 (persona/empresa/null). Decide qué
  // muestra el sidebar del paso 2, sobre los cupones — ver .pv3-hc-stage,
  // más abajo.
  const [destinoElegido, setDestinoElegido] = useState(null);

  // Cerrar el paso 2 sin que el contenido "salte" (2026-08-12, bug
  // reportado: "sigue desapareciendo de golpe"). .pv3-hc-stage no oculta
  // NI desmonta su contenido al instante — es un slide de .65s
  // (translateX 100%→0 y viceversa, ver la transition en el <style>)—, pero
  // destinoElegido sí cambiaba en el mismo tick que regaloAbierto: la rama
  // que arma el JSX (ver más abajo, el ternario destinoElegido==='empresa')
  // pasaba de mostrar el checkout embebido a mostrar la caja "elegí una
  // opción" ANTES de que el panel terminara de deslizarse afuera, así que
  // el contenido se veía cambiar de golpe a mitad de la animación en vez de
  // acompañarla. Ahora regaloAbierto se apaga ya (dispara el slide) y
  // destinoElegido recién se limpia cuando el slide ya terminó — durante
  // esos .65s el panel sigue mostrando lo mismo que se estaba viendo,
  // deslizándose entero, sin pisar su propio contenido en el camino.
  const PASO2_SLIDE_MS = 650;
  const cerrarPaso2 = () => {
    setRegaloAbierto(false);
    window.setTimeout(() => setDestinoElegido(null), PASO2_SLIDE_MS);
  };

  // Fija la navbar mientras dura la suscripción PRO embebida (2026-08-11):
  // es un alta larga, con su propio scroll adentro del sidebar — el vaivén
  // normal de la navbar en la home (aparece/desaparece con el scroll) no
  // tiene sentido ahí, se siente como perder el ancla a mitad del formulario.
  // Evento en window, mismo patrón que cuponear:navbar-reveal: Navbar no es
  // hijo de HeroPase, así que no hay prop que los una sin subir el estado
  // hasta App.jsx.
  useEffect(() => {
    if (destinoElegido !== 'empresa') return;
    window.dispatchEvent(new Event('cuponear:navbar-pin'));
    return () => window.dispatchEvent(new Event('cuponear:navbar-unpin'));
  }, [destinoElegido]);

  // Disparado por el ícono de gift pass, junto a "¿Más días?" (2026-08-12,
  // reemplaza al acceso "Regalar pases" que vivía bajo el título — ver la
  // nota junto a .pv3-gift-icon-btn en el <style>). Misma lógica que tenía
  // ese botón, sólo que ahora en un único lugar: en desktop abre el PASO 1
  // (el drawer GIFT PaSS, ver .pv3-gift-drawer) — elegir una opción adentro
  // es lo que recién dispara elegirDestino/regaloAbierto. En mobile/
  // reduced-motion se salta ese paso intermedio (un drawer sobre un ancho ya
  // angosto no suma nada) y va directo a regaloAbierto, trayendo el panel
  // (siempre visible en flujo normal ahí) a pantalla con scroll suave.
  const abrirRegalo = () => {
    const activo = (window.matchMedia?.('(min-width: 1181px)').matches ?? false) && !reducedMotion;
    if (activo) {
      setGiftAbierto(true);
    } else {
      setRegaloAbierto(true);
      document.querySelector('.gp-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Elegir un destino dispara el slide grande —lo que "empuja" el
  // contenedor blanco a su lugar final, sobre los cupones, del lado
  // izquierdo. Un solo lugar para esto: lo usan tanto el botón de la caja
  // del paso 1 (sobre la galería) como el de la caja del paso 2 (sobre los
  // cupones, sólo mientras no hay destino elegido todavía) — ver
  // renderOpcionesDestino, más abajo.
  //
  // 'empresa' YA NO NAVEGA (2026-08-11): antes las dos opciones abrían el
  // slide como flourish y a los 420ms saltaban a una vista aparte
  // (checkout-hotelero / checkout-pase). Ahora "empresa" se queda en la
  // home: el sidebar pasa a mostrar CheckoutHoteleroView embebido, con los
  // cupones todavía cayendo detrás — es EL contenido, no un adelanto de él.
  // 'persona' sigue como estaba (navega a checkout-pase con el mismo delay
  // de siempre): ese camino no se tocó en esta vuelta.
  const elegirDestino = (id) => {
    setRegaloAbierto(true);
    setDestinoElegido(id);
    if (id !== 'empresa') {
      window.setTimeout(() => { onComprarPase?.(); }, 420);
    }
  };

  // Las dos tarjetas de DESTINOS, en un solo lugar para no mantener el mismo
  // .map() duplicado en el paso 1 y en el paso 2 (ver los dos usos, más
  // abajo). `refs`, si se pasa, engancha cada botón a su grupo de la cascada
  // de entrada del paso 2 (hcG2Ref/hcG3Ref) — el paso 1 no la necesita: entra
  // como bloque único, por CSS (ver .pv3-gift-drawer).
  const renderOpcionesDestino = (refs) => DESTINOS.map((d, i) => (
    <button
      key={d.id}
      type="button"
      ref={refs ? refs[i] : undefined}
      style={refs ? { opacity: 0 } : undefined}
      className="gp-opcion"
      onClick={() => elegirDestino(d.id)}
    >
      <img className="gp-opcion-icono" src={d.icono} alt="" aria-hidden="true" />
      <span className="gp-opcion-texto">
        <span className="gp-opcion-fila">
          <span className="gp-opcion-titulo">{d.titulo}</span>
          {d.tag && (
            <span className="gp-opcion-tag" style={{ background: d.tagColor }}>{d.tag}</span>
          )}
        </span>
        {d.quien && <span className="gp-opcion-quien">{d.quien}</span>}
        <span className="gp-opcion-detalle">{d.detalle}</span>
      </span>
      {/* La flecha es lo que dice que la tarjeta ES el botón. Sin ella, dos
          recuadros apilados con borde se leen como campos a marcar, que es
          justo lo que dejaron de ser. */}
      <span className="gp-opcion-flecha" aria-hidden="true">
        <ArrowRight size={20} strokeWidth={2.5} />
      </span>
    </button>
  ));
  const { showLoading, hideLoading } = useLoading();
  // Gatea la animación de entrada (ver .pv3-listo en el <style>) y el
  // arranque del auto-reveal (ver el useEffect de más abajo): arranca en
  // false, pasa a true cuando terminó de cargar el primer lote de fotos de
  // la galería (o al toque, si prefers-reduced-motion). Mientras tanto la
  // pantalla de carga general (loading-casa.webm, ver src/lib/loading.jsx)
  // puede estar tapando todo — "de ser necesario": si las fotos ya están en
  // caché, showLoading()/hideLoading() se llaman tan rápido que nunca llega
  // a pintarse un frame con el loader visible.
  const [listo, setListo] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) return; // ya arrancó en listo=true, ver arriba
    // Primeras N fotos de cada columna (las que realmente importan para el
    // primer frame — el resto usa loading="lazy" y entra cuando haga falta,
    // ver el JSX de la galería) con loading="eager" (también en el JSX).
    // Esperar a TODAS las fotos —incluida la lista duplicada para el loop
    // infinito— tardaría de más sin sumar nada visible.
    const N = 4;
    const nodos = colWrapRefs.current
      .flatMap(col => col ? Array.from(col.querySelectorAll('img')).slice(0, N) : []);
    if (nodos.length === 0) { setListo(true); return; }
    showLoading();
    let restantes = nodos.length;
    let terminado = false;
    const terminar = () => { if (terminado) return; terminado = true; hideLoading(); setListo(true); };
    const listo1 = () => { restantes -= 1; if (restantes <= 0) terminar(); };
    nodos.forEach(img => {
      if (img.complete) listo1();
      else { img.addEventListener('load', listo1, { once: true }); img.addEventListener('error', listo1, { once: true }); }
    });
    // Colchón de seguridad: si por lo que sea alguna imagen nunca dispara
    // load/error (conexión rara, etc.), no se puede quedar el loading
    // general trabado para siempre.
    const tope = setTimeout(terminar, 4000);
    // showLoading() sólo tiene UN hideLoading() que lo compensa en todo el
    // ciclo de vida de este efecto — si se desmonta antes de terminar (p.ej.
    // en dev, React StrictMode corre este efecto dos veces: monta, limpia,
    // vuelve a montar) hay que cerrarlo acá en la limpieza, si no
    // showLoading() quedó contado de más y el loading general no se apaga
    // nunca más (LoadingContext es un contador, no un booleano).
    return () => { clearTimeout(tope); nodos.forEach(img => { img.removeEventListener('load', listo1); img.removeEventListener('error', listo1); }); terminar(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Antes: las columnas corrían solas (CSS animation, linear infinite) y por
  // encima se sumaba un parallax atado al scroll. Resultado: ruido — la
  // galería se movía todo el tiempo, incluso quieto el usuario.
  //
  // Ahora todo el movimiento sale de una sola fuente de TIEMPO (ver
  // pasoContinuo, más abajo) — nunca de window.scrollY. Cada columna recorre su
  // lista duplicada de fotos (para loop sin costura) a una velocidad propia
  // (COL_META.speed) y en su sentido (up/down), usando módulo sobre la mitad
  // real de su alto para el wrap — así el salto de vuelta al principio cae
  // justo donde la duplicación hace que sea invisible.
  //
  // Tampoco pasa por estado de React (mismo motivo de siempre: un setState
  // por frame re-renderiza toda la sección). El rAF escribe el transform
  // directo en el DOM, y con el hero fuera de vista se corta todo: ni se
  // agendan los frames.
  // ─── Galería derecha: drift automático ─────────────────────────────
  // (2026-08-10) Hasta acá este mismo efecto también manejaba un scroll-jack
  // completo del hero —pin con position:sticky, "postas" de reposo, rampas
  // por tiempo con el scroll bloqueado (wheel/keydown interceptados) para
  // revelar el bloque de decisión y, más tarde, ceder paso al panel "Pases
  // de regalo"—. Se probó en varias vueltas (ver "EX-PRUEBA", el historial
  // largo junto a PANEL_G1/G2/G3, arriba del componente) pero terminó
  // generando un "salto" perceptible al scrollear —el momento en
  // que se soltaba el scroll real y la página seguía desde otro punto— que
  // no se pudo afinar del todo. Se revirtió entero: el hero vuelve a vivir
  // en flujo normal, con scroll nativo del navegador de punta a punta. Lo
  // único que sigue siendo tiempo-driven (nunca scroll-driven) es el drift
  // de fondo de la galería, que no tiene nada que ver con el pin — corría
  // solo desde antes de que existiera, y sigue corriendo solo ahora.
  // Apagar la animación de entrada de cada columna en cuanto termina — ver
  // .pv3-col--fin en el <style>: lo que se va con ella es el filter:blur(0)
  // que el fill-mode dejaba congelado encima de la galería que driftea.
  useEffect(() => {
    if (!listo) return;
    const nodos = colWrapRefs.current.filter(Boolean);
    const fin = e => { if (e.animationName === 'pv3ColIn') e.currentTarget.classList.add('pv3-col--fin'); };
    nodos.forEach(n => n.addEventListener('animationend', fin));
    return () => nodos.forEach(n => n.removeEventListener('animationend', fin));
  }, [listo]);

  // .pv3-cta-full ("¿Cuánto dura tu viaje?") — mismo problema y misma
  // solución que .pv3-col--fin, arriba (2026-08-12, bug reportado: al
  // cerrar "Regalá cuponeras" el bloque desaparecía y volvía a aparecer en
  // vez de sólo des-blurear/re-saturar suave). .pv3-listo .pv3-cta-full
  // tiene una animación de entrada con fill-mode:both que sostiene su
  // opacity:1 para siempre — pero SOSTENER no es lo mismo que "la
  // animación ya terminó": mientras el navegador sigue considerando el
  // animation-name activo, cualquier toggle que necesitara poner
  // animation:none (como hacía antes .pv3-gift-abierto .pv3-cta-full) y
  // volver a sacarlo reinicia la animación de cero —fade-in-up desde
  // opacity:0 otra vez—, que es exactamente el "desaparece y reaparece"
  // reportado. Marcar la clase acá, al terminar de verdad, deja
  // animation:none clavado para siempre y opacity:1 puesto por una regla
  // común (no por el fill-mode): a partir de ahí, blurear/desblurear es
  // sólo un transition de filter, sin animación de por medio que se pueda
  // reiniciar.
  useEffect(() => {
    if (!listo) return;
    const el = ctaFullRef.current;
    if (!el) return;
    const fin = e => { if (e.animationName === 'pv3FadeUp') el.classList.add('pv3-cta-full--asentada'); };
    el.addEventListener('animationend', fin);
    return () => el.removeEventListener('animationend', fin);
  }, [listo]);

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const medirAltos = () => {
      colRefs.current.forEach((nodo, i) => {
        if (nodo) halfHeights.current[i] = nodo.scrollHeight / 2;
      });
    };

    // Posición ACUMULADA por columna, no recalculada desde un reloj
    // absoluto (2026-08-12, corrige un bug real: "las tiras de la galería
    // hacen un salto de golpe, como si volvieran a empezar"). La versión
    // vieja calculaba `(driftAuto * speed) % half` desde cero en CADA
    // frame, con driftAuto como un reloj que sólo crece. Se probó en el
    // navegador que la vuelta EN SÍ es perfecta —trasladar exactamente
    // "half" px muestra el pixel exacto de vuelta al principio, se
    // comparó captura contra captura—, así que el salto no viene de ahí.
    // Viene de que "half" no es constante para siempre: cambia cada vez
    // que medirAltos() se vuelve a llamar (resize de ventana; o el
    // ResizeObserver de acá abajo, que corrige "half" si el contenido
    // cambia de alto por cualquier motivo). Con la fórmula vieja, ese
    // cambio de "half" hace que el resultado del módulo salte a un punto
    // del ciclo SIN NINGUNA relación con el frame anterior —ahí está el
    // "como si volviera a empezar"—, aunque el cambio real de altura haya
    // sido mínimo.
    // La solución: cada frame SUMA su propio avance a un acumulador por
    // columna, y el módulo se aplica sobre ESE acumulador, no sobre un
    // reloj absoluto. Si "half" cambia entre un frame y el siguiente, el
    // acumulador sigue exactamente donde estaba — no hay nada que saltar;
    // sólo cambia, de ahí en más, el punto en el que la próxima vuelta
    // ocurre.
    const recorridos = [0, 0, 0];
    const pintarColumnas = (avancePx) => {
      colRefs.current.forEach((nodo, i) => {
        const half = halfHeights.current[i];
        if (!nodo || !half) return;
        const { speed, dir } = COL_META[i];
        recorridos[i] = (recorridos[i] + avancePx * speed) % half;
        const offset = dir === 'up' ? -recorridos[i] : -(half - recorridos[i]);
        nodo.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    };

    medirAltos();
    const onResize = () => medirAltos();
    window.addEventListener('resize', onResize);

    // Remedir también cuando cambia el ALTO del contenido, no sólo en
    // resize de ventana: aunque hoy cada celda mide su alto por
    // aspect-ratio (no depende de que la imagen haya cargado), cualquier
    // otro motivo de cambio de alto —una fuente que termina de aplicarse,
    // un ajuste futuro— deja "half" al día. Ya no hace falta que esto sea
    // "imperceptible" ni que pase temprano: con el acumulador de arriba,
    // un cambio de "half" en cualquier momento es seguro por diseño.
    const ro = new ResizeObserver(() => medirAltos());
    colRefs.current.forEach(n => { if (n) ro.observe(n); });

    if (reducedMotion) return () => { window.removeEventListener('resize', onResize); ro.disconnect(); };

    const AUTO_DRIFT_PX_POR_MS = 0.03; // ritmo del drift de fondo de la galería
    let ultimoTiempo = performance.now();
    let continuoId = 0;
    let visible = true;
    let scrolleando = 0; // id del timeout que reanuda al parar el scroll (ver más abajo)

    const pasoContinuo = (now) => {
      continuoId = 0;
      const dt = Math.min(now - ultimoTiempo, 100); // tope por si la pestaña estuvo en background
      ultimoTiempo = now;
      pintarColumnas(dt * AUTO_DRIFT_PX_POR_MS);
      if (visible && !scrolleando) continuoId = requestAnimationFrame(pasoContinuo);
    };

    // Arrancar de cero el reloj antes de reanudar: si no, el dt acumulado
    // durante la pausa se cobra entero en el primer frame y la galería pega un
    // salto proporcional a lo que estuvo quieta.
    const reanudar = () => {
      if (!visible || scrolleando || continuoId) return;
      ultimoTiempo = performance.now();
      continuoId = requestAnimationFrame(pasoContinuo);
    };
    continuoId = requestAnimationFrame(pasoContinuo);

    // ── Pausa mientras se scrollea ────────────────────────────────────
    // El drift es decorativo y lentísimo (0.03 px/ms): mientras la página se
    // mueve nadie lo está mirando, pero el navegador igual tiene que
    // recomponer la galería entera —enmascarada y rotada— en cada frame, y
    // esos son justo los frames en los que el compositor ya está ocupado
    // moviendo la página. De ahí la sensación de trabado al scrollear rápido
    // sobre el hero. Se congela durante el gesto y vuelve 180ms después de que
    // el scroll para; como no acumula tiempo mientras está en pausa, retoma
    // desde donde quedó, sin salto.
    const onScroll = () => {
      if (continuoId) { cancelAnimationFrame(continuoId); continuoId = 0; }
      clearTimeout(scrolleando);
      scrolleando = setTimeout(() => { scrolleando = 0; reanudar(); }, 180);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    // Pausa el rAF con la sección fuera de pantalla — sin esto seguía
    // gastando un frame entero por nada mientras el usuario ya estaba
    // scrolleado varias pantallas más abajo.
    const hero = heroRef.current;
    const obs = hero && new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      reanudar();
    }, { threshold: 0 });
    if (obs) obs.observe(hero);

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      clearTimeout(scrolleando);
      if (continuoId) cancelAnimationFrame(continuoId);
      if (obs) obs.disconnect();
      ro.disconnect();
    };
  }, [listo]); // se remide medirAltos() cuando las fotos ya cargaron y las columnas tienen su alto real

  // ─── Panel "Pases de regalo": entrada por tiempo, no por scroll ───
  // (2026-08-10) Reemplaza a pintarHC()/HC_START, que vivían adentro del
  // useEffect de arriba atados al progreso del pin — ver la nota fechada
  // ese día junto a POSTAS. Acá la única "posta" es el click: al abrirse,
  // corre una rampa de tiempo fijo (DUR) y los tres grupos del panel entran
  // en cascada, cada uno en su ventana de PANEL_G1/G2/G3 (arriba del
  // componente). La lluvia ya no cuelga de esta rampa: tiene la suya, diez
  // veces más larga, adentro de CouponRain.
  //
  // En mobile/reduced-motion (`activo` da false) no hay slide que animar
  // —.pv3-regalo-abierto no hace nada ahí, ver el <style>— y el panel debe
  // seguir SIEMPRE visible en flujo normal, como estaba antes de que esto
  // existiera: por eso, si no está activo, esto sólo limpia los inline
  // styles (opacity/transform/pointer-events a '') y deja que la única
  // regla de CSS que aplica ahí (ninguna, son valores por default) los
  // muestre servidos, sin importar regaloAbierto.
  useEffect(() => {
    const pinQuery = window.matchMedia?.('(min-width: 1181px)');
    const activo = () => !!(pinQuery?.matches) && !reducedMotion;
    const grupos = [hcG1Ref, hcG2Ref, hcG3Ref];
    let raf = 0;

    const limpiar = () => {
      grupos.forEach(r => {
        const el = r.current;
        if (el) { el.style.opacity = ''; el.style.transform = ''; el.style.pointerEvents = ''; }
      });
    };

    if (!activo()) { limpiar(); return; }

    if (!regaloAbierto) {
      grupos.forEach(r => {
        const el = r.current;
        if (el) { el.style.opacity = '0'; el.style.transform = 'translate3d(0, 18px, 0)'; el.style.pointerEvents = 'none'; }
      });
      return;
    }

    let vivo = true;
    const t0 = performance.now();
    const DUR = 2200;
    const paso = (now) => {
      const el = Math.min(1, (now - t0) / DUR);
      const eased = 1 - Math.pow(1 - el, 3); // ease-out cúbica, misma curva que la rampa de postas
      [[hcG1Ref, PANEL_G1], [hcG2Ref, PANEL_G2], [hcG3Ref, PANEL_G3]].forEach(([ref, ventana]) => {
        const g = ref.current;
        if (!g) return;
        const t = subProgress(eased, ventana);
        g.style.opacity = String(t);
        g.style.transform = `translate3d(0, ${((1 - t) * 18).toFixed(2)}px, 0)`;
        g.style.pointerEvents = t > 0.5 ? 'auto' : 'none';
      });
      if (el < 1 && vivo) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);

    // Salvavidas equivalente al onBreakpointChange() del useEffect de
    // arriba: si se achica a mobile con el panel ya abierto, se limpia solo
    // para no dejar los grupos en opacity intermedia clavada por inline.
    const onResize = () => { if (!activo()) { cancelAnimationFrame(raf); limpiar(); } };
    window.addEventListener('resize', onResize);

    return () => { vivo = false; cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [regaloAbierto, reducedMotion]);

  // Bloquea el scroll de la página mientras el panel está abierto —mismo
  // mecanismo que ya usan las postas (document.body.style.overflow), pero
  // en un efecto aparte porque este panel puede abrirse en cualquier
  // momento, no sólo durante el pin (piénsese en el reingreso, con el pin
  // ya suelto). Captura el valor previo en vez de asumir '': si el pin
  // seguía bloqueado (enPostas todavía true, reposo antes del primer
  // scroll) hay que devolvérselo tal cual al cerrar, no pisarlo con ''.
  //
  // Bloquea TAMBIÉN <html>, no sólo <body> (2026-08-11): el elemento que de
  // verdad scrollea la página es el que el navegador elija como
  // `document.scrollingElement` —casi siempre <html>—, y `overflow:hidden`
  // en <body> no se propaga ahí solo. Con sólo body bloqueado, la home
  // seguía scrolleando por detrás del panel: exactamente lo que se reportó.
  //
  // (2026-08-11 noche) Ese overflow:hidden seguía sin alcanzar: Lenis
  // (useLenisSmoothScroll.js, montado en App.jsx) mueve el scroll con JS
  // propio en cada frame de rueda, y asignar scrollTop por código no lo
  // frena el overflow:hidden — sólo bloquea el scroll nativo (rueda,
  // teclado, barra). Por eso se le avisa a Lenis por evento que se
  // detenga del todo mientras el panel está abierto (ver el detalle en
  // useLenisSmoothScroll.js) — el overflow:hidden de acá se deja igual,
  // como cinturón y tirantes para cualquier scroll nativo que no pase por
  // Lenis (p.ej. teclado con foco fuera del documento).
  // giftAbierto sumado a la condición (2026-08-12): el paso 1 pasó de
  // tarjeta flotando a drawer con scrim (ver .pv3-gift-drawer) — un drawer
  // que tapa media pantalla y todavía deja scrollear la home detrás no es
  // un drawer, mismo motivo por el que CarritoDrawer.jsx bloquea el body
  // mientras está abierto.
  useEffect(() => {
    if (!giftAbierto && !regaloAbierto) return;
    const html = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevHtml = html.style.overflow;
    document.body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    window.dispatchEvent(new Event('cuponear:scroll-lock'));
    return () => {
      document.body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
      window.dispatchEvent(new Event('cuponear:scroll-unlock'));
    };
  }, [giftAbierto, regaloAbierto]);

  // Lenis propio para el panel embebido de Suscripción PRO (2026-08-11,
  // segunda vuelta): con la página bloqueada (el useEffect de arriba) y
  // data-lenis-prevent en .gp-panel, la rueda sí scrolleaba el panel, pero
  // en seco —instantáneo, sin la inercia con aceleración/desaceleración que
  // tiene el resto del sitio—, que es justo lo que se pidió que tuviera
  // también acá adentro. La solución no es tocar la instancia global (esa
  // sigue apuntando a `window`, ver useLenisSmoothScroll.js): Lenis admite
  // una instancia por `wrapper`, así que esta es una instancia CHICA,
  // scopeada a .gp-panel, viva sólo mientras ese panel está montado
  // (destinoElegido === 'empresa', la única rama que lo renderiza).
  //
  // Sin `content` explícito: con un wrapper que no es `window`, Lenis mide
  // el scroll directo sobre `wrapper.scrollHeight` (ver Dimensions en
  // node_modules/lenis), así que no hace falta envolver el contenido en un
  // único hijo.
  //
  // Por qué no puede convivir con data-lenis-prevent en el mismo elemento
  // (por eso se sacó, ver la nota en el JSX): Lenis revisa esa marca al
  // principio de CUALQUIER instancia que procese el evento, incluida esta
  // misma — dejarla puesta apagaba a esta instancia sobre sí misma, no sólo
  // a la global. La instancia global igual no llega a pisarla: mientras el
  // panel tiene margen para scrollear, esta instancia local marca el evento
  // como consumido (`event.lenisStopPropagation`, mecanismo propio de
  // Lenis) y la global lo descarta al burbujear. Sólo en el borde exacto
  // (tope arriba/abajo) el evento sigue de largo hacia la global — que en
  // ese momento está `stop()`eada por el lock de arriba, así que no pasa
  // nada: ni un salto, ni scroll de la página por detrás.
  //
  // (2026-08-13) Sujeta al mismo interruptor que la global (SCROLL_SUAVE, ver
  // src/lib/efectos.js): apagada, el panel scrollea nativo por su propio
  // overflow-y:auto — pierde la inercia, no la capacidad de scrollear.
  useEffect(() => {
    if (!SCROLL_SUAVE) return;
    if (destinoElegido !== 'empresa') return;
    const el = panelEmbebidoRef.current;
    if (!el) return;
    const lenisPanel = new Lenis({ wrapper: el, autoRaf: true });
    return () => lenisPanel.destroy();
  }, [destinoElegido]);

  // Escape cierra un paso por vez — el mismo criterio que cualquier overlay
  // que tapa la pantalla, pero de a uno: si está el slide grande, lo cierra
  // (vuelve a la caja sobre la galería); si sólo está la caja, cierra la caja.
  useEffect(() => {
    if (!giftAbierto && !regaloAbierto) return;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (regaloAbierto) cerrarPaso2();
      else setGiftAbierto(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [giftAbierto, regaloAbierto]);

  // Logo de Cuponear en la navbar → cierra el overlay (2026-08-12): ver
  // cuponear:home-reset en Navbar.jsx — clickear el logo estando ya en home
  // con "Regalá cuponeras" abierto no navegaba a ningún lado (setView('home')
  // sobre un view que ya es 'home' no re-renderiza nada), así que el panel se
  // quedaba tapando la pantalla. Acá sí cierra los tres estados de un saque:
  // a diferencia de la flecha de "volver" (un paso atrás, ver
  // onVolverAlInicio más abajo), el logo es "llevame al principio de todo".
  // giftAbierto se apaga ya, sin esperar (a diferencia de destinoElegido,
  // vía cerrarPaso2): .pv3-gift-drawer ya está deslizado afuera de la
  // pantalla (translateX(105%)) todo este rato —mientras regaloAbierto es
  // true, ver esa regla en el <style>—, así que no hay nada que "salte" ahí.
  useEffect(() => {
    const onHomeReset = () => { cerrarPaso2(); setGiftAbierto(false); };
    window.addEventListener('cuponear:home-reset', onHomeReset);
    return () => window.removeEventListener('cuponear:home-reset', onHomeReset);
  }, []);

  return (
    <section ref={heroRef} className={`pv3-hero${listo ? ' pv3-listo' : ''}${giftAbierto ? ' pv3-gift-abierto' : ''}${regaloAbierto ? ' pv3-regalo-abierto' : ''}`} style={{ zIndex: 0, fontFamily: A.font, background: 'linear-gradient(180deg, #FFF7EB 0%, #FFFFFF 60%)' }}>

      {/* ─── Slide 1 (catálogo/decisión) ─────────────────────────
          (2026-08-10) Envuelve todo lo que antes era hijo directo de
          .pv3-hero —galería, columna izquierda, letra chica+botones— para
          poder correrlo entero fuera de pantalla cuando se abre "Pases de
          regalo" (ver .pv3-acceso--regalo, más abajo, y .pv3-hc-stage,
          el otro slide). Nueva capa de posicionamiento, pero mismo tamaño
          exacto que .pv3-hero (sin padding/margin propios): todo lo que
          adentro asumía "mi contenedor posicionado es .pv3-hero" —.pv3-
          galwin, .pv3-cta-full— sigue viendo la misma caja, sólo que ahora
          es .pv3-slide-catalogo quien la ofrece. */}
      <div className="pv3-slide-catalogo">

      {/* ─── Galería derecha: capa detrás, de techo a piso, sin huecos ───
          `pv3-galwin` es la ventana que recorta (al corte). Dentro, una capa
          más alta (colchón arriba/abajo) permite el parallax sin descubrir
          bordes. Cada columna llena SIEMPRE hasta abajo. */}
      <div className="pv3-galwin" aria-hidden="true">
        <div className="pv3-gallery">
          {cols.map((items, ci) => (
            // ref de wrapper: la usa el listener de animationend que apaga la
            // entrada al terminar (ver .pv3-col--fin en el <style>).
            // Las tres custom properties las consume la animación de entrada
            // (ver @keyframes pv3ColIn en el <style>): la opacidad de reposo
            // —que antes se escribía directo como `opacity` y la animación
            // habría pisado al terminar—, el sentido desde el que entra cada
            // columna (la misma dirección en la que después va a driftear,
            // así la entrada "arranca" el movimiento continuo en vez de
            // contradecirlo) y su lugar en la cascada.
            <div key={ci} className="pv3-col" ref={n => { colWrapRefs.current[ci] = n; }}
              style={{
                '--col-op': COL_META[ci].opacity ?? 1,
                '--col-from': COL_META[ci].dir === 'up' ? '90px' : '-90px',
                // String y no el número pelado: para las custom properties
                // React pasa el valor tal cual, pero dejarlo explícito evita
                // depender de esa regla — y el que lo lea en CSS es un calc().
                '--col-i': String(ci),
              }}>
              <div className="pv3-coldrift" ref={n => { colRefs.current[ci] = n; }}>
                {[...items, ...items].map((item, idx) => {
                  const capa = CAPAS[item.capa];
                  return (
                    <div key={`${ci}-${idx}`} className="pv3-cell"
                      style={{
                        aspectRatio: 1 / (COL_ASPECT[ci][(idx % items.length) % COL_ASPECT[ci].length]),
                        boxShadow: capa.shadow,
                      }}>
                      <img src={item.src} alt="" loading={idx < 4 ? 'eager' : 'lazy'} decoding="async" style={{ opacity: capa.opacity }}
                        onError={e => { const c = e.currentTarget.parentElement; if (c) c.style.display = 'none'; }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pv3-inner">
        <div className="pv3-left">

          {/* Este bloque llegó a tener una segunda variante de copy (la
              propuesta para alojamientos/agencias) apilada acá mismo, que
              entraba por cross-fade a medida que avanzaba el scroll pineado.
              Ese copy se mudó a su propia sección (HeroCoupons); lo que queda
              de la maquinaria —.pv3-left-stage/.pv3-left-var en
              position:absolute— sigue funcionando para esta única variante,
              sólo que ahora no tiene con qué cruzarse. El ticket-marca que
              vivía acá arriba (.pv3-logo-slot) se mudó a .pv3-cta-full, ver
              esa nota más abajo. */}
          <div className="pv3-left-stage">
            <div className="pv3-left-var">
              {/* 2 · Título. Sin cambios de copy en las dos primeras líneas: es
                     el activo de marca del hero. El casing de las palabras en
                     NauryzRedkeds va tal cual — mayúscula y minúscula son
                     glifos distintos. Tercera línea nueva (2026-08-09): "en
                     [rubro]", con el rubro tipeándose solo en bucle — ver
                     TickerPalabras arriba del componente. Reemplaza a la ceja
                     de localidades (se sacó) y a las categorías que caían
                     sobre la galería (también se sacaron). */}
              <h1 className="pv3-title">
                <span className="pv3-t-it">Viajá <span className="pv3-nauryz">CUPONEaNdO</span></span>
                <span className="pv3-t-bold">un pase, todos los descuentos</span>
                <span className="pv3-t-ticker">— en <TickerPalabras reducedMotion={reducedMotion} /></span>
              </h1>

              {/* Buscador de ubicación (2026-08-12) — reemplaza a los
                     accesos "Obtener pases diarios"/"Regalar pases" que
                     vivían acá (ver BuscadorUbicacion, arriba del
                     componente). "Obtener pases diarios" se sacó entero
                     —los botones de pase, un poco más abajo en
                     .pv3-cta-full, ya cubren esa acción—; "Regalar pases"
                     se mudó a un ícono solo, junto a "¿Más días?" (ver
                     .pv3-gift-icon-btn). "Conocé todas las ofertas" no
                     vive acá: es hermana directa de .pv3-left y
                     .pv3-cta-full más abajo en el JSX (ver esa nota, junto
                     a .pv3-acceso--ofertas). */}
              <div className="pv3-accesos">
                <BuscadorUbicacion />
              </div>
            </div>
          </div>
        </div>

        {/* Letra chica + botones — columna del medio de las tres que pide
            el boceto: (1) los accesos, arriba; (2) esto; (3) nada, el resto
            del ancho hasta la galería, que queda vacío a propósito ("en la
            derecha nada, pero ocuparía su ancho virtual"). Vive DENTRO de
            .pv3-inner, hermano de .pv3-left en el mismo flex row —así el
            propio flexbox la ubica después de la columna de accesos, sin
            estirarse a ocupar el resto (flex-basis fija, más abajo) y
            dejando esa tercera franja vacía sola, gratis—. Hasta el
            2026-08-10 vivía AFUERA de .pv3-inner, centrada contra la página
            entera con position:absolute: eso hacía que se superpusiera con
            la columna de accesos en viewports angostos ("las flechitas...
            quedaron tan lejos que se pisan con el título"). align-self:
            flex-end la asienta más abajo que .pv3-left (que sigue centrado
            por align-items en .pv3-inner), como pide el boceto. Ese mismo
            día, más tarde: el primer intento la corría con un margin-left
            fijo desde .pv3-left en vez de centrarla en el ancho libre — ver
            la nota junto a .pv3-cta-full en el <style> para el porqué del
            margin:0 auto que lo reemplazó. */}
        <div className="pv3-cta-full" ref={ctaFullRef}>
          {/* Ticket-marca (2026-08-12): se mudó acá arriba de "¿Cuánto dura
              tu viaje?" —antes vivía sobre el título principal, en
              .pv3-left-var, a pedido—. Ya no tiene su propia animación de
              entrada (la tenía porque ahí arriba el resto del bloque
              también entraba en cascada, uno por uno): acá adentro es el
              primer hijo de .pv3-cta-full, que ya fadea como un solo
              bloque, así que el ticket viaja con el resto sin necesitar
              nada propio. */}
          <div className="pv3-logo-slot">
            <img className="pv3-ticket" src="/cupon-pass.svg" alt="Cupon PASS" />
          </div>
          <p className="pv3-pretitulo">¿Cuánto dura tu viaje?</p>

          

          <div className="pv3-opciones">
            {/* .pv3-pases-par agrupa SÓLO los dos botones de pase, aparte de
                "¿Más días?" (2026-08-11): si los tres compartieran un mismo
                flex centrado, el ancho extra de "¿Más días?" corría el
                conjunto entero hacia la izquierda y el aire entre pase 3 y
                pase 7 —que tiene que quedar exactamente en el medio de la
                sección— se desviaba con él. Ahora .pv3-opciones-botones
                centra sólo el par (ese es el eje que importa), y "¿Más
                días?" cuelga afuera, a la derecha, sin pesar en ese cálculo
                —ver position:absolute en el <style>. */}
            <div className="pv3-opciones-botones">
              <div className="pv3-pases-par">
                {PASES.map(pase => (
                  <button key={pase.id} className="pv3-btn-pase"
                    onClick={() => onComprarPase?.(pase.dias)}
                    aria-label={`Comprar pase turista de ${pase.dias} días por ${pase.precio}`}>
                    <b>Pase {pase.label}</b>
                    <span className="pv3-btn-sep" aria-hidden="true" />
                    <span className="pv3-btn-precio">{pase.precio}</span>
                  </button>
                ))}
              </div>
              {/* .pv3-pases-extra agrupa "¿Más días?" y el ícono de gift
                  pass — ambos cuelgan afuera del centrado de
                  .pv3-pases-par (ver la nota de arriba), a su derecha, así
                  que los dos botones de pase siguen 100% centrados sin que
                  el ancho de ninguno de los dos pese en ese cálculo.
                  "¿Más días?" primero y el ícono después (2026-08-12, a
                  pedido; antes iba al revés). El ícono reemplaza al acceso
                  "Regalar pases" que vivía bajo el título (2026-08-12, ver
                  BuscadorUbicacion) — mismo destino (abrirRegalo, definido
                  arriba), sin texto: el regalito ya lo dice, como pasaba
                  antes con el ícono de Gift en ese acceso. Fondo blanco +
                  dorado (DORADO_GIFT, el mismo del moño de
                  giftpass-logo.svg) en vez del primary lleno de los pases:
                  es la puerta a OTRO producto, no otro pase. */}
              <div className="pv3-pases-extra">
                <button className="pv3-mas-dias" onClick={() => onComprarPase?.('custom')}>
                  ¿Más días?
                </button>
                {/* .pv3-gift-slot existe sólo para colgarle la iluminación
                    giratoria (ver el <style>): el halo va en un elemento
                    aparte, ANTES del botón en el DOM, así el botón lo tapa
                    por orden de pintado y sólo asoma el anillo. Adentro del
                    propio botón no se puede — un ::before con z-index:-1
                    pinta ENCIMA del fondo del elemento que lo contiene. */}
                <span className="pv3-gift-slot">
                  <span className="pv3-gift-glow" aria-hidden="true" />
                  <button
                    type="button"
                    className="pv3-gift-icon-btn"
                    aria-label="Regalar pases"
                    onClick={abrirRegalo}
                  >
                    <Gift size={24} strokeWidth={2.2} />
                  </button>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* "Conocé todas las ofertas" — standalone, no adentro de
            .pv3-accesos (2026-08-12, a pedido: "alineado a los CTA de
            pases, horizontalmente"). Antes vivía dentro de la columna de
            accesos, con un margin-top que la separaba del grupo de arriba
            pero sin relación real con .pv3-cta-full (otra columna del
            grid). Ahora es HERMANA directa de .pv3-left y .pv3-cta-full
            adentro de .pv3-inner, y usa el mismo truco que .pv3-cta-full
            para bajar (align-self:end) — grid-column:1 la superpone sobre
            la columna de .pv3-left en vez de cablear un cuarto hueco, así
            que su borde de abajo cae exactamente en la misma línea que los
            botones de pase (el padding-bottom de .pv3-inner, el ancla que
            usa .pv3-cta-full). justify-self:start la deja pegada a la
            izquierda, como el resto de los accesos. */}
        <button
          type="button"
          className="pv3-acceso pv3-acceso--ofertas"
          onClick={() => window.dispatchEvent(new CustomEvent('cuponear:scroll-to', { detail: { target: '[data-navbar-shrink]' } }))}
        >
          <span className="pv3-acceso-flecha" style={{ background: A.primary }} aria-hidden="true">
            <ArrowDown size={18} strokeWidth={2.5} />
          </span>
          <span className="pv3-acceso-titulo">Conocé todas las ofertas</span>
        </button>

        <div className="pv3-mobile-deco" aria-hidden="true">
          {MOBILE_DECO.map(s => (
            <div key={s.src} style={{ position: 'absolute', overflow: 'hidden', ...s.style, borderRadius: s.radius, opacity: 0.22 }}>
              <img src={s.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 3, height: 6, background: A.primary }} />
      </div>

      {/* ─── Paso 1: drawer GIFT PaSS, desde la derecha ────────────────
          (2026-08-11, drawer desde 2026-08-12 — antes flotaba sobre la
          galería, ver el historial de .pv3-gift-drawer más abajo). Clickear
          "Regalá pases" ya no salta directo al slide completo de más abajo
          (.pv3-hc-stage): primero dissuelve .pv3-cta-full ("¿Cuánto dura tu
          viaje?") y abre ESTE drawer, deslizando desde el borde derecho —
          mismo lenguaje que CarritoDrawer.jsx (scrim + panel fixed
          top:0/right:0/height:100vh + slide en vez de fade), el otro drawer
          que ya existe en la app.
          HERMANO de .pv3-slide-catalogo, NO hijo (2026-08-12): antes vivía
          adentro, para "viajar junto con todo lo demás" cuando arrancaba el
          slide grande — pero un position:fixed adentro de un ancestro con
          transform (.pv3-slide-catalogo, que trae `transform: translateX`
          para su propio slide) deja de posicionarse contra el VIEWPORT y
          pasa a posicionarse contra ESE ancestro — ver la nota del spec de
          CSS sobre "containing block" para elementos fixed bajo un
          transform. Sacándolo un nivel, position:fixed vuelve a anclar
          contra la ventana de verdad, que es lo que un drawer necesita.
          PORTAL a <body> (2026-08-13) — antes era hermano de
          .pv3-slide-catalogo acá adentro, y position:fixed le daba la
          geometría correcta (cubría el viewport entero, medido) pero NO el
          orden de pintado: la <section> del hero lleva zIndex:0 inline +
          position:relative, o sea que es la raíz de su propio stacking
          context, y ahí adentro el z-index 2000/2001 del drawer sólo ordena
          contra sus hermanos del hero. Contra el resto del sitio el hero
          entero pinta como UN bloque en z-index 0, así que lo tapaban las
          dos cosas que están por encima: la navbar (1000/1001) y la sección
          siguiente de la home ("Cuponeá", position:relative + zIndex:1) —
          con la página scrolleada esa sección se come la mitad de abajo del
          drawer, que era el síntoma de "el drawer pasa sólo en el área del
          hero". Es la MISMA trampa que ya tenía el desplegable de localidad
          y se resuelve igual: colgado de <body> el z-index vuelve a ser
          absoluto. De paso el backdrop-filter del scrim pasa a alcanzar al
          sitio entero y no sólo al hero (ver .pv3-gift-scrim).
          Las clases de estado van ACÁ y no en el ancestro: .pv3-gift-abierto
          /.pv3-regalo-abierto viven en .pv3-hero, y desde <body> ya no hay
          ancestro común del que colgarse. */}
      {createPortal(
        <>
      <div
        className={`pv3-gift-scrim${giftAbierto ? ' pv3-gift-scrim--visible' : ''}${regaloAbierto ? ' pv3-gift-scrim--saliendo' : ''}`}
        aria-hidden="true"
        onClick={() => setGiftAbierto(false)}
      />
      <div
        className={`pv3-gift-drawer${giftAbierto ? ' pv3-gift-drawer--abierto' : ''}${regaloAbierto ? ' pv3-gift-drawer--saliendo' : ''}`}
        aria-hidden={!giftAbierto || regaloAbierto}
      >
        <div className="gp-panel">
          <button type="button" className="gp-gift-cerrar" onClick={() => setGiftAbierto(false)} aria-label="Cerrar">
            <X size={18} strokeWidth={2.5} />
          </button>
          <div className="gp-cabezal">
            {/* size 26, no 30 (2026-08-12, a pedido): mismo tamaño que el
                logo GIFT PaSS PRO de la pantalla interna (ver ComoFunciona
                en CheckoutHoteleroView.jsx) — es la misma marca en dos
                pantallas del mismo flujo, no dos escalas sueltas. */}
            <h2 className="gp-titulo">
              <PaSSMark size={26} conPrefijo prefijo="GIft" color={DORADO_GIFT} />
            </h2>
            <p className="gp-bajada">
              Obsequiá pases con todos los descuentos de la red.
            </p>
          </div>
          <p className="gp-elegi">Elegí una opción:</p>
          <div className="gp-opciones">
            {renderOpcionesDestino()}
          </div>
        </div>
      </div>
        </>,
        document.body,
      )}

      {/* ─── Slide 2: "Pases de regalo" (ex-segundo acto/HeroCoupons) ───
          Hasta el 2026-08-10 esto era parte del mismo pin —una posta más,
          a la que se llegaba scrolleando (ver HC_START/pintarHC en el
          historial del useEffect)—. Ahora es un panel aparte que sólo se ve
          si se clickea "Pases de regalo" (ver .pv3-acceso--regalo, más
          arriba): entra con un slide desde la derecha (.pv3-regalo-abierto
          en el <style>, mismo timing que .pv3-slide-catalogo saliendo hacia
          la izquierda, así se sienten UN solo movimiento) y la lluvia de
          cupones + el panel (logo+ceja+título / subtítulo / botón, en
          cascada) se animan por TIEMPO, no por scroll — ver el useEffect
          dedicado, junto a hcG1Ref arriba del componente. aria-hidden
          refleja si de verdad se puede interactuar: no basta con el slide
          visual, un lector de pantalla no sabe que "está tapado" salvo que
          se lo digamos. */}
      <div className="pv3-hc-stage" aria-hidden={!regaloAbierto} style={{ '--coupon-base': COUPON_BASE_WIDTH }}>
        <button type="button" className="pv3-regalo-cerrar" onClick={cerrarPaso2} aria-label="Volver">
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        {/* El título en cursiva liviana (2026-08-11) sólo aparece una vez
            elegido "empresa": es el reemplazo del "Regalá descuentos y
            beneficios a tus clientes" que traía CheckoutHoteleroView en su
            propia banda de gradiente —esa banda no se muestra acá (ver
            `embebido` en ese componente)—, así que el mensaje no desaparece,
            se muda afuera del formulario. Va como children de CouponRain:
            queda intercalado ENTRE los dos planos de profundidad de la
            lluvia (ver ese componente) — los tres cupones del plano cerca
            pasan por encima, dándole cuerpo a la lluvia en vez de leerse como
            una capa de texto con cupones puestos encima. */}
        <CouponRain activo={regaloAbierto} reduced={reducedMotion}>
          {destinoElegido === 'empresa' && (
            <p className="gp-headline-cupones">
              Regalá descuentos y beneficios a tus huéspedes
            </p>
          )}
        </CouponRain>

        {/* `key` en la raíz de cada rama (2026-08-11 noche, bug real: ni la
            rueda ni los clicks respondían adentro del panel embebido) —
            las dos ramas empiezan con la misma cadena de <div> genéricos
            (.gp-wrap > div > div), así que sin `key` React las trataba como
            "el mismo" árbol al cambiar de rama y REUTILIZABA los nodos DOM
            en vez de desmontar uno y montar el otro. Eso hacía que
            `panelEmbebidoRef.current` terminara siendo el MISMO nodo que
            antes era `hcG1Ref.current` (el cabezal del paso 1) — con sus
            estilos inline imperativos (pointer-events:none,
            transform:translate3d(...), puestos por el useEffect de
            PANEL_G1/G2/G3) todavía pegados encima, porque React sólo
            resetea lo que declara vía JSX `style`, no lo que un efecto
            escribió a mano en `el.style`. Con `key` distinto, cada rama
            desmonta/monta limpio y no hay estilos ajenos que hereden. */}
        {destinoElegido === 'empresa' ? (
          /* Suscripción PRO, EL CONTENIDO REAL — no un adelanto de él
             (2026-08-11). Antes, elegir esta opción mostraba este mismo
             recuadro un instante y navegaba a CheckoutHoteleroView aparte;
             ahora ES CheckoutHoteleroView, embebida, con los cupones
             cayendo detrás todo el tiempo que dura el alta. `embebido` le
             saca a esa vista el envoltorio de página completa y su propia
             banda de gradiente (ver la nota en ese componente); `onListo`
             la completa HomeView → App.jsx, que es quien tiene la sesión
             para refrescarla y mandar al panel. */
          /* gp-wrap--alto (2026-08-11): el contenido embebido es mucho más
             alto que el sidebar, así que .gp-panel scrollea adentro (ver su
             overflow-y en hero-coupons.css) — pero centrado verticalmente
             (el comportamiento default de .gp-wrap) el borde superior
             redondeado quedaba pegado contra el techo, cortado, y no se leía
             como una tarjeta. Este modificador lo empieza más abajo, con
             aire arriba Y abajo, para que las cuatro esquinas se vean —sólo
             la de arriba, hasta que se scrollea— como pidió Mariano. */
          <div key="paso2-empresa" className="gp-wrap gp-wrap--alto">
            {/* .gp-panel-wrap: envoltorio sin scroll propio, sólo para que
                ScrollbarSutil ancle su track contra una caja que NO se
                mueve —ver la nota junto a .gp-panel-wrap en
                hero-coupons.css; antes el track vivía adentro de .gp-panel,
                que es justo la caja que scrollea, así que se iba de pantalla
                con el resto del contenido en vez de quedar clavado en el
                borde ("no se desliza, queda dura"). */}
            <div className="gp-panel-wrap">
              {/* Sin data-lenis-prevent (2026-08-11, segunda vuelta): eso
                  hacía que la rueda scrolleara nativo —instantáneo, sin
                  inercia—, y lo que se pedía era que este panel deslizara
                  suave, con la misma aceleración/desaceleración que el resto
                  del sitio. Ahora tiene su PROPIA instancia de Lenis, scopeada
                  a este elemento —ver el useEffect de lenisPanelRef, más
                  abajo—, así que data-lenis-prevent sería contraproducente:
                  Lenis revisa esa marca ANTES de decidir nada, así que
                  también apagaría a esta instancia local sobre sí misma. */}
              <div className="gp-panel" ref={panelEmbebidoRef}>
                <CheckoutHoteleroView
                  embebido
                  onListo={onSuscripcionLista}
                  // Un paso atrás, no cerrar todo (2026-08-12, bug reportado:
                  // "desaparece de golpe, no debería irse"): antes también
                  // apagaba giftAbierto, así que la flecha cerraba el flujo
                  // ENTERO de un salto —sin la rampa de .pv3-regalo-abierto,
                  // que necesita quedar en true un instante para animar el
                  // slide de vuelta—. Ahora hace exactamente lo mismo que
                  // .pv3-regalo-cerrar (el círculo del otro cierre, ver más
                  // abajo): vuelve al paso 1 —la caja "elegí una opción"
                  // sobre la galería, que sigue ahí porque giftAbierto no se
                  // toca— y cierra el slide sin pisar su propio contenido a
                  // mitad de camino (cerrarPaso2, ver la nota junto a su
                  // definición: destinoElegido se limpia recién cuando el
                  // slide ya terminó, no en el mismo tick).
                  onVolverAlInicio={cerrarPaso2}
                />
              </div>
              {/* Barra de scroll propia — ver ScrollbarSutil, arriba del
                  componente. Reemplaza a la nativa del navegador (fea/ancha
                  en algunos sistemas) sólo para este panel: el resto de
                  .gp-panel (paso 1, "elegí una opción") nunca desborda, así
                  que ahí esto nunca se monta con thumb.visible en true.
                  Hermana de .gp-panel, no hija (ver la nota de arriba). */}
              <ScrollbarSutil objetivoRef={panelEmbebidoRef} />
            </div>
          </div>
        ) : (
          /* Un solo contenedor centrado sobre la lluvia (2026-08-11). Antes era
              una columna de copy pegada a la izquierda —logo, ceja, título en dos
              pesos, párrafo y un botón suelto—: contaba la propuesta pero no
              preguntaba nada, y el único camino que ofrecía era el de empresa,
              cuando el panel tiene que atender también a la persona que quiere
              regalar un pase. Ahora el copy es el mínimo para entender de qué se
              trata y el peso está en la primera decisión, que es la que bifurca
              todo lo que sigue: ¿sos una persona regalando un pase, o una empresa
              que quiere regalar muchos?

              Se conservan los tres grupos de entrada en cascada (PANEL_G1/G2/G3,
              ver el useEffect junto a hcG1Ref): cabezal, opciones y botón. Lo que
              cambió es qué hay adentro de cada uno, no cómo entran.

              Sigue siendo lo que se ve mientras destinoElegido es 'persona' (ese
              camino todavía navega afuera con el delay de siempre, así que este
              recuadro es lo último que se alcanza a ver del slide) o null (recién
              abierto, sin elegir todavía). */
          <div key="paso1-elegir" className="gp-wrap">
            <div className="gp-panel">
              <div ref={hcG1Ref} className="pv3-hc-g1 gp-cabezal" style={{ opacity: 0 }}>
                <h2 className="gp-titulo">
                  <PaSSMark size={26} conPrefijo prefijo="GIft" color={DORADO_GIFT} />
                </h2>
                <p className="gp-bajada gp-bajada--fuerte">
                  Obsequiá un pase con todos los descuentos de la red
                </p>
                <p className="gp-bajada">
                  por la cantidad de días que decidas (ó que dure el viaje).
                </p>
              </div>

              <p className="gp-elegi">Elegí una opción:</p>

              <div className="gp-opciones">
                {renderOpcionesDestino([hcG2Ref, hcG3Ref])}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        /* ─── Entrada al cargar (no es scroll-linked, es al montar) ───
           Todo lo que ya se ve desde el primer frame —ceja de localidades,
           ticket, título completo, categorías— entra con el mismo fade +
           slide chico, escalonado en cascada. Se probó antes un efecto
           máquina de escribir en el título (steps() sobre width): se sacó
           entero —no se veía suave y el corte de línea quedaba raro con la
           fuente itálica— a favor de este único criterio para todo el
           bloque. El bloque de decisión (pretítulo+botones) no lleva nada de
           esto: ya tiene su propia entrada atada al scroll (pintarReveal). */
        @keyframes pv3FadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pv3-t-it, .pv3-t-bold, .pv3-t-ticker {
            animation: none; opacity: 1; transform: none;
          }
          /* Las columnas de la galería arrancan en opacity:0 esperando su
             animación de entrada (ver .pv3-col): sin animación que las
             traiga, hay que devolverles su opacidad de reposo a mano o la
             galería no se ve nunca.
             Va también .pv3-listo delante: una media query no suma
             especificidad, así que el selector de una sola clase (0,1,0) nunca
             llegaba a pisar al de dos (0,2,0) y la animación se seguía
             corriendo igual con reduced-motion puesto. */
          .pv3-col, .pv3-listo .pv3-col {
            animation: none; transform: none; filter: none;
            opacity: var(--col-op, 1);
          }
        }

        /* .pv3-hero — scroll nativo (2026-08-10; ver el historial completo
           junto a PIN_EXTRA_VH, arriba del componente, ya sin uso). Vivió un
           tiempo pineada (position:sticky + scroll-jack por "postas"); se
           revirtió entera por el salto que hacía al scrollear. position:
           relative de nuevo, sólo para seguir siendo el containing block de
           .pv3-hc-stage (panel "Pases de regalo", ver más abajo). */
        /* overflow-x: CLIP, no hidden. Con hidden en un eje, el otro deja de
           ser visible y computa auto: el hero se convertía en un scroll
           container de 100vh que no scrollea nada, y la rueda tenía que
           encadenar del contenedor al documento justo en su borde inferior
           —donde está la línea divisora—. Eso es lo que se sentía como una
           traba al pasar de acá a "Cuponeá". clip recorta igual pero NO crea
           scroll container, así que el eje vertical sigue en visible y la
           rueda va al documento de una. */
        /* ── Reloj de la entrada del hero ─────────────────────────────────
           Todos los tiempos de la cascada salen de acá. Antes eran siete
           números sueltos repartidos por la hoja más uno calculado en el JSX,
           y cambiar el orden obligaba a recalcularlos a mano de a uno — de
           hecho había un comentario avisando "si tocás esto, recalculá aquel".

           EL ORDEN LO ABRE LA GALERÍA (2026-08-14, a pedido). Antes entraba
           última, arrancando a los 0.95s, y se superponía con la cola del
           texto (.pv3-cta-full corría hasta 1.32s): la galería es lo más caro
           que anima la pantalla —tres columnas grandes con blur + scale +
           opacity, y encima el drift ya corriendo— así que compartir frames
           con los fades del texto la hacía entrar trabada. Ahora corre sola,
           de 0 a --gal-fin, y el texto empieza cuando ella termina.

           No hace falta esperar a las fotos acá: el estado "listo" (y con él
           la clase .pv3-listo que dispara todo esto) ya se pone recién cuando
           cargaron las primeras cuatro de cada columna. */
        .pv3-hero {
          position: relative; min-height: 100vh; overflow-x: clip;

          /* 1 · Galería: tres columnas escalonadas, cada una --gal-dur. */
          --gal-dur:  .95s;
          --gal-paso: .14s;
          /* Cuándo aterriza la última: dos pasos de retraso + su duración. */
          --gal-fin:  calc(var(--gal-paso) * 2 + var(--gal-dur));

          /* 2 · Texto: arranca donde termina la galería. */
          --txt-t0:   var(--gal-fin);
          --txt-paso: .12s;
          --txt-dur:  .5s;
        }

        /* Slide 1 (catálogo/decisión) — ver la nota larga en el JSX. Mismo
           tamaño que .pv3-hero (position:relative, sin tocar dimensiones);
           la única novedad es que ahora puede correrse entera fuera de
           pantalla. transition/transform van acá, no en .pv3-regalo-abierto
           (que sólo pisa el valor final), para que el estado de reposo
           también anime si algo la hace re-montar. */
        .pv3-slide-catalogo {
          position: relative;
          transition: transform .65s cubic-bezier(.65,0,.35,1);
          transform: translateX(0);
        }
        .pv3-regalo-abierto .pv3-slide-catalogo { transform: translateX(-100%); }

        /* Grid de TRES columnas (2026-08-10, última vuelta) — reemplaza al
           flex row + .pv3-cta-full en position:absolute con un left:58%
           calzado a ojo. El problema de aquello: el centro del bloque
           dependía de cuánto medía .pv3-left (640px fijos + 30px de margen),
           así que "centrado" nunca era el centro real de la página, y para
           que no se pisara con los accesos había que correrlo a mano.
           Acá las columnas 1 y 3 tienen el MISMO ancho (--pv3-lado), así que
           la del medio queda matemáticamente centrada en .pv3-inner —que a
           su vez es margin:0 auto con padding simétrico (40px de cada lado,
           ya no hay margin-left extra en .pv3-left que rompa la simetría)—,
           o sea: centrada en la página, sin números mágicos. La columna 3 no
           existe como elemento: se declara en el grid y queda vacía, que es
           justo lo que pide el boceto ("en la derecha nada, pero ocuparía su
           ancho virtual"), con la galería asomando por detrás.
           --pv3-lado por clamp y no fijo: las laterales se achican solas en
           viewports angostos y le ceden ese ancho a la del medio, que es lo
           que mantiene los dos botones de pase en UNA fila el mayor rango
           posible (ver .pv3-opciones-botones, flex-wrap:nowrap). */
        /* Los números del clamp y del gap no son a ojo: salen de medir en
           vivo los dos anchos que mandan. (1) La fila de los dos botones de
           pase mide 494px — por debajo de eso se apilan, que es justo lo que
           hay que evitar. (2) Los accesos miden 283px naturales (el
           subtítulo en itálica es el que manda). Con 22vw, en el peor caso
           del rango desktop (1180px, justo antes del breakpoint) las
           laterales quedan en ~260px y la del medio en ~518px: entra la fila
           de botones con aire. El precio de ese peor caso es que el
           subtítulo de "Pases de regalo" pasa a dos líneas entre ~1180 y
           ~1290px — es texto secundario, y vale mucho más eso que apilar los
           botones. De 1290 para arriba entra todo en una línea. */
        .pv3-inner {
          --pv3-lado: clamp(250px, 22vw, 340px);
          position: relative;
          z-index: 2;
          max-width: var(--site-max);
          margin: 0 auto;
          padding: 100px var(--site-pad) 56px;
          min-height: 760px;
          display: grid;
          grid-template-columns: var(--pv3-lado) minmax(0, 1fr) var(--pv3-lado);
          column-gap: 24px;
          align-items: center;
        }
        /* Columna 1. Ya no lleva ancho fijo ni margin-left propio: los pone
           el grid (ver arriba). El ticket y el título son más anchos que
           esta columna y se desbordan a propósito sobre la del medio —viven
           en .pv3-left-var, que es position:absolute y por lo tanto no
           empuja nada—, cosa que no molesta porque están MÁS ARRIBA que el
           bloque del medio; lo único que comparte banda vertical con él son
           los accesos, y esos sí quedan contenidos (ver .pv3-accesos). */
        .pv3-left { width: 100%; min-width: 0; }

        /* Herencia de cuando había dos variantes de copy (turista / socio)
           apiladas en el mismo lugar, cruzándose en cross-fade: .pv3-left-var
           quedó en position:absolute y pegada arriba (top:0), no centrada, y
           .pv3-left-stage con ancho explícito (no lo hereda del contenido,
           ver nota de .pv3-left) y una altura pensada para la variante más
           alta sin recortarla. Con una sola variante ya no hace falta nada de
           esto —alcanzaría con flujo normal—, pero se deja igual: funciona,
           y tocarlo significa reabrir el cálculo de +128px de acá abajo.
           +128px: el logo vivía en flujo normal arriba del stage (aportaba
           ~128px al alto de .pv3-left) y ahora vive adentro, en position:
           absolute, que no aporta alto al padre. Sin compensarlo, .pv3-left
           se achica esos 128px y el align-items:center de .pv3-inner
           recentra todo el bloque más abajo de lo que estaba. */
        .pv3-left-stage { position: relative; width: 100%; height: clamp(568px, calc(58vh + 128px), 668px); }
        /* top:44% + translateY(-50%) (2026-08-12): reemplaza a un top:-64px
           fijo — "todo el bloque, desde 'Viajá CUPONEaNdO' hasta el
           buscador, tiene que estar 100% centrado verticalmente". El
           offset fijo era un ajuste a ojo ("subir unos px el headline") que
           dejó de tener sentido en cuanto el título y el buscador
           cambiaron de tamaño un par de veces esa misma tarde: centraba
           bien para UN tamaño de contenido, no para cualquiera.
           translateY(-50%) es lo que hace el centrado real, inmune a que
           el título/buscador cambien de tamaño más adelante — siempre
           queda centrado el bloque EN SÍ, sin recalcular nada a mano.
           top:44% (no 50%) es el único número a ojo que queda: un empujón
           parejo hacia arriba —"capaz un poco más arriba, así no
           corremos riesgo de solapamiento"— contra el ticket + "¿Cuánto
           dura tu viaje?" de la columna del medio, que arranca más abajo
           (align-self:end en .pv3-cta-full) y si no quedaban más cerca de
           lo que se quería. Sigue siendo centrado "de verdad" en el
           sentido que importa: no depende de la altura del bloque, sólo
           corre el CENTRO un poco para arriba del centro exacto del stage.
           width explícito (antes era left:0/right:0, o sea el ancho de la
           columna): con el grid de tres columnas la columna 1 pasó a medir
           --pv3-lado (~340px máx), y el título necesita bastante más que eso
           para que "un pase, todos los descuentos" entre en una línea. Como
           esto es position:absolute, ese excedente se desborda sobre la
           columna del medio sin empujarla ni robarle ancho — y por eso
           también el -15% de tamaño en .pv3-t-bold/.pv3-t-ticker, ese mismo
           día: menos alto de bloque es más margen contra el solapamiento. */
        .pv3-left-var {
          position: absolute; left: 0; top: 35%; transform: translateY(-50%);
          width: 860px; max-width: calc(100vw - 80px);
        }

        /* Ticket-marca. Ya viene inclinado de fábrica en el propio SVG, en
           el mismo sentido que la galería (-10°) pero con bastante más
           gesto — no se rotula por CSS. Vive arriba de "¿Cuánto dura tu
           viaje?" (2026-08-12, se mudó desde .pv3-left-var, arriba del
           título principal) — .pv3-cta-full ya es text-align:center, así
           que .pv3-logo-slot sólo necesita el margen de abajo; centrar el
           <img> en sí lo hace margin:0 auto en .pv3-ticket. */
        .pv3-logo-slot { margin: 0 0 20px; }
        /* 200px → 120px (2026-08-12, a pedido: "más chico que antes, al 60%
           del tamaño que tenía"). */
        .pv3-ticket { width: 150px; height: auto; display: block; margin: 0 auto; }

        /* 2 · Título. Entra con el mismo fade del resto del bloque —ver nota
           arriba de por qué se sacó el efecto máquina de escribir—, .pv3-t-it
           un toque antes que .pv3-t-bold para que se lea como una sola
           frase cayendo en cascada, no como dos bloques separados. Sin la
           ceja de localidades (se sacó, ver el JSX) el título arranca más
           arriba —eso solo, más los -14px extra en .pv3-left-var, es el
           "subir unos px" que se pidió. */
        .pv3-title { position: relative; margin: 0; line-height: 1.12; letter-spacing: 0; }
        .pv3-title > span { display: block; }
        /* Otro +21.7% de tamaño a pedido (2026-08-12: probado en el
           inspector contra clamp(70px, 4.72vw, 57.5px) — el mínimo y el
           máximo estaban invertidos ahí, así que se los reordena acá: el
           máximo VIEJO (57.5) pasa a ser el mínimo nuevo, y 70 es el
           máximo nuevo. vw sin cambios. Historial: clamp original
           34px/4.1vw/50px → +15% → 39px/4.72vw/57.5px → esto. En mobile
           (<1180px, donde el mínimo es lo único que se ve casi siempre,
           ver la nota de abajo) el 57.5 fijo explotaba en pantallas
           angostas, así que hay un clamp aparte y más chico ahí — ver
           @media (max-width: 1180px). */
        .pv3-t-it {
          font-style: italic; font-weight: 300; color: ${A.ink}; font-size: clamp(57.5px, 4.72vw, 70px);
          opacity: 0;
        }
        .pv3-listo .pv3-t-it { animation: pv3FadeUp var(--txt-dur) ease-out var(--txt-t0) both; }
        .pv3-nauryz { font-family: ${NAURYZ}; font-style: normal; font-weight: normal; color: ${A.primary}; font-size: 0.8em; }
        /* Un poco más chico que en A (38px): el remate cierra el título, pero el
           siguiente nivel necesita aire para leerse como nivel 2. Historial:
           clamp original 24px/3.4vw/34px → +15% → 27.5px/3.91vw/39px →
           +21.7% (máximo viejo → mínimo nuevo) → 39px/3.91vw/47.5px → -15%
           (2026-08-12, a pedido: "achicar en tamaño un 15%", para dejar
           lugar a centrar el bloque entero sin pisar el logo de al lado —
           ver .pv3-left-var) → esto. vw sin tocar en el paso anterior, así
           que acá también se escala. */
        .pv3-t-bold {
          font-weight: 600; color: ${A.ink}; font-size: clamp(33px, 3.32vw, 40.5px); margin-top: 0.18em;
          opacity: 0;
        }
        .pv3-listo .pv3-t-bold { animation: pv3FadeUp var(--txt-dur) ease-out calc(var(--txt-t0) + var(--txt-paso)) both; }

        /* 3 · "en [rubro]" — tercera línea, nueva (2026-08-09). Mismo peso
           que .pv3-t-bold (es la continuación de esa misma frase, no un
           nivel nuevo), el rubro en primary para que se distinga de "en".
           Entra un paso después que .pv3-t-bold, misma cascada. */
        .pv3-t-ticker {
          font-weight: 600; color: ${A.ink}; font-size: clamp(33px, 3.32vw, 40.5px); margin-top: 0.18em;
          opacity: 0;
        }
        .pv3-listo .pv3-t-ticker { animation: pv3FadeUp var(--txt-dur) ease-out calc(var(--txt-t0) + var(--txt-paso) * 2) both; }
        .pv3-listo .pv3-accesos { animation: pv3FadeUp var(--txt-dur) ease-out calc(var(--txt-t0) + var(--txt-paso) * 3) both; }
        /* El span en sí no tiene ancho propio más que el de "en " — el que
           cambia de ancho al tipear/borrar es .pv3-ticker-word, adentro. */
        .pv3-ticker-word {
          display: inline-block;
          color: ${A.primary};
          transition: clip-path .45s cubic-bezier(.65,0,.35,1);
          will-change: clip-path;
        }

        /* Bajo el título (2026-08-10). Atado a --pv3-lado y no a un ancho
           suelto: vive dentro de .pv3-left-var, que se desborda a 640px a
           propósito (ver su nota), así que NO está limitado por el ancho
           de su columna. */
        /* position+z-index acá (2026-08-12, corrige un bug real: el bloque
           entero se pintaba DEBAJO de "Conocé todas las ofertas"). Nació por
           el desplegable de localidades, que ya no lo necesita —se fue por
           portal a <body>, ver .pv3-buscador-menu—, pero sigue haciendo
           falta para el botón mismo. La animación de entrada de arriba
           (.pv3-listo .pv3-accesos, pv3FadeUp con transform) convierte a
           este div en la raíz de su propio stacking context aunque sea
           position:static —transform crea contexto solo, sin necesitar
           position—, y un elemento static no puede llevar z-index: queda
           atrapado por debajo de cualquier hermano posicionado (como
           .pv3-acceso--ofertas, position:absolute), sin importar qué
           z-index tenga algo adentro suyo. position:relative + z-index acá
           saca a todo el bloque de esa trampa. */
        /* max-width propio, ya no var(--pv3-lado) (2026-08-12, a pedido:
           "agrandar el campo de ubicaciones, ya que una localidad larga
           hace que colapse" — con --pv3-lado, que clampea a 340px máx, un
           nombre como "Chacras del Mar" no entraba con el radio al lado).
           .pv3-accesos ya no necesita calzar con el ancho de la columna del
           grid —eso era para alinearse con "Conocé todas las ofertas",
           que ahora es un elemento aparte, position:absolute (ver esa
           nota)—, así que puede tomar el ancho que el contenido necesite,
           dentro de .pv3-left-var (860px, ver esa regla). */
        .pv3-accesos {
          position: relative; z-index: 2;
          margin-top: 28px; width: 100%; max-width: 420px; opacity: 0;
          display: flex; flex-direction: column;
        }
        /* ─── Buscador de ubicación (2026-08-12) ──────────────────────
           Único contenido de .pv3-accesos ahora (ver BuscadorUbicacion,
           arriba del componente) — reemplaza a "Obtener pases
           diarios"/"Regalar pases", que vivían acá como una lista de
           botones píldora apilados. Mismo radio 999px y misma paleta que
           el resto de los botones del hero (border #dbdef7, hover en
           primary) para que se lea como parte de la misma familia, aunque
           no navegue a nada por sí solo: sólo abre el desplegable de
           localidades. */
        .pv3-buscador { position: relative; width: 100%; }
        .pv3-buscador-btn {
          display: flex; align-items: center; gap: 10px;
          width: 100%; padding: 14px 20px;
          border: 1px solid #dbdef7; border-radius: 999px;
          background: #fff; cursor: pointer;
          font-family: inherit; text-align: left;
          transition: border-color .15s ease;
        }
        .pv3-buscador-btn:hover,
        .pv3-buscador-btn[aria-expanded="true"] { border-color: ${A.primary}; }
        .pv3-buscador-pin { flex-shrink: 0; color: ${A.primary}; }
        .pv3-buscador-localidad { font-size: 15px; font-weight: 700; color: ${A.ink}; white-space: nowrap; }
        .pv3-buscador-radio { font-size: 13px; font-weight: 500; color: ${A.ink2}; white-space: nowrap; }
        .pv3-buscador-chevron {
          margin-left: auto; flex-shrink: 0; color: ${A.ink2};
          transition: transform .15s ease;
        }
        .pv3-buscador-btn[aria-expanded="true"] .pv3-buscador-chevron { transform: rotate(180deg); }
        @media (prefers-reduced-motion: reduce) {
          .pv3-buscador-btn, .pv3-buscador-chevron { transition: none; }
        }
        /* Desplegable simple, sin librería. Cuelga de <body> por portal (ver
           BuscadorUbicacion), así que: position FIXED contra el viewport
           —left/top/bottom/width los calcula medir() y llegan inline—, y
           z-index por encima de la navbar (1000/1001 en Navbar.jsx) para que
           "quede siempre por delante de todo"; abajo del carrito (8000) y de
           los modales (9500), que son overlays de pantalla completa y sí
           deben taparlo. El z-index 4 de antes ordenaba sólo contra los
           hermanos del hero (galería en 6, panel de regalo en 3) — ese es
           justo el alcance que no alcanzaba.

           max-height inline + overflow-y: la lista se recorta a lo que entra
           en pantalla y el resto se scrollea acá adentro, en vez de seguir de
           largo por debajo de la sección siguiente. overscroll-behavior:
           contain corta el encadenado al llegar al tope: la rueda no le pasa
           el sobrante a la página (que además está scrolleando suave con
           Lenis, ver data-lenis-prevent en el JSX). */
        .pv3-buscador-menu {
          position: fixed;
          z-index: 1200;
          min-width: 220px;
          padding: 6px;
          border-radius: 18px;
          background: #fff;
          border: 1px solid #dbdef7;
          box-shadow: 0 18px 38px -20px rgba(11,16,32,0.28);
          overflow-y: auto;
          overscroll-behavior: contain;
        }
        /* Barra fina y visible, no escondida: es la única señal de que la
           lista sigue más abajo. Mismos valores que .cupon-scroll en
           CupopackModal.jsx, que es el otro listado scrolleable dentro de un
           panel redondeado. */
        .pv3-buscador-menu::-webkit-scrollbar { width: 8px; }
        .pv3-buscador-menu::-webkit-scrollbar-thumb {
          background: rgba(120,130,150,0.35); border-radius: 8px;
        }
        .pv3-buscador-item {
          display: block; width: 100%; padding: 10px 14px;
          border: none; border-radius: 12px; background: none;
          font-family: inherit; font-size: 14px; font-weight: 600; color: ${A.ink};
          text-align: left; cursor: pointer;
          transition: background .15s ease;
        }
        .pv3-buscador-item:hover { background: rgba(71, 91, 225, 0.1); }
        .pv3-buscador-item--activa { color: ${A.primary}; background: ${A.primarySoft}; }
        @media (prefers-reduced-motion: reduce) {
          .pv3-buscador-item { transition: none; }
        }
        /* Ya no hay recuadro común: cada acceso es su propio botón píldora
           (2026-08-11). El radio va en 999px, el mismo de .pv3-btn-pase, para
           que los tres botones del hero se lean como una sola familia. El
           padding izquierdo es grande y el derecho chico porque el borde
           curvo se come el aire del extremo y la flecha ya es un círculo: con
           padding parejo, el texto quedaba pegado a la curva y la flecha
           suelta en el medio. */
        .pv3-acceso {
          position: relative;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          width: 100%; padding: 6px 6px 6px 18px;
          border: 1px solid #dbdef7; border-radius: 999px;
          /* Blanco explícito (2026-08-12), no "none": "apagada" es un
             estado real ahora (ver .pv3-acceso--abierta más abajo), no sólo
             la ausencia de fondo — con "none" se veía crema, el degradé del
             hero por detrás, no blanco. */
          background: #fff; cursor: pointer;
          font-family: inherit; text-align: left;
          transition: background .15s ease, border-color .15s ease;
        }
        /* "Pases diarios" es el único que ya está "en curso" (clickearlo
           siempre lleva a la misma vista de pases) — por eso es el único
           relleno: pastilla en primary, título y círculo blancos, ícono en
           primary (currentColor de CuponIcon hereda el color del span). Los
           otros dos quedan con línea (.pv3-acceso, sin modificador): ese es
           el estado desactivado, que ahora comparten "Regalá cuponeras" y
           "Conocé todas las ofertas" por igual. Sin :hover propio (2026-08-11
           noche, a pedido): ya está pintado como la sección abierta, un
           hover encima sugería que hay algo más para activar. */
        /* Único acceso que queda con esta clase: "Conocé todas las ofertas"
           (2026-08-12: "Obtener pases diarios"/"Regalar pases", que
           llegaron a tener un estado ABIERTA/CERRADA que alternaba entre
           los dos —fondo primary vs. blanco—, se sacaron enteros; ver
           BuscadorUbicacion y .pv3-gift-icon-btn para dónde quedó cada
           uno). Fondo blanco con hover en primary clarito, sin más
           estados. */
        /* "Conocé todas las ofertas" es hermana directa de .pv3-left y
           .pv3-cta-full adentro de .pv3-inner, no un hijo más de
           .pv3-accesos (2026-08-12, a pedido: "alineado a los CTA de
           pases, horizontalmente" — ver la nota grande en el JSX). Se
           superpone a la columna 1 del grid (la de .pv3-left) y se ancla
           abajo con align-self:end, el mismo truco que ya usa .pv3-cta-full
           para apoyarse en el padding-bottom de .pv3-inner: los dos
           terminan en la misma línea horizontal sin necesidad de calcular
           nada a mano. justify-self:start la deja pegada a la izquierda de
           esa columna, como el resto de los accesos.
           Ya no es una píldora de ancho completo (2026-08-12, a pedido, ver
           captura): justify-content pasa a flex-start (la base trae
           space-between, para separar texto y círculo a los extremos de la
           fila entera) y el padding baja a lo mínimo — círculo y texto
           quedan pegados entre sí, a la izquierda, como un link con ícono,
           no como un botón que ocupa todo el ancho de la columna. */
        .pv3-acceso--ofertas {
          /* position:absolute, no grid-column/grid-row (2026-08-12,
             corrección de un bug real y grande: puesto explícitamente en
             fila1/columna1 vía grid-column+grid-row, el algoritmo de
             colocación de CSS Grid resuelve TODOS los ítems con posición
             explícita antes que los auto-colocados —sin importar el orden
             en el DOM—. Como este botón reclamaba (fila1,col1) por
             adelantado, cuando le tocaba el turno a .pv3-left (sin posición
             explícita, auto-colocado) esa celda ya estaba "ocupada" y el
             cursor de auto-placement lo mandó a la SIGUIENTE celda libre:
             columna 2 — empujando a su vez a .pv3-cta-full a la columna 3.
             Resultado: todo el bloque de la izquierda, Y "¿Cuánto dura tu
             viaje?", corridos hacia la derecha (bug reportado, confirmado
             midiendo en el navegador: .pv3-left aparecía con el ancho y la
             posición exactos de la columna 2).
             position:absolute saca este botón del grid por completo —ya no
             participa del auto-placement, así que no puede volver a
             empujar a nadie— y se ancla contra .pv3-inner (position:
             relative) directo. left/bottom van en 40px/56px, NO en 0
             (se probó con 0 primero y quedó pegado al borde real del
             contenedor, 40px a la izquierda y 56px más abajo de lo debido):
             el containing block de un position:absolute es la CAJA DE
             PADDING de su ancestro posicionado, cuyo borde exterior
             coincide con el borde interior del border —el padding en sí
             queda AFUERA de esa caja—, así que left:0/bottom:0 caen justo
             ahí, antes de descontar el padding. Por eso left/bottom repiten
             exactamente el padding-left/padding-bottom de .pv3-inner (ver
             esa regla): con eso, el origen pasa a ser el mismo que ya usa
             la columna 1 y el mismo piso que usa .pv3-cta-full con
             align-self:end. left va por var(--site-pad) y no por un 40px
             suelto (2026-08-13) justamente porque tiene que SEGUIR a ese
             padding — cuando el aire lateral del sitio subió a 80px, un
             40 acá clavado dejaba este acceso desalineado contra el título
             de arriba, que sí lo sigue. */
          position: absolute; left: var(--site-pad); bottom: 56px;
          border-color: transparent;
          justify-content: flex-start; gap: 10px;
          width: auto; padding: 4px 0;
          /* Entra con la cascada, como todo lo demás del hero (2026-08-13):
             se había quedado afuera —aparecía servido desde el frame cero
             mientras el resto todavía estaba entrando—. Ver la animación
             justo abajo para el porqué del delay. */
          opacity: 0;
        }
        /* ÚLTIMO de toda la entrada (a pedido). Sale un paso completo después
           de .pv3-cta-full, que es la última pieza de la cascada de texto:
           mismo delay + su duración, o sea que arranca justo cuando aquélla
           terminó. Ya no hay que recalcularlo a mano cuando cambian los
           tiempos — se mueve solo con el reloj de .pv3-hero. */
        .pv3-listo .pv3-acceso--ofertas { animation: pv3FadeUp var(--txt-dur) ease-out calc(var(--txt-t0) + var(--txt-paso) * 4 + var(--txt-dur)) both; }
        /* Va acá abajo y no en el bloque grande de prefers-reduced-motion de
           más arriba: una media query no suma especificidad, así que aquel
           (0,2,0) perdería contra el (0,2,0) de la regla de animación de acá,
           que viene después en la hoja. Mismo gotcha que ya documenta
           .pv3-col en ese bloque. Con reduced-motion, además, esperar 2.25s
           a que aparezca un link no tiene sentido: se muestra servido. */
        @media (prefers-reduced-motion: reduce) {
          .pv3-listo .pv3-acceso--ofertas { animation: none; opacity: 1; transform: none; }
        }
        .pv3-acceso.pv3-acceso--ofertas:hover { background: none; }
        .pv3-acceso.pv3-acceso--ofertas:hover .pv3-acceso-titulo { text-decoration: underline; }
        /* 15% de primary (2026-08-12, a pedido: "que no sea color azul,
           que sea un 15% de ese azul"), no el ${A.primarySoft} sólido de
           antes — un tinte, no un color plano nuevo. Sólo pinta el estado
           cerrado/blanco: la abierta se pisa a sí misma un poco más arriba
           (.pv3-acceso--abierta:hover). */
        .pv3-acceso:hover { background: rgba(71, 91, 225, 0.15) }
        @media (prefers-reduced-motion: reduce) {
          .pv3-acceso { transition: none; }
        }
        .pv3-acceso-texto { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        /* 14px → 17px (2026-08-12, a pedido: "al tamaño del texto de los
           botones de pases" — mismo font-size que .pv3-btn-pase). */
        .pv3-acceso-titulo { font-size: 17px; font-weight: 700; color: ${A.primary}; }
        .pv3-acceso-sub { font-size: 11.5px; font-weight: 500; color: ${A.ink2}; font-style: italic; }
        /* Círculo con la flecha. 26px → 32px, ícono 14 → 18 (2026-08-12, a
           pedido: "en proporción" al bump de .pv3-acceso-titulo — misma
           razón, 17/14 ≈ 1.2, aplicada al círculo y al ArrowDown del JSX).
           El color de fondo llega por style inline en el JSX (primary); el
           ícono (lucide) hereda blanco vía currentColor. */
        .pv3-acceso-flecha {
          flex-shrink: 0;
          display: grid; place-items: center;
          width: 32px; height: 32px;
          border-radius: 50%;
          color: #fff;
        }

        /* "¿Cuánto dura tu viaje?" — ver la nota fechada 2026-08-10 junto a
           TEXTO_ENTER, en el useEffect: se mudó adentro de .pv3-cta-full
           (más abajo), que ya es text-align:center, así que no necesita
           ningún centrado propio. Una sola línea (antes dos, con <br/>).
           Toda en itálica y -15% de tamaño (2026-08-12, a pedido: clamp
           original 24px/2.4vw/30px ×0.85). Un solo espesor (2026-08-12,
           segunda vuelta, a pedido: "hay dos espesores, dejar solamente el
           más liviano") — antes "¿Cuánto dura" iba en 650 y sólo "tu
           viaje?" (.pv3-pretitulo-it, un <span> aparte) en 500; ahora toda
           la frase es 500 y el span dejó de hacer falta. */
        .pv3-pretitulo {
          margin: 0 0 14px;
          font-style: italic;
          font-weight: 500; font-size: clamp(20.5px, 2.04vw, 25.5px); line-height: 1.25;
          color: ${A.primary};
        }

        /* Letra chica + botones — columna DEL MEDIO del grid de tres (ver la
           nota junto a .pv3-inner). Vive en flujo normal, como celda 2: no
           necesita position:absolute ni ningún left:% calzado a mano, porque
           con las columnas 1 y 3 del mismo ancho el centro de esta celda ES
           el centro de la página. Dos intentos anteriores del mismo día
           fallaron justamente por eso —uno centraba en el ancho sobrante
           tras .pv3-left (quedaba pegado a la galería), el otro usaba un
           left:58% a ojo que se despegaba del centro real según el viewport—.
           align-self:end la asienta abajo, como pide el boceto (el resto de
           las celdas sigue centrado por el align-items del grid).
           max-width 620 (antes 480): es el ancho que necesitan los dos
           botones de pase para entrar en UNA fila (~506px), que es lo que se
           pidió; el grid le da ese ancho porque las laterales se achican por
           clamp antes que él. */
        .pv3-cta-full {
          justify-self: center;
          align-self: end;
          width: 100%;
          max-width: 620px;
          /* Sin margen propio abajo (antes 64px): el bloque se apoya
             directamente sobre el padding-bottom de .pv3-inner, que es lo
             más cerca del piso que puede quedar sin invadirlo. */
          margin-bottom: 0;
          text-align: center;
          opacity: 0;
        }
        .pv3-listo .pv3-cta-full { animation: pv3FadeUp var(--txt-dur) ease-out calc(var(--txt-t0) + var(--txt-paso) * 4) both; }
        /* La clase la pone el listener de animationend (ver el useEffect de
           ctaFullRef) — mismo motivo y misma forma que .pv3-listo
           .pv3-col--fin, en la galería: con fill-mode 'both' el último
           keyframe (opacity:1) queda sostenido por la ANIMACIÓN, no por una
           propiedad común, así que apagarla y volver a prenderla (que es
           lo que hacía antes .pv3-gift-abierto .pv3-cta-full con
           animation:none) reinicia el fade-in-up de cero — el "desaparece
           y reaparece" reportado. Fijando animation:none acá, una sola vez,
           al terminar de verdad, lo que sigue (blur/saturación al abrir
           "Regalá cuponeras") es sólo un transition de filter sobre un
           elemento en opacity:1 fijo, nunca una animación que se pueda
           reiniciar. .pv3-listo adelante por la misma razón de siempre:
           empatar la especificidad (0,2,0) de la regla de arriba para
           poder pisarla por orden. */
        .pv3-listo .pv3-cta-full--asentada { animation: none; opacity: 1; }
        /* Paso 1 de "Pases de regalo": este bloque ya NO desaparece —se pidió
           lo contrario (2026-08-12): que quede "por detrás" del bloque
           blanco, en vez de irse del todo. Queda sólo pointer-events:none,
           que lo saca de la interacción.
           (2026-08-13) Se eliminó el tratamiento visual que vivía acá:
           filter: blur(3px) saturate(0.4) brightness(1.2), repetido hoja por
           hoja sobre .pv3-logo-slot / .pv3-pretitulo / .pv3-pase-caption /
           .pv3-pases-par / .pv3-mas-dias para saltear la rama del regalito
           (un filter en el padre alcanza a todos los descendientes y no hay
           "filter:none" que revierta el del ancestro, así que la única forma
           de dejar un hijo nítido era no bluerar al padre). A pedido: "es al
           pedo el blur de esa zona si ya le estamos poniendo blur a todo el
           sitio; sacar el des-saturar y que el blur sea el compartido".
           Y era literal: el scrim ya trae backdrop-filter, sólo que atrapado
           en el stacking context del hero no llegaba a nada de afuera. Con
           el drawer portaleado a <body> (ver la nota en el JSX) ese blur
           pasó a cubrir el sitio entero, así que la capa local dejó de
           sumar y sólo aportaba un tratamiento distinto —desaturado y
           aclarado— en un recorte arbitrario de la pantalla.
           Efecto lateral asumido: el círculo del regalito ahora se blurea
           como todo lo demás. Antes quedaba nítido a propósito (2026-08-12,
           "que el círculo e ícono del regalito no se blureen"), pero eso
           dependía justamente de la capa hoja-por-hoja que se fue; un
           backdrop-filter no sabe de excepciones. */
        .pv3-gift-abierto .pv3-cta-full { pointer-events: none; }

        /* ─── Drawer GIFT PaSS del paso 1 (2026-08-12) ───────────────────
           Mismo lenguaje que CarritoDrawer.jsx, el otro drawer de la app:
           scrim + panel fixed a la derecha, ancho fijo con tope en vw, slide
           por transform (no fade). Reemplaza a la tarjeta flotando sobre la
           galería que había antes —ver el historial más arriba en el JSX—:
           esa dependía de esquivar el título de la izquierda con números
           medidos a mano (720px, después 960px) y cada vez que el título
           cambiaba de ancho quedaba en riesgo de tocarlo. Un drawer anclado
           al borde derecho no compite con nada de la columna izquierda: no
           importa cuánto mida el título, nunca están en el mismo lugar.

           width: 560, más ancho que los 600 de max-width que tenía la
           tarjeta vieja PARA EL PANEL COMPLETO (acá 560 es sólo el drawer;
           .gp-panel adentro llega a ocupar los 560 enteros menos su propio
           padding, más ancho neto que antes) — "dando más espacio... para
           el contenido", a pedido. max-width:92vw, mismo criterio que
           CarritoDrawer, para no desbordar en viewports angostos (aunque
           esto es de escritorio, ver el breakpoint <1180px más abajo, que
           lo apaga entero).
           z-index 2000/2001: por encima de la navbar (1000, ver Navbar.jsx)
           — un drawer tapa todo, como CarritoDrawer. Ese "por encima" recién
           se cumple desde que los dos cuelgan de <body> por portal (ver la
           nota en el JSX): adentro del hero el número era el mismo pero no
           servía de nada.
           El blur del scrim es EL blur de la escena (2026-08-13, a pedido:
           "que el blur sea el compartido de todo el sitio"). Son los mismos
           2px de CarritoDrawer.jsx — un solo lenguaje para los dos drawers.
           Antes convivía con un filter local sobre media docena de elementos
           del hero, que además desaturaba; eso se eliminó, ver la nota de
           .pv3-gift-abierto .pv3-cta-full más arriba. */
        .pv3-gift-scrim {
          position: fixed;
          inset: 0;
          z-index: 2000;
          background: rgba(11, 16, 32, 0.45);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(2px);
          opacity: 0;
          pointer-events: none;
          transition: opacity .32s ease;
        }
        .pv3-gift-scrim--visible { opacity: 1; pointer-events: auto; }
        /* Se apaga junto con el drawer cuando arranca el paso 2 — la escena
           de .pv3-hc-stage ya cubre toda la pantalla por su cuenta, no hace
           falta un scrim aparte detrás. Después de --visible a propósito:
           misma especificidad, gana por orden mientras las dos conviven. */
        .pv3-gift-scrim--saliendo { opacity: 0; pointer-events: none; transition: opacity .2s ease; }

        .pv3-gift-drawer {
          position: fixed;
          top: 0;
          right: 0;
          height: 100vh;
          height: 100dvh;
          width: 560px;
          max-width: 92vw;
          z-index: 2001;
          background: #fff;
          border-top-left-radius: 24px;
          border-bottom-left-radius: 24px;
          box-shadow: -30px 0 80px -40px rgba(11, 16, 32, 0.35);
          overflow: hidden;
          transform: translateX(105%);
          pointer-events: none;
          transition: transform .42s cubic-bezier(.22,1,.36,1);
        }
        .pv3-gift-drawer--abierto { transform: translateX(0); pointer-events: auto; }
        /* Una vez que arrancó el paso 2, el drawer del paso 1 vuelve a
           deslizarse afuera — DESPUÉS de la regla de arriba (misma
           especificidad, gana por orden) para pisarle transform/pointer-
           events mientras las dos clases conviven durante el slide grande.
           Transition propia, más corta que la de entrada (.3s en vez de
           .42s): se va rápido, sin competir visualmente con la escena nueva
           que entra desde el mismo lado. */
        .pv3-gift-drawer--saliendo { transform: translateX(105%); pointer-events: none; transition: transform .3s ease; }
        /* .gp-panel llena el drawer entero (antes era una tarjeta con sus
           propios bordes/radio/sombra flotando adentro de una columna
           angosta) — acá ESO ya lo resuelve .pv3-gift-drawer (el borde
           redondeado, la sombra), así que .gp-panel se aplana: sin borde,
           sin radio propio, sin sombra, ocupando el 100% del alto para que
           el cabezal + las opciones se centren en el medio del drawer entero
           (justify-content:center), no arriba pegados contra el techo. */
        .pv3-gift-drawer .gp-panel {
          width: 100%;
          height: 100%;
          max-width: none;
          border: none;
          border-radius: 0;
          box-shadow: none;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        /* Cruz, arriba a la derecha (2026-08-12, a pedido: "el circulito en
           outline negro y la cruz en negro") — círculo sin relleno, sólo
           borde negro, con el ícono también negro (currentColor hereda del
           color de texto). Al hover se invierte (se rellena de negro, el
           ícono pasa a blanco): mismo gesto de "botón de cerrar" que el
           resto de la app, pero en outline en reposo en vez de sólido. */
        .gp-gift-cerrar {
          position: absolute;
          top: 14px;
          right: 14px;
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border: 1.5px solid ${A.ink};
          border-radius: 50%;
          background: none;
          color: ${A.ink};
          cursor: pointer;
          transition: background .15s ease, color .15s ease;
        }
        .gp-gift-cerrar:hover { background: ${A.ink}; color: #fff; }
        @media (prefers-reduced-motion: reduce) {
          .pv3-gift-drawer, .pv3-gift-scrim { transition: none; }
          .gp-gift-cerrar { transition: none; }
        }

        /* 7 · Letra chica: antes iba debajo de los botones, ahora arriba,
           entre la pregunta y la zona de decisión. Ya no itálica —en el
           boceto es texto derecho, igual que el resto del cuerpo—; PREMIUM
           en bold marca la palabra que importa dentro de la frase. */
        .pv3-pase-caption {
          margin: 0;
          font-weight: 400;
          font-size: 14px;
          line-height: 1.5;
          color: ${A.ink2};
        }
        .pv3-pase-caption b { color: ${A.ink}; font-weight: 700; }

        /* 6 · Botones de pase + "¿Más días?", todos en la misma fila
           (2026-08-11: antes "¿Más días?" vivía solo, en una fila propia
           debajo —.pv3-opciones-links, ya sin uso—; ahora comparte fila con
           los botones de pase, pegado a la derecha del de 7 días). */
        .pv3-opciones { margin-top: 22px; }
        /* nowrap (antes wrap): los dos pases se comparan de un vistazo sólo
           si están uno al lado del otro — apilados dejan de leerse como dos
           opciones del mismo eje. El ancho para que entren sale del grid
           (ver .pv3-inner: las columnas laterales se achican por clamp y le
           ceden lugar a esta). Cuando de verdad no hay ancho, el apilado
           vuelve, pero explícito y sólo ahí: ver la media query de 560px. */
        /* width:fit-content + margin auto en vez de un flex a todo el ancho
           con justify-content:center (2026-08-12): el par queda centrado
           igual —es el único contenido en flujo—, pero ahora el borde
           derecho del container coincide con el del pase de 7 días, que es
           lo que .pv3-pases-extra usa de ancla (left:100%). Antes el
           container se estiraba a todo el ancho disponible y ese borde caía
           ~30px más a la derecha, así que el aire real hasta "¿Más días?"
           era el margin-left MÁS un sobrante que cambiaba con el viewport. */
        .pv3-opciones-botones {
          position: relative; width: fit-content; margin-inline: auto;
          display: flex; flex-wrap: nowrap; align-items: center; justify-content: center;
        }
        .pv3-pases-par { display: flex; flex-wrap: nowrap; gap: 14px; }
        /* Cuelga afuera del centrado del par, a su derecha —ver la nota en
           el JSX. left:100% toma como referencia el borde derecho de
           .pv3-opciones-botones (el propio flex container, que mide
           exactamente lo que mide .pv3-pases-par porque es su único
           contenido en flujo), así que sigue pegado al pase de 7 días sin
           importar cuánto se centre el conjunto — el ícono de gift pass y
           "¿Más días?" van juntos adentro de este wrapper (2026-08-12, antes
           era sólo "¿Más días?" el que colgaba acá), en flujo normal entre
           ellos, así que ninguno de los dos pesa en el centrado del par.
           Las dos distancias son asimétricas a propósito (2026-08-12, a
           pedido): "¿Más días?" queda cerca de los pases (24px, la mitad
           del aire que había) porque pertenece a esa misma decisión, y
           lejos del regalito (32px, el doble) porque ese ícono abre otro
           producto.
           En mobile el gap vuelve a 16px: ahí el par se apila y la fila del
           extra es la única en horizontal, sin nada de qué despegarse. */
        .pv3-pases-extra {
          position: absolute; left: 100%; top: 50%;
          transform: translateY(-50%);
          margin-left: 24px;
          display: flex; align-items: center; gap: 32px;
        }
        .pv3-mas-dias {
          padding: 0; border: none; background: none; cursor: pointer;
          font-family: inherit; font-size: 15.5px; font-weight: 600; color: ${A.primary};
          white-space: nowrap;
          text-decoration: underline; text-underline-offset: 3px;
          text-decoration-thickness: 1.5px;
          transition: color .15s;
        }
        .pv3-mas-dias:hover { color: ${A.primaryDark}; }
        /* Mismo alto que .pv3-btn-pase (56px) para que las tres pastillas de
           la fila —dos pases + este— lean como una misma familia, pero
           circular y en blanco: es la puerta a OTRO producto (la
           suscripción PRO), no un tercer pase. El dorado es DORADO_GIFT, el
           mismo del moño de giftpass-logo.svg que ya usa el panel de
           "Pases de regalo" — no un amarillo nuevo. Sin borde en ningún
           estado (2026-08-12, a pedido: "el círculo sin outline") — una
           sombra suave, no un borde, es lo que separa el círculo blanco
           del fondo claro del hero. Hover invierte: fondo dorado, ícono
           blanco (currentColor) — misma inversión de color que ya usan los
           demás botones del hero al pasar a su estado "activo". */
        .pv3-gift-icon-btn {
          position: relative;
          flex-shrink: 0;
          display: grid; place-items: center;
          width: 56px; height: 56px;
          border: none; border-radius: 999px;
          background: #fff; color: ${DORADO_GIFT}; cursor: pointer;
          box-shadow: 0 4px 14px -8px rgba(11,16,32,0.25);
          transition: background .15s, color .15s, transform .15s, box-shadow .15s;
        }
        /* Iluminación giratoria (2026-08-13) — el regalito es la puerta a
           OTRO producto y queda callado al lado de dos pastillas llenas de
           primary: un borde dorado que gira despacio lo señala sin sumar
           copy ni un badge.
           La receta es la del "glowing button hover" de Webflow, que pasó
           Mariano de referencia (glowing-button-hover.webflow.io, de Dhruv
           Sachdev). Lo que hace ese efecto, mirado de cerca: un conic-
           gradient con UN arco encendido y el resto transparente, girando
           2.5s linear infinite, repetido en dos capas —una nítida recortada
           al borde y otra desenfocada de fondo—. Los ángulos de las paradas
           son los del original (0/60/310/360, o sea un arco de ~110° que
           cruza el 0); lo único que cambia es el color: el original va en
           blanco sobre fondo oscuro y acá tiene que ser DORADO_GIFT sobre el
           fondo claro del hero, que es el dorado del ícono y del moño de
           giftpass-logo.svg.
           El original arma esas capas con cuatro divs anidados y una máscara
           SVG porque tiene que resolver una PÍLDORA; un círculo se recorta
           con dos líneas de CSS, así que acá son dos capas y nada más:
             .pv3-gift-slot::before — el anillo nítido. La máscara
               content-box/exclude es el truco estándar de "sólo el borde":
               se pinta el gradiente en toda la caja y se descuenta el
               interior del padding, quedando visible un aro del grosor de
               ese padding.
             .pv3-gift-glow — el bloom. Mismo gradiente, desenfocado y más
               grande, que es lo que hace que el borde "ilumine" en vez de
               ser sólo una línea de color.
           Las dos rotan con la MISMA duración y arrancan juntas, así que el
           arco nítido y su resplandor van siempre en fase — si se
           desincronizaran se vería como dos luces distintas, no como una.
           Rota el elemento entero y no el ángulo inicial del gradiente, que
           no está interpolado en todos los navegadores (ahí el giro se ve a
           saltos).
           Las dos quedan atrás por ORDEN DE PINTADO, no por z-index: son
           hermanas anteriores al botón dentro del slot, y el botón (que trae
           su propio fondo opaco) pinta después y las tapa, así que sólo se
           ve lo que asoma afuera de los 56px. Con z-index:-1 adentro del
           botón NO funciona: un hijo con z-index negativo pinta encima del
           fondo del elemento que crea su contexto de apilado. */
        .pv3-gift-slot {
          position: relative; display: inline-flex; flex-shrink: 0;
          /* Una sola definición para las dos capas: si el arco nítido y el
             bloom no fueran el mismo gradiente, tocar uno y olvidarse del
             otro los dejaría con formas distintas. */
          --gift-conic: conic-gradient(
            from 0deg,
            rgba(255,185,74,0.95) 0deg,
            rgba(255,185,74,0)    60deg,
            rgba(255,185,74,0)    310deg,
            rgba(255,185,74,0.95) 360deg
          );
          transition: transform .15s;
        }
        .pv3-gift-slot::before,
        .pv3-gift-glow {
          content: ''; position: absolute; border-radius: 999px;
          pointer-events: none;
          background: var(--gift-conic);
          animation: pv3GiftGlow 2.5s linear infinite;
          transition: opacity .2s;
        }
        /* Pegado al borde del botón, no flotando alrededor: en el original el
           aro ES el borde de la pastilla y por eso se lee como una luz que
           recorre el contorno. Como esta capa se pinta ANTES que el botón,
           un inset:0 quedaría tapado entero por el círculo blanco — de ahí
           el -1.5px: el aro arranca justo donde termina el botón. */
        .pv3-gift-slot::before {
          inset: -1.5px;
          padding: 1.5px;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask-composite: exclude;
        }
        .pv3-gift-glow {
          inset: -8px;
          filter: blur(8px);
          opacity: .6;
        }
        @keyframes pv3GiftGlow {
          to { transform: rotate(360deg); }
        }
        /* Con el drawer abierto el glow se apaga: ya llamó la atención, y lo
           que importa mirar es lo que se abrió, no el botón que lo abrió. */
        .pv3-gift-abierto .pv3-gift-slot::before,
        .pv3-gift-abierto .pv3-gift-glow { opacity: 0; }
        /* El hover queda CLAVADO mientras el recuadro está abierto (2026-08-12,
           a pedido) — el botón es la puerta de lo que se abrió, y con todo lo
           de al lado fuera de foco tiene que leerse encendido, no en reposo.
           Como .pv3-cta-full pasa a pointer-events:none en ese momento, el
           :hover real ni siquiera se dispararía: la clase del section es la
           única forma de sostenerlo.
           El levante va en .pv3-gift-slot y no acá (2026-08-13): mover sólo
           el botón lo despegaba 1px de su propio anillo, que vive en el slot
           — se veía como un aro descentrado. Subiendo el slot viaja todo
           junto. */
        .pv3-gift-icon-btn:hover,
        .pv3-gift-abierto .pv3-gift-icon-btn {
          background: ${DORADO_GIFT}; color: #fff;
          box-shadow: 0 10px 20px -12px rgba(11,16,32,0.35);
        }
        .pv3-gift-slot:hover,
        .pv3-gift-abierto .pv3-gift-slot { transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) {
          .pv3-gift-icon-btn { transition: background .15s, color .15s; }
          .pv3-gift-slot:hover,
          .pv3-gift-abierto .pv3-gift-slot { transform: none; }
          /* El giro se corta y las dos capas quedan quietas en su posición
             de arranque: el aro dorado sigue distinguiendo al botón del par
             de pases, sin nada en movimiento permanente en pantalla. */
          .pv3-gift-slot::before,
          .pv3-gift-glow { animation: none; }
        }
        .pv3-btn-pase {
          display: inline-flex; align-items: center; gap: 12px;
          min-height: 56px; padding: 0 26px;
          border: none; border-radius: 999px;
          background: ${A.primary}; color: #fff;
          font-family: inherit; font-size: 17px; font-weight: 400;
          white-space: nowrap; cursor: pointer;
          transition: background .15s, transform .15s;
        }
        .pv3-btn-pase b { font-weight: 700; }
        /* Separador fino: divide días de precio sin sumar un signo más para leer */
        .pv3-btn-sep { width: 1px; height: 17px; background: rgba(255,255,255,0.42); }
        .pv3-btn-precio { font-variant-numeric: tabular-nums; }
        .pv3-btn-pase:hover { background: ${A.primaryDark}; transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) {
          .pv3-btn-pase { transition: background .15s; }
          .pv3-btn-pase:hover { transform: none; }
        }

        /* ─── Slide 2: "Pases de regalo" (ex-segundo acto/HeroCoupons) ───
           Reemplaza a .hc__stage (position:sticky) — acá no hace falta otro
           sticky, .pv3-hero ya lo es. position:absolute + inset:0 le da a
           .coupon-rain (position:absolute + inset:0 propio, ver
           hero-coupons.css) el contenedor posicionado que necesita;
           display:flex + align-items:center cumple el mismo rol que
           .hc__stage cumplía para centrar .hc__inner verticalmente.
           z-index bien alto: por encima de .pv3-slide-catalogo entero.
           (2026-08-10: dejó de vivir siempre en inset:0 con los grupos de
           adentro en opacity:0 —así se ocultaba antes, atado al progreso
           del pin—. Ahora arranca afuera de pantalla del todo
           (translateX(100%)) y entra con .pv3-regalo-abierto, en el mismo
           movimiento que .pv3-slide-catalogo sale hacia la izquierda —ver
           esa regla, más arriba—. pointer-events seguía en 'none' acá
           siempre: sin él, aun off-screen, sus hijos con position propia
           podían quedar clickeables por encima de todo.) */
        .pv3-hc-stage {
          /* hero-coupons.css usa estas cuatro variables (definidas antes en
             .hc, que ya no se renderiza acá) — mismos valores que A de
             arriba, es la misma paleta duplicada entre los dos archivos. */
          --hc-primary: ${A.primary};
          --hc-primary-dark: ${A.primaryDark};
          --hc-ink: ${A.ink};
          --hc-ink2: ${A.ink2};
          position: absolute; inset: 0;
          z-index: 6;
          display: flex; align-items: center;
          /* clip y no hidden, mismo motivo que .pv3-hero y .pv3-galwin: hidden
             lo convertía en un scroll container del tamaño del hero entero. */
          overflow: clip;
          pointer-events: none;
          transform: translateX(100%);
          transition: transform .65s cubic-bezier(.65,0,.35,1);
          /* Este panel está corrido fuera de pantalla casi siempre, pero su
             contenido no era gratis por estar afuera: son 42 nodos, 12 cupones
             —11 con filter: blur() propio, de 0.5 a 5.6px— y 16 elementos con
             will-change permanente, o sea 16 capas promovidas que nunca se
             sueltan, todo apilado en z-index 6 encima del hero. Con
             content-visibility el navegador saltea el renderizado del subárbol
             mientras está fuera de la ventana y lo retoma solo cuando el slide
             lo trae. No hace falta contain-intrinsic-size: el tamaño sale de
             inset: 0, no del contenido, así que no hay salto al volver. */
          content-visibility: auto;
        }
        .pv3-regalo-abierto .pv3-hc-stage { transform: translateX(0); pointer-events: auto; }
        /* Botón de volver — cae sobre la misma vertical que el título y las
           opciones: el margen del sidebar más su padding-inline (ver
           --gp-margen y .gp-panel en hero-coupons.css). z-index 3 lo pone por
           encima del panel, que ocupa esa esquina. */
        .pv3-regalo-cerrar {
          position: absolute;
          top: 28px; left: calc(var(--gp-margen, 0px) + 44px);
          z-index: 3;
          display: grid; place-items: center;
          width: 40px; height: 40px;
          border: none; border-radius: 50%;
          background: rgba(11, 16, 32, 0.06);
          color: ${A.ink};
          cursor: pointer;
          transition: background .15s ease;
        }
        .pv3-regalo-cerrar:hover { background: rgba(11, 16, 32, 0.12); }
        /* Los tres grupos del panel (logo+ceja+título / subtítulo / botón,
           ver PANEL_G1/G2/G3 arriba del componente y el useEffect dedicado
           que los anima) arrancan con pointer-events:none por default acá
           hasta que cada uno pasa a 'auto' por su cuenta, ya bastante
           visible — el botón (adentro de .hc__opciones) hereda el de su
           grupo, no necesita su propia regla. */
        .pv3-hc-stage .pv3-hc-g1,
        .pv3-hc-stage .hc__sub,
        .pv3-hc-stage .hc__opciones {
          pointer-events: none;
        }
        /* will-change SÓLO con el panel abierto (2026-08-12) — ver la nota
           larga junto a .pv3-regalo-abierto .coupon en hero-coupons.css.
           Estos tres son los que anima la rampa de PANEL_G1/G2/G3, y esa
           rampa corre únicamente cuando regaloAbierto pasa a true. */
        .pv3-regalo-abierto .pv3-hc-stage .pv3-hc-g1,
        .pv3-regalo-abierto .pv3-hc-stage .hc__sub,
        .pv3-regalo-abierto .pv3-hc-stage .hc__opciones {
          will-change: opacity, transform;
        }

        /* ─── Galería ─────────────────────────────────────────
           La ventana es MÁS ANCHA que el bloque de fotos a propósito: el
           sobrante de la izquierda es la zona donde el fundido las disuelve,
           así el borde visible es el del propio bloque —inclinado como todo lo
           demás— y no el corte vertical del contenedor. Ese sobrante además es
           la zona de solape: el texto (z-index 2) pasa por encima de fotos ya
           casi transparentes.
           --colw al 75% del original (190/21vw/300 → 142/15.75vw/225): celdas
           más chicas entran más por columna a la misma altura de viewport, así
           que el mismo scroll muestra más fotos distintas en vez de menos
           celdas más grandes repitiendo antes de completar el loop. */
        .pv3-galwin {
          --gap: 16px;
          --colw: clamp(142px, 15.75vw, 225px);
          --blockw: calc(${NUM_COLS} * var(--colw) + ${NUM_COLS - 1} * var(--gap));
          position: absolute;
          top: 0;
          bottom: 6px;
          right: 0;
          width: calc(var(--blockw) * 1.45);
          /* clip y no hidden, por lo mismo que .pv3-hero: esta ventana ocupa
             media pantalla y con hidden era otro scroll container inútil en
             el camino de la rueda. */
          overflow: clip;
          z-index: 0;
          pointer-events: none;
          -webkit-mask-image: linear-gradient(${FADE_ANGLE}deg, transparent ${FADE_START}%, #000 ${FADE}%);
                  mask-image: linear-gradient(${FADE_ANGLE}deg, transparent ${FADE_START}%, #000 ${FADE}%);
        }
        .pv3-gallery {
          position: absolute;
          width: var(--blockw);
          right: -${OVERHANG}px;
          top: -${BUFFER}px;
          bottom: -${BUFFER}px;
          display: flex;
          gap: var(--gap);
          transform: rotate(${TILT}deg);
        }
        /* ─── Entrada de la galería, en cascada y PRIMERA de todo ───
           (2026-08-10, a pedido, tomando como referencia el parallax por
           columnas de skiper-ui/skiper30.) Antes la galería estaba servida
           desde el primer frame y el ojo no llegaba a registrarla: entraba
           junto con todo lo demás. Cada columna entra por separado, con
           --gal-paso entre una y otra, que es lo que la hace legible como
           galería y no como un bloque que aparece.
           Abre la entrada y corre SOLA (2026-08-14): ver la nota del reloj en
           .pv3-hero. El escalonado sale de --col-i (el índice, puesto en el
           JSX) por --gal-paso, y no de un delay ya calculado en JS: el tiempo
           entero vive en CSS y no hay dos mitades que se puedan desfasar.
           Cada una entra DESDE el lado hacia el que después va a driftear
           (--col-from, ver el JSX): así el gesto de entrada y el movimiento
           continuo se leen como uno solo. El blur de salida es lo que le da
           la sensación de profundidad de la referencia — es corto y sobre
           tres elementos, no sostenido.
           La opacidad de llegada es var(--col-op) y no 1: estas columnas
           tienen opacidades de reposo distintas (ver COL_META) y una
           animación con fill-mode 'both' congela el último keyframe por
           encima de cualquier valor de reposo, así que si terminara en 1 se
           comería esa gradación de profundidad. */
        .pv3-col  { flex: 1 1 0; opacity: 0; }
        @keyframes pv3ColIn {
          from { opacity: 0; transform: translate3d(0, var(--col-from, 90px), 0) scale(0.94); filter: blur(6px); }
          to   { opacity: var(--col-op, 1); transform: translate3d(0, 0, 0) scale(1); filter: blur(0); }
        }
        .pv3-listo .pv3-col {
          animation: pv3ColIn var(--gal-dur) cubic-bezier(.16, 1, .3, 1) calc(var(--col-i, 0) * var(--gal-paso)) both;
        }
        /* La clase la pone el listener de animationend (ver el useEffect que
           la agrega). NO es cosmético: con fill-mode 'both' el último keyframe
           queda CONGELADO para siempre, y ese keyframe incluye filter:blur(0).
           Un filter distinto de 'none' —aunque sea un blur de cero— obliga al
           navegador a mandar el elemento por el pipeline de filtros en cada
           composición. Eran tres columnas de 429x1215 (1,5 millones de px², x4
           en pantalla retina) pasando por un filtro que no hace nada, 60 veces
           por segundo, porque adentro driftean sin parar. Matar la animación
           al terminar devuelve filter a 'none'; la opacidad de reposo, que era
           lo único que el fill tenía que sostener, se declara acá.
           El selector lleva .pv3-listo adelante a propósito: tiene que empatar
           en especificidad con la regla de arriba (0,2,0) para poder pisarla
           por orden. Con .pv3-col--fin solo (0,1,0) la clase entraba pero no
           cambiaba nada — se verificó en el navegador. */
        .pv3-listo .pv3-col--fin { animation: none; opacity: var(--col-op, 1); }
        .pv3-coldrift { display: flex; flex-direction: column; will-change: transform; }
        /* El radio se redondea en la IMAGEN, no recortando la celda. El
           overflow:hidden que había acá abría 34 clips de subárbol —uno por
           foto— dentro de un grupo que además está rotado y enmascarado, que
           es donde los clips redondeados salen más caros. Con border-radius
           heredado en el <img> se ve exactamente igual y no hay clip: la
           imagen se pinta redondeada y listo. El radio queda igual en la celda
           porque el box-shadow sigue su forma. */
        .pv3-cell { flex: 0 0 auto; margin-bottom: 16px; border-radius: 20px; }
        .pv3-cell img { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: inherit; }

        .pv3-mobile-deco { display: none; }

        @media (max-width: 1180px) {
          /* Layout angosto = una sola columna centrada, sin "derecha" de la
             que colgarse. */
          .pv3-hero { min-height: 0; overflow: visible; }
          /* El slide de "Pases de regalo" —ver .pv3-regalo-abierto, más
             arriba— es cosa de escritorio: acá no hay galería al lado que
             justifique correr nada fuera de pantalla, así que las dos
             mitades se resetean a su posición normal sin importar
             regaloAbierto (el useEffect que las anima ya deja los inline
             styles en '' en mobile, ver la nota junto a hcG1Ref) — sólo
             falta anular el transform de la regla base, que no depende de
             esos inline. */
          .pv3-slide-catalogo, .pv3-hc-stage { transform: none; }
          /* La caja del paso 1 también es cosa de escritorio: acá el click en
             "Regalá pases" salta directo a regaloAbierto (ver el onClick en
             el JSX, la rama sin activo), así que giftAbierto nunca debería
             quedar en true en este ancho — pero por si el viewport se achica
             CON la caja ya abierta (achicar la ventana en vivo), display:none
             la saca sin depender de que el estado se resetee solo. */
          .pv3-gift-drawer, .pv3-gift-scrim { display: none; }
          .pv3-left-stage { height: auto; }
          /* width/max-width: en desktop .pv3-left-var se desborda a propósito
             (640px sobre una columna de ~340, ver su nota arriba); acá vuelve
             a flujo normal y tiene que ceñirse a la única columna que hay. */
          .pv3-left-var {
            position: static; transform: none; opacity: 1; pointer-events: auto;
            width: 100%; max-width: 100%;
          }

          /* El grid de tres columnas es cosa de escritorio: acá colapsa a una
             sola, centrada, y las celdas se apilan en el orden del JSX. */
          .pv3-inner {
            grid-template-columns: minmax(0, 1fr);
            justify-items: center;
            text-align: center;
            padding: 132px 24px 56px;
            min-height: 0;
          }
          .pv3-left { display: flex; flex-direction: column; align-items: center; max-width: 620px; }
          /* Título: clamp propio y más chico acá (2026-08-12), no el de la
             regla base. La regla base tiene un cruce vw/mínimo recién
             arriba de los 1218px de ancho —por debajo, que es TODO este
             breakpoint, el tamaño queda pinneado en el mínimo (57.5px /
             39px)—, y ese mínimo se pensó para desktop, no para que
             explote en un teléfono de 360px. Estos clamp aparte retoman el
             +21.7% pedido (mismo factor que la regla base) pero sobre los
             valores que este breakpoint ya usaba, con piso propio para
             pantallas angostas. */
          .pv3-t-it { font-size: clamp(30px, 8vw, 47.5px); }
          /* -15% acá también (2026-08-12), mismo motivo que la regla base:
             21/5.6vw/33.5 × 0.85. */
          .pv3-t-bold, .pv3-t-ticker { font-size: clamp(18px, 4.76vw, 28.5px); }
          /* Centrada contra la columna, sin más — el max-width de la regla
             base (420px) ya le alcanza acá también, así que sólo hace
             falta el margin-inline:auto. */
          .pv3-accesos { margin-inline: auto; }
          /* En la regla base es la celda 2 del grid, asentada abajo con
             align-self:end + margin-bottom (ver su nota): acá, apilada bajo
             .pv3-left en una sola columna, ese margen de abajo dejaría un
             hueco enorme antes del panel siguiente y el aire hace falta
             ARRIBA, separándola de los accesos. */
          .pv3-cta-full { max-width: 620px; margin: 28px auto 0; }
          /* "Conocé todas las ofertas" en desktop es position:absolute
             contra .pv3-inner (ver esa regla, arriba) — acá, con una sola
             columna centrada y todo apilado, tiene que volver a flujo
             normal: position:static la devuelve a la posición que le toca
             en el DOM (después de .pv3-cta-full), centrada como el resto,
             con su propio margin-top en vez del left/bottom que la
             anclaban al padding de .pv3-inner (acá ya no hay "misma fila"
             que compartir con los botones de pase, quedó apilada debajo). */
          .pv3-acceso--ofertas { position: static; margin: 20px auto 0; }
          .pv3-galwin { opacity: 0.5; --colw: clamp(112px, 15vw, 165px); }
          /* "Pases de regalo": sin pin no hay slide que animar, así que pasa
             a flujo normal, siempre visible, debajo de todo lo demás —igual
             que antes de que existiera el click, ver la nota junto a
             hcG1Ref—. pointer-events:auto por !important porque el
             useEffect que anima este panel resetea el inline a '' acá (sin
             pin) y sin esto caía en el pointer-events:none de la regla base
             de escritorio, dejando el botón declickeable. El botón de
             volver no tiene nada que cerrar acá (el panel ya está siempre
             abierto): se oculta. */
          .pv3-hc-stage {
            position: static; display: block; overflow: visible;
            margin-top: 48px; padding-bottom: 56px;
          }
          .coupon-rain { display: none; }
          .pv3-hc-stage .hc__copy { pointer-events: auto !important; }
          .pv3-regalo-cerrar { display: none; }
        }
        @media (max-width: 760px) {
          .pv3-galwin { display: none; }
          .pv3-mobile-deco { display: block; position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        }
        @media (max-width: 560px) {
          /* Los dos pases pasan a ocupar el ancho: en mobile la comparación se
             hace en vertical, uno debajo del otro. .pv3-pases-extra (ícono de
             gift pass + "¿Más días?") vuelve al flujo normal (era
             position:absolute para no pesar en el centrado del par, ver la
             nota junto a esa regla) y se apila como tercer elemento,
             centrado con el resto. */
          .pv3-opciones-botones { width: auto; flex-direction: column; align-items: stretch; gap: 12px; }
          .pv3-pases-par { flex-direction: column; gap: 12px; }
          .pv3-btn-pase { justify-content: center; }
          .pv3-pases-extra { position: static; transform: none; margin-left: 0; justify-content: center; gap: 16px; }
        }
      `}</style>
    </section>
  );
}
