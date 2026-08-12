/**
 * Lluvia continua — 14 cupones en tres planos de profundidad.
 *
 * Cambió el modelo (2026-08-11): antes cada cupón caía UNA vez hasta una
 * posición final y se quedaba ahí quieto para siempre, con `y` y `enter`
 * describiendo ese aterrizaje. Ahora la caída no termina nunca: cada uno
 * recorre el alto del contenedor de arriba abajo, y al salir por abajo vuelve
 * a entrar por arriba. `y` y `enter` ya no existen — el lugar de cada cupón en
 * el ciclo lo dan `t0` (dónde arranca) y `vel` (qué tan rápido lo recorre).
 *
 * Los tres planos son el pedido de "más lejanos, chicos y difusos, y los más
 * cercanos definidos", y se sostienen con las CUATRO variables a la vez, no
 * sólo con el tamaño: lo lejano es chico + borroso + transparente + LENTO. La
 * velocidad es la que más hace: dos cupones del mismo tamaño cayendo a
 * distinta velocidad se leen a distinta distancia (paralaje), y sin eso el
 * desenfoque solo se lee como "está mal enfocado" en vez de "está lejos".
 *
 * Dentro de cada plano las opacidades no son iguales a propósito: un plano con
 * todos los cupones a la misma transparencia se lee como una calcomanía.
 *
 * La x va de 0 a 100 sobre el ESPACIO LIBRE, no sobre el ancho de la ventana:
 * la capa arranca donde termina el sidebar (ver .coupon-rain en
 * hero-coupons.css). Antes el rango empezaba en 34 para esquivar el panel a
 * ojo, y eso valía sólo al ancho en que se calibró — el panel mide siempre lo
 * mismo en px, así que el porcentaje que tapa cambia con la ventana.
 *
 * x        posicion horizontal del centro, en % del contenedor
 * t0       fase inicial dentro del ciclo, 0..1 (0 = arriba de todo)
 * vel      multiplicador de velocidad sobre PERIODO_BASE
 * rz       inclinacion base en el plano (grados); el giro se le suma encima
 * ry       giro base sobre el eje vertical (grados). |ry| > 90 => espejado
 * scale    multiplicador sobre COUPON_BASE_WIDTH
 * blur     desenfoque en px
 * opacity  opacidad de referencia (los bordes del ciclo la modulan)
 */
export const COUPONS = [
  // ── Cerca: nitidos, grandes, rapidos ──
  // opacity: 1 los tres (2026-08-11, a pedido) — antes 0.97/0.92/0.88. Estos
  // tres son el plano que pasa POR ENCIMA del título en cursiva que se
  // intercala en la lluvia (ver CouponRain.jsx): con menos de 1 se veía el
  // texto transparentar a través del cupón que lo cruzaba, que se leía como
  // un error de capas, no como profundidad. estadoCupon() sigue bajando esta
  // opacidad a 0 en los bordes del ciclo (entrada/salida de pantalla) — eso
  // no cambia, sigue siendo necesario para que el wrap no se note.
  { id: 'p1', x: 45, t0: 0.10, vel: 1.55, rz: -10, ry: -8, scale: 0.96, blur: 0, opacity: 1 },
  { id: 'p2', x: 82, t0: 0.62, vel: 1.40, rz: 28, ry: 60, scale: 0.86, blur: 0, opacity: 1 },
  { id: 'p3', x: 18, t0: 0.83, vel: 1.30, rz: -22, ry: 152, scale: 0.78, blur: 0.4, opacity: 1 },

  // ── Medio: algo de desenfoque, tamano y ritmo intermedios ──
  { id: 'm1', x: 62, t0: 0.34, vel: 0.95, rz: 16, ry: -52, scale: 0.56, blur: 1.6, opacity: 0.62 },
  { id: 'm2', x: 30, t0: 0.55, vel: 0.88, rz: -20, ry: 144, scale: 0.52, blur: 2.0, opacity: 0.48 },
  { id: 'm3', x: 93, t0: 0.06, vel: 0.92, rz: 12, ry: 88, scale: 0.50, blur: 1.8, opacity: 0.55 },
  { id: 'm4', x: 7, t0: 0.44, vel: 0.84, rz: -14, ry: -70, scale: 0.46, blur: 2.4, opacity: 0.40 },

  // ── Lejos: chicos, muy difusos, lentos ──
  { id: 'a1', x: 53, t0: 0.21, vel: 0.58, rz: 20, ry: -38, scale: 0.34, blur: 4.4, opacity: 0.30 },
  { id: 'a2', x: 88, t0: 0.77, vel: 0.52, rz: -14, ry: 54, scale: 0.32, blur: 4.8, opacity: 0.22 },
  { id: 'a3', x: 14, t0: 0.15, vel: 0.62, rz: 24, ry: -148, scale: 0.30, blur: 4.0, opacity: 0.34 },
  { id: 'a4', x: 71, t0: 0.90, vel: 0.48, rz: -18, ry: 40, scale: 0.28, blur: 5.2, opacity: 0.19 },
  { id: 'a5', x: 37, t0: 0.68, vel: 0.55, rz: 12, ry: -64, scale: 0.27, blur: 5.6, opacity: 0.26 },
  { id: 'a6', x: 4, t0: 0.29, vel: 0.50, rz: -24, ry: 118, scale: 0.25, blur: 5.0, opacity: 0.17 },
  { id: 'a7', x: 97, t0: 0.48, vel: 0.60, rz: 18, ry: -96, scale: 0.31, blur: 4.6, opacity: 0.28 },
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

/** Cuanto tarda en cruzar la pantalla, de arriba abajo, un cupon de vel: 1.
 *  Los de vel: 1.55 (el plano de adelante) tardan ~19s y los de vel: 0.48 (el
 *  del fondo) ~62s. Es deliberadamente lento: viene del pedido de "que caigan
 *  10 veces mas lento" y de que esto es fondo de un formulario, no un show —
 *  algo que se mueve rapido atras de un texto que hay que leer compite con el
 *  texto. */
export const PERIODO_BASE = 30000;

/** Fisica de la caida. Perfil "flotante": lenta, poco giro en Z, mucho volteo
 *  en Y. driftPx y spinZ ahora oscilan (seno) en vez de tender a un valor
 *  final, porque la caida no termina; spinY es cuantos grados gira por ciclo,
 *  o sea que el volteo tambien es continuo. */
export const FALL = {
  driftPx: 26, // amplitud del vaiven lateral
  spinZ: 9, // grados de balanceo en el plano
  spinY: 300, // grados de volteo horizontal por ciclo completo
  entrada: 0.08, // fraccion del ciclo que tarda en aparecer arriba / desaparecer abajo
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
export const MOBILE_HIDDEN = ['a3', 'a4', 'a5', 'a6', 'm2', 'm4'];
