import { useEffect, useRef, useState } from 'react';

/**
 * Devuelve el avance del scroll dentro de una seccion mas alta que el viewport.
 * 0 = arranca a avanzar. 1 = termino su recorrido. No secuestra el scroll:
 * el usuario siempre puede seguir de largo.
 *
 * `preEnterVh` (0-100, en vh) adelanta el arranque: sin el, progress queda en
 * 0 hasta que el borde superior de la seccion toca el techo del viewport
 * (recien ahi empieza a ser sticky), y todo lo atado a progress se queda
 * quieto hasta ese instante — con una seccion que entra de mas abajo, eso se
 * siente como una pausa en blanco antes de que arranque nada. Con preEnterVh,
 * progress ya empieza a moverse mientras la seccion todavia esta entrando en
 * flujo normal (antes de anclarse): 0 cuando falta preEnterVh de vh para que
 * el borde toque el techo, no cuando lo toca.
 */
export function useScrollProgress(ref, preEnterVh = 0) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const read = () => {
      frame.current = 0;
      const rect = el.getBoundingClientRect();
      const preEnterPx = (preEnterVh / 100) * window.innerHeight;
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) {
        setProgress(rect.top <= 0 ? 1 : 0);
        return;
      }
      const total = preEnterPx + travel;
      const p = (preEnterPx - rect.top) / total;
      setProgress(p < 0 ? 0 : p > 1 ? 1 : p);
    };

    const onScroll = () => {
      if (frame.current) return;
      frame.current = requestAnimationFrame(read);
    };

    read();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [ref, preEnterVh]);

  return progress;
}

/** Reescala p al tramo [start, end] y lo recorta a 0..1. */
export function subProgress(p, [start, end]) {
  if (end <= start) return p >= end ? 1 : 0;
  const v = (p - start) / (end - start);
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** true cuando el sistema pide menos movimiento. */
export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}
