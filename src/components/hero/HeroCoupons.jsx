import { useRef } from 'react';
import CouponRain from './CouponRain';
import {
  QUESTION_WIPE, QUESTION_FADE, PANEL_ENTER,
  SECTION_HEIGHT_VH, COUPON_BASE_WIDTH, PRE_ENTER_VH,
} from './couponRain.config';
import { useScrollProgress, subProgress, usePrefersReducedMotion } from './useScrollProgress';
import './hero-coupons.css';

// Misma frase en dos lugares: grande y centrada al principio (.hc__question),
// chica como ceja del panel después (.hc__eyebrow) — una sola constante para
// que nunca queden desincronizadas.
const PREGUNTA = '¿Tenés un alojamiento ó agencia de turismo?';

/**
 * Slide 2 de la home: la propuesta para alojamientos y agencias.
 *
 * Este copy vivia dentro de HeroPase como la variante `.pv3-left-var--socio`,
 * que entraba por cross-fade a mitad del recorrido pineado, y despues como
 * el carril "¿Tenes un alojamiento...?" al pie del slide 1. Ahora es una
 * seccion propia con la lluvia de cupones atada al scroll.
 *
 * Tres fases en secuencia (ver QUESTION_WIPE / QUESTION_FADE / PANEL_ENTER en
 * couponRain.config.js):
 *  1. La pregunta aparece gigante y centrada en el medio de la pantalla,
 *     descubriendose de izquierda a derecha con el scroll (clip-path, no
 *     fade — un wipe).
 *  2. Se desvanece.
 *  3. Entra el panel de texto de la izquierda, con la misma pregunta como
 *     ceja (mas chica) arriba del titulo.
 * Los cupones de ambiente caen durante toda la secuencia, de fondo; los
 * protagonistas recien cuando el panel ya esta quieto. Ver COUPONS en
 * couponRain.config.js.
 *
 * PRE_ENTER_VH adelanta ese recorrido: sin el, progress quedaba en 0 (nada se
 * movia) hasta que el borde superior de la seccion tocaba el techo del
 * viewport (recien ahi se ancla), y esa espera se sentia como una pausa en
 * blanco.
 */
export default function HeroCoupons({ onSuscribir }) {
  const ref = useRef(null);
  const reduced = usePrefersReducedMotion();
  const progress = useScrollProgress(ref, PRE_ENTER_VH);

  // Pregunta grande: wipe de 0 (tapada) a 1 (revelada), después opacity baja
  // a 0 antes de que arranque el panel. En reduced motion no se muestra
  // nunca —la misma frase ya está, quieta, como ceja del panel— así que el
  // primer instante accesible es directamente el estado final.
  const wipe = reduced ? 1 : subProgress(progress, QUESTION_WIPE);
  const questionOpacity = reduced ? 0 : 1 - subProgress(progress, QUESTION_FADE);

  const tPanel = reduced ? 1 : subProgress(progress, PANEL_ENTER);

  return (
    <section
      ref={ref}
      className="hc"
      style={{ '--section-h': `${SECTION_HEIGHT_VH}vh`, '--coupon-base': COUPON_BASE_WIDTH }}
    >
      <div className="hc__stage">
        <CouponRain progress={progress} reduced={reduced} />

        {/* Decorativa: la versión accesible y permanente de esta frase es la
            ceja de .hc__copy, más abajo. clip-path (no opacity) hace el
            wipe: se aplica sobre .hc__question-text, que mide lo que mide su
            propio texto (no el ancho de pantalla), así el % de inset
            corresponde al texto y no a una franja en blanco antes de
            llegar a él. */}
        <div className="hc__question" style={{ opacity: questionOpacity }} aria-hidden="true">
          <span className="hc__question-text" style={{ clipPath: `inset(0 ${((1 - wipe) * 100).toFixed(2)}% 0 0)` }}>
            {PREGUNTA}
          </span>
        </div>

        {/* .hc__inner replica el rol de .pv3-inner en HeroPase (ancho máx.
            1328px, centrado, padding horizontal); .hc__copy replica a
            .pv3-left (columna fija de 640px, pegada a la izquierda con
            margin-left:30px). */}
        <div className="hc__inner">
          <div
            className="hc__copy"
            style={{ opacity: tPanel, transform: `translate3d(0, ${((1 - tPanel) * 22).toFixed(2)}px, 0)` }}
          >
            <div className="hc__logo-slot">
              <img className="hc__logo" src="/cuponear-pro.svg" alt="Cuponear Pro" />
            </div>

            <p className="hc__eyebrow">{PREGUNTA}</p>

            <h1 className="hc__title">
              <span className="hc__t-it">Suscribite y regalá pases de turista</span>
              <span className="hc__t-bold">ellos te lo van a agradecer</span>
            </h1>

            <p className="hc__sub">
              Gastronomía, masajes, excursiones, compras. Experiencias inolvidables para el
              turista y más ventas para vos.
            </p>

            <div className="hc__opciones">
              <button className="hc__btn" onClick={onSuscribir}>
                <b>Desde $30.000 por mes</b>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
