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
// Dos grupos de marca; cada uno con su lockup + descripción y DOS planes.
const GRUPOS = [
  {
    marca: 'pass',
    desc: 'Accedé a todo el catálogo de descuentos locales.',
    planes: [
      { id: 'x3', cta: 'Pase x 3 días', variant: 'fill', precio: '$20.000', nota: 'por única vez' },
      { id: 'x7', cta: 'Pase x 7 días', variant: 'fill', precio: '$35.000', nota: 'por única vez' },
    ],
  },
  {
    marca: 'club',
    desc: 'Promos y descuentos en todos los destinos, sin límites.',
    planes: [
      { id: 'club',     cta: 'Suscribite ahora', variant: 'outline', precio: '$8.333', nota: 'por mes' },
      { id: 'premium', cta: 'Premium',         variant: 'outline',
        notaEspecial: <><b style={{ fontStyle: 'italic', color: A.primary, fontSize: '0.92em' }}>¡Regalá pases ilimitados!</b><br /><span style={{ fontStyle: 'italic', fontSize: '0.92em' }}>Ideal para hoteleros.</span></> },
    ],
  },
];

// Lockup Gesell Pass: SVG del último boceto (público /gesell-pass-03.svg).
const NAURYZ = "'NauryzRedkeds', 'Inter', sans-serif";
function PassLockup() {
  return (
    <img src="/gesell-pass-03.svg" alt="Gesell Pass" style={{ display: 'block', height: 76, width: 'auto', transform: 'translateY(-15px)' }} />
  );
}

// Lockup "CLUB cuponear": "CLUB" liviano, poca interletra, alineado a la
// izquierda (arranca sobre la C del logo cuponear).
function ClubLockup() {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0, lineHeight: 1 }}>
      <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.04em', color: A.primary, marginBottom: -5 }}>CLUB</span>
      <img src="/logo-cuponera.svg" alt="Cuponear" style={{ display: 'block', height: 40, width: 'auto' }} />
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
];

// Metadata por columna: factor de parallax (f), duración del loop continuo
// (dur, seg) y dirección (dir). Dos columnas: la 1 sube, la 2 baja — flujo
// continuo en una sola dirección, sin rebote.
const COL_META = [
  { f: 0.12, dur: 144, dir: 'up' },
  { f: 0.19, dur: 180, dir: 'down' },
];
const NUM_COLS = COL_META.length;

// Colchón vertical (px) por encima/debajo de la ventana: aire para que el
// parallax mueva las columnas sin descubrir bordes.
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
  // Usa TODAS las fotos del pool (repartidas entre las columnas) para que el
  // loop continuo tarde en repetir → "levanta" muchas imágenes de la carpeta.
  const imgs = shuffle(GRILLA_IMGS);
  const cols = Array.from({ length: NUM_COLS }, () => []);
  // Opacidad arbitraria por foto, entre 0.60 y 0.85.
  imgs.forEach((src, i) => {
    const opacity = +(0.60 + Math.random() * 0.25).toFixed(3);
    cols[i % NUM_COLS].push({ src, opacity });
  });
  return cols;
}

// Deriva mobile: apenas dos fotos tenues arriba para no dejar pelado.
const MOBILE_DECO = [
  { src: '/grilla/mar3.jpg',  style: { top: -6, left: -6, width: 120, height: 140 }, radius: '0 0 40px 26px' },
  { src: '/grilla/kite.jpeg', style: { top: -6, right: -6, width: 110, height: 128 }, radius: '0 0 26px 40px' },
];

// Trazo a mano bajo "de local" (mismo asset y técnica que el hero actual).
// ─── Un plan (botón + precio/nota) dentro de un grupo ────────
function SubPlan({ plan, onClick }) {
  const fill = plan.variant === 'fill';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 0', minWidth: 120 }}>
      <button
        onClick={onClick}
        style={{
          width: '100%', maxWidth: 200, padding: '13px 14px', borderRadius: 999, cursor: 'pointer',
          fontFamily: A.font, fontWeight: 700, fontSize: 14, transition: 'background .15s, color .15s',
          background: fill ? A.primary : '#fff', color: fill ? '#fff' : A.primary,
          border: fill ? 'none' : `1.5px solid ${A.primary}`,
        }}
        onMouseEnter={e => { if (fill) e.currentTarget.style.background = A.primaryDark; else { e.currentTarget.style.background = A.primary; e.currentTarget.style.color = '#fff'; } }}
        onMouseLeave={e => { if (fill) e.currentTarget.style.background = A.primary; else { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = A.primary; } }}
      >
        {plan.cta}
      </button>
      <div style={{ marginTop: 12, fontSize: 13.5, textAlign: 'center', lineHeight: 1.4 }}>
        {plan.notaEspecial
          ? <span style={{ color: A.ink }}>{plan.notaEspecial}</span>
          : <span style={{ color: A.primary }}><b>{plan.precio}</b> <span style={{ fontStyle: 'italic', color: A.ink2 }}>{plan.nota}</span></span>}
      </div>
    </div>
  );
}

