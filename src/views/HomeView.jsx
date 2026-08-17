// ============================================================
//  src/views/HomeView.jsx — Aire design system
// ============================================================
import { useState, useEffect, useRef } from 'react';
import OfertaCard from '../components/OfertaCard';
import CupopackModal from '../components/CupopackModal';
import { getBeneficioIcon } from '../lib/beneficioIconos';
import { aplicarBeneficioCupopack } from '../lib/beneficiosCupopack';
import { useCarrito } from '../lib/carrito';
import HeroPase from '../components/landing/HeroPase';
import PortadaCupopack from '../components/PortadaCupopack';
import PaSSMark        from '../components/PaSSMark';
import Icono           from '../components/Icono';

// ─── Design tokens ───────────────────────────────────────────
const A = {
  primary:     '#475BE1',
  primaryDark: '#3347C8',
  primarySoft: '#EEF0FD',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  yellow:      '#FFC93C',
  green:       '#10A36B',
  navy:        '#0B1733',
  font:        "'Inter', system-ui, sans-serif",
};

// ─── Photos — Mar de las Pampas aesthetic ────────────────────
const PHOTOS = {
  forest:  'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=900&q=80',
  cabin:   'https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=900&q=80',
  pool:    'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=900&q=80',
};

const IcoBolt    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>;
const IcoArrowR  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
// ─── Type filter pills with SVG icons ────────────────────────
const TYPE_FILTERS = [
  {
    id: 'hoteles', label: 'Hoteles', navFiltro: 'Hotel,Hostel',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21V7l9-4 9 4v14"/><path d="M9 21V11h6v10"/><rect x="10" y="3" width="4" height="4" rx="1" fill="currentColor" opacity="0.3"/>
      </svg>
    ),
  },
  {
    id: 'casas', label: 'Casas y cabañas', navFiltro: 'Cabaña,Casa',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5 12 3l9 6.5V21H3V9.5Z"/><path d="M9 21v-7h6v7"/>
      </svg>
    ),
  },
  {
    id: 'aparts', label: 'Aparts', navFiltro: 'Departamento',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M3 9h6M3 15h6M15 3v18M15 9h6M15 15h6"/>
      </svg>
    ),
  },
  {
    id: 'camping', label: 'Dormis / Camping', navFiltro: 'Dormi',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20 12 4l10 16H2Z"/><path d="M12 4v16M2 20h20"/>
      </svg>
    ),
  },
];

