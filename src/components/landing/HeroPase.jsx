// ============================================================
//  src/components/landing/HeroPase.jsx
//  Hero de la home — Pase Gesell. Calco del mockup:
//  logo cuponear · localidades · título · caja de catálogo ·
//  suscripción a Gesell Pass con 3 planes. Alrededor, fotos
//  del lugar recortadas con formas orgánicas y parallax al
//  scrollear. Clases `.pase-*` en src/index.css.
// ============================================================

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

// ─── Design tokens (Aire) ────────────────────────────────────
const A = {
  primary:     '#2545E6',
  primaryDark: '#1731B8',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  font:        "'Inter', system-ui, sans-serif",
  montserrat:  "'Montserrat', 'Inter', sans-serif",
};

// Localidades de la red (calco del mockup, en orden y mayúsculas).
const LOCALIDADES = [
  'Mar de las Pampas', 'Mar Azul', 'Las Gaviotas',
  'Villa Gesell', 'El Salvaje', 'Colonia Marina',
];

// Planes del pase (copy del mockup — precios placeholder).
const PLANES = [
  { label: 'plan 3 días',        precio: '$10.000' },
  { label: 'plan 7 días',        precio: '$18.000' },
  { label: 'para alojamientos',  precio: '$20.000 x mes' },
];

// Satélites recortados en la periferia. `f` = factor de parallax.
// Las 4 del medio subidas 100px respecto del boceto; las de arriba y
// abajo quedan como referencia.
const SATELITES = [
  { src: '/grilla/mar3.jpg',      style: { top: -8, left: -8, width: 'clamp(216px, 23.4vw, 387px)', height: 241 }, radius: '0 0 64px 40px',  f:  0.05 },
  { src: '/grilla/kite.jpeg',     style: { top: -8, right: -8, width: 'clamp(210px, 22vw, 360px)', height: 214 }, radius: '0 0 40px 64px',  f:  0.08 },
  { src: '/grilla/feria.jpg',     style: { top: 250, left: 52, width: 210, height: 276 }, radius: '96px 28px 96px 28px', f: -0.09 },
  { src: '/grilla/masaje.jpeg',   style: { top: 469, left: 177, width: 216, height: 194 }, radius: '28px 82px 28px 82px', f:  0.11 },
  { src: '/grilla/cafe.webp',     style: { top: 226, right: 52, width: 248, height: 244 }, radius: '90px 28px 28px 90px', f: -0.08 },
  { src: '/grilla/sandboard.jpeg',style: { top: 496, right: 116, width: 202, height: 214 }, radius: '30px 84px 30px 92px', f:  0.10 },
];

// Satélites que "asoman desde atrás" del módulo siguiente: viven en la
// capa más al fondo del hero, se prolongan por debajo de la línea azul
// y el módulo 2 (opaco) los tapa como un bloque que pasa por encima.
// Al scrollear el parallax los revela.
const SATELITES_FONDO = [
  { src: '/grilla/cabalgata.jpg', style: { bottom: -40, left: -8, width: 300, height: 340 }, radius: '70px 44px 96px 40px', f:  0.10 },
  { src: '/grilla/4x4.avif',      style: { bottom: -40, right: -8, width: 258, height: 350 }, radius: '44px 70px 40px 96px', f:  0.12 },
];

// ─── Caja punteada del catálogo ──────────────────────────────
// El borde se dibuja con un SVG (dash espaciado + trazo fino) para
// tener control real del punteado, y el botón se apoya sobre el
// borde inferior "cortándolo".
function CatalogoBox({ onVerDescuentos }) {
  const ref = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => {
      // border-box (incluye padding) para que el SVG cubra toda la caja
      // y el punteado quede centrado, no corrido por el padding.
      const bw = e.borderBoxSize?.[0]?.inlineSize ?? e.target.offsetWidth;
      const bh = e.borderBoxSize?.[0]?.blockSize ?? e.target.offsetHeight;
      setBox({ w: Math.round(bw), h: Math.round(bh) });
    });
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block', margin: '56px auto 0', padding: '26px 30px 0' }}>
      {/* Borde punteado */}
      <svg width={box.w} height={box.h} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
        <rect x="1" y="1" width={Math.max(0, box.w - 2)} height={Math.max(0, box.h - 2)} rx="22" ry="22"
          fill="none" stroke={A.primary} strokeWidth="1.1" strokeDasharray="3 5" strokeLinecap="round" />
      </svg>

      <p style={{ fontFamily: A.font, fontStyle: 'italic', fontSize: 'clamp(14px, 1.4vw, 17px)', lineHeight: 1.5, color: A.primary, margin: 0, whiteSpace: 'nowrap' }}>
        Un solo pago y activás todos los descuentos<br />
        <b>en gastronomía, compras y experiencias.</b>
      </p>

      {/* Botón que corta el borde inferior */}
      <button
        onClick={() => onVerDescuentos?.()}
        style={{ position: 'relative', zIndex: 1, margin: '20px auto -24px', display: 'block', background: A.primary, color: '#fff', border: 'none', padding: '15px 30px', borderRadius: 999, fontWeight: 700, fontSize: 15.5, cursor: 'pointer', fontFamily: A.font }}
        onMouseEnter={e => { e.currentTarget.style.background = A.primaryDark; }}
        onMouseLeave={e => { e.currentTarget.style.background = A.primary; }}
      >
        Catálogo de descuentos
      </button>
    </div>
  );
}

