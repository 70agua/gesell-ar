import { useEffect, useRef } from 'react';
import Coupon from './Coupon';
import { estadoCupon } from './estadoCupon';
import { COUPONS, MOBILE_HIDDEN, PERIODO_BASE } from './couponRain.config';

// División en dos planos de profundidad para poder intercalar contenido
// entre medio (2026-08-11, a pedido: "debajo de los cupones que están en
// primer plano"). El plano "cerca" son los tres protagonistas —ids p1-p3,
// ver couponRain.config: nítidos, grandes, rápidos— y son los únicos que
// tienen que verse SIEMPRE por encima de lo que se ponga en `children`. El
// resto (medio + lejos) queda detrás, como fondo.
const FRENTE_IDS = new Set(COUPONS.filter(c => c.id.startsWith('p')).map(c => c.id));

/**
 * Capa de fondo del panel "Pases de regalo". No recibe eventos propios: sólo
 * el contenido que se le pase por `children` (si lo hay) puede llevar los
 * suyos.
 *
 * `activo` prende la lluvia (se pone en true al abrirse el panel). `reduced`
 * la deja quieta, con los cupones repartidos en el cuadro.
 *
 * `children`, si se pasa, se intercala ENTRE los dos planos de profundidad:
 * los cupones de fondo (medio+lejos) quedan atrás, `children` en el medio, y
 * los tres protagonistas (plano cerca) quedan siempre adelante, tapándolo de
 * a ratos al cruzarlo — es lo que le da la sensación de que el contenido está
 * "adentro" de la lluvia y no pegado encima como una capa aparte.
 *
 * La caida NO TERMINA: cada cupon recorre la pantalla y vuelve a entrar por
 * arriba, cada uno con su periodo (PERIODO_BASE / vel) y su fase inicial (t0),
 * asi que nunca se sincronizan ni se vacia la pantalla. El rAF corre mientras
 * el panel esta abierto y se corta al cerrarlo.
 *
 * Todo se pinta por ref: son 14 elementos y cero renders de React. Un bucle
 * infinito atado a un useState re-renderizaria el hero entero —galeria de 34
 * fotos incluida— para siempre.
 */
export default function CouponRain({ activo, reduced, children }) {
  const capaRef = useRef(null);
  // Un solo array de refs, indexado igual que COUPONS (no por plano): a qué
  // <div> DOM caiga cada cupón (fondo o frente) no le importa al efecto, que
  // sólo necesita "el nodo del cupón i" para escribirle transform/opacity.
  const refs = useRef([]);

  useEffect(() => {
    // El recorrido vertical se calcula en px sobre el alto de la capa (ver
    // estadoCupon). Se mide una vez y se re-mide al cambiar de tamaño: leerlo
    // en cada frame sería forzar un layout sincrónico 60 veces por segundo.
    let alto = capaRef.current?.offsetHeight || window.innerHeight;
    const medir = () => { alto = capaRef.current?.offsetHeight || window.innerHeight; };
    window.addEventListener('resize', medir);

    const pintar = (ms) => {
      COUPONS.forEach((c, i) => {
        const el = refs.current[i];
        if (!el) return;
        const periodo = PERIODO_BASE / c.vel;
        const f = (c.t0 + ms / periodo) % 1;
        const { transform, opacity } = estadoCupon(c, i + 1, f, alto);
        el.style.transform = transform;
        el.style.opacity = opacity;
      });
    };

    // Con reduced-motion no hay lluvia: se sirve un cuadro fijo, cada cupón en
    // su fase inicial. Ese reparto ya es el que da el efecto de profundidad.
    const quitarResize = () => window.removeEventListener('resize', medir);

    if (reduced || !activo) { pintar(0); return quitarResize; }

    let raf = 0;
    let vivo = true;
    const t0 = performance.now();
    const paso = (now) => {
      pintar(now - t0);
      if (vivo) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);

    return () => { vivo = false; cancelAnimationFrame(raf); quitarResize(); };
  }, [activo, reduced]);

  return (
    <div className="coupon-rain" ref={capaRef}>
      <div className="coupon-rain-plano">
        {COUPONS.map((c, i) => !FRENTE_IDS.has(c.id) && (
          <Coupon
            key={c.id}
            data={c}
            innerRef={n => { refs.current[i] = n; }}
            hidden={MOBILE_HIDDEN.includes(c.id)}
          />
        ))}
      </div>
      {children && <div className="coupon-rain-medio">{children}</div>}
      <div className="coupon-rain-plano">
        {COUPONS.map((c, i) => FRENTE_IDS.has(c.id) && (
          <Coupon
            key={c.id}
            data={c}
            innerRef={n => { refs.current[i] = n; }}
            hidden={MOBILE_HIDDEN.includes(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