// ═══════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function HomeView({ accommodations = [], dining = [], aventura = [], onOpenDetail, onArmarPack, onVerPacks, onOpenOferta, onVerOfertasRegalo, onNavCuponear, onComprarPase, onSuscribirHoteleria, onSuscripcionLista, onVerPase, onVerTodas }) {
  const [activeTypes,    setActiveTypes]    = useState(new Set());
  const [activeSecondary, setActiveSecondary] = useState([]);
  const [tabAloj,        setTabAloj]        = useState('Todos'); // eslint-disable-line

  // Las ofertas se traen una sola vez para las 5 tiras y se etiquetan con su
  // bucket acá: cada PromosSection filtra sobre el mismo array en memoria.
  const [promos, setPromos]             = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  useEffect(() => {
    let vivo = true;
    (async () => {
      const { getPromos, bucketCuponear } = await import('../lib/datos');
      const rows = await getPromos(300);
      if (!vivo) return;
      setPromos(rows.map(p => ({ ...p, bucket: bucketCuponear(p) })));
      setLoadingPromos(false);
    })();
    return () => { vivo = false; };
  }, []);

  return (
    <div style={{ color: A.ink, fontFamily: A.font }}>

      {/* ── HERO — Pase Gesell + propuesta para alojamientos/agencias,
          fusionados en UN SOLO pin (2026-08-09). Antes eran dos secciones
          separadas (HeroPase y HeroCoupons, cada una con su propio scroll-
          jack) y el traspaso entre una y otra se sentía como "bajar a otra
          pantalla" — un salto de sección normal en medio de dos tramos
          pineados. Ahora todo el segundo acto (pregunta grande + panel de
          suscripción + lluvia de cupones) vive DENTRO del mismo stage
          pineado de HeroPase; HeroCoupons.jsx quedó sin uso en la home (no
          se borró el archivo por las dudas de que se necesite reflotar
          rápido, pero no se importa más acá). El link que antes era
          "Conocé el catálogo" (llevaba al listado general vía onVerTodas)
          pasó a decir "Regalá pases" y ya no navega a otra vista: salta al
          panel de suscripción dentro del mismo hero (ver irAPostaRef en
          HeroPase.jsx). "Conocé todas las ofertas" (2026-08-10) siguió
          viviendo en esos accesos, pero dejó de navegar a onVerTodas
          (2026-08-11 tarde): ahora desliza la propia home hasta "Cuponeá
          antes de pagar", resuelto adentro de HeroPase.jsx contra el mismo
          ancla [data-navbar-shrink] de acá abajo — por eso ya no se le pasa
          onVerCatalogo. */}
      {/* onSuscribirHoteleria ya no lo usa HeroPase (el camino "empresa" quedó
          embebido ahí adentro, ver CheckoutHoteleroView `embebido`) — sigue
          recibiéndolo por si hace falta reflotarlo, no rompe nada de más. */}
      <HeroPase onComprarPase={onComprarPase} onSuscribirHoteleria={onSuscribirHoteleria} onSuscripcionLista={onSuscripcionLista} />

      {/* Fin del hero: a partir de acá la navbar se condensa (Navbar.jsx →
          [data-navbar-shrink]). Al lado había un segundo ancla,
          [data-navbar-reveal], que era la que la hacía APARECER; se eliminó el
          2026-08-11 porque aparecer dejó de ser una cuestión de posición: ahora
          la navbar responde a la dirección del scroll desde el arranque de la
          home. Ver el useEffect de dirección en Navbar.jsx. */}
      <div data-navbar-shrink aria-hidden="true" />

      {/* ── Cuponeá en cada momento de tu viaje ──────────────── */}
      <CuponearCategoriasSection onVerOfertasRegalo={onVerOfertasRegalo} onNavCuponear={onNavCuponear} />

      {/* ── Una tira de ofertas por grupo: alojamientos, gastronomía,
             aventura & relax y compras ───────────────────────── */}
      {HOME_BUCKETS.map((g, i) => (
        <PromosSection
          key={g.id}
          grupo={g}
          promos={promos}
          loading={loadingPromos}
          conBordeSuperior={i === 0}
          onOpenDetail={onOpenDetail}
          accommodations={accommodations}
          onOpenOferta={onOpenOferta}
          onNavCuponear={onNavCuponear}
        />
      ))}

      {/* ── Cupopacks ─────────────────────────────────────────── */}
      <CupopacksSection onVerPacks={onVerPacks} onVerPase={onVerPase} />
    </div>
  );
}

// Punto de disparo único para las entradas por scroll de la home: las
// pastillas de "Cuponeá" y las fichas de cada tira "Ofertas en …".
//
// threshold: 0 + margen inferior en % (no en px, no con threshold) para que el
// disparo NO dependa del alto del bloque: se activa exactamente cuando su
// BORDE SUPERIOR cruza la mitad del alto de la ventana, mida lo que mida. Con
// un threshold por fracción, un bloque alto tenía que meter mucha más altura en
// pantalla que uno bajo, así que cada sección arrancaba en un momento distinto.
//
// 50% = la mitad exacta de la ventana. Se probó primero con 75% (un cuarto de
// pantalla antes, para que la cascada estuviera terminando justo al llegar al
// medio) y no funcionó: medido en pantalla, con el borde superior al 75% de una
// ventana de 746px, de la tira de fichas —596px de alto— sólo entraban 186px,
// o sea que las fichas animaban con tres cuartas partes abajo del pliegue y
// para cuando se veían enteras la animación ya había terminado. Cuanto más alto
// el bloque, peor: por eso las pastillas de "Cuponeá" (364px) zafaban y las
// fichas no.
//
// Con el borde superior en el medio entran 373px, que es más o menos una ficha
// completa (392px) y la grilla entera de pastillas: la mitad de abajo de la
// pantalla es el bloque animándose. Eso es lo que se ve.
//
// Importante: hay que observar el BLOQUE QUE ANIMA, no la <section> que lo
// contiene. La tira de fichas observaba la sección entera —57px de padding más
// el header arriba— así que la cascada arrancaba con las fichas todavía abajo
// de la ventana y para cuando aparecían ya había terminado.
const REVEAL_IO = { threshold: 0, rootMargin: '0px 0px -50% 0px' };