// Trazo a mano bajo "de local". El asset lo exportás vos desde el
// diseño (SVG/PNG) y lo dejás en public/subrayado-local.svg — así
// pega exacto sin tocar código. Ocupa el aire bajo el título.
function Swoosh() {
  return (
    <img src="/subrayado-local.svg" alt="" aria-hidden="true"
      style={{ position: 'absolute', left: '50%', bottom: -30, transform: 'translateX(-50%)', width: 240, maxWidth: '120%', height: 'auto', pointerEvents: 'none' }} />
  );
}

export default function HeroPase({ onVerDescuentos, onSuscribir }) {
  const [scrollY, setScrollY] = useState(0);
  const rafRef = useRef(0);

  // Parallax: seguimos el scroll con rAF para no saturar el render.
  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY || 0);
        rafRef.current = 0;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const suscribir = (plan) => (onSuscribir || onVerDescuentos)?.(plan);

  return (
    <section className="pase-hero" style={{ position: 'relative', zIndex: 0, fontFamily: A.font, background: 'linear-gradient(180deg, #FFFDFB 0%, #FFFFFF 100%)', overflowX: 'clip' }}>

      {/* ─ Capa trasera: satélites que asoman desde detrás del módulo 2 ─ */}
      <div className="pase-deco-fondo" aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        {SATELITES_FONDO.map(s => (
          <div key={s.src} style={{
            position: 'absolute', overflow: 'hidden', ...s.style, borderRadius: s.radius,
            transform: `translate3d(0, ${scrollY * s.f}px, 0)`, willChange: 'transform',
            opacity: 0.4,
          }}>
            <img src={s.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
      </div>

      <div className="pase-stage" style={{ position: 'relative', minHeight: 1000, display: 'flex', justifyContent: 'center', padding: '136px 24px 20px', overflow: 'hidden' }}>

        {/* ─ Satélites con parallax ─ */}
        <div className="pase-deco" aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
          {SATELITES.map(s => (
            <div key={s.src} style={{
              position: 'absolute', overflow: 'hidden', ...s.style, borderRadius: s.radius,
              transform: `translate3d(0, ${scrollY * s.f}px, 0)`, willChange: 'transform',
              opacity: 0.4,
            }}>
              <img src={s.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>

        {/* ─ Contenido central ─ */}
        <div className="pase-content" style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 680, textAlign: 'center' }}>

          {/* 1 · Logo Cuponear */}
          <img src="/logo-cuponera.svg" alt="Cuponear" style={{ height: 'clamp(34px, 3.6vw, 46px)', width: 'auto', display: 'block', margin: '0 auto 66px' }} />

          {/* 2 · Localidades de la red — Montserrat liviana, una sola línea. */}
          <div className="pase-locs" style={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'center', gap: 9, margin: '0 0 16px' }}>
            {LOCALIDADES.map((loc, i) => (
              <span key={loc} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontFamily: A.montserrat, fontSize: 'clamp(10px, 1.05vw, 13px)', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', color: A.primary, whiteSpace: 'nowrap' }}>
                {loc}
                {i < LOCALIDADES.length - 1 && <span style={{ fontFamily: A.montserrat, fontSize: 6, opacity: 0.55 }}>○</span>}
              </span>
            ))}
          </div>

          {/* 3 · Título — todo en una línea, Inter */}
          <h1 className="pase-titulo" style={{ position: 'relative', display: 'inline-block', fontSize: 'clamp(28px, 4.3vw, 58px)', lineHeight: 1.08, letterSpacing: 0, margin: 0, whiteSpace: 'nowrap' }}>
            <span style={{ fontStyle: 'italic', fontWeight: 300, color: A.primary, marginRight: '0.16em' }}>Viví gesell</span>
            <span style={{ fontWeight: 600, color: A.ink, letterSpacing: '-0.015em' }}>a precio </span>
            <span style={{ position: 'relative', fontWeight: 600, color: A.ink, letterSpacing: '-0.015em' }}>
              de local
              <Swoosh />
            </span>
          </h1>

          {/* 4 · Caja de catálogo */}
          <CatalogoBox onVerDescuentos={onVerDescuentos} />

          {/* 5 · Suscripción a Gesell Pass */}
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: 10, margin: '148px 0 0', fontSize: 'clamp(15px, 1.4vw, 17px)', color: A.ink, fontWeight: 500 }}>
            <span>¡Suscribite ahora a</span>
            <img src="/gesell-pass.svg" alt="Gesell Pass" style={{ height: 34, width: 'auto', display: 'block' }} />
            <span>y lo activás cuando viajes!</span>
          </div>

          {/* 6 · Planes */}
          <div className="pase-planes" style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', gap: 0, margin: '22px auto 0', maxWidth: 620 }}>
            {PLANES.map((plan, i) => (
              <div key={plan.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '4px 18px', borderLeft: i > 0 ? '1px solid #D8DEEA' : 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: A.primary }}>{plan.label}</div>
                <div style={{ fontSize: 16, fontStyle: 'italic', color: A.ink2, marginBottom: 4 }}>{plan.precio}</div>
                <button
                  onClick={() => suscribir(plan.label)}
                  style={{ background: A.ink, color: '#fff', border: 'none', padding: '11px 22px', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: A.font, transition: 'background .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1c2333'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = A.ink; }}
                >
                  Suscribirse
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barra divisoria — por delante de las imágenes que asoman */}
      <div aria-hidden="true" style={{ position: 'relative', zIndex: 3, height: 6, background: A.primary }} />
    </section>
  );
}
