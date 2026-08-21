import { useEffect } from 'react';
import Lenis from 'lenis';
import { SCROLL_SUAVE } from '../lib/efectos';

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
 *
 * ── Lock externo (2026-08-11 noche) ─────────────────────────────────────
 * Bug reportado: con el panel "Regalá cuponeras" (GIFT PaSS PRO) abierto en
 * HeroPase, igual se podía scrollear y ver el resto de la home detrás. La
 * vía que HeroPase ya usaba para bloquear el scroll —poner
 * `overflow:hidden` en <html>/<body>— frena el scroll NATIVO (rueda,
 * teclado, barra), pero Lenis no depende de eso: intercepta el evento
 * `wheel` él mismo y mueve el scroll asignando `scrollTop` por JS en cada
 * frame, algo que `overflow:hidden` no bloquea (asignar `scrollTop` por
 * código sigue moviendo el contenido aunque el elemento no sea scrolleable
 * a mano). Por eso, aunque la página "no debía" moverse, Lenis la seguía
 * corriendo por debajo.
 *
 * La solución es pedirle al propio Lenis que se detenga (`lenis.stop()` /
 * `lenis.start()`), no sólo tocar CSS. Como la instancia vive acá adentro y
 * HeroPase es un componente hermano sin acceso directo a ella, se
 * comunican con el mismo patrón que ya usa el resto del sitio para esto
 * (eventos en `window`, ver `cuponear:home-reset` en Navbar.jsx):
 * `cuponear:scroll-lock` / `cuponear:scroll-unlock`.
 *
 * ── Refuerzo: allowNestedScroll (2026-08-11, segunda vuelta) ────────────
 * HeroPase.jsx además monta su PROPIA instancia de Lenis scopeada a
 * `.gp-panel` (wrapper propio, no `window`) para que ese scroll interno
 * también deslice con inercia — ver el useEffect de lenisPanelRef ahí. Esa
 * instancia local, sola, ya debería alcanzar (marca el evento como
 * consumido vía `event.lenisStopPropagation` mientras el panel tiene
 * margen para scrollear, así esta instancia global ni lo procesa al
 * burbujear). Como cinturón y tirantes —Lenis documenta justo este
 * escenario, "nested scrollable elements", como el caso que más rompe
 * cuando se lo pasa por alto—, esta instancia global también activa
 * `allowNestedScroll` SÓLO mientras hay algo bloqueando el scroll de
 * página (`cuponear:scroll-lock` activo): si por lo que sea un wheel
 * llegara a burbujear hasta acá con el target adentro de un contenedor con
 * su propio overflow scrolleable, esta instancia lo detecta sola y no
 * hace nada (deja que sea el scroll nativo/la instancia local el que
 * responda), en vez de mover la página de atrás. No queda prendido
 * siempre porque el chequeo recorre el DOM en cada wheel —ver el aviso en
 * la doc de Lenis— y el resto del sitio no tiene paneles anidados que lo
 * necesiten.
 */
// ── Scroll-to a demanda, con su propia curva (2026-08-12) ────────────────
// "Conocé todas las ofertas" (HeroPase.jsx) usaba scrollIntoView nativo — se
// pidió primero que fuera "más lento", después específicamente que
// "acelere de menor a mayor, y luego desacelere" (ease-in-out, no ease-out:
// el ease-out anterior arrancaba de una en velocidad máxima). El propio
// Lenis ya trae un scrollTo con duración/easing configurables (ver README,
// sección scrollTo), así que en vez de reinventar una animación a mano se
// le pide A LENIS que lo haga, por el mismo mecanismo de evento en window
// que ya usa el lock (cuponear:scroll-lock/unlock): HeroPase no tiene ni
// necesita un handle directo a la instancia.
const SCROLL_TO_DURATION = 2.2;
// Cúbica ease-in-out clásica: primera mitad acelera (t³), segunda mitad
// desacelera (espejada) — a diferencia de una ease-out pura, el arranque
// también es gradual, no a velocidad máxima desde el frame cero.
const scrollToEasing = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function useLenisSmoothScroll() {
  // Apagado por el interruptor (ver src/lib/efectos.js): sin Lenis, el scroll
  // de la página es el nativo del navegador y `cuponear:scroll-to` se resuelve
  // con scrollIntoView — el único consumidor del evento es el botón "Conocé
  // todas las ofertas", que si no dejaría de hacer nada.
  //
  // Salto seco, no `behavior: 'smooth'` (2026-08-13): el smooth programático
  // del navegador se verificó INERTE en este Chrome —no se mueve ni un píxel,
  // y pasa igual en cualquier página, no es cosa de la app—, así que dejarlo
  // en smooth es dejar el botón muerto. Con los efectos apagados el salto
  // seco es además lo coherente; la curva vuelve sola al prender SCROLL_SUAVE.
  useEffect(() => {
    if (SCROLL_SUAVE) return;
    const irANativo = (e) => {
      const target = e.detail?.target;
      const el = typeof target === 'string' ? document.querySelector(target) : target;
      el?.scrollIntoView({ block: 'start' });
    };
    window.addEventListener('cuponear:scroll-to', irANativo);
    return () => window.removeEventListener('cuponear:scroll-to', irANativo);
  }, []);

  useEffect(() => {
    if (!SCROLL_SUAVE) return;
    const lenis = new Lenis({
      autoRaf: true,
    });
    const detener  = () => { lenis.options.allowNestedScroll = true; lenis.stop(); };
    const reanudar = () => { lenis.start(); lenis.options.allowNestedScroll = false; };
    const irA = (e) => {
      const target = e.detail?.target;
      if (!target) return;
      lenis.scrollTo(target, { duration: SCROLL_TO_DURATION, easing: scrollToEasing });
    };
    window.addEventListener('cuponear:scroll-lock', detener);
    window.addEventListener('cuponear:scroll-unlock', reanudar);
    window.addEventListener('cuponear:scroll-to', irA);
    return () => {
      window.removeEventListener('cuponear:scroll-lock', detener);
      window.removeEventListener('cuponear:scroll-unlock', reanudar);
      window.removeEventListener('cuponear:scroll-to', irA);
      lenis.destroy();
    };
  }, []);
}
