// ============================================================
//  src/components/landing/HeroPase.jsx
//  Hero de la home a DOS columnas:
//   · Izquierda: título (Viví gesell / a precio de local) + swoosh,
//     bajada con el logo cuponear y las 3 tarjetas de pase.
//   · Derecha: galería masonry (tipo Pinterest) con parallax al
//     scrollear; fotos random del pool /public/grilla por carga.
//  Estilos responsive inyectados inline (<style> local, clases .pv2-*).
// ============================================================

import { useEffect, useRef, useState } from 'react';

// ─── Design tokens (mismos del hero actual) ──────────────────
const A = {
  primary:     '#2545E6',
  primaryDark: '#1731B8',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  font:        "'Inter', system-ui, sans-serif",
};

// ─── Planes (copy y precios del mockup nuevo) ────────────────
const PLANES = [
  {
    brand: 'pass', sufijo: 'x3', id: 'x3',
    desc: <><b>3 días</b> de acceso ilimitado<br />al catálogo de descuentos.</>,
    cta: 'Elegir 3 días', variant: 'fill',
    precio: '$20.000', precioNota: 'por única vez',
  },
  {
    brand: 'pass', sufijo: 'x7', id: 'x7',
    desc: <><b>7 días</b> de acceso ilimitado<br />al catálogo de descuentos.</>,
    cta: 'Elegir 7 días', variant: 'fill',
    precio: '$35.000', precioNota: 'por única vez',
  },
  {
    brand: 'club', id: 'club',
    desc: <><b>¡Asociate ya!</b> Promos y descuentos en todo el país.</>,
    cta: 'Suscribite ahora', variant: 'outline',
    precio: '$8.333', precioNota: 'por mes',
  },
];

// Lockup "GESELL Pass x3/x7" en NauryzRedkeds (la display que venimos
// usando); "Pass" en pastilla y el sufijo x3/x7 en Inter itálica, chico.
const NAURYZ = "'NauryzRedkeds', 'Inter', sans-serif";
function PassLockup({ sufijo }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5, fontSize: 'clamp(14px, 1.15vw, 17px)', whiteSpace: 'nowrap', lineHeight: 1 }}>
      <span style={{ fontFamily: NAURYZ, color: A.ink }}>GESELL</span>
      <span style={{ fontFamily: NAURYZ, color: A.primary }}>Pass</span>
      <span style={{ fontFamily: A.font, fontStyle: 'italic', fontWeight: 400, fontSize: '0.92em', color: A.primary }}>{sufijo}</span>
    </span>
  );
}

// Lockup "CLUB cuponear": "CLUB" liviano, poca interletra, alineado a la
// izquierda (arranca sobre la C del logo cuponear).
function ClubLockup() {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0, lineHeight: 1 }}>
      <span style={{ fontSize: 12.65, fontWeight: 600, letterSpacing: '0.04em', color: A.ink, marginBottom: -4.5 }}>CLUB</span>
      <img src="/logo-cuponera.svg" alt="Cuponear" style={{ display: 'block', height: 34.5, width: 'auto' }} />
    </span>
  );
}

// ─── Galería derecha: masonry tipo Pinterest ─────────────────
// Pool = fotos de /public/grilla. OJO: esta lista es MANUAL, así que si
// agregás/renombrás/borrás archivos en la carpeta hay que actualizarla
// (un nombre viejo da 404 = imagen rota). Red de seguridad: la galería
// OCULTA sola cualquier foto que no cargue (onError), así nunca queda el
// ícono roto aunque la lista quede desfasada.
const GRILLA_IMGS = [
  '4x4.avif', 'almuerzo.jpg', 'bosque.jpg', 'cabalgata.jpg', 'cafe.webp',
  'faro.jpg', 'feria.jpg', 'kite.jpeg', 'lobito.jpg', 'mar2.jpg',
  'mar3.jpg', 'masaje.jpeg', 'muelle.jpeg', 'nido.jpg', 'pinocha.jpg',
  'sandboard.jpeg',
  // Nombre larguísimo — conviene renombrarla (p. ej. 'playa-bosque.jpeg'):
  'no-es-carilo-ni-mar-del-plata-la-playa-con-un-pacifico-bosque-y-medanos-ideal-para-ir-el-proximo-feriado-foto-freepik-LNTHDWB4OVBIPCGIEFKITGJ56I.jpeg',
].map(f => `/grilla/${f}`);

