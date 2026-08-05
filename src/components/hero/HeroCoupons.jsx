import { useRef } from 'react';
import CouponRain from './CouponRain';
import { TEXT_ENTER, SECTION_HEIGHT_VH, COUPON_BASE_WIDTH, PRE_ENTER_VH } from './couponRain.config';
import { useScrollProgress, subProgress, usePrefersReducedMotion } from './useScrollProgress';
import './hero-coupons.css';

/**
 * Slide 2 de la home: la propuesta para alojamientos y agencias.
 *
 * Este copy vivia dentro de HeroPase como la variante `.pv3-left-var--socio`,
 * que entraba por cross-fade a mitad del recorrido pineado. Ahora es una
 * seccion propia con la lluvia de cupones atada al scroll.
 *
 * La seccion mide mas que el viewport y su contenido queda anclado con sticky.
 * Primera mitad del recorrido: entra el texto y caen los cupones de ambiente.
 * Segunda mitad: el texto ya esta quieto y legible, y caen los protagonistas.
 * Asi el usuario tiene tiempo de leer antes de que la seccion se despegue.
 *
 * PRE_ENTER_VH adelanta ese recorrido: sin el, nada se movia hasta que el
 * borde superior de la seccion tocaba el techo del viewport (recien ahi se
 * ancla), y esa espera se sentia como una pausa en blanco.
 */
export default function HeroCoupons({ onSuscribir }) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const progress = useScrollProgress(ref, PRE_ENTER_VH);

  const t = reduced ? 1 : subProgress(progress, TEXT_ENTER);

  return (
    <section
      ref={ref}
      className="hc"
      style={{ '--section-h': `${SECTION_HEIGHT_VH}vh`, '--coupon-base': COUPON_BASE_WIDTH }}
    >
      <div className="hc__stage">
        <CouponRain progress={progress} reduced={reduced} />

        {/* .hc__inner replica el rol de .pv3-inner en HeroPase (ancho máx.
            1328px, centrado, padding horizontal); .hc__copy replica a
            .pv3-left (columna fija de 640px, pegada a la izquierda con
            margin-left:30px). Antes .hc__copy hacía las dos cosas a la vez
            —contenedor centrado Y columna de texto— y esa mezcla la dejaba
            mucho más ancha (y con los hijos como .hc__title recortados a un
            max-width propio absurdo) que la columna del slide 1. */}
        <div className="hc__inner">
          <div
            className="hc__copy"
            style={{ opacity: t, transform: `translate3d(0, ${((1 - t) * 22).toFixed(2)}px, 0)` }}
          >
            <div className="hc__logo-slot">
              <img className="hc__logo" src="/cuponear-pro.svg" alt="Cuponear Pro" />
            </div>

            <h1 className="hc__title">
              <span className="hc__t-it">Regalá pases a tus clientes</span>
              <span className="hc__t-bold">un servicio que te destaca del resto</span>
            </h1>

            <p className="hc__sub">
              ¡Miles de pesos de descuento para el viajero!<br />
              Gastronomía, masajes, excursiones, compras. Experiencias inolvidables para el
              turista y más ventas para vos.
            </p>

            <p className="hc__pretitulo">
              <b>Suscribite desde $30.000 por mes y ofrecé algo que buscan todos: ¡Gastar menos!</b>
            </p>

            <div className="hc__opciones">
              <button className="hc__btn" onClick={onSuscribir}>
                <b>Hotelería, agencias de turismo, etc</b>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
