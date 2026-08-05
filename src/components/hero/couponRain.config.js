/**
 * Layout "Racimo" — 10 cupones.
 * Tres protagonistas casi enfocados, cada uno girado hacia un lado distinto.
 * Siete de ambiente, desenfocados. Tres quedan cortados por el borde.
 *
 * x, y      posicion final del centro, en % del contenedor
 * rz        rotacion final en el plano (grados)
 * ry        rotacion final sobre el eje vertical (grados). |ry| > 90 => espejado
 * scale     multiplicador sobre COUPON_BASE_WIDTH
 * blur      desenfoque en px
 * opacity   opacidad final
 * phase     'a' cae mientras entra el texto, 'b' cae con el texto ya quieto
 * enter     [inicio, fin] del tramo de scroll que le corresponde, 0..1
 */
export const COUPONS = [
  { id: 'p1', x: 56, y: 42, rz: -10, ry: -8, scale: 0.94, blur: 0, opacity: 0.96, phase: 'b', enter: [0.48, 0.70] },
  { id: 'p2', x: 78, y: 70, rz: 28, ry: 60, scale: 0.78, blur: 0.5, opacity: 0.89, phase: 'b', enter: [0.55, 0.77] },
  { id: 'p3', x: 94, y: 30, rz: -36, ry: 152, scale: 0.72, blur: 1.0, opacity: 0.83, phase: 'b', enter: [0.62, 0.84] },

  { id: 'm1', x: 42, y: 58, rz: 16, ry: -52, scale: 0.42, blur: 3.0, opacity: 0.27, phase: 'b', enter: [0.70, 0.92] },
  { id: 'm2', x: 66, y: 90, rz: -20, ry: 144, scale: 0.38, blur: 3.6, opacity: 0.23, phase: 'b', enter: [0.78, 1.0] },

  { id: 'a1', x: 38, y: 24, rz: 20, ry: -38, scale: 0.34, blur: 4.4, opacity: 0.2, phase: 'a', enter: [0.0, 0.34] },
  { id: 'a2', x: 88, y: 88, rz: -14, ry: 54, scale: 0.32, blur: 4.8, opacity: 0.18, phase: 'a', enter: [0.04, 0.38] },
  { id: 'a3', x: 52, y: 8, rz: 24, ry: -148, scale: 0.3, blur: 4.0, opacity: 0.22, phase: 'a', enter: [0.08, 0.42] },
  { id: 'a4', x: 97, y: 58, rz: -18, ry: 40, scale: 0.28, blur: 5.2, opacity: 0.17, phase: 'a', enter: [0.12, 0.46] },
  { id: 'a5', x: 70, y: 50, rz: 12, ry: -64, scale: 0.26, blur: 5.6, opacity: 0.15, phase: 'a', enter: [0.16, 0.5] },
];

/** Tramo de scroll en el que entra el texto. Termina antes que la fase B. */
export const TEXT_ENTER = [0.03, 0.4];

/** Fisica de la caida. Perfil "flotante": lenta, poco giro en Z, mucho volteo en Y. */
export const FALL = {
  driftPx: 22, // deriva lateral maxima
  spinZ: 11, // grados extra de rotacion en el plano durante la caida
  spinY: 245, // grados de volteo horizontal durante la caida
  riseVh: 26, // altura de partida, en % del alto del contenedor
  easing: 'cubic-bezier(.18,.72,.35,1)',
};

/** Alto de la seccion. El excedente sobre 100vh es el recorrido de scroll. */
export const SECTION_HEIGHT_VH = 240;

/** Ancho de referencia del cupon. Cada scale multiplica este valor. */
export const COUPON_BASE_WIDTH = 'clamp(88px, 12vw, 190px)';

/** Relacion alto/ancho del PNG (783 / 570). */
export const COUPON_RATIO = 1.374;

/** En pantallas chicas se ocultan los cupones marcados y se agranda el resto. */
export const MOBILE_HIDDEN = ['a4', 'a5', 'm2', 'a3'];
