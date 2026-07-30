// ============================================================
//  src/components/landing/HeroPaseB.jsx
//  HERO VIGENTE de la home. Nació como variante B de una prueba de jerarquía y
//  quedó como definitivo. El hero anterior sigue en HeroPase.jsx y se puede ver
//  con ?hero=a en la URL (ver HomeView) mientras se compara.
//
//  Qué cambia respecto del hero anterior, y por qué:
//   1. Un solo protagonista: el turista. El título ya le habla a él ("Viví
//      cuponeando a precio de local"), así que la primera acción que se cruza
//      también es suya. Hotelería baja a un carril propio al pie del hero.
//   2. El precio entra DENTRO del botón. En A la decisión (cuánto sale) vivía
//      en el nivel tipográfico más chico, debajo del botón, repetida dos veces.
//   3. Un solo párrafo de apoyo en lugar de dos claims en itálica de cuerpo
//      casi igual (21 y 22px) que se leían como el mismo nivel y competían.
//   4. Cuatro pesos de acción (botón negro, dos azules, pastilla lavanda, link)
//      pasan a dos: azul lleno = comprar; link subrayado = todo lo demás.
//   5. El ticket inclinado deja de ser un adorno al costado y pasa a ser la
//      marca del producto arriba del título — eso jubila la pastilla "PASE
//      TURISTA" y le da un trabajo real. Además se inclina -14°, en el mismo
//      sentido que la galería, en vez de -25° cruzándola.
//
//  Estilos locales autocontenidos, prefijo .pv3-* (el hero anterior usa .pv2-*:
//  no se pisan). La galería está duplicada de HeroPase.jsx a propósito, para que
//  las dos puedan convivir; al borrar la vieja, sale a componente propio.
// ============================================================

import { useEffect, useRef, useState } from 'react';

// ─── Design tokens ───────────────────────────────────────────
const A = {
  primary:     '#2545E6',
  primaryDark: '#1731B8',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  line:        '#E6E3DC',
  font:        "'Inter', system-ui, sans-serif",
};

const NAURYZ = "'NauryzRedkeds', 'Inter', sans-serif";

// ─── Los dos pases ──────────────────────────────────────────
// `dias` es la clave real: es lo que se busca en la tabla `pases` al entrar al
// checkout, de donde sale el precio que se cobra. El precio de acá es sólo
// vidriera. `dias` en negrita + precio al lado: el botón dice la decisión
// completa, sin letra chica debajo.
const PASES = [
  { id: 'x3', dias: 3, label: '3 días', precio: '$20.000' },
  { id: 'x7', dias: 7, label: '7 días', precio: '$35.000' },
];

// ─── Galería derecha (idéntica a la variante A) ──────────────
// Se mantiene igual a propósito: lo que está a prueba es la columna de texto,
// no el fondo. Si B gana, el bloque de galería sale a un componente propio y
// las dos variantes lo comparten.
const GRILLA_MODULES = import.meta.glob(
  '../../assets/grilla-web/*.{jpg,jpeg,png,webp,avif}',
  { eager: true, query: '?url', import: 'default' },
);
const GRILLA_IMGS = Object.values(GRILLA_MODULES);
const foto = (nombre) => GRILLA_MODULES[`../../assets/grilla-web/${nombre}`];

const COL_ASPECT = [
  [1.33, 1.50, 1.25, 1.50],
  [1.50, 1.33, 1.50, 1.25],
];
const COL_META = [
  { f: 0.12, dur: 144, dir: 'up' },
  { f: 0.19, dur: 180, dir: 'down' },
];
const NUM_COLS = COL_META.length;
const BUFFER = 220;
const TILT = -10;
const OVERHANG = Math.ceil(460 * Math.abs(Math.sin((TILT * Math.PI) / 180)));
const FADE_ANGLE = 90 + TILT;
const FADE_START = 20;
const FADE = 100;

