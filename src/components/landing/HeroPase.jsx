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

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowLeft, ArrowDown, Gift, X } from 'lucide-react';
import Lenis from 'lenis';
import CouponRain from '../hero/CouponRain';
import PaSSMark from '../PaSSMark';
import CuponIcon from '../CuponIcon';
import CheckoutHoteleroView from '../../views/CheckoutHoteleroView';
import { COUPON_BASE_WIDTH } from '../hero/couponRain.config';
import { subProgress } from '../hero/useScrollProgress';
import { useLoading } from '../../lib/loading';
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
// `quien` va antes que `detalle` a propósito: primero que el que lee se
// reconozca ("soy esto"), después qué se lleva. Al revés obliga a deducir de la
// mecánica si la opción es para uno. En "persona" no hay `quien` — el título ya
// quedó corto ("Regalar un pase") y sumarle una línea de quién es le devolvía
// el peso de dos renglones que "Suscripción PRO" sí necesita para lo suyo.
//
// Cada opción ES el botón: clickearla arranca su camino, no la deja
// seleccionada esperando un "Continuar" (2026-08-11). Con dos opciones y sin
// nada que revisar entre elegir y seguir, el paso intermedio sólo sumaba un
// click. Por eso tampoco hay punto de radio: no es un formulario que se
// completa, son dos puertas.
//
// Sólo "empresa" lleva tag (2026-08-11 lo probó también en "persona" por
// simetría, pero el tag "Personas" ahí no aportaba nada que el título
// "Regalar un pase" no dijera ya, así que se sacó de nuevo). `tagColor` es
// el primary de la app — es la que lleva a otro producto (suscripción) y no
// al dorado de GIFT PaSS.
//
// `icono` es el SVG que va a la izquierda de cada opción (2026-08-11):
// gift-01 (etiqueta/porcentaje) para el regalo suelto, gift-02 (caja con
// moño) para la suscripción — la caja es la que de verdad regala EN SERIE.
const DESTINOS = [
  {
    id: 'persona',
    icono: '/gift-01.svg',
    titulo: 'Regalar un pase',
    detalle: 'Elegís cuántos días tendrá el catálogo a su disposición.',
  },
  {
    id: 'empresa',
    icono: '/gift-02.svg',
    titulo: 'Suscripción PRO',
    tag: 'Empresas',
    tagColor: A.primary,
    quien: 'Para hoteleros, agencias de turismo e inmobiliarias.',
    detalle: 'Obsequiás acceso a todos tus huéspedes. Desde $30.000 /mes adquirí tu membresía.',
  },
];

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
  // "¿Cuánto dura tu viaje?" y muestra la caja GIFT PaSS ahí mismo, sobre la
  // galería (ver .pv3-gift-inline). Elegir una de sus dos opciones es lo que
  // recién ahí dispara regaloAbierto, el slide grande que ya existía. Viven
  // separados porque son dos preguntas distintas: "¿mostrar la caja?" vs
  // "¿correr toda la pantalla?" — regaloAbierto puede estar en true con
  // giftAbierto en true (van juntos en el camino normal), pero no al revés.
  const [giftAbierto, setGiftAbierto] = useState(false);

  // Cuál de las dos está "abierta" (2026-08-12, tercera vuelta): sólo
  // depende de si el flujo de regalo está realmente abierto (la caja sobre
  // la galería o el slide grande) — YA NO del hover. Antes, pasar el mouse
  // por "Regalá cuponeras" despintaba a "Pases diarios" (bug reportado: "no
  // se despinte el botón que no se está presionando: queda en azul a pesar
  // de estar haciendo hover en el otro botón" — el cruce de hover era
  // justo lo que causaba eso). Ahora cada botón sólo reacciona a SU PROPIO
  // hover (CSS puro, :hover — ver .pv3-acceso:hover en el <style>, ya no
  // hace falta JS para esto), y regaloSeleccionado es lo único que decide
  // cuál de las dos está pintada de azul.
  const regaloSeleccionado = giftAbierto || regaloAbierto;

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
  // como bloque único, por CSS (ver .pv3-gift-inline).
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
  // driftAuto, más abajo) — nunca de window.scrollY. Cada columna recorre su
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

    const pintarColumnas = (drift) => {
      colRefs.current.forEach((nodo, i) => {
        const half = halfHeights.current[i];
        if (!nodo || !half) return;
        const { speed, dir } = COL_META[i];
        const recorrido = (drift * speed) % half;
        const offset = dir === 'up' ? -recorrido : -(half - recorrido);
        nodo.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    };

    medirAltos();
    const onResize = () => medirAltos();
    window.addEventListener('resize', onResize);

    if (reducedMotion) return () => window.removeEventListener('resize', onResize);

    const AUTO_DRIFT_PX_POR_MS = 0.03; // ritmo del drift de fondo de la galería
    let driftAuto = 0;
    let ultimoTiempo = performance.now();
    let continuoId = 0;
    let visible = true;
    let scrolleando = 0; // id del timeout que reanuda al parar el scroll (ver más abajo)

    const pasoContinuo = (now) => {
      continuoId = 0;
      const dt = Math.min(now - ultimoTiempo, 100); // tope por si la pestaña estuvo en background
      ultimoTiempo = now;
      driftAuto += dt * AUTO_DRIFT_PX_POR_MS;
      pintarColumnas(driftAuto);
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
  useEffect(() => {
    if (!regaloAbierto) return;
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
  }, [regaloAbierto]);

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
  useEffect(() => {
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
  // vía cerrarPaso2): .pv3-gift-inline ya está en opacity:0 todo este rato
  // —mientras regaloAbierto es true, ver esa regla en el <style>—, así que
  // no hay nada que "salte" ahí.
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
                '--col-delay': `${(0.95 + ci * 0.16).toFixed(2)}s`,
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
              position:absolute, el alto compensado del stage, .pv3-logo-slot
              con alto fijo— sigue funcionando para esta única variante, sólo
              que ahora no tiene con qué cruzarse. */}
          <div className="pv3-left-stage">
            <div className="pv3-left-var">
              {/* 1 · Marca del producto. Reemplaza a la pastilla "PASE TURISTA":
                     dice lo mismo y encima es la imagen que el turista va a
                     reconocer después en su Pase. Dejó de ser clickeable
                     (2026-08-11): era el disparador manual del navbar
                     escondido ('cuponear:navbar-reveal' en Navbar.jsx), pero
                     el navbar ya se revela solo con la dirección del scroll
                     (ver la nota junto a visiblePorScroll en Navbar.jsx), así
                     que el click acá era redundante y se prestaba a
                     confusión (nada en el ticket sugiere que sea un botón). */}
              <div className="pv3-logo-slot">
                <img className="pv3-ticket" src="/cupon-pass.svg" alt="Cupon PASS" />
              </div>

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

              {/* Accesos (2026-08-10, reordenados y re-skinneados 2026-08-11
                     tarde — ver el detalle de cada uno junto a .pv3-accesos
                     en el JSX de más abajo): "Pases diarios" y "Regalá
                     cuponeras" van agrupados arriba, "Conocé todas las
                     ofertas" queda suelto abajo y ya no navega —desliza la
                     home hasta "Cuponeá antes de pagar"—. Dorado sólo en
                     "Regalá cuponeras" (mismo dorado que el moño de
                     giftpass-logo.svg, el logo que ya usa el panel del
                     segundo slide — no es un color inventado); los otros dos
                     van en primary. "Pases de regalo" ya no navega directo
                     (ver giftAbierto/elegirDestino, arriba) — el
                     link "Regalá pases" que saltaba de posta (en
                     .pv3-opciones-links, más abajo) se sacó: ahora este es
                     el único acceso a esa suscripción. */}
              <div className="pv3-accesos">
                {/* Los dos van agrupados (7px entre sí, ver .pv3-accesos-top)
                    porque son el mismo tipo de cosa —pases—. "Conocé todas
                    las ofertas" ya no vive acá adentro (2026-08-12, se movió
                    a ser hermana directa de .pv3-cta-full para alinearse con
                    los botones de pase — ver esa nota, más abajo en el JSX,
                    junto a .pv3-mas-dias). */}
                <div className="pv3-accesos-top">
                  {/* Lógica de estados simplificada (2026-08-12, a pedido:
                      "no usar amarillo, azul/blanco con estados básicos"):
                      de los dos, uno está SIEMPRE abierto y el otro cerrado,
                      nunca los dos igual. regaloSeleccionado (si el flujo de
                      regalo está REALMENTE abierto) decide cuál — en reposo,
                      por default, es "Pases diarios" (clickearla siempre
                      lleva al mismo lugar, así que lee como la opción "en
                      curso"). Abierta = fondo primary, texto blanco, círculo
                      blanco con ícono primary. Cerrada = fondo blanco, texto
                      primary, círculo primary con ícono blanco (lógica
                      invertida a propósito, para que el círculo siempre
                      contraste con su propio fondo) — y sólo la cerrada
                      tiene hover (celeste al 15%, ver .pv3-acceso:hover en
                      el <style>; la abierta no cambia con el mouse encima,
                      .pv3-acceso--abierta:hover se lo pisa a propósito). El
                      hover de cada botón es sólo suyo —CSS puro— y no toca
                      al otro: hovereando "Regalá cuponeras" con "Pases
                      diarios" todavía abierta, "Pases diarios" se queda
                      exactamente como está. */}
                  <button
                    type="button"
                    className={`pv3-acceso pv3-acceso--pases${regaloSeleccionado ? '' : ' pv3-acceso--abierta'}`}
                    onClick={() => onComprarPase?.('custom')}
                  >
                    <span className="pv3-acceso-titulo">Pases diarios</span>
                    <span className="pv3-acceso-flecha" style={{ background: regaloSeleccionado ? A.primary : '#fff', color: regaloSeleccionado ? '#fff' : A.primary }} aria-hidden="true">
                      <CuponIcon size={14} />
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`pv3-acceso pv3-acceso--regalo${regaloSeleccionado ? ' pv3-acceso--abierta' : ''}`}
                    onClick={() => {
                      // En desktop, el click abre el PASO 1: la caja GIFT PaSS
                      // sobre la galería (ver .pv3-gift-inline), no el slide
                      // completo todavía — eso lo dispara elegir una opción
                      // adentro (ver onElegirDestino, más abajo).
                      //
                      // En mobile/reduced-motion no hay galería sobre la que
                      // superponer nada (ver .pv3-gift-inline, neutralizado en
                      // ese breakpoint) ni slide que abrir (.pv3-regalo-abierto
                      // también neutralizado ahí) — el panel completo ya está
                      // siempre visible en flujo normal, así que se salta el
                      // paso 1 entero: va directo a regaloAbierto y el click
                      // sólo trae la caja a pantalla con scroll suave, mismo
                      // fallback que ya usaba "Regalá pases" antes de sacarse.
                      const activo = (window.matchMedia?.('(min-width: 1181px)').matches ?? false) && !reducedMotion;
                      if (activo) {
                        setGiftAbierto(true);
                      } else {
                        setRegaloAbierto(true);
                        document.querySelector('.gp-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }}
                  >
                    <span className="pv3-acceso-texto">
                      <span className="pv3-acceso-titulo">Regalá cuponeras</span>
                    </span>
                    {/* Regalito, no flecha: este acceso es el único de los
                        tres que lleva a un regalo, no a un catálogo ni a los
                        pases — el ícono lo dice antes de leer el texto. Ya no
                        es dorado fijo (2026-08-12, se sacó el amarillo de
                        esta botonera): mismo círculo invertido que "Pases
                        diarios" — blanco+ícono primary cuando ESTA es la
                        abierta, primary+ícono blanco cuando está cerrada. */}
                    <span className="pv3-acceso-flecha" style={{ background: regaloSeleccionado ? '#fff' : A.primary, color: regaloSeleccionado ? A.primary : '#fff' }} aria-hidden="true">
                      <Gift size={14} strokeWidth={2.5} />
                    </span>
                  </button>
                </div>
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
          <p className="pv3-pretitulo">
            ¿Cuánto dura <span className="pv3-pretitulo-it">tu viaje?</span>
          </p>

          <p className="pv3-pase-caption">
            Cualquier pase te da acceso al catálogo de descuentos completo<br />
            Tenés un cupón <b>PREMIUM</b> a elección por día.
          </p>

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
              <button className="pv3-mas-dias" onClick={() => onComprarPase?.('custom')}>
                ¿Más días?
              </button>
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
            <ArrowDown size={14} strokeWidth={2.5} />
          </span>
          <span className="pv3-acceso-titulo">Conocé todas las ofertas</span>
        </button>

        {/* ─── Paso 1: la caja GIFT PaSS sobre la galería ───────────────
            (2026-08-11) Clickear "Regalá pases" ya no salta directo al slide
            completo de más abajo (.pv3-hc-stage): primero dissuelve
            .pv3-cta-full ("¿Cuánto dura tu viaje?", justo arriba) y muestra
            ESTA caja en su lugar, superpuesta a la galería de fotos. Vive
            DENTRO de .pv3-inner —hermana de .pv3-cta-full, mismo nivel— para
            posicionarse con los mismos números que usa .pv3-inner para su
            propio padding (ver .pv3-gift-inline en el <style> para el
            porqué de 680/40/130/56 en vez de --pv3-lado); y dentro de
            .pv3-slide-catalogo, así que viaja junto con TODO lo demás cuando
            el paso 2 arranca el slide grande (no hace falta ocultarla aparte
            en ese momento).
            Reutiliza .gp-panel tal cual (mismo look que la del paso 2) pero
            SIN .gp-wrap: acá no hace falta el alto:100% de sidebar, es una
            tarjeta flotando centrada sobre la galería, con su propio alto de
            contenido. La entrada es un fade simple por CSS
            (.pv3-gift-abierto .pv3-gift-inline), no la cascada de tres
            grupos del paso 2 — es una aparición más chica, no la escena
            completa. */}
        <div className="pv3-gift-inline" aria-hidden={!giftAbierto || regaloAbierto}>
          <div className="gp-panel">
            <button type="button" className="gp-gift-cerrar" onClick={() => setGiftAbierto(false)} aria-label="Cerrar">
              <X size={18} strokeWidth={2.5} />
            </button>
            <div className="gp-cabezal">
              <h2 className="gp-titulo">
                <PaSSMark size={30} conGesell prefijo="GIft" color={DORADO_GIFT} />
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
              {renderOpcionesDestino()}
            </div>
          </div>
        </div>

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
                  <PaSSMark size={30} conGesell prefijo="GIft" color={DORADO_GIFT} />
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
          .pv3-logo-slot, .pv3-t-it, .pv3-t-bold, .pv3-t-ticker {
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
        .pv3-hero { position: relative; min-height: 100vh; overflow-x: clip; }

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
          max-width: 1328px;
          margin: 0 auto;
          padding: 130px 40px 56px;
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
        /* top: 30px - 80px - 14px = -64px — todo el bloque (ticket a
           botones) 80px más arriba, y encima 14px más (a pedido, "subir
           unos px el headline"), sumado a que ya subió solo al sacarse la
           ceja de localidades que colgaba entre el ticket y el título.
           width explícito (antes era left:0/right:0, o sea el ancho de la
           columna): con el grid de tres columnas la columna 1 pasó a medir
           --pv3-lado (~340px máx), y el título necesita bastante más que eso
           para que "un pase, todos los descuentos" entre en una línea. Como
           esto es position:absolute, ese excedente se desborda sobre la
           columna del medio sin empujarla ni robarle ancho — y no se pisa
           con nada porque el bloque del medio arranca más abajo. */
        .pv3-left-var {
          position: absolute; left: 0; top: -64px;
          width: 640px; max-width: calc(100vw - 80px);
        }

        /* 1 · Ticket-marca. Ya viene inclinado de fábrica en el propio SVG,
           en el mismo sentido que la galería (-10°) pero con bastante más
           gesto — no se rotula por CSS. .pv3-logo-slot le fija un alto
           reservado antes del título —era para que el ticket y el sello de
           rating de la ex-variante socio arrancaran el título en la misma
           línea pese a medir distinto; hoy es la única imagen del bloque,
           pero se deja igual por si vuelve a convivir con algo más acá.
           Dejó de ser un <button> (ver el JSX): sin cursor:pointer ni
           padding/border de reset, que ya no hacen falta con un <div>.
           margin-left negativo a propósito, distinto del resto de la
           columna: en el boceto el ticket cuelga más a la izquierda que el
           párrafo de texto, no de la misma línea — alinearlos de más
           quedaba "contracturado". Valor a ojo contra el boceto, sin poder
           verificarlo en vivo — ajustar si no calza. */
        .pv3-logo-slot {
          height: 130px; display: flex; align-items: flex-end; margin: 0 0 28px -40px;
          opacity: 0;
        }
        /* .pv3-listo: se agrega recién cuando termina el loading general
           (ver useLoading()/showLoading()/hideLoading() en el useEffect de
           arriba) — antes de eso estos cuatro quedan en opacity:0 quietos,
           sin animar (si el CSS de animation corriera desde el montaje, ya
           habría terminado de tapado por la pantalla de carga, y al
           destaparse se verían aparecer de golpe en vez de animados). */
        .pv3-listo .pv3-logo-slot { animation: pv3FadeUp .5s ease-out .1s both; }
        .pv3-ticket { width: 200px; height: auto; display: block; }

        /* 2 · Título. Entra con el mismo fade del resto del bloque —ver nota
           arriba de por qué se sacó el efecto máquina de escribir—, .pv3-t-it
           un toque antes que .pv3-t-bold para que se lea como una sola
           frase cayendo en cascada, no como dos bloques separados. Sin la
           ceja de localidades (se sacó, ver el JSX) el título arranca más
           arriba —eso solo, más los -14px extra en .pv3-left-var, es el
           "subir unos px" que se pidió. */
        .pv3-title { position: relative; margin: 0; line-height: 1.12; letter-spacing: 0; }
        .pv3-title > span { display: block; }
        /* +15% de tamaño a pedido (clamp original: 34px/4.1vw/50px). */
        .pv3-t-it {
          font-style: italic; font-weight: 300; color: ${A.ink}; font-size: clamp(39px, 4.72vw, 57.5px);
          opacity: 0;
        }
        .pv3-listo .pv3-t-it { animation: pv3FadeUp .5s ease-out .34s both; }
        .pv3-nauryz { font-family: ${NAURYZ}; font-style: normal; font-weight: normal; color: ${A.primary}; font-size: 0.8em; }
        /* Un poco más chico que en A (38px): el remate cierra el título, pero el
           siguiente nivel necesita aire para leerse como nivel 2. +15% acá
           también (clamp original: 24px/3.4vw/34px). */
        .pv3-t-bold {
          font-weight: 600; color: ${A.ink}; font-size: clamp(27.5px, 3.91vw, 39px); margin-top: 0.18em;
          opacity: 0;
        }
        .pv3-listo .pv3-t-bold { animation: pv3FadeUp .5s ease-out .46s both; }

        /* 3 · "en [rubro]" — tercera línea, nueva (2026-08-09). Mismo peso
           que .pv3-t-bold (es la continuación de esa misma frase, no un
           nivel nuevo), el rubro en primary para que se distinga de "en".
           Entra un paso después que .pv3-t-bold, misma cascada. */
        .pv3-t-ticker {
          font-weight: 600; color: ${A.ink}; font-size: clamp(27.5px, 3.91vw, 39px); margin-top: 0.18em;
          opacity: 0;
        }
        .pv3-listo .pv3-t-ticker { animation: pv3FadeUp .5s ease-out .58s both; }
        .pv3-listo .pv3-accesos { animation: pv3FadeUp .5s ease-out .7s both; }
        /* El span en sí no tiene ancho propio más que el de "en " — el que
           cambia de ancho al tipear/borrar es .pv3-ticker-word, adentro. */
        .pv3-ticker-word {
          display: inline-block;
          color: ${A.primary};
          transition: clip-path .45s cubic-bezier(.65,0,.35,1);
          will-change: clip-path;
        }

        /* Accesos nuevos (2026-08-10), bajo el título. Misma columna, uno
           debajo del otro —no dos columnas de la misma fila: eso fue un
           intento intermedio para el bug de la flecha pisando el título,
           pero el bug era otro (ver la nota junto a .pv3-cta-full, más
           abajo: vivía centrada contra la página entera y se metía debajo
           de esta columna) — con .pv3-cta-full ya resuelta, esta lista
           apilada con divisor horizontal es la que pide el boceto: texto a
           la izquierda, flecha en círculo pegada al borde derecho de la
           fila (max-width acá abajo). */
        /* max-width 300 (antes 420): con justify-content:space-between, todo
           el ancho de más se convertía en hueco entre el texto y la flecha
           —se leían como dos cosas sueltas en vez de una fila—. Además es la
           medida que fija de hecho el ancho útil de la columna 1: es lo único
           que comparte banda vertical con el bloque del medio, así que
           cuanto más angosta, más ancho libre queda para que los dos botones
           de pase entren en una sola fila. */
        /* Atados a --pv3-lado y no a un ancho suelto: los accesos viven
           dentro de .pv3-left-var, que se desborda a 640px a propósito (ver
           su nota), así que NO están limitados por el ancho de su columna
           —con un max-width suelto de 300px se metían 16px adentro de la
           celda del medio en viewports angostos—. Tomar exactamente el ancho
           de la columna los mantiene dentro en todo el rango. */
        /* Achicados y con menos interlínea (2026-08-11, a pedido): con tres
           accesos el gap de 8px + el tamaño original (padding 10px, título
           16px, círculo de 34px) leía como tres tarjetas sueltas, no como un
           bloque. gap:2px con el propio padding vertical de cada botón (6px
           en vez de 10px) es lo que da el aire real entre uno y otro —así se
           lee como un índice/menú compacto, no como three cards apiladas. */
        .pv3-accesos {
          margin-top: 28px; width: 100%; max-width: var(--pv3-lado); opacity: 0;
          display: flex; flex-direction: column;
        }
        /* "Pases diarios" y "Regalá cuponeras" son el mismo tipo de cosa
           (pases) y van agrupados con poco aire entre sí. 7px = los 2px que
           tenía el gap original más los 5px pedidos de más. */
        .pv3-accesos-top {
          display: flex; flex-direction: column; gap: 7px;
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
        /* Especificidad (2026-08-12): los modificadores de acá para abajo
           van encadenados a ".pv3-acceso" (".pv3-acceso.pv3-acceso--x" en
           vez de ".pv3-acceso--x" solo) a propósito — un bug real: con un
           solo nivel de clase, un modificador (0,1,0) perdía contra el
           genérico ".pv3-acceso:hover" (0,2,0) de más abajo apenas el mouse
           quedaba encima (p.ej. clickeando "Regalá cuponeras", el cursor le
           queda arriba). Con ".pv3-acceso.pv3-acceso--x" la especificidad
           sube a (0,2,0) o (0,3,0) con :hover encadenado, así que gana
           siempre, sin importar el orden de las reglas en la hoja.
           Estados básicos, sin amarillo (2026-08-12, a pedido: "azul es
           abierta, blanco apagada"): entre "Pases diarios" y "Regalá
           cuponeras" siempre hay una abierta y una cerrada, nunca las dos
           igual (ver regaloSeleccionado en el componente, que decide
           cuál). ABIERTA: fondo primary, texto blanco — el círculo
           se resuelve aparte, por style inline en el JSX (mismo dato que
           decide esta clase), porque también tiene que invertirse en el
           ÍCONO (Gift vs CuponIcon) y no sólo en el fondo. CERRADA es la
           ausencia de esta clase: fondo blanco (ver la regla base,
           .pv3-acceso) con hover en primary clarito — el mismo
           .pv3-acceso:hover de siempre, ya le alcanza, no hace falta una
           regla nueva. */
        .pv3-acceso.pv3-acceso--abierta {
          background: ${A.primary}; border-color: transparent;
        }
        .pv3-acceso.pv3-acceso--abierta .pv3-acceso-titulo { color: #fff; }
        /* Sin :hover propio a propósito ("el hover sólo aplica al
           fondito blanco", a pedido): la abierta ya está pintada como tal,
           un hover encima sugería que hay algo más para activar. */
        .pv3-acceso.pv3-acceso--abierta:hover { background: ${A.primary}; }
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
             ahí, antes de descontar el padding. 40px y 56px son
             exactamente el padding-left/padding-bottom de .pv3-inner (ver
             esa regla): con eso, el origen pasa a ser el mismo que ya usa
             la columna 1 y el mismo piso que usa .pv3-cta-full con
             align-self:end. */
          position: absolute; left: 40px; bottom: 56px;
          border-color: transparent;
          justify-content: flex-start; gap: 10px;
          width: auto; padding: 4px 0;
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
        .pv3-acceso-titulo { font-size: 14px; font-weight: 700; color: ${A.primary}; }
        .pv3-acceso-sub { font-size: 11.5px; font-weight: 500; color: ${A.ink2}; font-style: italic; }
        /* Círculo con la flecha — mismo tamaño para los tres, sólo cambia el
           color de fondo (pasado por style inline en el JSX: primary para
           catálogo y "Pases diarios", el dorado de giftpass-logo.svg para
           "Pases de regalo"). El ícono (lucide) hereda blanco vía
           currentColor. */
        .pv3-acceso-flecha {
          flex-shrink: 0;
          display: grid; place-items: center;
          width: 26px; height: 26px;
          border-radius: 50%;
          color: #fff;
        }

        /* "¿Cuánto dura tu viaje?" — ver la nota fechada 2026-08-10 junto a
           TEXTO_ENTER, en el useEffect: se mudó adentro de .pv3-cta-full
           (más abajo), que ya es text-align:center, así que no necesita
           ningún centrado propio. Una sola línea (antes dos, con <br/>),
           mismo peso visual que tenía. */
        .pv3-pretitulo {
          margin: 0 0 14px;
          font-weight: 650; font-size: clamp(24px, 2.4vw, 30px); line-height: 1.25;
          color: ${A.primary};
        }
        .pv3-pretitulo-it { font-style: italic; font-weight: 500}

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
        .pv3-listo .pv3-cta-full { animation: pv3FadeUp .5s ease-out .82s both; }
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
           lo contrario (2026-08-12): que quede blureado "por detrás" del
           bloque blanco, en vez de irse del todo. Sin opacity (2026-08-12,
           segunda vuelta: "no le pongas transparencia porque queda raro
           sobre la galería") — sólo el blur lo saca de foco, a media asta
           (3px, antes 6px, "no lo blurees tanto"); pointer-events:none lo
           saca de la interacción igual, sin hacer falta bajarle la opacidad.
           saturate(0.4) (2026-08-12, tercera vuelta, a pedido: "desaturar
           levemente todo color primary que haya en ese bloque") — el CSS
           filter no puede apuntar a un color puntual, así que desatura el
           bloque entero; en la práctica lo único con saturación ahí son los
           dos botones de pase (primary) y el texto en cursiva, que es
           exactamente lo que se pidió atenuar. Sólo filter en la transition
           (2026-08-12): opacity/animation ya quedaron resueltos por
           .pv3-cta-full--asentada, arriba, así que blurear/desblurear y
           saturar/desaturar es lo único que anima acá, siempre suave, nunca
           un salto. */
        .pv3-gift-abierto .pv3-cta-full {
          filter: blur(3px) saturate(0.4);
          pointer-events: none;
          transition: filter .4s ease;
        }
        @media (prefers-reduced-motion: reduce) {
          .pv3-gift-abierto .pv3-cta-full { transition: none; filter: none; }
        }

        /* La caja GIFT PaSS del paso 1 — ver el JSX, hermana de .pv3-cta-full.
           left: 720px, NO calc(--pv3-lado + gap). --pv3-lado es el ancho de la
           columna VIRTUAL del grid (máx 340px), pero el título/ticket
           (.pv3-left-var) se desborda a propósito hasta 640px de ancho real
           —ver su nota—, bastante más allá de esa columna. Con el cálculo
           viejo la caja arrancaba a los ~364px y pisaba el título de lleno.
           720 = 40 (padding izq. de .pv3-inner, donde arranca .pv3-left-var)
           + 640 (su desborde real) + 40 de aire — medido desde el mismo
           origen que .left en .pv3-gift-inline: la caja de PADDING de
           .pv3-inner, que es el contexto de posicionamiento de los dos.
           Verificado en pantalla: con 680 (sin el aire) tocaban borde a
           borde, cero separación. right: 40px por la misma razón, simétrico.
           top/bottom: 0/0, NO el padding vertical de .pv3-inner (130px/56px,
           lo que tenía antes). Esa columna (desde left:720px) no tiene nada
           arriba —el padding-top de 130px es aire reservado para el
           ticket/título de la columna de la izquierda, no contenido de acá—,
           así que restarlo corría el centrado hacia abajo (37px, la mitad de
           la diferencia entre 130 y 56): la caja quedaba visiblemente "baja"
           contra el alto real de .pv3-inner, que es lo que el ojo compara.
           Centrando contra la caja completa (0/0) el centro coincide con el
           de la columna vacía real.
           z-index 3: por encima de la galería (0) y de .pv3-cta-full, que en
           este momento ya se está disolviendo debajo. */
        .pv3-gift-inline {
          position: absolute;
          left: 720px;
          right: 40px;
          top: 0;
          bottom: 0;
          z-index: 3;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 0;
          box-sizing: border-box;
          opacity: 0;
          pointer-events: none;
          transition: opacity .45s ease .12s;
        }
        .pv3-gift-abierto .pv3-gift-inline { opacity: 1; pointer-events: auto; }
        /* Une vez que arrancó el paso 2, la caja del paso 1 deja de ser
           clickeable — va DESPUÉS de la regla de arriba (misma especificidad,
           gana por orden) para pisarle el pointer-events mientras las dos
           clases conviven durante el slide. Sin esto, sus botones seguían
           respondiendo —y podían disparar elegirDestino() de nuevo— mientras
           la caja ya estaba yéndose de la pantalla.
           opacity:0 sumado acá (2026-08-12, bug reportado: "toma carrera",
           un salto hacia atrás antes de ir hacia adelante): esta caja vive
           DENTRO de .pv3-slide-catalogo a propósito —ver la nota grande más
           arriba, "viaja junto con TODO lo demás"—, así que al arrancar el
           slide sale arrastrada hacia la IZQUIERDA (translateX(-100%) del
           padre) justo cuando el panel nuevo entra por la DERECHA: quien
           acababa de clickear ahí veía su propio click huir para el lado
           contrario antes de que llegara lo nuevo. Transition propia, mucho
           más corta que la de entrada (.15s en vez de .45s): se apaga en el
           lugar case-instantáneo, antes de que el arrastre del padre llegue
           a notarse, en vez de viajar visible hasta desaparecer afuera. */
        .pv3-regalo-abierto .pv3-gift-inline { opacity: 0; pointer-events: none; transition: opacity .15s ease; }
        /* Sin .gp-wrap (ver hero-coupons.css): acá no es sidebar de alto
           completo, es una tarjeta flotando con su alto de contenido — sólo
           hace falta topearle el ancho para que no se estire a ocupar toda la
           franja libre. position:relative es lo único que le suma esta regla
           encima de la compartida: ancla al botón de cerrar, que es de acá,
           no del panel del paso 2 (ese usa su propio botón, afuera de
           .gp-panel). */
        .pv3-gift-inline .gp-panel {
          position: relative;
          /* 600 y no 480: con la tarjeta angosta, "Desde $30.000 por mes,
             obsequiás acceso total a cada turista que se hospeda en tu
             negocio" partía en tres líneas. Sin max-width fijo (ancho:100%
             del flex item nomás) se estiraría a ocupar TODO el espacio libre
             entre 680px y el borde, que en pantallas anchas es demasiado —
             600 es el tope; abajo de eso, se achica sola con el contenedor
             (mismo mecanismo que ya usa este mismo panel en el breakpoint
             <1180px, ver más abajo). */
          max-width: 600px;
        }
        /* Cruz, arriba a la derecha — mismo lenguaje que cualquier "cerrar" de
           overlay en la app (ver .pv3-regalo-cerrar, el del paso 2): círculo
           gris neutro. Acá el ícono va blanco y no ${A.ink} porque el fondo es
           un gris sólido (no el gris-al-6% translúcido de allá, que sólo
           funciona con un ícono oscuro encima) — contraste blanco-sobre-gris,
           mismo criterio que .gp-opcion-tag. */
        .gp-gift-cerrar {
          position: absolute;
          top: 14px;
          right: 14px;
          display: grid;
          place-items: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 50%;
          background: var(--color-text-muted, #6B7280);
          color: #fff;
          cursor: pointer;
          transition: background .15s ease;
        }
        .gp-gift-cerrar:hover { background: ${A.ink}; }
        @media (prefers-reduced-motion: reduce) {
          .pv3-gift-inline { transition: none; }
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
        .pv3-opciones-botones { position: relative; display: flex; flex-wrap: nowrap; align-items: center; justify-content: center; }
        .pv3-pases-par { display: flex; flex-wrap: nowrap; gap: 14px; }
        /* Cuelga afuera del centrado del par, a su derecha —ver la nota en
           el JSX. left:100% toma como referencia el borde derecho de
           .pv3-opciones-botones (el propio flex container, que mide
           exactamente lo que mide .pv3-pases-par porque es su único
           contenido en flujo), así que sigue pegado al pase de 7 días sin
           importar cuánto se centre el conjunto. */
        .pv3-mas-dias {
          position: absolute; left: 100%; top: 50%;
          transform: translateY(-50%);
          margin-left: 18px;
          padding: 0; border: none; background: none; cursor: pointer;
          font-family: inherit; font-size: 15.5px; font-weight: 600; color: ${A.primary};
          white-space: nowrap;
          text-decoration: underline; text-underline-offset: 3px;
          text-decoration-thickness: 1.5px;
          transition: color .15s;
        }
        .pv3-mas-dias:hover { color: ${A.primaryDark}; }
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
           grupo, no necesita su propia regla. will-change en los tres: son
           los que esa rampa anima. */
        .pv3-hc-stage .pv3-hc-g1,
        .pv3-hc-stage .hc__sub,
        .pv3-hc-stage .hc__opciones {
          pointer-events: none;
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
        /* ─── Entrada de la galería, en cascada y DESPUÉS del texto ───
           (2026-08-10, a pedido, tomando como referencia el parallax por
           columnas de skiper-ui/skiper30.) Antes la galería estaba servida
           desde el primer frame y el ojo no llegaba a registrarla: entraba
           junto con todo lo demás. Ahora cada columna entra por separado,
           arrancando recién a los 0.95s —después de la última pieza de
           texto, que es .pv3-cta-full a los 0.82s— y con 0.16s entre
           columna y columna, que es lo que la hace legible como galería y
           no como un bloque que aparece.
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
          animation: pv3ColIn .95s cubic-bezier(.16, 1, .3, 1) var(--col-delay, 1s) both;
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
          .pv3-gift-inline { display: none; }
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
          /* Ya es una lista apilada en la regla base (ver la nota junto a
             .pv3-accesos, arriba) — acá sólo hace falta centrarla contra la
             columna. Un poco más ancha que en desktop: sin la columna del
             medio al lado, el hueco entre texto y flecha ya no compite con
             nada. */
          .pv3-accesos { max-width: 360px; margin-inline: auto; }
          /* height:auto: a este ancho el ticket ya no entra en los 130px
             fijos de la regla base sin recortarse. margin-left vuelve a 0:
             el offset negativo de escritorio (para despegarlo del párrafo)
             no tiene sentido acá, la columna entera está centrada. */
          .pv3-logo-slot { height: auto; margin: 0 0 24px; }
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
             hace en vertical, uno debajo del otro. "¿Más días?" vuelve al
             flujo normal (era position:absolute para no pesar en el centrado
             del par, ver la nota junto a .pv3-mas-dias) y se apila como
             tercer elemento, centrado con el resto. */
          .pv3-opciones-botones { flex-direction: column; align-items: stretch; gap: 12px; }
          .pv3-pases-par { flex-direction: column; gap: 12px; }
          .pv3-btn-pase { justify-content: center; }
          .pv3-mas-dias { position: static; transform: none; margin-left: 0; text-align: center; }
        }
      `}</style>
    </section>
  );
}
