// ============================================================
//  src/components/landing/HeroPase.jsx
//  Hero de la home a DOS columnas:
//   · Izquierda: título (Viví cuponeando / en Villa Gesell), el claim de
//     hotelería con su CTA negro y, abajo, el bloque de pases (ticket
//     inclinado + claim y, a ras del CTA negro, los dos pases y el "+").
//   · Derecha: galería masonry (tipo Pinterest) inclinada 10°, con parallax al
//     scrollear; fotos random del pool src/assets/grilla por carga.
//  Estilos responsive inyectados inline (<style> local, clases .pv2-*).
// ============================================================

import { useEffect, useRef, useState } from 'react';

// ─── Design tokens (mismos del hero actual) ──────────────────
const A = {
  primary:     '#2545E6',
  primaryDark: '#1731B8',
  primarySoft: '#8C97E8',   // lavanda del botón "+"
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  font:        "'Inter', system-ui, sans-serif",
};

const NAURYZ = "'NauryzRedkeds', 'Inter', sans-serif";

// ─── Pases (bloque de abajo del hero) ────────────────────────
// Compra única, para el que viene unos días. El "+" abre el checkout de pases
// posicionado en el pase a medida (8 a 30 días); la suscripción mensual ya no
// vive en el hero (está en la navbar, "Planes y suscripción"), y el hotelero
// entra por su propio CTA negro.
// `dias` es la clave real: es lo que se busca en la tabla `pases` al entrar al
// checkout, que además es de donde sale el precio que se cobra.
// El rótulo del producto ("Pase turista") va DENTRO del botón, en negrita, y la
// duración al lado en peso normal: el nombre pesa, el plazo acompaña. Así no
// hace falta la pastilla azul que antes lo anunciaba arriba del claim.
const PASES = [
  { id: 'x3', dias: 3, rotulo: 'Pase turista', cola: 'x 3 días', precio: '$20.000', nota: 'por única vez' },
  { id: 'x7', dias: 7, rotulo: 'Pase turista', cola: 'x 7 días', precio: '$35.000', nota: 'por única vez' },
];

// ─── Galería derecha: masonry tipo Pinterest ─────────────────
// Pool = TODO lo que haya en src/assets/grilla-web, que son las versiones
// livianas (≤900px) de los originales de src/assets/grilla. Tirás una foto
// nueva en grilla/, corrés `npm run fotos` y la galería se actualiza sola, sin
// tocar código. Vite resuelve el glob en build — por eso las fotos viven en
// src/assets y no en public/ (ahí no hay glob posible), y de paso salen con
// hash y cacheo largo.
const GRILLA_MODULES = import.meta.glob(
  '../../assets/grilla-web/*.{jpg,jpeg,png,webp,avif}',
  { eager: true, query: '?url', import: 'default' },
);
const GRILLA_IMGS = Object.values(GRILLA_MODULES);
// Busca una foto puntual por nombre de archivo (para la deriva mobile).
const foto = (nombre) => GRILLA_MODULES[`../../assets/grilla-web/${nombre}`];

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

// Inclinación de las tiras (grados). Al rotar, el bloque de fotos se corre
// lateralmente ≈ (mitad del alto de la ventana · sen θ) en cada extremo. Del
// lado izquierdo eso no importa (ahí el bloque termina en el aire y el fundido
// lo disuelve), pero del lado derecho da contra el borde de la página: por eso
// el bloque se corre OVERHANG px hacia afuera, para que la rotación no destape
// una cuña de fondo en la esquina superior derecha.
const TILT = -10;
const OVERHANG = Math.ceil(460 * Math.abs(Math.sin((TILT * Math.PI) / 180)));

