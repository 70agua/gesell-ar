import { FALL, COUPON_RATIO } from './couponRain.config';
import couponSrc from '../../assets/cupon-3d.png';

/** Curva de la caida. Empuja hacia el final para que frene suave. */
function ease(t) {
  return 1 - Math.pow(1 - t, 2.6);
}

/**
 * Un cupon. `t` va de 0 (arriba, invisible) a 1 (posicion final, quieto).
 * `seed` desfasa la deriva y el sentido de giro para que no caigan iguales.
 */
export default function Coupon({ data, t, seed, hidden }) {
  const { x, y, rz, ry, scale, blur, opacity } = data;

  const dir = seed % 2 === 0 ? 1 : -1;
  const spread = 0.6 + ((seed * 37) % 70) / 100;
  const e = ease(t);

  const drift = FALL.driftPx * spread * dir * (1 - e) * Math.cos(t * Math.PI * 1.1);
  const rise = -FALL.riseVh * (0.82 + ((seed * 53) % 40) / 100) * (1 - e);
  const curRz = rz - FALL.spinZ * spread * dir * (1 - e);
  const curRy = ry - FALL.spinY * (0.75 + ((seed * 29) % 50) / 100) * dir * (1 - e);
  const fade = t < 0.16 ? t / 0.16 : 1;

  return (
    <div
      aria-hidden="true"
      data-coupon={data.id}
      className={hidden ? 'coupon coupon--off' : 'coupon'}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        width: `calc(var(--coupon-base) * ${scale})`,
        height: `calc(var(--coupon-base) * ${scale} * ${COUPON_RATIO})`,
        marginLeft: `calc(var(--coupon-base) * ${scale} / -2)`,
        marginTop: `calc(var(--coupon-base) * ${scale} * ${COUPON_RATIO} / -2)`,
        filter: blur ? `blur(${blur}px)` : 'none',
        opacity: opacity * fade,
        transform: `translate3d(${drift.toFixed(2)}px, ${rise.toFixed(2)}%, 0) rotateY(${curRy.toFixed(2)}deg) rotateZ(${curRz.toFixed(2)}deg)`,
      }}
    >
      <img src={couponSrc} alt="" draggable="false" />
    </div>
  );
}
