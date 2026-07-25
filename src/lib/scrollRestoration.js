// Control manual del scroll al cargar la página.
//
// Comportamiento deseado:
//   - Refresh (reload) o navegación nueva  → siempre arriba del todo.
//   - Botón "atrás/adelante" del browser    → retomar la posición donde se dejó.
//
// Por defecto el browser usa history.scrollRestoration = 'auto', que en cada
// refresh intenta restaurar la posición previa. Como el hero carga imágenes y
// parallax de forma diferida, esa restauración cae en un punto equivocado
// (la intersección del hero con la sección siguiente). Tomamos el control.

const KEY = 'gesell:scrollPos';

export function initScrollRestoration() {
  if (typeof window === 'undefined') return;

  if ('scrollRestoration' in window.history) {
    window.history.scrollRestoration = 'manual';
  }

  // Tipo de navegación que originó esta carga.
  const nav = performance.getEntriesByType?.('navigation')?.[0];
  const navType = nav?.type; // 'navigate' | 'reload' | 'back_forward' | 'prerender'

  if (navType === 'back_forward') {
    // Volver desde el historial → restaurar la última posición guardada.
    // (Cuando el browser usa bfcache no se ejecuta este script y la posición
    //  se conserva sola; esto cubre el caso en que la página se reconstruye.)
    const saved = Number(sessionStorage.getItem(KEY) || 0);
    if (saved > 0) {
      // La altura definitiva llega recién cuando termina de cargar el contenido
      // diferido: reintentamos hasta que la página sea lo bastante alta.
      let tries = 0;
      const restore = () => {
        window.scrollTo(0, saved);
        if (++tries < 20 && Math.abs(window.scrollY - saved) > 2) {
          setTimeout(restore, 100);
        }
      };
      restore();
    }
  } else {
    // Refresh o entrada nueva → arriba del todo.
    window.scrollTo(0, 0);
  }

  // Guardamos la posición de forma continua (con throttle vía rAF).
  let ticking = false;
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        sessionStorage.setItem(KEY, String(window.scrollY));
        ticking = false;
      });
    },
    { passive: true }
  );
}