// Fundido contra el lado del texto. Dos cosas lo definen:
//  · FADE_ANGLE: el gradiente va girado los mismos grados que las tiras, así sus
//    líneas de iso-opacidad quedan PARALELAS a la galería y no se lee un borde
//    vertical cruzando fotos inclinadas. 90deg = izq→der; sumarle TILT lo gira.
//  · FADE_START / FADE: dónde el fundido vale 0 y dónde llega a opaco (% del
//    recorrido). FADE_START cae sobre el borde izquierdo del bloque de fotos —
//    como gradiente y bloque están inclinados lo mismo, esa línea de opacidad
//    cero corre PARALELA al borde en toda la altura, y las fotos nacen de la
//    nada en vez de aparecer con un escalón. FADE en 100 hace que el fundido
//    recorra toda la galería y solo llegue a pleno contra el borde derecho;
//    bajarlo (p. ej. 80) devuelve fotos plenas antes.
const FADE_ANGLE = 90 + TILT;
const FADE_START = 20;
const FADE = 100;

// Capas de profundidad: la foto "lejos" va tenue y casi sin sombra, la "cerca"
// plena y con sombra marcada. Sin desenfoque — la profundidad la dan opacidad,
// sombra y el parallax distinto de cada tira.
// Rango acotado a 65–85%: alcanza para escalonar las capas sin que ninguna
// foto se despinte contra el fondo.
const CAPAS = {
  lejos: { opacity: 0.65, shadow: '0 10px 26px -24px rgba(11,16,32,0.22)' },
  medio: { opacity: 0.75, shadow: '0 18px 38px -30px rgba(11,16,32,0.26)' },
  cerca: { opacity: 0.85, shadow: '0 22px 44px -28px rgba(11,16,32,0.34)' },
};

// Sorteo de capa por columna: la tira 1 (parallax lento) tira al fondo y la
// tira 2 (parallax rápido) al frente — lo que se mueve más, se lee más cerca.
const PESOS_CAPA = [
  ['lejos', 'lejos', 'medio', 'medio', 'cerca'],
  ['cerca', 'cerca', 'medio', 'medio', 'lejos'],
];

// Barajado Fisher-Yates (no muta el original).
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Reparte el pool barajado entre las columnas. Al no haber duplicados, ninguna
// imagen se repite dentro de la misma vista. Se llama una vez por montaje →
// random en cada carga.
function buildColumns() {
  const imgs = shuffle(GRILLA_IMGS);
  const cols = Array.from({ length: NUM_COLS }, () => []);
  // Capa de profundidad arbitraria por foto (sesgada según la columna).
  imgs.forEach((src, i) => {
    const ci = i % NUM_COLS;
    const pesos = PESOS_CAPA[ci];
    cols[ci].push({ src, capa: pesos[Math.floor(Math.random() * pesos.length)] });
  });
  return cols;
}

// Deriva mobile: apenas dos fotos tenues arriba para no dejar pelado. Estas sí
// van por nombre; si alguna se borra de la carpeta, simplemente no se dibuja.
const MOBILE_DECO = [
  { src: foto('mar3.jpg'),  style: { top: -6, left: -6, width: 120, height: 140 }, radius: '0 0 40px 26px' },
  { src: foto('kite.jpeg'), style: { top: -6, right: -6, width: 110, height: 128 }, radius: '0 0 26px 40px' },
].filter(d => d.src);

// ─── Un pase: botón azul + precio en una línea ───────────────
function PaseBoton({ pase, onClick }) {
  return (
    <div className="pv2-pase">
      <button className="pv2-btn-pase" onClick={onClick}>
        <b>{pase.rotulo}</b> {pase.cola}
      </button>
      {/* Precio: chico y SIEMPRE en una línea, para no desalinear los botones. */}
      <div className="pv2-pase-precio">
        <b>{pase.precio}</b> <i>{pase.nota}</i>
      </div>
    </div>
  );
}

