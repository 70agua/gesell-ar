import { useRef } from 'react';
import CouponRain from './CouponRain';
import { TEXT_ENTER, SECTION_HEIGHT_VH, COUPON_BASE_WIDTH } from './couponRain.config';
import { useScrollProgress, subProgress, usePrefersReducedMotion } from './useScrollProgress';
import './hero-coupons.css';

/**
 * Slide del hero con lluvia de cupones atada al scroll.
 * La seccion mide mas que el viewport; el contenido queda anclado mientras
 * el excedente se recorre. Primera mitad: entra el texto y caen los cupones
 * de ambiente. Segunda mitad: el texto ya esta quieto y caen los protagonistas.
 */
export default function HeroCoupons({ eyebrow, title, body, children }) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const progress = useScrollProgress(ref);

  const tText = reduced ? 1 : subProgress(progress, TEXT_ENTER);

  return (
    <section
      ref={ref}
      className="hero-coupons"
      style={{ '--section-h': `${SECTION_HEIGHT_VH}vh`, '--coupon-base': COUPON_BASE_WIDTH }}
    >
      <div className="hero-coupons__stage">
        <CouponRain progress={progress} reduced={reduced} />

        <div
          className="hero-coupons__copy"
          style={{
            opacity: tText,
            transform: `translate3d(0, ${((1 - tText) * 22).toFixed(2)}px, 0)`,
          }}
        >
          {eyebrow && <p className="hero-coupons__eyebrow">{eyebrow}</p>}
          <h1 className="hero-coupons__title">{title}</h1>
          {body && <p className="hero-coupons__body">{body}</p>}
          {children}
        </div>
      </div>
    </section>
  );
}