// Proporciones ESTÁNDAR por celda (multiplicador de alto respecto del ancho
// de columna): 1.0 = cuadrado · 1.25 = 4:5 · 1.33 = 3:4 · 1.5 = 2:3. Nunca
// más que 2:3 → jamás quedan fotos "altísimas" (pensado tipo Pinterest).
// Patrón fijo por columna e índice, con suma alta para llenar sin huecos.
const COL_ASPECT = [
  [1.33, 1.50, 1.25, 1.50],
  [1.50, 1.33, 1.50, 1.25],
  [1.25, 1.50, 1.33, 1.50],
];

// Metadata por columna: desfase vertical (spacer superior, px) + factor de
// parallax (f). Parallax exagerado; el colchón (BUFFER) evita descubrir
// bordes al moverse.
const COL_META = [
  { spacer: 0,  f: 0.10 },
  { spacer: 58, f: 0.20 },
  { spacer: 28, f: 0.15 },
];
const NUM_COLS = COL_META.length;

// Máximo de fotos visibles por vista (contando cortadas + enteras).
const MAX_FOTOS = 12;
// Colchón vertical (px) por encima/debajo de la ventana: aire para que el
// parallax (exagerado) mueva las columnas sin descubrir bordes.
const BUFFER = 220;

// Barajado Fisher-Yates (no muta el original).
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Elige hasta MAX_FOTOS fotos únicas al azar y las reparte en NUM_COLS
// columnas. Al barajar un pool sin duplicados y cortar, ninguna imagen se
// repite dentro de la misma vista. Se llama una vez por montaje → random
// en cada carga.
function buildColumns() {
  const imgs = shuffle(GRILLA_IMGS).slice(0, MAX_FOTOS);
  const cols = Array.from({ length: NUM_COLS }, () => []);
  imgs.forEach((src, i) => { cols[i % NUM_COLS].push(src); });
  return cols;
}

// Deriva mobile: apenas dos fotos tenues arriba para no dejar pelado.
const MOBILE_DECO = [
  { src: '/grilla/mar3.jpg',  style: { top: -6, left: -6, width: 120, height: 140 }, radius: '0 0 40px 26px' },
  { src: '/grilla/kite.jpeg', style: { top: -6, right: -6, width: 110, height: 128 }, radius: '0 0 26px 40px' },
];

// Trazo a mano bajo "de local" (mismo asset y técnica que el hero actual).
function Swoosh() {
  return (
    <img src="/subraya-01.svg" alt="" aria-hidden="true"
      style={{ position: 'absolute', left: '50%', bottom: 'calc(-0.5em - 12px)', transform: 'translateX(-50%)', width: '145%', height: 'auto', pointerEvents: 'none' }} />
  );
}