export default function HeroPase({ onVerDescuentos, onSuscribir, onComprarPase }) {
  const [cols] = useState(buildColumns); // random por carga, estable en la sesión
  const rafRef  = useRef(0);
  const heroRef = useRef(null);
  const colRefs = useRef([]);
  const visibleRef = useRef(true);

  // El parallax NO pasa por el estado de React: un setState por frame de scroll
  // obliga a re-renderizar toda la sección (34 celdas + el bloque <style>) 60
  // veces por segundo. Acá el rAF escribe el transform directo en el DOM.
  //
  // Y con el hero fuera del viewport se corta todo: se congela el marquee —y
  // con él la recomposición de una capa grande, rotada y enmascarada— y ni se
  // agendan los frames de scroll. Al volver, se repinta una vez para tomar el
  // scroll que pasó mientras tanto.
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
      hero.classList.toggle('pv2-quieto', !e.isIntersecting);
      if (e.isIntersecting) agendar();
    }, { threshold: 0 });
    if (obs) obs.observe(hero);

    return () => {
      window.removeEventListener('scroll', agendar);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (obs) obs.disconnect();
    };
  }, []);

  const suscribir = (plan) => (onSuscribir || onVerDescuentos)?.(plan);

  return (
    <section ref={heroRef} className="pv2-hero" style={{ position: 'relative', zIndex: 0, fontFamily: A.font, background: 'linear-gradient(180deg, #FFF7EB 0%, #FFFFFF 60%)', overflowX: 'clip' }}>

      {/* ─── Galería derecha: capa detrás, de techo a piso, sin huecos ───
          `pv2-galwin` es la ventana que recorta (al corte). Dentro, una capa
          más alta (colchón arriba/abajo) permite el parallax sin descubrir
          bordes. Cada columna llena SIEMPRE hasta abajo. */}
      <div className="pv2-galwin" aria-hidden="true">
        <div className="pv2-gallery">
          {cols.map((items, ci) => (
            <div key={ci} className="pv2-col" ref={n => { colRefs.current[ci] = n; }}
              style={{ willChange: 'transform' }}>
              {/* Wrapper interno: loop continuo en una dirección (no pisa el
                  parallax del padre). Las fotos van DUPLICADAS para que el
                  bucle sea sin costura (translateY -50% = exactamente un set). */}
              <div className={`pv2-coldrift pv2-marquee-${COL_META[ci].dir}`}
                style={{ animationDuration: `${COL_META[ci].dur}s` }}>
                {[...items, ...items].map((item, idx) => {
                  const capa = CAPAS[item.capa];
                  return (
                    <div key={`${ci}-${idx}`} className="pv2-cell"
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

      <div className="pv2-inner">

        {/* ─── Columna izquierda: texto ─── */}
        <div className="pv2-left">
          {/* Título + claim + CTA de hotelería viajan juntos, corridos 30px a la
              derecha. El bloque de pases lleva el mismo corrimiento, así el CTA
              negro y los botones de pase arrancan sobre la misma línea. En
              pantallas chicas todo se centra y el corrimiento se anula. */}
          <div className="pv2-claim-pack">
            {/* Título — 3 líneas: dos itálicas finas (con las palabras de marca en
                NauryzRedkeds azul) + el remate en negrita, casi del mismo cuerpo. */}
            <h1 className="pv2-title">
              {/* El casing NO es decorativo: en NauryzRedkeds mayúscula y minúscula
                  son glifos distintos, así que "CUPONEaNdO" y "vILLa GESELL" van
                  tal cual — no normalizar ni "corregir". */}
              <span className="pv2-t-it">Viví <span className="pv2-nauryz">CUPONEaNdO</span></span>
              <span className="pv2-t-it">en <span className="pv2-nauryz">vILLa GESELL</span></span>
              <span className="pv2-t-bold">a precio de local y sin gastar de más</span>
            </h1>

            {/* Hotelería: claim + CTA negro (el único botón oscuro del hero, para
                que no compita con el azul de los pases). */}
            <p className="pv2-hotel-claim">¡Regalá cuponeras con descuentos locales a tus huéspedes!</p>
            {/* Sólo el botón: el precio se cuenta en la vista de planes. En el
                hero, una cifra al lado del pase de turista se leía como si
                fueran dos productos comparables, y no lo son. */}
            <button className="pv2-cta-negro" onClick={() => suscribir('premium')}>
              Suscripción <b>para hotelería</b>
            </button>
          </div>

          {/* Pases: arriba el ticket inclinado con el claim al lado; abajo, la
              botonera. La botonera NO cuelga del ticket: es hermana del
              encabezado, así arranca a ras del bloque y queda alineada con el
              CTA negro de hotelería. */}
          <div className="pv2-pases">
            <div className="pv2-pases-head">
              <img className="pv2-ticket" src="/gesell-pass-03.svg" alt="Gesell Pass" />
              {/* Dos renglones cortos, uno debajo del otro: la pregunta y la
                  respuesta. Van en líneas propias (no envueltos por el ancho de
                  la caja) para que el remate empiece siempre alineado con la
                  pregunta, sea cual sea el ancho de pantalla. */}
              <p className="pv2-pases-claim">
                <b>¿Viajás por unos días?</b><br />
                <button className="pv2-link" onClick={() => onVerDescuentos?.()}>¡Conseguí descuento en todo!</button>
              </p>
            </div>
            <div className="pv2-pases-row">
              {PASES.map(pase => (
                <PaseBoton key={pase.id} pase={pase} onClick={() => onComprarPase?.(pase.dias)} />
              ))}
              {/* Al apoyar el mouse la pastilla se estira a la derecha y
                  completa la palabra: "+ días". Lleva al mismo checkout que
                  los otros dos pases, pero con el pase a medida ya elegido
                  (arranca en 8 días, que es donde termina el de 7). */}
              <button className="pv2-mas" onClick={() => onComprarPase?.('custom')}
                aria-label="Más días" title="Más días">
                <span className="pv2-mas-ico">+</span>
                <span className="pv2-mas-txt">días</span>
              </button>
            </div>
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
        /* Título + claim + CTA de hotelería, corridos como un solo paquete. */
        .pv2-claim-pack { margin-left: 30px; }

        /* ── Título ───────────────────────────────────────────── */
        .pv2-title { position: relative; margin: 0; line-height: 1.12; letter-spacing: 0; }
        .pv2-title > span { display: block; }
        .pv2-t-it   { font-style: italic; font-weight: 300; color: ${A.ink}; font-size: clamp(34px, 4.3vw, 53px); }
        /* Palabras de marca dentro de la línea itálica */
        .pv2-nauryz { font-family: ${NAURYZ}; font-style: normal; font-weight: normal; color: ${A.primary}; font-size: 0.8em; }
        /* El remate va casi tan grande como las itálicas: es el que cierra el
           argumento, no una bajada. */
        .pv2-t-bold { font-weight: 600; color: ${A.ink}; font-size: clamp(26px, 3.9vw, 38px); margin-top: 0.2em; }

        /* ── Hotelería ────────────────────────────────────────── */
        .pv2-hotel-claim {
          margin: 52px 0 0;
          font-style: italic;
          font-size: clamp(16px, 1.6vw, 22px);
          line-height: 1.5;
          color: ${A.ink};
        }
        .pv2-cta-negro {
          margin-top: 26px;
          padding: 18px 52px;
          border: none;
          border-radius: 999px;
          background: ${A.ink};
          color: #fff;
          font-family: inherit;
          font-size: 19px;
          font-weight: 400;
          cursor: pointer;
          transition: background .15s;
        }
        .pv2-cta-negro b { font-weight: 700; }
        .pv2-cta-negro:hover { background: #1B2340; }

        /* ── Pases ────────────────────────────────────────────── */
        /* Mismo corrimiento que .pv2-claim-pack: es lo que pone los botones de
           pase a ras del CTA negro. */
        .pv2-pases { margin: 44px 0 0 30px; }
        .pv2-pases-head { display: flex; align-items: center; gap: 38px; }
        /* El ticket va inclinado al revés que la galería: cruza la diagonal
           general y evita que el bloque se lea como un bloque más.
           El margin-top negativo lo levanta respecto del claim: al rotar, la
           esquina inferior derecha baja ~26px de más y sin esto quedaría
           lamiendo la botonera, que ahora corre justo abajo. */
        .pv2-ticket { flex: 0 0 auto; margin-top: -18px; width: 140px; height: auto; display: block; transform: rotate(-25deg); }
        /* Dos renglones propios: no hace falta recortar la caja por derecha para
           forzar el corte, así que el claim ya puede ocupar su ancho natural. */
        .pv2-pases-claim { margin: 0; font-size: clamp(15px, 1.5vw, 21px); font-style: italic; line-height: 1.35; color: ${A.primary}; }
        .pv2-pases-claim b { font-style: italic; font-weight: 700; }
        /* "todo el catálogo": link de verdad (button), sin chrome de botón */
        /* Sin subrayado: dentro de una frase en itálica el subrayado la ensuciaba.
           Sigue siendo un botón y se distingue por el color y el hover. */
        .pv2-link {
          padding: 0; border: none; background: none; font: inherit; cursor: pointer;
          color: ${A.primary}; text-decoration: none;
        }
        .pv2-link:hover { color: ${A.primaryDark}; }
        /* Alineados arriba: el "+" queda a la altura de los botones, no de los precios */
        .pv2-pases-row { display: flex; align-items: flex-start; gap: 22px; margin-top: 44px; }
        .pv2-pase { display: flex; flex-direction: column; align-items: center; }
        /* El botón lleva dos pesos: "Pase turista" en negrita (el producto) y la
           duración en normal. De ahí el peso base 400 y el <b> adentro. */
        .pv2-btn-pase {
          width: 252px; padding: 15px 16px; border: none; border-radius: 999px;
          background: ${A.primary}; color: #fff; white-space: nowrap;
          font-family: inherit; font-size: 16.5px; font-weight: 400; cursor: pointer;
          transition: background .15s;
        }
        .pv2-btn-pase b { font-weight: 700; }
        .pv2-btn-pase:hover { background: ${A.primaryDark}; }
        .pv2-pase-precio { margin-top: 12px; font-size: 13.5px; line-height: 1.3; white-space: nowrap; color: ${A.primary}; }
        .pv2-pase-precio i { font-style: italic; }
        /* Pastilla que arranca como círculo de 50px y, al hover, se estira
           hacia la derecha para que el "+" termine de decir "+ días". El ancho
           lo da el contenido: el texto pasa de max-width 0 a su medida. */
        .pv2-mas {
          flex: 0 0 auto; height: 52px; min-width: 52px; padding: 0 13px;
          display: inline-flex; align-items: center; justify-content: center; gap: 0;
          border: none; border-radius: 999px;
          background: ${A.primarySoft}; color: #fff;
          font-family: inherit; font-weight: 400; line-height: 1; cursor: pointer;
          transition: background .15s, gap .28s ease;
        }
        .pv2-mas-ico { font-size: 27px; line-height: 1; }
        .pv2-mas-txt {
          max-width: 0; opacity: 0; overflow: hidden; white-space: nowrap;
          font-size: 16.5px; font-weight: 700;
          transition: max-width .28s ease, opacity .2s ease;
        }
        .pv2-mas:hover, .pv2-mas:focus-visible { background: ${A.primary}; gap: 7px; }
        .pv2-mas:hover .pv2-mas-txt, .pv2-mas:focus-visible .pv2-mas-txt { max-width: 90px; opacity: 1; }
        @media (prefers-reduced-motion: reduce) {
          .pv2-mas, .pv2-mas-txt { transition: background .15s; }
        }

        /* Ventana de la galería: recorta al corte (techo → piso), detrás del
           texto (z-index 0) y sin capturar clicks. No afecta el layout: es
           absoluta, así el alto del hero lo fija solo el contenido de texto.

           Es MÁS ANCHA que el bloque de fotos a propósito: el sobrante de la
           izquierda es la zona donde el fundido las disuelve. Así el borde
           visible de la galería es el del propio bloque —inclinado como todo lo
           demás— y no el corte vertical del contenedor, que era lo que delataba
           que son dos canvas distintos. Ese sobrante además es la zona de
           solape: el texto (z-index 2) pasa por encima de fotos ya casi
           transparentes, así que pisarlas no rompe nada. */
        .pv2-galwin {
          --gap: 16px;
          --colw: clamp(190px, 21vw, 300px);
          --blockw: calc(${NUM_COLS} * var(--colw) + ${NUM_COLS - 1} * var(--gap));
          position: absolute;
          top: 0;
          bottom: 6px;            /* deja ver la barra divisoria de 6px */
          right: 0;               /* pegada al borde de la página, sin aire */
          width: calc(var(--blockw) * 1.45);
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
          /* Se funde con el fondo hacia el lado del texto, en paralelo a la
             inclinación de las tiras. */
          -webkit-mask-image: linear-gradient(${FADE_ANGLE}deg, transparent ${FADE_START}%, #000 ${FADE}%);
                  mask-image: linear-gradient(${FADE_ANGLE}deg, transparent ${FADE_START}%, #000 ${FADE}%);
        }
        /* Capa interna más alta (colchón arriba/abajo) para que el parallax
           mueva las columnas sin descubrir bordes.
           Inclinada: la rotación va acá (el contenedor de las dos tiras) para
           no pisar el transform del parallax (.pv2-col) ni el del loop
           (.pv2-coldrift). Como esos dos transforms quedan DENTRO del marco
           rotado, las tiras se desplazan sobre su propio eje inclinado: la
           banda no se mueve de lugar, solo corren las fotos adentro. */
        .pv2-gallery {
          position: absolute;
          /* Ancho propio (no se estira a la ventana) y anclado a la derecha:
             las tiras miden --colw pase lo que pase, y el sobrante de ventana
             queda del lado del fundido. */
          width: var(--blockw);
          right: -${OVERHANG}px;
          top: -${BUFFER}px;
          bottom: -${BUFFER}px;
          display: flex;
          gap: var(--gap);
          transform: rotate(${TILT}deg);
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
        /* Hero fuera del viewport: se congela el loop en vez de seguir
           recomponiendo una capa grande, rotada y con máscara. */
        .pv2-quieto .pv2-coldrift { animation-play-state: paused; }
        /* La sombra la pone cada celda inline (varía según la capa). */
        .pv2-cell { flex: 0 0 auto; margin-bottom: 16px; border-radius: 20px; overflow: hidden; }
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
          /* Todo centrado: el corrimiento de 30px lo descentraría. */
          .pv2-claim-pack { margin-left: 0; }
          /* Todo centrado: acá tampoco va el corrimiento de 30px. */
          .pv2-pases { margin-left: 0; }
          /* El ticket pasa arriba del claim, centrado y más chico */
          .pv2-pases-head { flex-direction: column; align-items: center; gap: 14px; }
          .pv2-ticket { width: 150px; margin-top: 0; }
          .pv2-pases-row { flex-wrap: wrap; justify-content: center; }
          /* Tablet: la galería NO se va, se queda de fondo. Al estar en z-index
             0 con el texto en 2, el contenido simplemente la pisa; con menos
             opacidad y las tiras más angostas, ese solape se lee como textura
             de fondo y no como dos cosas peleándose el lugar. */
          .pv2-galwin { opacity: 0.5; --colw: clamp(150px, 20vw, 220px); }
        }
        /* Recién en mobile la galería estorba de verdad: ahí sí sale y quedan
           las dos fotos de la deriva. */
        @media (max-width: 760px) {
          .pv2-galwin { display: none; }
          .pv2-mobile-deco { display: block; position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        }
        @media (max-width: 560px) {
          .pv2-pases-row { gap: 16px; }
          /* Un botón por renglón: "Pase turista x 3 días" ya no entra de dos en
             dos sin partirse. */
          .pv2-btn-pase { width: 236px; }
        }
      `}</style>
    </section>
  );
}