// ═══════════════════════════════════════════════════════════
//  Cuponear — 4 grupos de ofertas genéricos
// ═══════════════════════════════════════════════════════════
const CUPONEAR_CARDS = [
  {
    titulo: 'Descansá',
    img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=700&q=80',
    alt: 'Interior de habitación premium en cabaña de madera con cama king y vista al bosque',
    navTarget: 'alojamientos',
  },
  {
    titulo: 'Salí a comer',
    img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=700&q=80',
    alt: 'Pareja cenando en restaurante íntimo con velas',
    navTarget: 'comer',
  },
  {
    titulo: 'Viví una experiencia',
    img: '/travesia.avif',
    alt: '4x4 haciendo travesía en la playa',
    navTarget: 'experiencia',
  },
  {
    titulo: 'Traete un recuerdo',
    img: '/aldea.jpeg',
    alt: 'Aldea de artesanos con turistas recorriendo los locales al atardecer',
    navTarget: 'compras',
  },
  {
    titulo: 'Hacete un mimo',
    img: '/masaje.jpeg',
    alt: 'Terapeuta aplicando masaje en la espalda de una persona en camilla de spa',
    navTarget: 'mimo',
  },
];

function CuponearCategoriasSection({ onVerOfertasRegalo, onNavCuponear }) {
  // Ahorro máximo real por bucket, leído de las ofertas vigentes. Si un
  // bucket no tiene ninguna oferta con % cargado, no se muestra nada debajo
  // de esa pastilla — antes que prometer un número que no existe.
  const [ahorros, setAhorros] = useState({});
  const [totalOfertas, setTotalOfertas] = useState(0);

  // Entrada en cascada de las pastillas, la primera vez que la sección entra
  // en pantalla. Mismo mecanismo (y mismo punto de disparo, ver REVEAL_IO) que
  // la tira de ofertas: IntersectionObserver que se desconecta al disparar,
  // para que sea un estreno y no algo que se repite cada vez que se pasa.
  const gridRef = useRef(null);
  const [revelado, setRevelado] = useState(false);
  useEffect(() => {
    if (revelado) return;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) { setRevelado(true); return; }
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setRevelado(true); obs.disconnect(); }
    }, REVEAL_IO);
    obs.observe(el);
    return () => obs.disconnect();
  }, [revelado]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const [{ getPromos, ahorroMaxPorBucket }, { contarDescuentosDelPase }] = await Promise.all([
        import('../lib/datos'),
        import('../lib/pases'),
      ]);
      // El total sale contado contra la base, no sobre la página que trajo
      // getPromos: incluye las dos capas del pase, las incluidas y las premium.
      const [promos, conteo] = await Promise.all([getPromos(300), contarDescuentosDelPase()]);
      if (!vivo) return;
      setAhorros(ahorroMaxPorBucket(promos));
      setTotalOfertas(conteo.total);
    })();
    return () => { vivo = false; };
  }, []);

  return (
    // zIndex por encima del hero (z:0) para tapar como bloque las imágenes
    // que asoman desde atrás de la línea divisoria.
    <section style={{ position: 'relative', zIndex: 1, background: 'linear-gradient(180deg, #EAF4FB 0%, #E2F0FB 100%)', padding: '72px 0' }}>
      <div style={{ maxWidth: 'var(--site-max)', margin: '0 auto', padding: '0 var(--site-pad)' }}>
        {/* Header */}
        <div style={{ marginBottom: 60, textAlign: 'center' }}>
          {/* Icono de los cuponcitos, encima del título */}
          <div style={{ position: 'relative', width: 72, height: 52, margin: '0 auto 16px' }}>
            <img src="/ico-disc.svg" alt="" style={{ width: 48, position: 'absolute', top: 0, left: 12, zIndex: 2 }} />
            <img src="/ico-disc.svg" alt="" style={{ width: 48, position: 'absolute', top: 0, left: 38, zIndex: 1, opacity: 0.55 }} />
          </div>
          <h2 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.025em', color: A.ink, margin: 0, lineHeight: 1.1 }}>
            <em style={{ fontStyle: 'italic', fontWeight: 400, color: A.primary }}>Cuponeá</em> antes de pagar
          </h2>

          {/* Atribución al producto, pegada al título */}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 30, fontSize: 19, color: A.muted, lineHeight: 1.6 }}>
            con <PaSSMark size={16} conGesell />
          </span>
        </div>

        {/* 4 cards */}
        {/* Entrada de las pastillas, tomando como referencia phantom.com
            (2026-08-10). Lo que se pudo VERIFICAR de esa página, midiendo
            sus nodos: las cards que todavía no entraron están en opacity:0 +
            transform:scale(0.95) y pasan a opacity:1 + transform:none, con
            transition-duration en 0s —o sea que no lo anima CSS sino JS por
            la Web Animations API—, y hay una segunda capa interna que sólo
            hace fade. Los tiempos exactos NO se pudieron extraer (bundle
            minificado, valores armados en runtime), así que de acá para
            abajo son decisiones propias, no copia.
            Lo importante es lo que NO hace: no hay barrido lateral. En esa
            página cada card se dispara por su propio cruce de viewport, y
            como las de una fila cruzan todas a la vez, entran juntas. Un
            intento anterior acá escalonaba 90ms por índice y se leía
            exactamente como lo que no tiene que ser: una carga de izquierda
            a derecha. El escalonado de ahora sale del CENTRO hacia afuera
            (ver el delay en el JSX): mantiene vida y profundidad, pero es
            simétrico, así que no hay un lado que "va primero".
            El blur y el desplazamiento corto son lo que le da cuerpo — sin
            eso, fade+escala solo queda demasiado plano. */}
        <style>{`
          .cup-pastilla { opacity: 0; }
          .cup-pastilla--in { animation: cupPastillaIn .9s cubic-bezier(.16,1,.3,1) both; }
          @keyframes cupPastillaIn {
            from { opacity: 0; transform: translateY(26px) scale(.92); filter: blur(10px); }
            to   { opacity: 1; transform: none; filter: blur(0); }
          }
          /* La capa de texto entra un paso después que su pastilla — es la
             segunda capa que hace sólo fade en la referencia. */
          .cup-pastilla-texto { opacity: 0; }
          .cup-pastilla--in .cup-pastilla-texto {
            animation: cupTextoIn .6s ease-out both;
            animation-delay: calc(var(--cup-delay, 0ms) + 260ms);
          }
          @keyframes cupTextoIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: none; }
          }
          @media (prefers-reduced-motion: reduce) {
            .cup-pastilla, .cup-pastilla-texto {
              opacity: 1; transform: none; filter: none; animation: none;
            }
          }
        `}</style>
        <div ref={gridRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 48 }}>
          {CUPONEAR_CARDS.map((card, i) => (
            <div
              key={card.titulo}
              onClick={() => onNavCuponear?.(card.navTarget)}
              className={`cup-pastilla${revelado ? ' cup-pastilla--in' : ''}`}
              // Delay por distancia al CENTRO de la fila, no por índice: con
              // 5 pastillas da 140/70/0/70/140ms, o sea que abre desde el
              // medio hacia los dos lados a la vez. Escalonado por índice
              // (0/90/180/270/360) es lo que producía la lectura de barrido
              // de izquierda a derecha. --cup-delay lo reusa el texto de
              // adentro para entrar después de su propia pastilla.
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, cursor: 'pointer',
                '--cup-delay': `${Math.abs(i - (CUPONEAR_CARDS.length - 1) / 2) * 70}ms`,
                animationDelay: `${Math.abs(i - (CUPONEAR_CARDS.length - 1) / 2) * 70}ms`,
              }}
            >
              {/* Imagen con proporción tall pill */}
              <div style={{ width: '80.5%', aspectRatio: '9/16', borderRadius: 999, overflow: 'hidden', boxShadow: '0 4px 24px rgba(11,16,32,0.10)' }}>
                <img
                  src={card.img}
                  alt={card.alt}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
                />
              </div>

              {/* Texto */}
              <div className="cup-pastilla-texto" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: A.ink, lineHeight: 1.2 }}>{card.titulo}</div>
                {ahorros[card.navTarget] != null && (
                  <div style={{ fontSize: 13, fontWeight: 500, color: A.muted, marginTop: 5 }}>
                    hasta un <strong style={{ color: A.primary, fontWeight: 700 }}>{ahorros[card.navTarget]}% menos</strong>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* La regla de los dos relojes: el descuento de estadía se usa al
            reservar; los días del pase arrancan al llegar (ver canjearEstadia
            en lib/pases.js). */}
        <div style={{ marginTop: 56, textAlign: 'center', lineHeight: 1.6 }}>
          {/* Los dos rubros que sí piden reserva previa, como ilustración de
              la frase que sigue. */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 8, marginBottom: 14 }}>
            {/* La casita al 85% (72 → 61). Sin corrimiento vertical: la fila
                alinea por abajo (alignItems: flex-end) y cualquier `top` la
                descuelga del piso que comparte con el spa. */}
            <Icono src="/iconos/cabania.json" style={{ height: 61, width: 61, display: 'block' }} />
            {/* Un toque más chico y bajado: así la flor de loto queda
                ópticamente alineada con la cabaña, que apoya en el piso.
                Va en Lottie: el canvas es cuadrado, así que lleva ancho fijo. */}
            <Icono src="/iconos/spa.json" style={{ height: 67, width: 67, display: 'block', position: 'relative', top: 2 }} />
          </div>
          <div style={{ fontSize: 15, color: A.ink }}>
            <strong style={{ fontWeight: 700, color: A.primary }}>Los cupones que necesitan coordinar fecha los pedís por anticipado.</strong>
            <br></br>El resto de los cupones, en las fechas que elijas.
          </div>

          {totalOfertas > 0 && (
            <button
              onClick={() => onNavCuponear?.('alojamientos')}
              style={{ marginTop: 26, background: A.primary, border: `none`, color: 'white', borderRadius: 999, padding: '11px 26px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.2s, color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = A.primary; }}
              onMouseLeave={e => { e.currentTarget.style.background = A.primary; e.currentTarget.style.color = 'white'; }}
            >
              Ver los {totalOfertas} descuentos →
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// Una tira por grupo de la home, en el orden en que se muestran. Los valores de
// `buckets` son los que devuelve bucketCuponear() en lib/datos.js — el mismo
// criterio con el que navegan las pastillas de "Cuponeá antes de pagar".
// Aventura y relax van juntas en una sola tira; `navTarget` es a dónde manda el
// botón negro (App.jsx → onNavCuponear).
// `navSection` es el ítem del navbar que se subraya mientras la tira está en
// pantalla (ver el data-nav-section que lee Navbar.jsx).
const HOME_BUCKETS = [
  { id: 'alojamientos', buckets: ['alojamientos'],       label: 'alojamientos',    labelBoton: 'en Alojamiento',        navTarget: 'alojamientos', navSection: 'aloj' },
  { id: 'comer',        buckets: ['comer'],              label: 'gastronomía',     labelBoton: 'en Salidas',            navTarget: 'comer',        navSection: 'gastro' },
  { id: 'compras',      buckets: ['compras'],            label: 'compras',         labelBoton: 'en Compras',            navTarget: 'compras',      navSection: 'gastro' },
  { id: 'aventura',     buckets: ['experiencia', 'mimo'], label: 'aventura & relax', labelBoton: 'en Aventura & Relax', navTarget: 'experiencia',  navSection: 'aventura' },
];

function PromosSection({ grupo, promos, loading, onOpenDetail, accommodations, onOpenOferta, onNavCuponear, conBordeSuperior = false }) {
  const { id, buckets, label, labelBoton, navTarget, navSection } = grupo;
  const [filtroTipo, setFiltroTipo]     = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loadingMore, setLoadingMore]   = useState(false);
  const scrollRef = useRef(null);
  const seccionRef = useRef(null);
  const { addCupon } = useCarrito();

  useEffect(() => { setVisibleCount(10); scrollRef.current?.scrollTo({ left: 0 }); }, [filtroTipo]);

  // Reveal en cascada: las fichas aterrizan desde la derecha la primera vez
  // que la tira entra en pantalla al scrollear (una sola vez — no se repite
  // si se vuelve a pasar por acá). `revelado` gatea la clase que dispara la
  // animación (ver @keyframes promoCardIn, más abajo); el propio card sigue
  // montado siempre, sólo cambia opacity/transform vía CSS. Con
  // prefers-reduced-motion queda visible de entrada, sin animar.
  //
  // Se observa la TIRA (scrollRef), no la <section>: ver la nota de REVEAL_IO.
  const [revelado, setRevelado] = useState(false);
  useEffect(() => {
    if (revelado) return;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) { setRevelado(true); return; }
    const el = scrollRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setRevelado(true); obs.disconnect(); }
    }, REVEAL_IO);
    obs.observe(el);
    return () => obs.disconnect();
  }, [revelado]);

  const promosCat = promos.filter(p => p.tokens_costo !== 0 && buckets.includes(p.bucket));
  const promosFiltradas = (id === 'alojamientos' && filtroTipo)
    ? promosCat.filter(p => filtroTipo.split(',').map(t => t.trim()).includes(p.negocioTipo))
    : promosCat;

  // Un bucket sin una sola oferta no aparece: antes que una tira vacía, nada.
  if (!loading && promosCat.length === 0) return null;

  const alojMostrados = promosFiltradas.slice(0, visibleCount);
  const hayMas = visibleCount < promosFiltradas.length;

  function handleScroll(e) {
    if (!hayMas || loadingMore) return;
    const el = e.currentTarget;
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 320) {
      setLoadingMore(true);
      setTimeout(() => {
        setVisibleCount(n => n + 10);
        setLoadingMore(false);
      }, 400);
    }
  }

  const PILL_BASE = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 14px', borderRadius: 999, cursor: 'pointer',
    fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
    border: '1.5px solid transparent', transition: 'all 0.15s',
  };

  return (
    <section ref={seccionRef} data-nav-section={navSection} style={{ background: A.bg, padding: '57px 0', borderTop: conBordeSuperior ? `1px solid ${A.line}` : 'none', borderBottom: `1px solid ${A.line}` }}>
      <style>{`
        @keyframes skelPulse { 0%, 100% { opacity: 0.9 } 50% { opacity: 0.3 } }
        /* Reveal en cascada de las fichas — ver el useEffect con
           IntersectionObserver más arriba (revelado). Arrancan corridas a la
           derecha y transparentes; .promo-card--in las trae a su lugar, con
           un animation-delay creciente por índice (inline, más abajo) para
           que entren en cascada y no todas juntas. */
        .promo-card { opacity: 0; transform: translateX(64px); }
        .promo-card--in { animation: promoCardIn .6s cubic-bezier(.16,1,.3,1) both; }
        @keyframes promoCardIn {
          from { opacity: 0; transform: translateX(64px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .promo-card { opacity: 1; transform: none; animation: none; }
        }
      `}</style>
      {/* Header */}
      <div style={{ paddingLeft: 'max(var(--site-pad), calc((100vw - var(--site-max)) / 2 + var(--site-pad)))', paddingRight: 56, marginBottom: 28 }}>
        <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.01em', color: A.ink, margin: '0 0 20px', display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <span>Ofertas en&nbsp;</span>
          {/* La categoría en azul es el mismo atajo que el botón negro del pie */}
          <button
            onClick={() => onNavCuponear?.(navTarget)}
            style={{ background: 'none', border: 'none', font: 'inherit', letterSpacing: 'inherit', color: A.primary, cursor: 'pointer', padding: 0, margin: 0, textDecoration: 'none' }}
          >
            {label}
          </button>
        </h2>

        {/* Pills de filtro (solo en alojamientos) */}
        {id === 'alojamientos' && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <button onClick={() => setFiltroTipo(null)} style={{ ...PILL_BASE, background: filtroTipo === null ? A.primary : '#fff', color: filtroTipo === null ? '#fff' : A.ink2, borderColor: filtroTipo === null ? A.primary : A.line }}>
              Todos
            </button>
            {TYPE_FILTERS.map(f => {
              const active = filtroTipo === f.navFiltro;
              return (
                <button key={f.id} onClick={() => setFiltroTipo(active ? null : f.navFiltro)} style={{ ...PILL_BASE, background: active ? A.primary : '#fff', color: active ? '#fff' : A.ink2, borderColor: active ? A.primary : A.line }}>
                  <span style={{ color: active ? '#fff' : A.muted, display: 'flex' }}>{f.icon}</span>
                  {f.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Scroll horizontal en todos los anchos: arrancan 10 fichas y entran de
          a 10 al llegar al final, para no cargar la tira entera de una. */}
      <div style={{ position: 'relative' }}>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ overflowX: 'auto', paddingLeft: 'max(var(--site-pad), calc((100vw - var(--site-max)) / 2 + var(--site-pad)))', paddingBottom: 44 }}
          className="no-scrollbar"
        >
          {/* stretch: todas las fichas toman el alto de la más alta. Con
              flex-start las más bajas dejaban aire abajo y el botón parecía
              alejarse de la tira en las categorías con títulos largos. */}
          <div style={{ display: 'flex', gap: 24, width: 'max-content', paddingRight: 56, alignItems: 'stretch' }}>
            {loading ? (
              /* Placeholders: bloques grises parpadeando hasta la primera tanda */
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ width: 340, height: 392, flexShrink: 0, borderRadius: 20, background: '#e2e4ea', animation: 'skelPulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
              ))
            ) : (
              <>
                {alojMostrados.map((promo, i) => (
                  <div
                    key={promo.id}
                    className={`promo-card${revelado ? ' promo-card--in' : ''}`}
                    style={{ width: 340, flexShrink: 0, display: 'flex', animationDelay: `${Math.min(i * 70, 560)}ms` }}
                  >
                    <OfertaCard
                      promo={promo}
                      onOpen={p => {
                        if (onOpenOferta) { onOpenOferta(p); return; }
                        if (!onOpenDetail || !accommodations) return;
                        const neg = accommodations.find(a => String(a.id) === String(p.negocioId));
                        if (neg) onOpenDetail(neg, 'alojamiento', 'promos');
                      }}
                     
                    />
                  </div>
                ))}
                {/* Preloader al final del scroll, mientras entra la tanda siguiente */}
                {(hayMas || loadingMore) && (
                  <div style={{ width: 80, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <video autoPlay loop muted playsInline style={{ width: 56, height: 'auto', opacity: 0.7 }}>
                      <source src="/loading-casa.webm" type="video/webm" />
                    </video>
                  </div>
                )}
                {alojMostrados.length === 0 && (
                  <div style={{ padding: '40px 4px', color: A.muted, fontSize: 15, fontFamily: A.font }}>
                    No hay ofertas en esta categoría por ahora.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {/* Fade derecho: la tira se desvanece a 0% contra el fondo de la sección */}
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 8, width: 120, background: 'linear-gradient(to right, rgba(247,247,248,0), rgba(247,247,248,1))', pointerEvents: 'none', zIndex: 2 }} />
      </div>

      {/* Botón negro centrado — sólo si hay más ofertas que las que se ven */}
      {!loading && promosFiltradas.length > 4 && (
        <div style={{ maxWidth: 'var(--site-max)', margin: '0 auto', padding: '8px var(--site-pad) 0', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => onNavCuponear?.(navTarget)}
            style={{ background: A.ink, color: '#fff', border: 'none', borderRadius: 999, padding: '13px 30px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: A.font }}
          >
            Ver más ofertas {labelBoton}
          </button>
        </div>
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
//  CUPOPACKS
// ─── Card de un Cupopack (portada + beneficio + CTA) ───────
function CupopackCard({ cupopack, onVerCupopack }) {
  const portada  = cupopack.images?.[0] || PHOTOS.cabin;
  const nCupones = cupopack.cupones?.length || 0;
  const BenIcon  = getBeneficioIcon(cupopack.beneficioIcono);
  // Precio total del Cupopack (con el descuento del beneficio, si aplica).
  const precioBase = (cupopack.cupones || []).reduce((s, c) => s + (Number(c.precio_activacion) || 0), 0);
  const { precio: precioCupopack } = aplicarBeneficioCupopack({
    tipo: cupopack.beneficioTipo, valor: cupopack.beneficioValor, puntosBase: 0, precioBase,
  });

  return (
    <button
      onClick={onVerCupopack}
      style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden', minHeight: 520,
        display: 'flex', flexDirection: 'column',
        border: 'none', background: 'none', padding: 0, cursor: 'pointer',
        transition: 'transform .15s', width: '100%',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <PortadaCupopack cupopack={{ ...cupopack, images: [portada] }} alt={cupopack.title} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,10,25,0.95) 0%, rgba(5,10,25,0.35) 52%, rgba(5,10,25,0.5) 100%)' }} />

      {/* Beneficio adicional (círculo amarillo + texto amarillo) */}
      {cupopack.beneficioAdicional && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 11, padding: '20px 22px 0' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: A.yellow, display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}>
            <BenIcon size={21} color={A.navy} strokeWidth={2.4} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: A.yellow, lineHeight: 1.25 }}>{cupopack.beneficioAdicional}</span>
        </div>
      )}

      {/* Contenido inferior */}
      <div style={{ position: 'relative', marginTop: 'auto', padding: '0 26px 26px', textAlign: 'left' }}>
        <h3 style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0 0 12px' }}>{cupopack.title}</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5, margin: '0 0 22px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cupopack.subtitle}</p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 15, color: '#fff', fontSize: 15, fontWeight: 600 }}>
          <div style={{ position: 'relative', width: 40, height: 33 }}>
            <img src="/ico-disc.svg" alt="" style={{ width: 33, height: 33, position: 'absolute', top: 0, left: 0, zIndex: 2 }} />
            <img src="/ico-disc.svg" alt="" style={{ width: 33, height: 33, position: 'absolute', top: 0, left: 18, zIndex: 1, opacity: 0.55 }} />
          </div>
          {nCupones} cupones{precioCupopack > 0 ? `. Valor total: $${Math.round(precioCupopack).toLocaleString('es-AR')}` : ''}
        </div>
      </div>
    </button>
  );
}

function CupopacksSection({ onVerPacks, onVerPase }) {
  const [modal, setModal] = useState(null); // { cupopack, startIndex }
  const [cupopacks, setCupopacks] = useState(null); // null = cargando

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { getCupopacks } = await import('../lib/datos');
      const data = await getCupopacks();
      if (vivo) setCupopacks(data.slice(0, 6));
    })();
    return () => { vivo = false; };
  }, []);

  // No renderizar la sección si no hay Cupopacks cargados en la DB.
  if (cupopacks !== null && cupopacks.length === 0) return null;

  return (
    <section data-nav-section="packs" style={{ background: '#fff', position: 'relative' }}>
      <style>{`
        @media (max-width: 980px) { .cupopacks-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px) { .cupopacks-grid { grid-template-columns: 1fr !important; } }
        @keyframes cupSkel { 0%,100% { opacity: .35; } 50% { opacity: .12; } }
      `}</style>

      {/* Banda azul superior: cubre el header y baja hasta ~1/3 de la 1ª fila de cards */}
      <div style={{ background: A.navy, color: '#fff', paddingTop: 88, paddingBottom: 220 }}>
        <div style={{ paddingLeft: 'max(var(--site-pad), calc((100vw - var(--site-max)) / 2 + var(--site-pad)))', paddingRight: 'max(var(--site-pad), calc((100vw - var(--site-max)) / 2 + var(--site-pad)))' }}>

        {/* Header */}
        <div style={{ marginBottom: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(255,201,60,0.16)', color: A.yellow, borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
            <IcoBolt /> Viajá con packs de cupones
          </div>
          <h2 style={{ fontSize: 'clamp(34px, 3vw, 52px)', fontWeight: 700, lineHeight: 1.05, margin: '0 0 10px' }}>
            Cupopacks:{' '}
            <button
              onClick={onVerPacks}
              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: A.yellow, cursor: 'pointer', textDecoration: 'none', transition: 'opacity .15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.78'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              Todo en uno
            </button>
          </h2>
          <p style={{ fontSize: 21, fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45, letterSpacing: '-0.01em', margin: '18px 0 16px', maxWidth: 1120 }}>
            Selecciones de beneficios armadas por nosotros, para que no tengas que elegir entre decenas de cupones.
          </p>
        </div>{/* /header */}
        </div>{/* /inner padding banda azul */}
      </div>{/* /banda azul */}

      {/* Grid — subido para que el tercio superior de las cards quede sobre el azul */}
      <div style={{ paddingLeft: 'max(var(--site-pad), calc((100vw - var(--site-max)) / 2 + var(--site-pad)))', paddingRight: 'max(var(--site-pad), calc((100vw - var(--site-max)) / 2 + var(--site-pad)))', marginTop: -170, paddingBottom: 96, position: 'relative', zIndex: 1 }}>
        <div className="cupopacks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {cupopacks === null
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 24, aspectRatio: '1/1', background: 'rgba(255,255,255,0.08)', animation: 'cupSkel 1.4s ease-in-out infinite' }} />
              ))
            : cupopacks.map(c => (
                <CupopackCard
                  key={c.id}
                  cupopack={c}
                  onVerCupopack={() => setModal({ cupopack: c, startIndex: 0 })}
                />
              ))
          }
        </div>

        {/* Salida al listado completo de packs */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
          <button
            onClick={onVerPacks}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '15px 30px', borderRadius: 999, border: 'none', background: A.ink, color: '#fff', fontSize: 15.5, fontWeight: 700, cursor: 'pointer', fontFamily: A.font, transition: 'background .15s, transform .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = A.navy; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = A.ink; e.currentTarget.style.transform = 'none'; }}
          >
            Ver más Packs todo incluido <IcoArrowR />
          </button>
        </div>
      </div>

      {modal && (
        <CupopackModal
          cupopack={modal.cupopack}
          startIndex={modal.startIndex}
          onClose={() => setModal(null)}
          onVerPase={onVerPase}
        />
      )}
    </section>
  );
}