// ─── Tarjeta de plan ─────────────────────────────────────────
function PlanCard({ plan, onClick }) {
  const fill = plan.variant === 'fill';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', flex: '1 1 0', minWidth: 140 }}>
      {/* Lockup de marca (texto) — bajado 15px para acercarlo a su descripción
          (translateY no altera el layout, así el resto queda en su lugar) */}
      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, transform: 'translateY(15px)' }}>
        {plan.brand === 'pass' ? <PassLockup sufijo={plan.sufijo} /> : <ClubLockup />}
      </div>

      {/* Descripción — altura fija en el contenedor (no en el <p>) para que
          CTA y precio alineen entre las 3 tarjetas sin romper el párrafo */}
      <div style={{ height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 0 16px' }}>
        <p style={{ fontSize: 13, lineHeight: 1.45, color: A.ink, margin: 0 }}>{plan.desc}</p>
      </div>

      {/* CTA */}
      <button
        onClick={onClick}
        style={{
          width: '100%', maxWidth: 190, padding: '13px 16px', borderRadius: 999, cursor: 'pointer',
          fontFamily: A.font, fontWeight: 700, fontSize: 14, transition: 'background .15s, color .15s',
          background: fill ? A.primary : '#fff', color: fill ? '#fff' : A.primary,
          border: fill ? 'none' : `1.5px solid ${A.primary}`,
        }}
        onMouseEnter={e => { if (fill) e.currentTarget.style.background = A.primaryDark; else { e.currentTarget.style.background = A.primary; e.currentTarget.style.color = '#fff'; } }}
        onMouseLeave={e => { if (fill) e.currentTarget.style.background = A.primary; else { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = A.primary; } }}
      >
        {plan.cta}
      </button>

      {/* Precio */}
      <div style={{ marginTop: 12, fontSize: 13.5, color: A.primary }}>
        <b>{plan.precio}</b> <span style={{ fontStyle: 'italic', color: A.ink2 }}>{plan.precioNota}</span>
      </div>
    </div>
  );
}

