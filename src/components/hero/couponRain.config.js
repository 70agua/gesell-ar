/**
 * Layout "Racimo" — 12 cupones.
 * Tres protagonistas casi enfocados, cada uno girado hacia un lado distinto.
 * Dos medianos de ambiente (m1/m2, con los protagonistas). Cinco chicos muy
 * desenfocados (a1-a5). Dos medianos más, MENOS desenfocados que a1-a5 —
 * ver 'idle' más abajo.
 *
 * x, y      posicion final del centro, en % del contenedor
 * rz        rotacion final en el plano (grados)
 * ry        rotacion final sobre el eje vertical (grados). |ry| > 90 => espejado
 * scale     multiplicador sobre COUPON_BASE_WIDTH
 * blur      desenfoque en px
 * opacity   opacidad final
 * phase     'a' cae mientras entra el texto, 'b' cae con el texto ya quieto,
 *           'idle' cae durante el sostén de la pregunta centrada (ver más
 *           abajo) — es sólo documentación, el código no lee este campo.
 * enter     [inicio, fin] del tramo de scroll que le corresponde, 0..1
 */
export const COUPONS = [
  { id: 'p1', x: 56, y: 42, rz: -10, ry: -8, scale: 0.94, blur: 0, opacity: 0.96, phase: 'b', enter: [0.60, 0.77] },
  { id: 'p2', x: 78, y: 70, rz: 28, ry: 60, scale: 0.78, blur: 0.5, opacity: 0.89, phase: 'b', enter: [0.65, 0.82] },
  { id: 'p3', x: 94, y: 30, rz: -36, ry: 152, scale: 0.72, blur: 1.0, opacity: 0.83, phase: 'b', enter: [0.70, 0.87] },

  { id: 'm1', x: 42, y: 58, rz: 16, ry: -52, scale: 0.42, blur: 3.0, opacity: 0.27, phase: 'b', enter: [0.76, 0.93] },
  { id: 'm2', x: 66, y: 90, rz: -20, ry: 144, scale: 0.38, blur: 3.6, opacity: 0.23, phase: 'b', enter: [0.82, 1.0] },

  { id: 'a1', x: 38, y: 24, rz: 20, ry: -38, scale: 0.34, blur: 4.4, opacity: 0.2, phase: 'a', enter: [0.0, 0.35] },
  { id: 'a2', x: 88, y: 88, rz: -14, ry: 54, scale: 0.32, blur: 4.8, opacity: 0.18, phase: 'a', enter: [0.05, 0.40] },
  { id: 'a3', x: 52, y: 8, rz: 24, ry: -148, scale: 0.3, blur: 4.0, opacity: 0.22, phase: 'a', enter: [0.10, 0.45] },
  { id: 'a4', x: 97, y: 58, rz: -18, ry: 40, scale: 0.28, blur: 5.2, opacity: 0.17, phase: 'a', enter: [0.15, 0.50] },
  { id: 'a5', x: 70, y: 50, rz: 12, ry: -64, scale: 0.26, blur: 5.6, opacity: 0.15, phase: 'a', enter: [0.20, 0.55] },

  // 2026-08-09: se suman estos dos para el sostén de la pregunta centrada
  // (posta 2 de HeroPase, ver IDLE_CAP/idleHc ahí) — la pantalla quedaba
  // muy estática ahí, así que la lluvia sigue cayendo sola, en cámara
  // lenta. Menos desenfocados y más grandes que a1-a5 para que SE NOTE que
  // son cupones (a1-a5 quedan casi manchas) — "que todos los cupones vayan
  // cayendo" mientras se escribe/desescribe la pregunta, a pedido
  // (2026-08-09).
  { id: 'am1', x: 18, y: 42, rz: 15, ry: -58, scale: 0.50, blur: 1.7, opacity: 0.44, phase: 'idle', enter: [0.36, 0.53] },
  { id: 'am2', x: 84, y: 14, rz: -16, ry: 88, scale: 0.46, blur: 2.0, opacity: 0.38, phase: 'idle', enter: [0.40, 0.55] },
];

/** Tramo de scroll en el que la pregunta ("¿Tenés un alojamiento ó agencia
 *  de turismo?") se escribe, de izquierda a derecha. */
export const QUESTION_WIPE = [0.05, 0.28];

/** Tramo en el que esa misma pregunta, ya escrita, se "desescribe" —el
 *  mismo wipe cerrándose, no un fade— antes de que aparezca el panel de
 *  texto de la izquierda con la ceja del mismo texto, a su tamaño real.
 *  Arranca en 0.40 (no 0.30): entre el final de QUESTION_WIPE (0.28) y acá
 *  se sostiene sola un rato antes de irse. (2026-08-09: fusión de las dos
 *  postas —pregunta y panel— en una sola transición continua, sin parada
 *  en el medio; este tramo pasó de vaciar opacity a cerrar el wipe, ver
 *  pintarHC() en HeroPase.jsx, que es quien la usa.) */
export const QUESTION_WIPE_OUT = [0.40, 0.48];

/** Tramo en el que entra el panel de texto (ceja + título + subtítulo +
 *  cuerpo + botón), ya con la pregunta afuera de escena. Arranca después de
 *  QUESTION_FADE y termina justo antes de que empiecen a caer los
 *  protagonistas (ver COUPONS, fase 'b'), para que el texto ya esté quieto
 *  cuando eso pase. */
export const PANEL_ENTER = [0.40, 0.60];

/** Fisica de la caida. Perfil "flotante": lenta, poco giro en Z, mucho volteo en Y. */
export const FALL = {
  driftPx: 22, // deriva lateral maxima
  spinZ: 11, // grados extra de rotacion en el plano durante la caida
  spinY: 245, // grados de volteo horizontal durante la caida
  riseVh: 52, // altura de partida, en % del alto del contenedor (2x, a pedido)
  easing: 'cubic-bezier(.18,.72,.35,1)',
};

/** Alto de la seccion. El excedente sobre 100vh es el recorrido de scroll.
 *  240 (140vh) se sentia lento para lo que habia entonces. Se bajo a 170
 *  (70vh, el mismo recorrido que PIN_EXTRA_VH en HeroPase) para que arrancara
 *  antes. Ahora hay MAS que mostrar en secuencia —la pregunta grande que se
 *  descubre, se desvanece, y recien despues entra el panel de texto (ver
 *  QUESTION_WIPE/QUESTION_FADE/PANEL_ENTER)— y 70vh quedaba corto: todo se
 *  atropellaba junto. 260 (160vh) le da aire a las tres fases sin volver a la
 *  lentitud original, porque encima ahora arranca antes gracias a
 *  PRE_ENTER_VH. */
export const SECTION_HEIGHT_VH = 260;

/** Cuanto (en vh) adelanta el arranque de la caida mientras la seccion
 *  todavia esta entrando en pantalla, antes de anclarse arriba — ver
 *  useScrollProgress. Sin esto, progress quedaba en 0 (nada se movia) hasta
 *  que el borde entre HeroPase y HeroCoupons tocaba el techo del viewport, y
 *  esa espera se sentia como una pausa en blanco. */
export const PRE_ENTER_VH = 70;

/** Ancho de referencia del cupon. Cada scale multiplica este valor. */
export const COUPON_BASE_WIDTH = 'clamp(88px, 12vw, 190px)';

/** Relacion alto/ancho del PNG (783 / 570). */
export const COUPON_RATIO = 1.374;

/** En pantallas chicas se ocultan los cupones marcados y se agranda el resto. */
export const MOBILE_HIDDEN = ['a4', 'a5', 'm2', 'a3'];
