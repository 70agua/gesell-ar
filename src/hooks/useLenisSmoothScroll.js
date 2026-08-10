import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * (2026-08-09) Después de tres vueltas intentando distinguir "rueda de
 * mouse" de "trackpad" a mano con heurísticas sobre deltaY —tamaño del
 * delta, múltiplos de 10, aislamiento por tiempo— y ninguna terminó de
 * andar bien (o no se notaba nada, o rebotaba en trackpad), se pidió mirar
 * cómo lo resuelve https://www.cheaf.com/ar/ y copiarlo.
 *
 * Esa página está hecha con Framer y carga Lenis (darkroomengineering/lenis,
 * la librería de smooth-scroll más usada en sitios "premium" — se ve en el
 * HTML: clases .lenis/.lenis-smooth y un módulo "SmoothScroll_Prod"). Lenis
 * NO intenta distinguir mouse de trackpad —no hay forma confiable de
 * hacerlo, que es justo donde chocaron los tres intentos anteriores—: por
 * default suaviza TODOS los eventos `wheel` por igual (`smoothWheel: true`),
 * mouse y trackpad los dos, porque a nivel navegador un swipe de trackpad
 * también llega como evento `wheel` — no hay atajo.
 *
 * Lo que si queda afuera, sin pedir nada especial, es el touch real de
 * celular/tablet: eso llega por `touchstart/touchmove`, no por `wheel`, y
 * Lenis sólo lo toma si se prende `syncTouch` a mano (default: false, y acá
 * no se toca). O sea: mouse y trackpad quedan con la misma sensación
 * suave (como pedía la referencia); el touch de pantalla sigue 100% nativo.
 *
 * "Runs on native scroll" (de la propia doc de Lenis): no es un scroll
 * "falso" con transform, sigue moviendo el window.scrollY real cuadro a
 * cuadro — compatible con position:sticky y con todo lo que ya lee
 * getBoundingClientRect()/scrollY en el resto del sitio (HeroPase,
 * HeroCoupons, la navbar).
 *
 * `respectReducedMotion` viene en true por default: con
 * prefers-reduced-motion activado, Lenis se autoapaga solo.
 */
export default function useLenisSmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
    });
    return () => lenis.destroy();
  }, []);
}
