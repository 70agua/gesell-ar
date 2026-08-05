import { useEffect, useRef, useState } from 'react';

/**
 * Devuelve el avance del scroll dentro de una seccion mas alta que el viewport.
 * 0 = la seccion recien se ancla arriba. 1 = termino su recorrido.
 * No secuestra el scroll: el usuario siempre puede seguir de largo.
 */
export function useScrollProgress(ref) {
  const [progress, setProgress] = useState(0);
  const frame = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const read = () => {
      frame.current = 0;
      const rect = el.getBoundingClientRect();
      const travel = rect.height - window.innerHeight;
      if (travel <= 0) {
        setProgress(rect.top <= 0 ? 1 : 0);
        return;
      }
      const p = -rect.top / travel;
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
  }, [ref]);

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
