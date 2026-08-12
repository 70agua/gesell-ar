import { FALL } from './couponRain.config';

/**
 * Estado de un cupon en la fase `f` de su ciclo (0 = arriba, fuera de cuadro;
 * 1 = abajo, fuera de cuadro; y vuelve a 0). La caida no termina nunca, asi
 * que no hay estado final: todo lo que se mueve es periodico.
 *
 * Vive en su propio modulo y no adentro de Coupon.jsx a proposito: la caida la
 * pinta CouponRain por ref, sin pasar por React. Antes el avance bajaba como
 * prop desde HeroPase (un useState escrito en cada frame), lo que
 * re-renderizaba el hero completo —galeria de 34 fotos incluida— 60 veces por
 * segundo. Con una animacion que ahora no para nunca, eso no era una opcion.
 */
export function estadoCupon(data, seed, f, altoCapa) {
  const { rz, ry, opacity } = data;

  const dir = seed % 2 === 0 ? 1 : -1;
  const spread = 0.6 + ((seed * 37) % 70) / 100;

  // Recorrido vertical, en PIXELES sobre el alto de la capa. Va de -20% a 120%
  // para que aparezca y desaparezca fuera del cuadro: el salto del ciclo cae
  // donde nadie lo ve.
  //
  // En px y no en % porque un translateY porcentual se resuelve contra la
  // altura DEL PROPIO ELEMENTO, no la del contenedor: cada cupón recorría un
  // tramo distinto según su tamaño y todos quedaban amontonados arriba. El
  // alto de la capa lo mide CouponRain y lo pasa acá.
  const y = (-0.2 + f * 1.4) * altoCapa;

  // Vaiven lateral y balanceo: un seno cada uno, con periodos distintos entre
  // si (2 y 1.5 vueltas por ciclo) para que el cupon no repita exactamente el
  // mismo gesto en el mismo punto de la caida.
  const drift = Math.sin((f * 2 + seed * 0.31) * Math.PI * 2) * FALL.driftPx * spread;
  const curRz = rz + Math.sin((f * 1.5 + seed * 0.17) * Math.PI * 2) * FALL.spinZ;

  // Volteo continuo sobre el eje vertical: es lo que hace que el cupon se vea
  // de canto y de atras mientras cae, en vez de bajar plano.
  const curRy = ry + f * FALL.spinY * dir;

  // Los bordes del ciclo modulan la opacidad para que el wrap sea invisible.
  // Sin esto, un cupon del plano de adelante reaparece de golpe arriba.
  const e = FALL.entrada;
  const borde = f < e ? f / e : f > 1 - e ? (1 - f) / e : 1;

  return {
    transform: `translate3d(${drift.toFixed(2)}px, ${y.toFixed(2)}px, 0) rotateY(${curRy.toFixed(2)}deg) rotateZ(${curRz.toFixed(2)}deg)`,
    opacity: (opacity * borde).toFixed(3),
  };
}
