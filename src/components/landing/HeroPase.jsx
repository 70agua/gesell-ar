// ============================================================
//  src/components/landing/HeroPase.jsx
//  Hero de la home, a DOS columnas:
//   · Izquierda: el ticket como marca del producto, el título (Viví cuponeando
//     / en Villa Gesell), un párrafo de apoyo, un pretítulo con los dos pases
//     con su precio adentro, una línea de letra chica y —abajo de todo,
//     separado por una línea fina— el carril de hotelería.
//   · Derecha: galería masonry (tipo Pinterest) inclinada 10°, con parallax al
//     scrollear; fotos random del pool src/assets/grilla por carga. Encima,
//     al ras del borde derecho, la ficha con el contador de cupones.
//
//  Las reglas de jerarquía que sostienen este orden, para no romperlas sin
//  querer al agregar cosas:
//   1. Un solo protagonista: el turista. El título le habla a él ("Viví
//      cuponeando a precio de local"), así que la primera acción que se cruza
//      también es suya. Hotelería va en su propio carril, al pie.
//   2. El precio entra DENTRO del botón: es la decisión, no letra chica.
//   3. Un solo párrafo de apoyo. Dos claims de cuerpo parecido no rankean:
//      compiten.
//   4. Dos pesos de acción y no más: azul lleno = comprar; link subrayado =
//      todo lo demás.
//   5. El ticket es la marca del producto, no un adorno al costado: por eso va
//      arriba del título y se inclina en el mismo sentido que la galería.
//   6. Los datos vivos del catálogo son vidriera, no argumento: van sobre la
//      galería, no en el renglón del claim, donde le comían el espacio.
//
//  Estilos responsive inyectados inline (<style> local, clases .pv3-*).
// ============================================================

import { useEffect, useRef, useState } from 'react';
import usePaseStats from '../../hooks/usePaseStats';