const CAPAS = {
  lejos: { opacity: 0.65, shadow: '0 10px 26px -24px rgba(11,16,32,0.22)' },
  medio: { opacity: 0.75, shadow: '0 18px 38px -30px rgba(11,16,32,0.26)' },
  cerca: { opacity: 0.85, shadow: '0 22px 44px -28px rgba(11,16,32,0.34)' },
};
const PESOS_CAPA = [
  ['lejos', 'lejos', 'medio', 'medio', 'cerca'],
  ['cerca', 'cerca', 'medio', 'medio', 'lejos'],
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildColumns() {
  const imgs = shuffle(GRILLA_IMGS);
  const cols = Array.from({ length: NUM_COLS }, () => []);
  imgs.forEach((src, i) => {
    const ci = i % NUM_COLS;
    const pesos = PESOS_CAPA[ci];
    cols[ci].push({ src, capa: pesos[Math.floor(Math.random() * pesos.length)] });
  });
  return cols;
}

const MOBILE_DECO = [
  { src: foto('mar3.jpg'),  style: { top: -6, left: -6, width: 120, height: 140 }, radius: '0 0 40px 26px' },
  { src: foto('kite.jpeg'), style: { top: -6, right: -6, width: 110, height: 128 }, radius: '0 0 26px 40px' },
].filter(d => d.src);

export default function HeroPaseB({ onVerDescuentos, onSuscribir, onComprarPase }) {
  const [cols] = useState(buildColumns);
  const rafRef  = useRef(0);
  const heroRef = useRef(null);
  const colRefs = useRef([]);
  const visibleRef = useRef(true);

  // Parallax fuera de React (un setState por frame re-renderizaría las 34
  // celdas), y congelado cuando el hero no se ve. Igual que en la variante A.
  useEffect(() => {
    const pintar = () => {
      rafRef.current = 0;
      const y = window.scrollY || 0;
      colRefs.current.forEach((nodo, i) => {
        if (nodo) nodo.style.transform = `translate3d(0, ${y * COL_META[i].f}px, 0)`;
      });
    };
    const agendar = () => {
      if (rafRef.current || !visibleRef.current) return;
      rafRef.current = requestAnimationFrame(pintar);
    };
    pintar();
    window.addEventListener('scroll', agendar, { passive: true });

    const hero = heroRef.current;
    const obs = hero && new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
      hero.classList.toggle('pv3-quieto', !e.isIntersecting);
      if (e.isIntersecting) agendar();
    }, { threshold: 0 });
    if (obs) obs.observe(hero);

    return () => {
      window.removeEventListener('scroll', agendar);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (obs) obs.disconnect();
    };
  }, []);

  const suscribir = () => (onSuscribir || onVerDescuentos)?.('premium');

  return (
    <section ref={heroRef} className="pv3-hero" style={{ position: 'relative', zIndex: 0, fontFamily: A.font, background: 'linear-gradient(180deg, #FFF7EB 0%, #FFFFFF 60%)', overflowX: 'clip' }}>

      {/* ─── Galería derecha (igual que A) ─── */}
      <div className="pv3-galwin" aria-hidden="true">
        <div className="pv3-gallery">
          {cols.map((items, ci) => (
            <div key={ci} className="pv3-col" ref={n => { colRefs.current[ci] = n; }}
              style={{ willChange: 'transform' }}>
              <div className={`pv3-coldrift pv3-marquee-${COL_META[ci].dir}`}
                style={{ animationDuration: `${COL_META[ci].dur}s` }}>
                {[...items, ...items].map((item, idx) => {
                  const capa = CAPAS[item.capa];
                  return (
                    <div key={`${ci}-${idx}`} className="pv3-cell"
                      style={{
                        aspectRatio: 1 / (COL_ASPECT[ci][(idx % items.length) % COL_ASPECT[ci].length]),
                        boxShadow: capa.shadow,
                      }}>
                      <img src={item.src} alt="" loading="lazy" decoding="async" style={{ opacity: capa.opacity }}
                        onError={e => { const c = e.currentTarget.parentElement; if (c) c.style.display = 'none'; }} />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pv3-inner">
        <div className="pv3-left">

          {/* 1 · Marca del producto. Reemplaza a la pastilla "PASE TURISTA":
                 dice lo mismo y encima es la imagen que el turista va a
                 reconocer después en su cuponera. */}
          <img className="pv3-ticket" src="/gesell-pass-03.svg" alt="Gesell Pass" />

          {/* 2 · Título. Sin cambios de copy: es el activo de marca del hero.
                 El casing de las palabras en NauryzRedkeds va tal cual —
                 mayúscula y minúscula son glifos distintos. */}
          <h1 className="pv3-title">
            <span className="pv3-t-it">Viví <span className="pv3-nauryz">CUPONEaNdO</span></span>
            <span className="pv3-t-it">en <span className="pv3-nauryz">vILLa GESELL</span></span>
            <span className="pv3-t-bold">a precio de local y sin gastar de más</span>
          </h1>

          {/* 3 · Un único párrafo de apoyo: qué es y qué entra. Redonda (no
                 itálica) y en ink2, para que se lea como nivel 2 y no como un
                 segundo titular. El link de explorar va acá, al final de la
                 frase: es el camino del que todavía no compra. */}
          <p className="pv3-sub">
            Un pase y listo: descuentos en alojamiento, restaurantes, salidas y compras de toda la ciudad.{' '}
            <button className="pv3-link" onClick={() => onVerDescuentos?.()}>Mirá todo lo que entra</button>
          </p>

          {/* 4 · Zona de decisión. Dos hermanos idénticos salvo el dato que los
                 diferencia (días y precio), los dos dentro del botón. */}
          <div className="pv3-opciones">
            {PASES.map(pase => (
              <button key={pase.id} className="pv3-btn-pase"
                onClick={() => onComprarPase?.(pase.dias)}
                aria-label={`Comprar pase turista de ${pase.dias} días por ${pase.precio}`}>
                <b>{pase.label}</b>
                <span className="pv3-btn-sep" aria-hidden="true" />
                <span className="pv3-btn-precio">{pase.precio}</span>
              </button>
            ))}
          </div>

          {/* 5 · Una sola línea de letra chica, que junta lo que en A eran dos
                 "por única vez" repetidos y la pastilla "+" (que no decía qué
                 hacía hasta que le pasabas el mouse por encima). */}
          <p className="pv3-micro">
            Pago único, sin suscripción.{' '}
            <button className="pv3-link" onClick={() => onComprarPase?.('custom')}>¿Más días? Armá tu pase</button>
          </p>

          {/* 6 · Carril de hotelería: otro público, otro nivel. Separado por una
                 línea fina y con peso de link, no de botón: sigue estando a un
                 clic sin pelearle el protagonismo al pase. */}
          <div className="pv3-b2b">
            <span className="pv3-b2b-txt">¿Tenés un alojamiento?</span>
            <button className="pv3-b2b-cta" onClick={suscribir}>
              Regalá cuponeras a tus huéspedes <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <div className="pv3-mobile-deco" aria-hidden="true">
          {MOBILE_DECO.map(s => (
            <div key={s.src} style={{ position: 'absolute', overflow: 'hidden', ...s.style, borderRadius: s.radius, opacity: 0.22 }}>
              <img src={s.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      </div>

      <div aria-hidden="true" style={{ position: 'relative', zIndex: 3, height: 6, background: A.primary }} />

      <style>{`
        .pv3-inner {
          position: relative;
          z-index: 2;
          max-width: 1328px;
          margin: 0 auto;
          padding: 130px 40px 56px;
          min-height: 760px;
          display: flex;
          align-items: center;
        }
        /* Todo el contenido cuelga de la misma línea izquierda: no hay bloques
           corridos 30px respecto de otros. Ancho acotado a 640px para que los
           renglones corten solos, sin recortes por derecha. */
        .pv3-left { max-width: 640px; margin-left: 30px; }

        /* 1 · Ticket-marca. -14°: sigue yendo en el mismo sentido que la galería
           (-10°) en vez de cruzarla, pero con bastante más gesto. Al rotar, el
           alto visual pasa de 74 a ~104px y se come 15px por arriba y por abajo:
           de ahí el margin inferior de 26px, para que no lama el título. */
        .pv3-ticket { width: 132px; height: auto; display: block; margin: 0 0 26px; transform: rotate(-14deg); }

        /* 2 · Título */
        .pv3-title { position: relative; margin: 0; line-height: 1.12; letter-spacing: 0; }
        .pv3-title > span { display: block; }
        .pv3-t-it   { font-style: italic; font-weight: 300; color: ${A.ink}; font-size: clamp(34px, 4.1vw, 50px); }
        .pv3-nauryz { font-family: ${NAURYZ}; font-style: normal; font-weight: normal; color: ${A.primary}; font-size: 0.8em; }
        /* Un poco más chico que en A (38px): el remate cierra el título, pero el
           siguiente nivel necesita aire para leerse como nivel 2. */
        .pv3-t-bold { font-weight: 600; color: ${A.ink}; font-size: clamp(24px, 3.4vw, 34px); margin-top: 0.18em; }

        /* 3 · Párrafo de apoyo */
        .pv3-sub {
          margin: 22px 0 0;
          max-width: 30em;
          font-size: clamp(16px, 1.45vw, 19px);
          line-height: 1.55;
          color: ${A.ink2};
        }
        /* Links de texto: subrayados. Sin subrayado, el color era la única
           marca de que se podía clickear (y el color solo no alcanza). */
        .pv3-link {
          padding: 0; border: none; background: none; font: inherit; cursor: pointer;
          color: ${A.primary}; font-weight: 600;
          text-decoration: underline; text-underline-offset: 3px;
          text-decoration-thickness: 1.5px;
        }
        .pv3-link:hover { color: ${A.primaryDark}; }

        /* 4 · Botones de pase: un solo peso de acción en todo el hero */
        .pv3-opciones { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 32px; }
        .pv3-btn-pase {
          display: inline-flex; align-items: center; gap: 12px;
          min-height: 56px; padding: 0 26px;
          border: none; border-radius: 999px;
          background: ${A.primary}; color: #fff;
          font-family: inherit; font-size: 17px; font-weight: 400;
          white-space: nowrap; cursor: pointer;
          transition: background .15s, transform .15s;
        }
        .pv3-btn-pase b { font-weight: 700; }
        /* Separador fino: divide días de precio sin sumar un signo más para leer */
        .pv3-btn-sep { width: 1px; height: 17px; background: rgba(255,255,255,0.42); }
        .pv3-btn-precio { font-variant-numeric: tabular-nums; }
        .pv3-btn-pase:hover { background: ${A.primaryDark}; transform: translateY(-1px); }
        @media (prefers-reduced-motion: reduce) {
          .pv3-btn-pase { transition: background .15s; }
          .pv3-btn-pase:hover { transform: none; }
        }

        /* 5 · Letra chica: una línea, no dos columnas de leyendas */
        .pv3-micro { margin: 14px 0 0; font-size: 13.5px; line-height: 1.5; color: ${A.ink2}; }
        .pv3-micro .pv3-link { font-weight: 500; }

        /* 6 · Carril hotelería */
        .pv3-b2b {
          display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px;
          margin-top: 40px; padding-top: 22px;
          border-top: 1px solid ${A.line};
          max-width: 30em;
          font-size: 15.5px; line-height: 1.5;
        }
        .pv3-b2b-txt { color: ${A.ink2}; }
        /* Alto de toque cómodo sin cambiar de nivel visual: el área crece por
           padding, no por fondo ni por borde. */
        .pv3-b2b-cta {
          padding: 10px 0; border: none; background: none; cursor: pointer;
          font-family: inherit; font-size: 15.5px; font-weight: 700; color: ${A.ink};
          text-decoration: underline; text-underline-offset: 3px;
          text-decoration-thickness: 1.5px; text-decoration-color: ${A.line};
          transition: color .15s, text-decoration-color .15s;
        }
        .pv3-b2b-cta:hover { color: ${A.primary}; text-decoration-color: ${A.primary}; }

        /* ─── Galería (igual que la variante A) ─── */
        .pv3-galwin {
          --gap: 16px;
          --colw: clamp(190px, 21vw, 300px);
          --blockw: calc(${NUM_COLS} * var(--colw) + ${NUM_COLS - 1} * var(--gap));
          position: absolute;
          top: 0;
          bottom: 6px;
          right: 0;
          width: calc(var(--blockw) * 1.45);
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
          -webkit-mask-image: linear-gradient(${FADE_ANGLE}deg, transparent ${FADE_START}%, #000 ${FADE}%);
                  mask-image: linear-gradient(${FADE_ANGLE}deg, transparent ${FADE_START}%, #000 ${FADE}%);
        }
        .pv3-gallery {
          position: absolute;
          width: var(--blockw);
          right: -${OVERHANG}px;
          top: -${BUFFER}px;
          bottom: -${BUFFER}px;
          display: flex;
          gap: var(--gap);
          transform: rotate(${TILT}deg);
        }
        .pv3-col  { flex: 1 1 0; }
        .pv3-coldrift { display: flex; flex-direction: column; will-change: transform; }
        .pv3-marquee-up   { animation: pv3MarqueeUp   linear infinite; }
        .pv3-marquee-down { animation: pv3MarqueeDown linear infinite; }
        @keyframes pv3MarqueeUp   { from { transform: translateY(0); }    to { transform: translateY(-50%); } }
        @keyframes pv3MarqueeDown { from { transform: translateY(-50%); } to { transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) {
          .pv3-marquee-up, .pv3-marquee-down { animation: none; }
        }
        .pv3-quieto .pv3-coldrift { animation-play-state: paused; }
        .pv3-cell { flex: 0 0 auto; margin-bottom: 16px; border-radius: 20px; overflow: hidden; }
        .pv3-cell img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .pv3-mobile-deco { display: none; }

        @media (max-width: 1180px) {
          .pv3-inner {
            text-align: center;
            padding: 132px 24px 56px;
            min-height: 0;
            justify-content: center;
          }
          .pv3-left { display: flex; flex-direction: column; align-items: center; max-width: 620px; margin-left: 0; }
          .pv3-ticket { margin: 0 0 24px; }
          .pv3-sub, .pv3-b2b { text-align: center; }
          .pv3-opciones, .pv3-b2b { justify-content: center; }
          .pv3-galwin { opacity: 0.5; --colw: clamp(150px, 20vw, 220px); }
        }
        @media (max-width: 760px) {
          .pv3-galwin { display: none; }
          .pv3-mobile-deco { display: block; position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        }
        @media (max-width: 560px) {
          /* Los dos pases pasan a ocupar el ancho: en mobile la comparación se
             hace en vertical, uno debajo del otro. */
          .pv3-opciones { flex-direction: column; align-self: stretch; gap: 12px; }
          .pv3-btn-pase { justify-content: center; }
        }
      `}</style>
    </section>
  );
}
