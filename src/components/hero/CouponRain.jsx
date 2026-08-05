import Coupon from './Coupon';
import { COUPONS, MOBILE_HIDDEN } from './couponRain.config';
import { subProgress } from './useScrollProgress';

/**
 * Capa de fondo del hero. No recibe eventos: el texto y los CTA siguen encima.
 * `progress` 0..1 viene del scroll de la seccion contenedora.
 * `reduced` fuerza el estado final sin movimiento.
 */
export default function CouponRain({ progress, reduced }) {
  return (
    <div className="coupon-rain">
      {COUPONS.map((c, i) => (
        <Coupon
          key={c.id}
          data={c}
          seed={i + 1}
          t={reduced ? 1 : subProgress(progress, c.enter)}
          hidden={MOBILE_HIDDEN.includes(c.id)}
        />
      ))}
    </div>
  );
}
