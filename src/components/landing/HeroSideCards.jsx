// ============================================================
//  src/components/landing/HeroSideCards.jsx
//  Fichas laterales del hero (HeroPase), colgadas del borde derecho
//  de la ventana igual que antes hacía .pv3-contador, pero como
//  columna de accesos directos en vez de un solo contador.
//  Reciben las cards por prop: no hay copy ni data hardcodeada acá.
// ============================================================

import { useEffect, useRef, useState } from 'react';

export default function HeroSideCards({ cards = [], onCardClick }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className="pv3-sidecards">
      {cards.map((c, i) => (
        <button
          key={c.title}
          className="pv3-sidecard"
          onClick={() => onCardClick?.(c)}
          style={{
            transitionDelay: visible ? `${i * 120}ms` : '0ms',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateX(0)' : 'translateX(24px)',
          }}
        >
          <span className="pv3-sidecard-icon">{c.icon}</span>
          <span className="pv3-sidecard-title">{c.title}</span>
          <span className="pv3-sidecard-value">{c.value}</span>
        </button>
      ))}
    </div>
  );
}
