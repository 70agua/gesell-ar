import { COUPON_RATIO } from './couponRain.config';
import couponSrc from '../../assets/cupon-3d.png';

/**
 * Un cupon. Solo lo que NO cambia durante la caida: posicion, tamano y
 * desenfoque. transform y opacity los escribe CouponRain sobre `innerRef`,
 * frame a frame, con lo que devuelve estadoCupon() (ver estadoCupon.js).
 */
export default function Coupon({ data, hidden, innerRef }) {
  const { x, scale, blur } = data;

  return (
    <div
      ref={innerRef}
      aria-hidden="true"
      data-coupon={data.id}
      className={hidden ? 'coupon coupon--off' : 'coupon'}
      style={{
        left: `${x}%`,
        // El alto lo recorre entero el transform (ver estadoCupon): acá top es
        // sólo el origen del recorrido, no una posición que se ajuste por
        // cupón. Antes cada uno tenía su `y` porque aterrizaba en un lugar
        // fijo; ahora todos cruzan la pantalla completa.
        top: 0,
        width: `calc(var(--coupon-base) * ${scale})`,
        height: `calc(var(--coupon-base) * ${scale} * ${COUPON_RATIO})`,
        marginLeft: `calc(var(--coupon-base) * ${scale} / -2)`,
        marginTop: `calc(var(--coupon-base) * ${scale} * ${COUPON_RATIO} / -2)`,
        filter: blur ? `blur(${blur}px)` : 'none',
        opacity: 0,
      }}
    >
      <img src={couponSrc} alt="" draggable="false" />
    </div>
  );
}