// ─── Design tokens ───────────────────────────────────────────
const A = {
  primary:     '#475BE1',
  primaryDark: '#3347C8',
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
const foto = (nombre) => GRILLA_MODULES[`../../assets/grilla-web/${nombre}`];

const COL_ASPECT = [
  [1.33, 1.50, 1.25, 1.50],
  [1.50, 1.33, 1.50, 1.25],
];
const COL_META = [
  { speed: 0.55, dir: 'up' },
  { speed: 0.8,  dir: 'down' },
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

export default function HeroPase({ onVerDescuentos, onSuscribir, onComprarPase }) {
  const [cols] = useState(buildColumns);
  const stats = usePaseStats();
  const rafRef  = useRef(0);
  const heroRef = useRef(null);
  const colRefs = useRef([]);
  const halfHeights = useRef([]);
  const visibleRef = useRef(true);

  // Antes: las columnas corrían solas (CSS animation, linear infinite) y por
  // encima se sumaba un parallax atado al scroll. Resultado: ruido — la
  // galería se movía todo el tiempo, incluso quieto el usuario.
  //
  // Ahora todo el movimiento sale de una sola fuente: window.scrollY. Sin
  // scroll, cero transform, cero movimiento. Cada columna recorre su lista
  // duplicada de fotos (para loop sin costura) a una velocidad propia
  // (COL_META.speed) y en su sentido (up/down), usando módulo sobre la mitad
  // real de su alto para el wrap — así el salto de vuelta al principio cae
  // justo donde la duplicación hace que sea invisible.
  //
  // Tampoco pasa por estado de React (mismo motivo de siempre: un setState
  // por frame de scroll re-renderiza toda la sección). El rAF escribe el
  // transform directo en el DOM, y con el hero fuera de vista se corta todo:
  // ni se agendan los frames.
  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const medirAltos = () => {
      colRefs.current.forEach((nodo, i) => {
        if (nodo) halfHeights.current[i] = nodo.scrollHeight / 2;
      });
    };

    const pintar = () => {
      rafRef.current = 0;
      if (reducedMotion) return;
      const y = window.scrollY || 0;
      colRefs.current.forEach((nodo, i) => {
        const half = halfHeights.current[i];
        if (!nodo || !half) return;
        const { speed, dir } = COL_META[i];
        const recorrido = (y * speed) % half;
        const offset = dir === 'up' ? -recorrido : -(half - recorrido);
        nodo.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    };
    const agendar = () => {
      if (rafRef.current || !visibleRef.current) return;
      rafRef.current = requestAnimationFrame(pintar);
    };

    const onResize = () => { medirAltos(); agendar(); };

    medirAltos();
    pintar();
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', onResize);

    const hero = heroRef.current;
    const obs = hero && new IntersectionObserver(([e]) => {
      visibleRef.current = e.isIntersecting;
      if (e.isIntersecting) agendar();
    }, { threshold: 0 });
    if (obs) obs.observe(hero);

    return () => {
      window.removeEventListener('scroll', agendar);
      window.removeEventListener('resize', onResize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (obs) obs.disconnect();
    };
  }, []);

  const suscribir = () => (onSuscribir || onVerDescuentos)?.('premium');

  return (
    <section ref={heroRef} className="pv3-hero" style={{ position: 'relative', zIndex: 0, fontFamily: A.font, background: 'linear-gradient(180deg, #FFF7EB 0%, #FFFFFF 60%)', overflowX: 'clip' }}>

      {/* ─── Galería derecha: capa detrás, de techo a piso, sin huecos ───
          `pv3-galwin` es la ventana que recorta (al corte). Dentro, una capa
          más alta (colchón arriba/abajo) permite el parallax sin descubrir
          bordes. Cada columna llena SIEMPRE hasta abajo. */}
      <div className="pv3-galwin" aria-hidden="true">
        <div className="pv3-gallery">
          {cols.map((items, ci) => (
            <div key={ci} className="pv3-col">
              <div className="pv3-coldrift" ref={n => { colRefs.current[ci] = n; }}>
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
                 reconocer después en su Pase. */}
          <img className="pv3-ticket" src="/gesell-pass-03.svg" alt="Gesell Pass" />

          {/* 2 · Título. Sin cambios de copy: es el activo de marca del hero.
                 El casing de las palabras en NauryzRedkeds va tal cual —
                 mayúscula y minúscula son glifos distintos. */}
          <h1 className="pv3-title">
            <span className="pv3-t-it">Viajá <span className="pv3-nauryz">CUPONEaNdO</span></span>
            <span className="pv3-t-bold">un pase, todos los descuentos</span>
          </h1>

          {/* 3 · Un único párrafo de apoyo: qué es y qué entra. Redonda (no
                 itálica) y en ink2, para que se lea como nivel 2 y no como un
                 segundo titular. Alojamiento va ÚLTIMO en la lista: el pretítulo
                 de abajo lo levanta justo antes de los botones, y arrancar la
                 frase con la misma palabra hacía que el remate sonara a repetido
                 en vez de a énfasis. */}
          <p className="pv3-sub">
            En Villa Gesell, Mar de las Pampas, Mar Azul y Las Gaviotas. Descuentos en excursiones, salidas, compras y alojamiento.
          </p>

          {/* 4 · Contador, sobre la galería. Está acá y no dentro del párrafo
                 de apoyo por dos motivos: en el renglón le competía el espacio
                 al claim, y el dato es vidriera —cuánto hay para recorrer—, no
                 argumento de venta.

                 Cuenta CUPONES y no socios: es lo que el turista va a mirar uno
                 por uno, y son más del doble (133 contra 64).

                 El número desaparece si la consulta falla o el catálogo está
                 vacío —nunca un número inventado— pero el botón queda igual: es
                 el único camino a explorar el catálogo desde el hero.

                 Vive DENTRO de .pv3-left, no como hermano suelto, aunque en
                 desktop se posicione absoluto contra .pv3-inner (que es el
                 relative más cercano: .pv3-left no está posicionado). Es para
                 el caso angosto: ahí vuelve al flujo, y tiene que caer entre el
                 claim y la decisión —no después del carril de hotelería, que
                 invertiría el orden de públicos. */}
          {/* El nombre accesible va explícito: los tres spans son hijos de un
              flex, así que el texto se concatena sin los espacios que sí se ven
              en pantalla ("133cupones cargadosMirá…"). */}
          <button className="pv3-contador" onClick={() => onVerDescuentos?.()}
            aria-label={stats.ok
              ? `Conocé los ${stats.cupones} cupones que te esperan`
              : 'Conocé los cupones que te esperan'}>
            {stats.ok && (
              <>
                <span className="pv3-contador-num">{stats.cuponesFmt}</span>
                <span className="pv3-contador-label"><span>cupones</span><span>te esperan</span></span>
              </>
            )}
            <span className="pv3-contador-link">Conocelos <span aria-hidden="true">→</span></span>
          </button>

          {/* 5 · Pretítulo de los pases. No es un segundo párrafo de apoyo: es
                 la etiqueta de los dos botones, y por eso va pegado a ellos
                 (12px) y separado del sub (30px). La pregunta es literalmente
                 el dato que diferencia a los dos botones —3 días o 7—, así que
                 los convierte en respuesta en vez de en dos productos sueltos.
                 El alojamiento se nombra acá y no en el sub porque es lo que
                 empuja al pase largo: quien se queda una semana lo elige por
                 la estadía, no por los cafés. */}
          <p className="pv3-pretitulo">
            <b>¿Cuánto dura tu viaje?</b> Todo empieza acá:
          </p>

          {/* 6 · Zona de decisión. Dos hermanos idénticos salvo el dato que los
                 diferencia (días y precio), los dos dentro del botón, más una
                 tercera opción en texto plano —sin chapa de botón— para quien
                 necesita más días de los que ofrecen los dos pases fijos. */}
          <div className="pv3-opciones">
            {PASES.map(pase => (
              <button key={pase.id} className="pv3-btn-pase"
                onClick={() => onComprarPase?.(pase.dias)}
                aria-label={`Comprar pase turista de ${pase.dias} días por ${pase.precio}`}>
                <b>Pase {pase.label}</b>
                <span className="pv3-btn-sep" aria-hidden="true" />
                <span className="pv3-btn-precio">{pase.precio}</span>
              </button>
            ))}
            <button className="pv3-mas-dias" onClick={() => onComprarPase?.('custom')}>
              ¿Más días?
            </button>
          </div>

          {/* 7 · Carril de hotelería: otro público, otro nivel. Separado por una
                 línea fina y con peso de link, no de botón: sigue estando a un
                 clic sin pelearle el protagonismo al pase. */}
          <div className="pv3-b2b">
            <span className="pv3-b2b-txt"><b>¿Tenés un alojamiento ó agencia de turismo?</b></span>
            <button className="pv3-b2b-cta" onClick={suscribir}>
              Suscribite y regalá pases  <span aria-hidden="true">→</span>
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

        /* 1 · Ticket-marca. -18°: sigue yendo en el mismo sentido que la galería
           (-10°) en vez de cruzarla, pero con bastante más gesto. Al rotar, el
           alto visual pasa de 85 a ~128px y se come 21px por arriba y por abajo:
           de ahí el margin inferior de 32px, para que no lama el título. */
        .pv3-ticket { width: 172px; height: auto; display: block; margin: 0 0 32px; transform: rotate(-25deg); }

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
        /* 5 · Pretítulo de los pases. Rankea por debajo del sub (15.5 contra
           16-19) y sólo la pregunta va en ink+700: si los dos bloques tuvieran
           el mismo peso competirían en vez de encadenarse. El aire está
           repartido a propósito —30px arriba, 12px abajo— para que se lea
           colgado de los botones y no del párrafo. */
        /* Sin max-width propio: hereda los 640px de .pv3-left y entra en un
           renglón. Con el tope de 30em (465px) cortaba justo antes de "entran"
           y dejaba una línea huérfana de una palabra. */
        .pv3-pretitulo { margin: 30px 0 0; font-size: 15.5px; line-height: 1.5; color: ${A.ink2}; }
        .pv3-pretitulo b { color: ${A.ink}; font-weight: 700; }

        /* 6 · Botones de pase: un solo peso de acción en todo el hero */
        .pv3-opciones { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-top: 12px; }
        /* Tercera opción: mismo nivel que los links del resto del hero (no el
           de los botones), y centrada contra el alto de 56px de sus hermanos
           por el align-items del contenedor. */
        .pv3-mas-dias {
          padding: 0; border: none; background: none; cursor: pointer;
          font-family: inherit; font-size: 15.5px; font-weight: 600; color: ${A.primary};
          white-space: nowrap;
          text-decoration: underline; text-underline-offset: 3px;
          text-decoration-thickness: 1.5px;
          transition: color .15s;
        }
        .pv3-mas-dias:hover { color: ${A.primaryDark}; }
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

        /* 7 · Carril hotelería. margin-top a 10px (era 40): con la letra chica
           de arriba eliminada, el carril se acerca 30px más al bloque de pases
           que separaban por el bloque intermedio ya nada. */
        .pv3-b2b {
          display: flex; align-items: center; flex-wrap: wrap; gap: 4px 10px;
          margin-top: 40px; padding-top: 20px;
          border-top: 1px solid ${A.line};
          /* Igual que el pretítulo: sin tope propio, la pregunta y el link
             entran en un renglón y la línea divisoria cruza los 640px enteros
             en vez de cortarse a media columna. */
          font-size: 15.5px; line-height: 1.5;
        }
        .pv3-b2b-txt { color: ${A.ink}; }
        /* Alto de toque cómodo sin cambiar de nivel visual: el área crece por
           padding, no por fondo ni por borde. */
        .pv3-b2b-cta {
          padding: 0px 0; border: none; background: none; cursor: pointer;
          font-family: inherit; font-size: 15.5px; font-weight: 700; color: ${A.primary};
          text-decoration: underline; text-underline-offset: 3px;
          text-decoration-thickness: 1.5px; text-decoration-color: ${A.line};
          transition: color .15s, text-decoration-color .15s;
        }
        .pv3-b2b-cta:hover { color: ${A.primary}; text-decoration-color: ${A.primary}; }

        /* 4 · Contador sobre la galería.
           Ficha blanca al ras del borde derecho de la ventana, sin rotar. La
           galería está inclinada y en movimiento; una tarjeta con TEXTO que
           además girara competía con ella en vez de apoyarse, y a -10° el
           número se leía torcido sin ganar nada.

           Se sale de la caja del contenido a propósito: el "right" es negativo
           por la mitad de lo que le sobra al viewport respecto de .pv3-inner,
           así queda pegada al borde de la ventana y no al de la columna. La
           esquina derecha se pierde fuera de pantalla —de ahí el radio sólo
           del lado izquierdo—: media ficha asomando dice "hay más para este
           lado" mejor que una tarjeta entera flotando en el aire.

           (100vw incluye la barra de scroll, así que se corre ~8px de más;
           como el borde derecho ya está fuera de cuadro, no se nota.) */
        .pv3-contador {
          position: absolute;
          right: calc((100% - 100vw) / 2);
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          display: flex; flex-direction: column; align-items: flex-start;
          min-width: 190px;
          padding: 22px 30px 20px 26px;
          border: none;
          border-radius: 26px 0 0 26px;
          background: #fff;
          box-shadow: 0 22px 50px -28px rgba(11,16,32,0.45);
          font-family: inherit; text-align: left; cursor: pointer;
          transition: box-shadow .18s;
        }
        .pv3-contador:hover { box-shadow: 0 28px 60px -26px rgba(11,16,32,0.55); }
        .pv3-contador-num {
          font-size: 38px; font-weight: 700; line-height: 1.05;
          color: ${A.primary}; font-variant-numeric: tabular-nums;
        }
        /* Dos spans y no un <br>: en angosto la ficha se desarma en una línea
           y el corte tiene que poder deshacerse desde el CSS. */
        .pv3-contador-label {
          display: flex; flex-direction: column;
          font-size: 16px; font-weight: 400; line-height: 1.3; color: ${A.ink};
        }
        .pv3-contador-link {
          margin-top: 16px;
          font-size: 15px; font-weight: 700; color: ${A.ink};
          transition: color .15s;
        }
        /* Sin número, el link queda solo en la ficha y no hay nada de lo que
           separarse. */
        .pv3-contador-link:first-child { margin-top: 0; }
        .pv3-contador:hover .pv3-contador-link { color: ${A.primary}; }

        /* ─── Galería ─────────────────────────────────────────
           La ventana es MÁS ANCHA que el bloque de fotos a propósito: el
           sobrante de la izquierda es la zona donde el fundido las disuelve,
           así el borde visible es el del propio bloque —inclinado como todo lo
           demás— y no el corte vertical del contenedor. Ese sobrante además es
           la zona de solape: el texto (z-index 2) pasa por encima de fotos ya
           casi transparentes. */
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
          .pv3-sub, .pv3-pretitulo, .pv3-b2b { text-align: center; }
          .pv3-opciones, .pv3-b2b { justify-content: center; }
          .pv3-galwin { opacity: 0.5; --colw: clamp(150px, 20vw, 220px); }

          /* Acá el layout es de una sola columna centrada: no hay "derecha" de
             la que colgarse. Una ficha blanca al ras del borde quedaría pisando
             el contenido centrado —y desde 760px, apoyada sobre una galería que
             ya ni existe—. Vuelve al flujo y se desarma: sin fondo, sin sombra
             y en una línea queda como un renglón más del bloque, que es lo que
             es cuando no tiene fotos detrás. */
          .pv3-contador {
            position: static; transform: none;
            flex-direction: row; align-items: baseline; gap: 7px;
            min-width: 0; margin: 18px 0 0; padding: 0;
            background: none; box-shadow: none; border-radius: 0;
          }
          .pv3-contador:hover { box-shadow: none; }
          .pv3-contador-num   { font-size: 24px; }
          .pv3-contador-label { flex-direction: row; gap: 5px; font-size: 15px; }
          .pv3-contador-link  { margin-top: 0; font-size: 15px; }
          .pv3-contador-label::after { content: '·'; margin-left: 2px; color: ${A.line}; }
        }
        @media (max-width: 760px) {
          .pv3-galwin { display: none; }
          .pv3-mobile-deco { display: block; position: absolute; inset: 0; pointer-events: none; z-index: 0; }
        }
        @media (max-width: 560px) {
          /* Los dos pases pasan a ocupar el ancho: en mobile la comparación se
             hace en vertical, uno debajo del otro. Pisa el align-items:center
             de la regla base (ahí es para centrar "¿Más días?" contra el alto
             de los botones en la fila de escritorio; acá no hay fila). */
          .pv3-opciones { flex-direction: column; align-items: stretch; gap: 12px; }
          .pv3-btn-pase { justify-content: center; }
          .pv3-mas-dias { padding-top: 2px; text-align: center; }

          /* Las cuatro piezas en un renglón suman ~293px: entran justo en un
             teléfono de 360 y no en uno de 320. Se permite el corte, pero por
             la junta que corresponde —el link cae entero a la segunda línea—
             en lugar de partir "te esperan" al medio. */
          .pv3-contador { flex-wrap: wrap; justify-content: center; }
          .pv3-contador-label::after { content: none; }
        }
      `}</style>
    </section>
  );
}