export default function HeroPase({ onVerDescuentos, onSuscribir }) {
  const [scrollY, setScrollY] = useState(0);
  const [cols] = useState(buildColumns); // random por carga, estable en la sesión
  const rafRef = useRef(0);

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
    <section className="pv2-hero" style={{ position: 'relative', zIndex: 0, fontFamily: A.font, background: 'linear-gradient(180deg, #FFF7EB 0%, #FFFFFF 60%)', overflowX: 'clip' }}>

      {/* ─── Galería derecha: capa detrás, de techo a piso, sin huecos ───
          `pv2-galwin` es la ventana que recorta (al corte). Dentro, una capa
          más alta (colchón arriba/abajo) permite el parallax sin descubrir
          bordes. Cada columna llena SIEMPRE hasta abajo: la última celda
          crece (flex) para tapar cualquier hueco. */}
      <div className="pv2-galwin" aria-hidden="true">
        <div className="pv2-gallery">
          {cols.map((items, ci) => (
            <div key={ci} className="pv2-col" style={{
              transform: `translate3d(0, ${scrollY * COL_META[ci].f}px, 0)`, willChange: 'transform',
            }}>
              {COL_META[ci].spacer > 0 && <div style={{ flex: '0 0 auto', height: COL_META[ci].spacer }} />}
              {items.map((src, idx) => (
                <div key={`${ci}-${idx}`} className="pv2-cell"
                  style={{ aspectRatio: 1 / (COL_ASPECT[ci][idx % COL_ASPECT[ci].length]) }}>
                  <img src={src} alt="" loading="lazy"
                    onError={e => { const c = e.currentTarget.parentElement; if (c) c.style.display = 'none'; }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="pv2-inner">

        {/* ─── Columna izquierda: texto ─── */}
        <div className="pv2-left">
          {/* Título */}
          <h1 className="pv2-title" style={{ position: 'relative', margin: 0, lineHeight: 1.16, letterSpacing: 0 }}>
            <span style={{ display: 'block', fontStyle: 'italic', fontWeight: 300, color: A.primary, fontSize: 'clamp(48px, 5.7vw, 82px)' }}>Viví gesell</span>
            <span style={{ display: 'block', fontWeight: 600, color: A.ink, letterSpacing: '-0.02em', fontSize: 'clamp(34px, 3.7vw, 54px)' }}>
              a precio{' '}
              <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>
                de local
                <Swoosh />
              </span>
            </span>
          </h1>

          {/* Bajada con logo cuponear inline */}
          <p className="pv2-sub" style={{ color: A.ink, margin: '48px 0 0', lineHeight: 1.6, fontStyle: 'italic', letterSpacing: '0.01em' }}>
            Pases de ahorro en <b>gastronomía, experiencias y compras.</b><br />
            <img src="/logo-cuponera.svg" alt="cuponear" style={{ display: 'inline-block', height: 27, width: 'auto', verticalAlign: '-6px', marginRight: 5 }} />
            es saber ahorrar y viajar sin gastar de más!
          </p>

          {/* Tarjetas de pase */}
          <div className="pv2-planes" style={{ display: 'flex', alignItems: 'flex-start', gap: 28, margin: '68px 0 0' }}>
            {PLANES.map((plan) => (
              <PlanCard key={plan.id} plan={plan} onClick={() => suscribir(plan.id)} />
            ))}
          </div>
        </div>

        {/* Decoración mobile (solo pantallas chicas) */}
        <div className="pv2-mobile-deco" aria-hidden="true">
          {MOBILE_DECO.map(s => (
            <div key={s.src} style={{ position: 'absolute', overflow: 'hidden', ...s.style, borderRadius: s.radius, opacity: 0.22 }}>
              <img src={s.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Barra divisoria */}
      <div aria-hidden="true" style={{ position: 'relative', zIndex: 3, height: 6, background: A.primary }} />

      {/* Estilos responsive locales (autocontenidos para la prueba) */}
      <style>{`
        /* Contenedor del texto (columna izquierda), centrado vertical */
        .pv2-inner {
          position: relative;
          z-index: 2;
          max-width: 1328px;
          margin: 0 auto;
          padding: 130px 40px 56px;
          min-height: 760px;
          display: flex;
          align-items: center;
        }
        .pv2-left { max-width: 600px; }
        .pv2-sub  { font-size: clamp(16px, 1.5vw, 20px); max-width: 600px; white-space: nowrap; }
        /* En pantallas más chicas sí puede cortarse la frase */
        @media (max-width: 1340px) { .pv2-sub { white-space: normal; } }

        /* Ventana de la galería: recorta al corte (techo → piso), detrás del
           texto (z-index 0) y sin capturar clicks. No afecta el layout: es
           absoluta, así el alto del hero lo fija solo el contenido de texto. */
        .pv2-galwin {
          position: absolute;
          top: 0;
          bottom: 6px;            /* deja ver la barra divisoria de 6px */
          right: 15px;
          width: clamp(460px, 44vw, 820px);
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }
        /* Capa interna más alta (colchón arriba/abajo) para que el parallax
           mueva las columnas sin descubrir bordes. */
        .pv2-gallery {
          position: absolute;
          left: 0; right: 0;
          top: -${BUFFER}px;
          bottom: -${BUFFER}px;
          display: flex;
          gap: 16px;
        }
        .pv2-col  { flex: 1 1 0; display: flex; flex-direction: column; gap: 16px; }
        .pv2-cell { flex: 0 0 auto; border-radius: 20px; overflow: hidden; box-shadow: 0 22px 44px -30px rgba(11,16,32,0.28); }
        .pv2-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pv2-mobile-deco { display: none; }

        @media (max-width: 1180px) {
          .pv2-inner {
            text-align: center;
            padding: 132px 24px 56px;
            min-height: 0;
            justify-content: center;
          }
          .pv2-left { display: flex; flex-direction: column; align-items: center; max-width: 620px; }
          .pv2-sub { margin-left: auto; margin-right: auto; }
          .pv2-planes { flex-wrap: wrap; justify-content: center; max-width: 620px; }
          .pv2-galwin { display: none; }
          .pv2-mobile-deco { display: block; position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        }
        @media (max-width: 560px) {
          .pv2-planes > div { flex: 1 0 100% !important; }
        }
      `}</style>
    </section>
  );
}
