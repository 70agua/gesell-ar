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
import { ArrowRight, ArrowLeft } from 'lucide-react';
import CouponRain from '../hero/CouponRain';
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
// Misma frase en dos lugares (pregunta grande centrada + ceja chica del
// panel) — una sola constante para que nunca queden desincronizadas. Viene
// de HeroCoupons.jsx (2026-08-09: ese "segundo acto" se fusionó acá adentro,
// ver el comentario largo junto a HC_START más abajo).
const PREGUNTA_HC = '¿Tenés un alojamiento ó agencia de turismo?';

const PASES = [
  { id: 'x3', dias: 3, label: '3 días', precio: '$20.000' },
  { id: 'x7', dias: 7, label: '7 días', precio: '$35.000' },
];

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

export default function HeroPase({ onComprarPase, onSuscribirHoteleria, onVerCatalogo }) {
  const [cols] = useState(buildColumns);
  const heroRef = useRef(null);
  const colRefs = useRef([]);
  const colWrapRefs = useRef([]);
  const halfHeights = useRef([]);
  // Panel "Pases de regalo" (ex-segundo acto/HeroCoupons, ver PANEL_G1/G2/G3
  // arriba del componente): usa opacity/transform por JS igual que el resto
  // de acá, PERO la lluvia de cupones (CouponRain/Coupon, sin tocar) espera
  // su avance como PROP, no por ref — así que ese pedacito sí pasa por React
  // state en vez de escritura directa a DOM. Es la única excepción en todo
  // el archivo; se documenta en el useEffect que anima este panel, más
  // abajo. Panel en tres grupos (logo+ceja+título / subtítulo / botón), cada
  // uno con su propia entrada.
  const hcG1Ref = useRef(null);
  const hcG2Ref = useRef(null);
  const hcG3Ref = useRef(null);
  const [hcProgress, setHcProgress] = useState(0);
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

    const pasoContinuo = (now) => {
      continuoId = 0;
      const dt = Math.min(now - ultimoTiempo, 100); // tope por si la pestaña estuvo en background
      ultimoTiempo = now;
      driftAuto += dt * AUTO_DRIFT_PX_POR_MS;
      pintarColumnas(driftAuto);
      if (visible) continuoId = requestAnimationFrame(pasoContinuo);
    };
    continuoId = requestAnimationFrame(pasoContinuo);

    // Pausa el rAF con la sección fuera de pantalla — sin esto seguía
    // gastando un frame entero por nada mientras el usuario ya estaba
    // scrolleado varias pantallas más abajo.
    const hero = heroRef.current;
    const obs = hero && new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !continuoId) {
        ultimoTiempo = performance.now();
        continuoId = requestAnimationFrame(pasoContinuo);
      }
    }, { threshold: 0 });
    if (obs) obs.observe(hero);

    return () => {
      window.removeEventListener('resize', onResize);
      if (continuoId) cancelAnimationFrame(continuoId);
      if (obs) obs.disconnect();
    };
  }, [listo]); // se remide medirAltos() cuando las fotos ya cargaron y las columnas tienen su alto real

  // ─── Panel "Pases de regalo": entrada por tiempo, no por scroll ───
  // (2026-08-10) Reemplaza a pintarHC()/HC_START, que vivían adentro del
  // useEffect de arriba atados al progreso del pin — ver la nota fechada
  // ese día junto a POSTAS. Acá la única "posta" es el click: al abrirse,
  // corre una rampa de tiempo fijo (DUR) que hace lo mismo que hacía
  // aquella —CouponRain recibe su avance 0-1 por prop (hcProgress, la
  // misma excepción a "todo por ref" de siempre, ver la nota junto a
  // hcG1Ref) y los tres grupos del panel entran en cascada, cada uno en su
  // ventana de PANEL_G1/G2/G3 (arriba del componente)—.
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

    // setHcProgress no puede llamarse síncrono en el cuerpo del efecto
    // (dispara cascading renders) — un solo requestAnimationFrame lo
    // corre siempre un tick después, tanto acá como dentro de paso() más
    // abajo, que ya vivía naturalmente en un callback async.
    const limpiar = () => {
      grupos.forEach(r => {
        const el = r.current;
        if (el) { el.style.opacity = ''; el.style.transform = ''; el.style.pointerEvents = ''; }
      });
      raf = requestAnimationFrame(() => setHcProgress(0));
    };

    if (!activo()) { limpiar(); return () => cancelAnimationFrame(raf); }

    if (!regaloAbierto) {
      grupos.forEach(r => {
        const el = r.current;
        if (el) { el.style.opacity = '0'; el.style.transform = 'translate3d(0, 18px, 0)'; el.style.pointerEvents = 'none'; }
      });
      raf = requestAnimationFrame(() => setHcProgress(0));
      return () => cancelAnimationFrame(raf);
    }

    let vivo = true;
    const t0 = performance.now();
    const DUR = 2200;
    const paso = (now) => {
      const el = Math.min(1, (now - t0) / DUR);
      const eased = 1 - Math.pow(1 - el, 3); // ease-out cúbica, misma curva que la rampa de postas
      setHcProgress(eased);
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
  useEffect(() => {
    if (!regaloAbierto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [regaloAbierto]);

  // Escape cierra el panel — mismo criterio que cualquier overlay que tapa
  // la pantalla entera.
  useEffect(() => {
    if (!regaloAbierto) return;
    const onKey = (e) => { if (e.key === 'Escape') setRegaloAbierto(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [regaloAbierto]);

  return (
    <section ref={heroRef} className={`pv3-hero${listo ? ' pv3-listo' : ''}${regaloAbierto ? ' pv3-regalo-abierto' : ''}`} style={{ zIndex: 0, fontFamily: A.font, background: 'linear-gradient(180deg, #FFF7EB 0%, #FFFFFF 60%)' }}>

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
            // ref de wrapper: pintarFadeGaleria() le escribe un mask-image
            // propio para el desvanecido en cascada.
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
                     reconocer después en su Pase. También es el disparador
                     manual del navbar escondido (ver 'cuponear:navbar-reveal'
                     en Navbar.jsx) — antes existía un ícono aparte en la
                     esquina para eso, se sacó porque el boceto no lo tiene,
                     y esa función pasó a vivir en la marca misma. */}
              <button type="button" className="pv3-logo-slot" onClick={() => window.dispatchEvent(new Event('cuponear:navbar-reveal'))} aria-label="Mostrar el menú">
                <img className="pv3-ticket" src="/cupon-pass.svg" alt="Cupon PASS" />
              </button>

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

              {/* Nuevos accesos (2026-08-10), bajo el título: dos atajos
                     directos, cada uno con su propia flechita en círculo —
                     azul para el catálogo, dorado para "Pases de regalo"
                     (mismo dorado que el moño de giftpass-logo-11.svg, el
                     logo que ya usa el panel del segundo slide — no es un
                     color inventado). Salen del hero del todo, vía
                     onVerCatalogo/onSuscribirHoteleria, los mismos
                     callbacks que ya usan el resto de los CTA — el link
                     "Regalá pases" que saltaba de posta (en
                     .pv3-opciones-links, más abajo) se sacó: ahora este es
                     el único acceso a esa suscripción. */}
              <div className="pv3-accesos">
                <button type="button" className="pv3-acceso" onClick={() => onVerCatalogo?.()}>
                  <span className="pv3-acceso-titulo">Conocé todas las ofertas</span>
                  <span className="pv3-acceso-flecha" style={{ background: A.primary }} aria-hidden="true">
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </span>
                </button>
                <button
                  type="button"
                  className="pv3-acceso pv3-acceso--regalo"
                  onClick={() => {
                    setRegaloAbierto(true);
                    // En mobile/reduced-motion no hay slide que abrir (ver
                    // .pv3-regalo-abierto en el <style>, neutralizado ahí
                    // entero) — el panel ya está siempre visible más abajo,
                    // en flujo normal, así que el click sólo lo trae a
                    // pantalla con un scroll suave, mismo fallback que ya
                    // usaba "Regalá pases" antes de sacarse.
                    const activo = (window.matchMedia?.('(min-width: 1181px)').matches ?? false) && !reducedMotion;
                    if (!activo) {
                      document.querySelector('.hc__opciones')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                >
                  <span className="pv3-acceso-texto">
                    <span className="pv3-acceso-titulo">Pases de regalo</span>
                    <span className="pv3-acceso-sub">(Alojamientos, agencias, inmobiliarias)</span>
                  </span>
                  <span className="pv3-acceso-flecha" style={{ background: '#FFB94A' }} aria-hidden="true">
                    <ArrowRight size={16} strokeWidth={2.5} />
                  </span>
                </button>
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
        <div className="pv3-cta-full">
          <p className="pv3-pretitulo">
            ¿Cuánto dura <span className="pv3-pretitulo-it">tu viaje?</span>
          </p>

          <p className="pv3-pase-caption">
            ¡Cualquier pase te da acceso al catálogo de descuentos!<br />
            Tenés incluido un cupón <b>PREMIUM</b> a elección por día.
          </p>

          <div className="pv3-opciones">
            <div className="pv3-opciones-botones">
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
            <div className="pv3-opciones-links">
              <button className="pv3-mas-dias" onClick={() => onComprarPase?.('custom')}>
                ¿Más días?
              </button>
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
        <button type="button" className="pv3-regalo-cerrar" onClick={() => setRegaloAbierto(false)} aria-label="Volver">
          <ArrowLeft size={20} strokeWidth={2.5} />
        </button>
        <CouponRain progress={hcProgress} reduced={reducedMotion} />

        <div className="hc__inner">
          {/* Tres grupos, tres entradas — ver PANEL_G1/G2/G3 (arriba del
              componente) y el useEffect dedicado que las anima, junto a
              hcG1Ref. El botón entra último, a pedido. */}
          <div className="hc__copy">
            <div ref={hcG1Ref} className="pv3-hc-g1" style={{ opacity: 0 }}>
              <div className="hc__logo-slot">
                <img className="hc__logo" src="/giftpass-logo-11.svg" alt="GiftPass" />
              </div>

              <p className="hc__eyebrow">{PREGUNTA_HC}</p>

              <h1 className="hc__title">
                <span className="hc__t-it">Suscribite y regalá pases de turista</span>
                <span className="hc__t-bold">ellos te lo van a agradecer</span>
              </h1>
            </div>

            <p ref={hcG2Ref} className="hc__sub" style={{ opacity: 0 }}>
              Gastronomía, masajes, excursiones, compras. Experiencias inolvidables para el
              turista y más ventas para vos.
            </p>

            <div ref={hcG3Ref} className="hc__opciones" style={{ opacity: 0 }}>
              <button className="hc__btn" onClick={onSuscribirHoteleria}>
                <b>Desde $30.000 por mes</b>
              </button>
            </div>
          </div>
        </div>
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
             galería no se ve nunca. */
          .pv3-col {
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
        .pv3-hero { position: relative; min-height: 100vh; overflow-x: hidden; }

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
           Es un <button> (dispara el reveal del navbar, ver más arriba en
           el JSX) por eso resetea los estilos de botón nativo. margin-left
           negativo a propósito, distinto del resto de la columna: en el
           boceto el ticket cuelga más a la izquierda que el párrafo de
           texto, no de la misma línea — alinearlos de más quedaba
           "contracturado". Valor a ojo contra el boceto, sin poder
           verificarlo en vivo — ajustar si no calza. */
        .pv3-logo-slot {
          height: 130px; display: flex; align-items: flex-end; margin: 0 0 28px -40px;
          padding: 0; border: none; background: none; cursor: pointer;
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
           de la columna los mantiene dentro en todo el rango y, ahora que
           hay recuadro, le da al contenido el aire que se come el padding
           (antes había además un tope de 300px; con el borde puesto, ese
           tope dejaba el texto demasiado apretado contra el marco). */
        .pv3-accesos {
          margin-top: 28px; width: 100%; max-width: var(--pv3-lado); opacity: 0;
          /* Recuadro pedido: sólo contorno, sin relleno. El radio grande va
             con el resto del lenguaje del hero (celdas de galería en 20px,
             botones en píldora); un radio chico acá se leería como una caja
             de formulario. El padding-inline es el que despega el texto y la
             flecha del marco — el vertical es corto porque cada .pv3-acceso
             ya trae 14px propios arriba y abajo. */
          border: 1px solid ${A.primary};
          border-radius: 24px;
          padding: 4px 18px;
        }
        /* El margen negativo + el ancho compensado son lo que hace que el
           fondo del hover llegue "a toda la línea": sin eso se cortaba donde
           termina el texto, porque el padding-inline vive en .pv3-accesos
           (el recuadro) y no acá. Quedan 6px de aire contra el marco (18 del
           recuadro − 12 de acá), suficiente para que el rectángulo no se
           empaste con el borde. */
        .pv3-acceso {
          position: relative;
          display: flex; align-items: center; justify-content: space-between; gap: 16px;
          width: calc(100% + 24px); margin-inline: -12px; padding: 14px 12px;
          border: none; background: none; cursor: pointer;
          font-family: inherit; text-align: left;
          /* 18px = 24 (radio del recuadro) − 6 (lo que queda entre el fondo
             del hover y el marco). Es la regla de los radios concéntricos:
             si el interno no es el externo menos la separación, las curvas
             no quedan paralelas y el rectángulo se lee "cuadrado" contra un
             contenedor redondeado. Con 14px se notaba justamente eso. */
          border-radius: 18px;
          transition: background .15s ease;
        }
        .pv3-acceso:hover { background: ${A.primarySoft} }
        @media (prefers-reduced-motion: reduce) {
          .pv3-acceso { transition: none; }
        }
        /* El divisor pasó de border-top del propio botón a un pseudo-elemento
           insetado: como el botón ahora se ensancha 24px para el fondo del
           hover, un border-top suyo se estiraría igual y quedaría casi tocando
           el marco. Con ::before la línea conserva su inset propio,
           independiente de cuánto se ensanche el área clickeable. */
        .pv3-acceso--regalo::before {
          content: '';
          position: absolute; top: 0; left: 12px; right: 12px;
          border-top: 1px solid ${A.line};
        }
        .pv3-acceso-texto { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .pv3-acceso-titulo { font-size: 16px; font-weight: 700; color: ${A.primary}; }
        .pv3-acceso-sub { font-size: 12.5px; font-weight: 500; color: ${A.ink2}; font-style: italic; }
        /* Círculo con la flecha — mismo tamaño para los dos, sólo cambia el
           color de fondo (pasado por style inline en el JSX: primary para
           el catálogo, el dorado de giftpass-logo-11.svg para "Pases de
           regalo"). El ícono (lucide) hereda blanco vía currentColor. */
        .pv3-acceso-flecha {
          flex-shrink: 0;
          display: grid; place-items: center;
          width: 34px; height: 34px;
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

        /* 6 · Botones de pase, en su propia fila, y debajo —fila propia
           también— los dos enlaces, a pedido: antes compartían una sola
           fila con los botones y wrapeaban de forma impredecible según el
           ancho disponible. */
        .pv3-opciones { margin-top: 22px; }
        /* nowrap (antes wrap): los dos pases se comparan de un vistazo sólo
           si están uno al lado del otro — apilados dejan de leerse como dos
           opciones del mismo eje. El ancho para que entren sale del grid
           (ver .pv3-inner: las columnas laterales se achican por clamp y le
           ceden lugar a esta). Cuando de verdad no hay ancho, el apilado
           vuelve, pero explícito y sólo ahí: ver la media query de 560px. */
        .pv3-opciones-botones { display: flex; flex-wrap: nowrap; align-items: center; justify-content: center; gap: 14px; }
        .pv3-opciones-links { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 18px; margin-top: 12px; }
        .pv3-mas-dias {
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
          overflow: hidden;
          pointer-events: none;
          transform: translateX(100%);
          transition: transform .65s cubic-bezier(.65,0,.35,1);
        }
        .pv3-regalo-abierto .pv3-hc-stage { transform: translateX(0); pointer-events: auto; }
        /* Botón de volver — mismo padding-inline que .hc__inner (ver
           hero-coupons.css), así queda alineado con el logo/ceja/título de
           abajo en vez de pegado al borde del viewport. */
        .pv3-regalo-cerrar {
          position: absolute;
          top: 28px; left: 40px;
          z-index: 2;
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
          overflow: hidden;
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
        .pv3-coldrift { display: flex; flex-direction: column; will-change: transform; }
        .pv3-cell { flex: 0 0 auto; margin-bottom: 16px; border-radius: 20px; overflow: hidden; }
        .pv3-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }

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
             hace en vertical, uno debajo del otro. */
          .pv3-opciones-botones { flex-direction: column; align-items: stretch; gap: 12px; }
          .pv3-btn-pase { justify-content: center; }
        }
      `}</style>
    </section>
  );
}