// ─── Grupo de marca: lockup + descripción + sus dos planes ───
function GrupoPlanes({ grupo, onSelect }) {
  return (
    <div className="pv2-grupo">
      <div className="pv2-grupo-logo">
        {grupo.marca === 'pass' ? <PassLockup /> : <ClubLockup />}
      </div>
      <div className="pv2-grupo-desc">{grupo.desc}</div>
      <div className="pv2-grupo-planes">
        {grupo.planes.map(plan => <SubPlan key={plan.id} plan={plan} onClick={() => onSelect(plan.id)} />)}
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
              {/* Wrapper interno: loop continuo en una dirección (no pisa el
                  parallax del padre). Las fotos van DUPLICADAS para que el
                  bucle sea sin costura (translateY -50% = exactamente un set). */}
              <div className={`pv2-coldrift pv2-marquee-${COL_META[ci].dir}`}
                style={{ animationDuration: `${COL_META[ci].dur}s` }}>
                {[...items, ...items].map((item, idx) => (
                  <div key={`${ci}-${idx}`} className="pv2-cell"
                    style={{ aspectRatio: 1 / (COL_ASPECT[ci][(idx % items.length) % COL_ASPECT[ci].length]) }}>
                    <img src={item.src} alt="" loading="lazy" style={{ opacity: item.opacity }}
                      onError={e => { const c = e.currentTarget.parentElement; if (c) c.style.display = 'none'; }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pv2-inner">

        {/* ─── Columna izquierda: texto ─── */}
        <div className="pv2-left">
          {/* Título — 3 líneas: dos itálicas (con GESELL en NauryzRedkeds azul)
              + una en negrita */}
          <h1 className="pv2-title" style={{ position: 'relative', margin: 0, lineHeight: 1.12, letterSpacing: 0 }}>
            <span style={{ display: 'block', fontStyle: 'italic', fontWeight: 300, color: A.ink, fontSize: 'clamp(34px, 4.3vw, 53px)' }}>Viví cuponeando</span>
            <span style={{ display: 'block', fontStyle: 'italic', fontWeight: 300, color: A.ink, fontSize: 'clamp(34px, 4.3vw, 62px)' }}>en <span style={{ fontFamily: NAURYZ, fontStyle: 'normal', fontWeight: 'normal', color: A.primary, fontSize: '0.82em' }}>GESELL</span> y alrededores</span>
            <span style={{ display: 'block', fontWeight: 600, color: A.ink, letterSpacing: '-0.02em', fontSize: 'clamp(26px, 3.2vw, 44px)', marginTop: '0.12em' }}>a precio de local y sin gastar de más</span>
          </h1>

          {/* Bajada con línea azul a la izquierda + "CUPONEaR" en texto */}
          <p className="pv2-sub" style={{ color: A.ink, margin: '44px 0 0', lineHeight: 1.6, fontStyle: 'italic', letterSpacing: '0.01em', borderLeft: `3px solid ${A.primary}`, paddingLeft: 18 }}>
            Pases de ahorro en <b>gastronomía, experiencias y compras.</b><br />
            <span style={{ fontFamily: NAURYZ, fontStyle: 'normal', fontWeight: 'normal', color: A.primary, fontSize: '0.8em', letterSpacing: 0 }}>CUPONEaR</span> es saber ahorrar y viajar sin gastar de más!
          </p>

          {/* Planes — 2 grupos (Gesell Pass · Club Cuponear), 2 planes c/u */}
          <div className="pv2-planes">
            {GRUPOS.map((grupo) => (
              <GrupoPlanes key={grupo.marca} grupo={grupo} onSelect={(id) => suscribir(id)} />
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
        .pv2-left { max-width: 900px; }
        .pv2-sub  { font-size: clamp(16px, 1.5vw, 20px); max-width: 560px; white-space: nowrap; }
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
          width: clamp(300px, 28vw, 540px);
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
        .pv2-col  { flex: 1 1 0; }
        /* Wrapper interno: loop continuo en una dirección (marquee) sin costura.
           El translate de la animación se compone con el del parallax (padre).
           Sin gap: el espaciado va como margin-bottom en cada celda (incluida la
           última) para que translateY(-50%) sea exactamente un set. */
        .pv2-coldrift { display: flex; flex-direction: column; will-change: transform; }
        .pv2-marquee-up   { animation: pv2MarqueeUp   linear infinite; }
        .pv2-marquee-down { animation: pv2MarqueeDown linear infinite; }
        @keyframes pv2MarqueeUp   { from { transform: translateY(0); }    to { transform: translateY(-50%); } }
        @keyframes pv2MarqueeDown { from { transform: translateY(-50%); } to { transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .pv2-marquee-up, .pv2-marquee-down { animation: none; }
        }
        .pv2-cell { flex: 0 0 auto; margin-bottom: 16px; border-radius: 20px; overflow: hidden; box-shadow: 0 22px 44px -30px rgba(11,16,32,0.28); }
        .pv2-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pv2-mobile-deco { display: none; }

        /* Planes: 2 grupos (Gesell Pass · Club Cuponear) con 2 planes c/u */
        .pv2-planes { display: flex; align-items: flex-start; gap: 56px; margin-top: 52px; }
        .pv2-grupo { flex: 1 1 0; display: flex; flex-direction: column; align-items: center; }
        .pv2-grupo-logo { height: 62px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; transform: translateY(10px); }
        .pv2-grupo-desc { font-size: 13px; line-height: 1.4; color: #0B1020; text-align: center; white-space: nowrap; height: 22px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
        /* En pantallas donde no entra en una línea, se permite cortar */
        @media (max-width: 1280px) { .pv2-grupo-desc { white-space: normal; height: 40px; } }
        .pv2-grupo-planes { display: flex; gap: 16px; width: 100%; justify-content: center; }

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
