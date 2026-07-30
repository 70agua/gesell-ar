// ============================================================
//  src/views/HomeView.jsx — Aire design system
// ============================================================
import React, { useState, useEffect, useRef } from 'react';
import AccommodationCard from '../components/AccommodationCard';
import OfertaCard, { PrecioCupon } from '../components/OfertaCard';
import { ALL_PROMOS } from '../data/mockData';
import CuponModal from '../components/CuponModal';
import CuponModalMock from '../components/CuponModalMock';
import { getBeneficioIcon } from '../lib/beneficioIconos';
import { aplicarBeneficioCuponera } from '../lib/beneficiosCuponera';
import { useCuponera }  from '../lib/cuponera';
import HeartButton      from '../components/HeartButton';
import { socialProof } from '../lib/socialProof';
import HeroPase from '../components/landing/HeroPase';
import HeroPaseB from '../components/landing/HeroPaseB';
import PortadaCuponera from '../components/PortadaCuponera';
import PaSSMark        from '../components/PaSSMark';
import Icono           from '../components/Icono';

// Hero vigente: HeroPaseB (una sola jerarquía, el turista primero y hotelería
// en su propio carril). El anterior queda a mano con `?hero=a` en la URL, para
// comparar; cuando ya no haga falta, se borra HeroPase.jsx y esto queda en una
// sola línea. Se lee al cargar: no cambia sin recargar la página.
const HERO_VARIANTE = typeof window !== 'undefined'
  ? new URLSearchParams(window.location.search).get('hero')
  : null;
const Hero = HERO_VARIANTE === 'a' ? HeroPase : HeroPaseB;

// ─── Design tokens ───────────────────────────────────────────
const A = {
  primary:     '#2545E6',
  primaryDark: '#1731B8',
  primarySoft: '#EEF1FF',
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

// ─── SVG Icons ───────────────────────────────────────────────
const IcoPin     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>;
const IcoBolt    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>;
const IcoTicket  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M13 6v12" strokeDasharray="2 3"/></svg>;
const IcoChevR   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>;
const IcoArrowR  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
const IcoCheck   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>;
const IcoInfo    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>;
const IcoUsers    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;

// ─── Golden coin SVG ─────────────────────────────────────────
function CoinSVG({ size = 14 }) {
  return <img src="/cuponera-coin.svg" alt="crédito" style={{ width: size, height: size, display:'inline-block', verticalAlign:'middle' }}/>;
}

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

const SECONDARY_FILTERS = [
  { id: 'mar', label: 'Cerca del mar' },
  { id: 'piscina', label: 'Con piscina' },
  { id: 'mascotas', label: 'Acepta mascotas' },
];

// ─── Guests dropdown (Adultos / Niños / Bebés) ───────────────
function GuestsDropdown() {
  const [open, setOpen]           = useState(false);
  const [adultos, setAdultos]     = useState(2);
  const [ninos, setNinos]         = useState(0);
  const [bebes, setBebes]         = useState(0);
  const [mascotas, setMascotas]   = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const summary = () => {
    const parts = [`${adultos} adulto${adultos !== 1 ? 's' : ''}`];
    if (ninos > 0) parts.push(`${ninos} niño${ninos !== 1 ? 's' : ''}`);
    if (mascotas) parts.push('+ mascota');
    return parts.join(', ');
  };

  const Counter = ({ value, onDec, onInc, min = 0 }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <button
        onClick={onDec}
        disabled={value <= min}
        style={{ width: 30, height: 30, borderRadius: '50%', border: `1px solid ${value <= min ? A.line : A.ink2}`, background: '#fff', cursor: value <= min ? 'default' : 'pointer', fontWeight: 700, fontSize: 18, display: 'grid', placeItems: 'center', lineHeight: 1, color: value <= min ? A.muted : A.ink, transition: 'all 0.1s' }}
      >
        −
      </button>
      <span style={{ minWidth: 20, textAlign: 'center', fontSize: 15, fontWeight: 600, color: A.ink }}>{value}</span>
      <button
        onClick={onInc}
        style={{ width: 30, height: 30, borderRadius: '50%', border: `1px solid ${A.ink2}`, background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 18, display: 'grid', placeItems: 'center', lineHeight: 1, color: A.ink }}
      >
        +
      </button>
    </div>
  );

  return (
    <div className="hero-search-guests" style={{ position: 'relative', borderRight: `1px solid ${A.line}`, flexShrink: 0 }} ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ padding: '14px 20px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, width: 168 }}
      >
        <div style={{ fontSize: 10, color: A.muted, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Huéspedes</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: A.ink, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
          <span style={{ color: A.primary, flexShrink: 0 }}><IcoUsers /></span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{summary()}</span>
        </div>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, background: '#fff', border: `1px solid ${A.line}`, borderRadius: 16, boxShadow: '0 16px 48px -16px rgba(11,16,32,0.2)', zIndex: 999, minWidth: 300, padding: '8px 0 0' }}>
          {/* Adultos */}
          <div style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${A.line}` }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: A.ink }}>Adultos</span>
            <Counter value={adultos} onDec={() => setAdultos(v => Math.max(1, v - 1))} onInc={() => setAdultos(v => Math.min(16, v + 1))} min={1} />
          </div>
          {/* Niños */}
          <div style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${A.line}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: A.ink, flexShrink: 0 }}>Niños</span>
              <span style={{ fontSize: 11, color: A.muted, whiteSpace: 'nowrap' }}>2 – 12 años</span>
            </div>
            <Counter value={ninos} onDec={() => setNinos(v => Math.max(0, v - 1))} onInc={() => setNinos(v => Math.min(8, v + 1))} />
          </div>
          {/* Bebés */}
          <div style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${A.line}` }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, minWidth: 0, overflow: 'hidden' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: A.ink, flexShrink: 0 }}>Bebés</span>
              <span style={{ fontSize: 11, color: A.muted, whiteSpace: 'nowrap' }}>Menores de 2 años</span>
            </div>
            <Counter value={bebes} onDec={() => setBebes(v => Math.max(0, v - 1))} onInc={() => setBebes(v => Math.min(4, v + 1))} />
          </div>
          {/* Mascotas */}
          <div
            onClick={() => setMascotas(v => !v)}
            style={{ padding: '11px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>🐾</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: A.ink }}>Con mascotas</span>
            </div>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${mascotas ? A.primary : A.line}`, background: mascotas ? A.primary : '#fff', display: 'grid', placeItems: 'center', transition: 'all 0.15s', flexShrink: 0 }}>
              {mascotas && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
          </div>
          {/* Confirmar */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${A.line}`, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setOpen(false)}
              style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════
export default function HomeView({ accommodations = [], dining = [], aventura = [], onOpenDetail, onVerTodas, onArmarPack, onOpenPack, onVerPacks, onOpenOferta, onVerOfertasRegalo, onNavCuponear, onComprarPase, onSuscribirHoteleria }) {
  const [activeTypes,    setActiveTypes]    = useState(new Set());
  const [activeSecondary, setActiveSecondary] = useState([]);
  const [tabAloj,        setTabAloj]        = useState('Todos'); // eslint-disable-line

  const toggleSecondary = id => setActiveSecondary(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  const toggleType = id => setActiveTypes(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const filteredAloj = tabAloj === 'Todos' ? accommodations : accommodations.filter(a => a.type === tabAloj);

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

      {/* ── HERO — Pase Gesell (un producto, un CTA, sin buscador).
             Con ?hero=a se pinta el hero anterior, para comparar. ── */}
      <Hero
        onVerDescuentos={() => { onVerTodas && onVerTodas(); window.scrollTo(0, 0); }}
        onComprarPase={onComprarPase}
        onSuscribir={onSuscribirHoteleria}
      />

      {/* Marca el fin del hero: cuando este punto pasa bajo la navbar,
          la navbar se estrecha (ver Navbar.jsx → [data-navbar-shrink]). */}
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

      {/* ── Packs / Cuponeras prediseñadas ─────────────────────── */}
      <CuponerasSection onOpenPack={onOpenPack} onVerPacks={onVerPacks} />
    </div>
  );
}

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
  useEffect(() => {
    let vivo = true;
    (async () => {
      const [{ getPromos, ahorroMaxPorBucket }, { contarDescuentosDelPase }] = await Promise.all([
        import('../lib/datos'),
        import('../lib/pases'),
      ]);
      // El total sale contado contra la base, no sobre la página que trajo
      // getPromos: incluye las dos capas del pase, las incluidas y las PLUS.
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
      <div style={{ maxWidth: 1328, margin: '0 auto', padding: '0 40px' }}>
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
            Todo esto lo incluye tu <PaSSMark size={20} conGesell />
          </span>
        </div>

        {/* 4 cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 48 }}>
          {CUPONEAR_CARDS.map((card) => (
            <div key={card.titulo} onClick={() => onNavCuponear?.(card.navTarget)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
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
              <div style={{ textAlign: 'center' }}>
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
            <strong style={{ fontWeight: 700, color: A.primary }}>Los cupones que requieran reserva previa los usás anticipadamente.</strong>
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

// ═══════════════════════════════════════════════════════════
//  Socios locales que son tendencia — avatares redondos
// ═══════════════════════════════════════════════════════════
const IcoStarFill = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01L12 2z"/></svg>;
const IcoFlame    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 3-1 4.5-2.5 6C8 9.5 7 11 7 13a5 5 0 0 0 10 0c0-1.7-.7-3.2-1.7-4.4-.3 1-1 1.7-1.9 1.9.6-2-.3-4.4-1.4-6.5-.3 1.2-1 2-2 2.6.2-1.8-.2-3.6-1-5.6 1.6.4 3.4 1.3 4.9 0z"/></svg>;

// Set de 6 íconos SVG (línea, currentColor) que cubren todas las subcategorías por agrupación
const IcoCatBed    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7"/><path d="M3 18h18"/><path d="M3 11V7"/><path d="M7 11V9a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2"/></svg>;
const IcoCatFork   = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3v7a2 2 0 1 0 4 0V3"/><path d="M9 10v11"/><path d="M17 3c-1.5 0-2 2-2 4s.5 4 2 4 2-2 2-4-.5-4-2-4Z"/><path d="M17 11v10"/></svg>;
const IcoCatCup    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h12v6a6 6 0 0 1-6 6h0a6 6 0 0 1-6-6V8Z"/><path d="M17 9h2a2 2 0 0 1 0 4h-2"/><path d="M9 3c-.6.8-.6 1.2 0 2"/><path d="M13 3c-.6.8-.6 1.2 0 2"/></svg>;
const IcoCatMusic  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>;
const IcoCatBeach  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 17c1.5 1.3 3 1.3 4.5 0s3-1.3 4.5 0 3 1.3 4.5 0 3-1.3 4.5 0"/><path d="M12 14V3"/><path d="M12 3c4 0 7 2.5 7 6H5c0-3.5 3-6 7-6Z"/></svg>;
const IcoCatBread  = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14c0-5 3.5-9 8-9s8 4 8 9-3 5-8 5-8 0-8-5Z"/><path d="M9 10c.5-1 1.5-1 2 0"/><path d="M13 10c.5-1 1.5-1 2 0"/></svg>;

// Pool de fotos únicas de placeholder, variadas por categoría y escena
const FALLBACK_PHOTOS = {
  alojamiento: [
    'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=400&q=80',
    'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&q=80',
    'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&q=80',
    'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&q=80',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=400&q=80',
  ],
  salidas: [
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=80',
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=400&q=80',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80',
    'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400&q=80',
    'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=400&q=80',
  ],
  aventura_relax: [
    'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=400&q=80',
    'https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?w=400&q=80',
    'https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=400&q=80',
    'https://images.unsplash.com/photo-1502680390469-be75c86b636f?w=400&q=80',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80',
    'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=400&q=80',
  ],
};

// Agrupación de subcategorías de negocio → ícono representativo
const CATEGORIA_ICON_MAP = {
  // Alojamiento → cama
  'Hotel': IcoCatBed, 'Cabaña': IcoCatBed, 'Departamento': IcoCatBed, 'Casa': IcoCatBed,
  'Hostel': IcoCatBed, 'Dormi': IcoCatBed, 'Domo': IcoCatBed, 'Carpa': IcoCatBed, 'Glamping': IcoCatBed,
  // Gastronomía de plato → tenedor
  'Restaurante': IcoCatFork, 'Parrilla': IcoCatFork, 'Gourmet': IcoCatFork,
  // Panadería → pan
  'Panadería': IcoCatBread,
  // Bebidas/café/dulces → taza
  'Bar': IcoCatCup, 'Café': IcoCatCup, 'Heladería': IcoCatCup,
  // Entretenimiento → nota musical
  'Discoteca': IcoCatMusic, 'Cine y Teatro': IcoCatMusic, 'Show y Recital': IcoCatMusic, 'Centro Cultural': IcoCatMusic,
  // Playa/aventura → sombrilla
  'Balneario': IcoCatBeach,
  // Fallbacks por tipo
  'alojamiento': IcoCatBed, 'salidas': IcoCatFork, 'aventura_relax': IcoCatBeach,
};

// ═══════════════════════════════════════════════════════════
//  "Tipos de cupón" — 9 mecánicas en grilla 3 col
// ═══════════════════════════════════════════════════════════
function TiposCuponSection() {
  const [flash, setFlash] = React.useState(2 * 3600 + 45 * 60 + 11);
  const [hh,    setHh]    = React.useState(4 * 3600 + 12 * 60 + 38);
  React.useEffect(() => {
    const t = setInterval(() => {
      setFlash(s => s > 0 ? s - 1 : 2 * 3600 + 45 * 60 + 11);
      setHh(s    => s > 0 ? s - 1 : 4 * 3600 + 12 * 60 + 38);
    }, 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = s => {
    s = Math.max(0, s);
    return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
      .map(n => String(n).padStart(2, '0')).join(':');
  };

  const CARD_BASE = { background: '#fff', border: `1px solid ${A.line}`, borderRadius: 24, padding: '30px 30px 28px', minHeight: 288, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', transition: 'transform .22s ease, box-shadow .22s ease', cursor: 'default' };
  const CARD_BLUE = { ...CARD_BASE, background: A.primary, border: `1px solid ${A.primary}`, color: '#fff' };
  const CARD_INK  = { ...CARD_BASE, background: A.navy,    border: `1px solid ${A.navy}`,    color: '#fff' };
  const CARD_GRAY = { ...CARD_BASE, background: '#ECEEF3', border: '1px solid transparent' };
  const ICO = (svg, color = A.primary) => <div style={{ color }}>{svg}</div>;
  const Chip = ({ color = A.primary, bg = A.primarySoft, children }) => (
    <div style={{ position: 'absolute', top: 26, right: 26, display: 'inline-flex', alignItems: 'center', gap: 6, background: bg, color, fontSize: 11.5, fontWeight: 600, padding: '6px 11px', borderRadius: 999, letterSpacing: '0.01em', fontFamily: A.font }}>
      {children}
    </div>
  );
  const PulseDot = ({ color = A.primary }) => (
    <span style={{ position: 'relative', width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
  );

  return (
    <section style={{ background: '#fff', borderTop: `1px solid ${A.line}` }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '88px 48px 104px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, marginBottom: 40, flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: A.primary, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>
              Tipos de cupón
            </div>
            <h2 style={{ fontSize: 46, lineHeight: 1.04, letterSpacing: '-0.03em', fontWeight: 700, margin: 0, maxWidth: '18ch', fontFamily: A.font }}>Cada cupón es único en su especie</h2>
            <p style={{ fontSize: 17, lineHeight: 1.5, color: A.muted, margin: '14px 0 0', maxWidth: '54ch' }}>
              Nueve mecánicas distintas, del descuento de siempre a la ruleta de la suerte. Cada socio elige cómo quiere sorprenderte.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', fontSize: 12.5, color: A.muted, fontWeight: 500 }}>
            {[['#2545E6','En vivo'],['#10A36B','Por activarse'],['#FFC93C','Premio']].map(([color, label]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Grid 3 col */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>

          {/* 1 · Normal */}
          <article style={CARD_BASE}>
            {ICO(<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M13 6v12" strokeDasharray="2 3"/></svg>)}
            <div style={{ flex: 1, minHeight: 24 }} />
            <h3 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, margin: 0, fontFamily: A.font }}>Normal</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: A.muted, margin: '9px 0 0', maxWidth: '30ch' }}>El cupón de siempre. Descuento fijo, sin reloj corriendo.</p>
            <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: A.green }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>
              Sin fecha límite
            </div>
          </article>

          {/* 2 · Flash (BLUE) */}
          <article style={CARD_BLUE}>
            <Chip color="#fff" bg="rgba(255,255,255,0.16)">
              <PulseDot color="#fff" />
              <span style={{ fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.02em' }}>{fmt(flash)}</span>
            </Chip>
            {ICO(<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>, '#fff')}
            <div style={{ flex: 1, minHeight: 24 }} />
            <h3 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, margin: 0, fontFamily: A.font }}>Flash</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.72)', margin: '9px 0 0', maxWidth: '30ch' }}>Cuenta regresiva a la vista. Cuando llega a cero, se apaga.</p>
            <div style={{ marginTop: 16, fontSize: 12, fontWeight: 600, opacity: 0.85 }}>Termina hoy · {fmt(flash)}</div>
          </article>

          {/* 3 · Grupal */}
          <article style={CARD_BASE}>
            {ICO(<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2 20c1-3.5 3.5-5.5 7-5.5s6 2 7 5.5"/><circle cx="17" cy="9" r="3"/><path d="M16 14.5c2.6.2 4.7 1.8 6 4.5"/></svg>)}
            <div style={{ flex: 1, minHeight: 24 }} />
            <h3 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, margin: 0, fontFamily: A.font }}>Grupal</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: A.muted, margin: '9px 0 0', maxWidth: '30ch' }}>Se activa al juntar N compradores. La variante <em>trampa</em> arranca con la mitad.</p>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11.5, fontWeight: 600, color: A.ink2, marginBottom: 7 }}>
                <span>12 / 20 personas</span><span style={{ color: A.green }}>⚡ Trampa: 50%</span>
              </div>
              <div style={{ height: 7, borderRadius: 999, background: A.line, overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, width: '60%', borderRadius: 999, background: A.primary }} />
              </div>
            </div>
          </article>

          {/* 4 · Geo Oferta */}
          <article style={CARD_BASE}>
            <Chip color={A.primary} bg={A.primarySoft}>
              <PulseDot color={A.primary} /> En vivo
            </Chip>
            {ICO(<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>)}
            <div style={{ flex: 1, minHeight: 24 }} />
            <h3 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, margin: 0, fontFamily: A.font }}>Geo Oferta</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: A.muted, margin: '9px 0 0', maxWidth: '30ch' }}>Se enciende en tiempo real y manda un push a turistas a la redonda.</p>
            <div style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 600, color: A.ink2 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0v5l1.5 3h-15L6 13V8Z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>
              Push en radio de 0,2 km
            </div>
          </article>

          {/* 5 · Oferta Tormenta */}
          <article style={CARD_BASE}>
            <Chip color="#475569" bg="#F0F1F4">
              <PulseDot color="#475569" /> Lloviendo
            </Chip>
            {ICO(<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 15a4 4 0 0 1 .5-7.97 5.5 5.5 0 0 1 10.6 1.02A3.5 3.5 0 0 1 17 15"/><path d="M9 18l-1.5 3M14 18l-1.5 3M16 17l-1 2"/></svg>, '#475569')}
            <div style={{ flex: 1, minHeight: 24 }} />
            <h3 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, margin: 0, fontFamily: A.font }}>Oferta Tormenta</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: A.muted, margin: '9px 0 0', maxWidth: '30ch' }}>La API del clima la dispara cuando llueve en la localidad del socio.</p>
            <div style={{ marginTop: 16, fontSize: 12, fontWeight: 600, color: A.ink2 }}>Activa hoy en Villa Gesell</div>
          </article>

          {/* 6 · Combos (GRAY) */}
          <article style={CARD_GRAY}>
            {ICO(<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 16.5 9 5 9-5"/></svg>, A.primaryDark)}
            <div style={{ flex: 1, minHeight: 24 }} />
            <h3 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, margin: 0, fontFamily: A.font }}>Combos</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: A.muted, margin: '9px 0 0', maxWidth: '30ch' }}>Premio automático al acumular tipos que se complementan en tu cuponera.</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {['Café', 'Playa'].map(t => <span key={t} style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8, background: A.primarySoft, color: A.primaryDark }}>{t}</span>)}
              <span style={{ fontSize: 11, fontWeight: 600, padding: '5px 10px', borderRadius: 8, background: A.yellow, color: A.ink }}>+ Premio</span>
            </div>
          </article>

          {/* 7 · Happy Hour */}
          <article style={CARD_BASE}>
            <Chip color={A.muted} bg="#F0F1F4">
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: A.muted, display: 'inline-block' }} /> Inactivo
            </Chip>
            {ICO(<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>)}
            <div style={{ flex: 1, minHeight: 24 }} />
            <h3 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, margin: 0, fontFamily: A.font }}>Happy Hour</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: A.muted, margin: '9px 0 0', maxWidth: '30ch' }}>Solo se canjea en su franja. Fuera de hora queda en pausa, con cuenta atrás.</p>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, fontWeight: 600, color: A.ink2 }}>
              <span style={{ background: A.primarySoft, color: A.primary, padding: '4px 9px', borderRadius: 7 }}>18:00 – 20:00</span>
              <span style={{ color: A.muted }}>Abre en <span style={{ fontFamily: 'monospace', color: A.ink }}>{fmt(hh)}</span></span>
            </div>
          </article>

          {/* 8 · Circuitos Cuponear */}
          <article style={CARD_BASE}>
            {ICO(<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="18" r="2.5"/><path d="M5 8.5v3a3.5 3.5 0 0 0 3.5 3.5h6a3.5 3.5 0 0 1 0 0"/><path d="M7.5 6H14a3.5 3.5 0 0 1 3.5 3.5V15"/></svg>)}
            <div style={{ flex: 1, minHeight: 24 }} />
            <h3 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, margin: 0, fontFamily: A.font }}>Circuitos Cuponear</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: A.muted, margin: '9px 0 0', maxWidth: '30ch' }}>Escaneás el QR de varios socios agrupados. Al completar el circuito, cupón especial.</p>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
              {[true,true,true,false,false].map((on, i) => (
                <React.Fragment key={i}>
                  <div style={{ width: 24, height: 24, borderRadius: 8, display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', background: on ? A.primary : A.line, color: on ? '#fff' : A.muted }}>{i+1}</div>
                  {i < 4 && <div style={{ flex: '0 0 14px', height: 2, borderRadius: 2, background: on ? A.primary : A.line }} />}
                </React.Fragment>
              ))}
            </div>
          </article>

          {/* 9 · Ruleta (INK) */}
          <article style={CARD_INK}>
            <Chip color="#fff" bg="rgba(255,255,255,0.16)">
              <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'conic-gradient(#FFC93C 0 25%, #fff 0 50%, #FFC93C 0 75%, #fff 0 100%)', border: '2px solid #fff', display: 'inline-block', animation: 'spin 6s linear infinite', flexShrink: 0 }} />
              ¡Girá!
            </Chip>
            {ICO(<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 5V3M12 13l5-3M12 13l-4 2.5"/><path d="M12 13v8M4.5 13h15"/></svg>, '#fff')}
            <div style={{ flex: 1, minHeight: 24 }} />
            <h3 style={{ fontSize: 23, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.12, margin: 0, fontFamily: A.font }}>Ruleta</h3>
            <p style={{ fontSize: 13.5, lineHeight: 1.5, color: 'rgba(255,255,255,0.72)', margin: '9px 0 0', maxWidth: '30ch' }}>Mini ruleta en la ficha del cupón. El giro define tu descuento y tu precio final.</p>
            <div style={{ marginTop: 16, fontSize: 12, fontWeight: 600, color: A.yellow }}>Suerte: del 10% al 70% OFF</div>
          </article>

        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </section>
  );
}

function SociosTendenciaSection({ accommodations = [], dining = [], aventura = [], onOpenDetail }) {
  // Intercalado round-robin de las tres categorías para garantizar diversidad visual
  const planRank = { PLUS: 2, BASE: 1 };
  const rank = s => (planRank[s.plan] || 0) * 10 + (s.rating || 0);
  const sortedA = accommodations.map(a => ({ ...a, _tipo: 'alojamiento' })).filter(s => s.name).sort((a,b) => rank(b) - rank(a));
  const sortedD = dining.map(d => ({ ...d, _tipo: 'salidas' })).filter(s => s.name).sort((a,b) => rank(b) - rank(a));
  const sortedX = aventura.map(x => ({ ...x, _tipo: 'aventura_relax' })).filter(s => s.name).sort((a,b) => rank(b) - rank(a));
  const socios = [];
  const maxLen = Math.max(sortedA.length, sortedD.length, sortedX.length);
  for (let i = 0; i < maxLen && socios.length < 12; i++) {
    if (sortedA[i]) socios.push(sortedA[i]);
    if (socios.length < 12 && sortedD[i]) socios.push(sortedD[i]);
    if (socios.length < 12 && sortedX[i]) socios.push(sortedX[i]);
  }

  if (!socios.length) return null;

  // Deduplicar fotos: si dos socios comparten la misma URL de imagen, asignar fallback único por categoría
  const DEFAULT_IMG = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e';
  const seenImgs = new Set();
  const fallbackIdx = { alojamiento: 0, salidas: 0, aventura_relax: 0 };
  const sociosDeduped = socios.map(s => {
    const isDefault = !s.image || s.image.startsWith(DEFAULT_IMG);
    const isDup = seenImgs.has(s.image);
    if (isDefault || isDup) {
      const pool = FALLBACK_PHOTOS[s._tipo] || FALLBACK_PHOTOS.alojamiento;
      const idx = fallbackIdx[s._tipo] || 0;
      const img = pool[idx % pool.length];
      fallbackIdx[s._tipo] = idx + 1;
      seenImgs.add(img);
      return { ...s, image: img };
    }
    seenImgs.add(s.image);
    return s;
  });

  return (
    <section style={{ background: 'linear-gradient(30deg, #fff1f6 0%, #d2e9f3 55%, #fff1f6 100%)', padding: '72px 0', borderTop: `1px solid ${A.line}`, borderBottom: `1px solid ${A.line}` }}>
      {/* Header */}
      <div style={{ paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingRight: 56, marginBottom: 32 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: A.primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          <span style={{ color: '#FF5A8A', display: 'flex' }}><IcoFlame /></span> Tendencia en la costa
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', color: A.ink, margin: 0 }}>Socios locales que son tendencia</h2>
        <p style={{ fontSize: 16, color: A.ink2, margin: '10px 0 0', maxWidth: 560, lineHeight: 1.5 }}>
          Los lugares más elegidos de la temporada. Tocá uno y descubrí sus promociones.
        </p>
      </div>

      {/* Scroll horizontal de avatares redondos */}
      <div style={{ position: 'relative' }}>
        <div style={{ overflowX: 'auto', paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingTop: 6, paddingBottom: 12 }} className="no-scrollbar">
          <div style={{ display: 'flex', gap: 26, width: 'max-content', paddingRight: 56 }}>
            {sociosDeduped.map(s => {
              const IconCat = CATEGORIA_ICON_MAP[s.category] || CATEGORIA_ICON_MAP[s._tipo] || IcoCatBed;
              return (
              <button
                key={`${s._tipo}-${s.id}`}
                onClick={() => onOpenDetail?.(s, s._tipo)}
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: 154, flexShrink: 0, fontFamily: A.font }}
                onMouseEnter={e => { const img = e.currentTarget.querySelector('.socio-ring'); if (img) { img.style.transform = 'scale(1.05)'; img.style.boxShadow = '0 16px 36px -12px rgba(37,69,230,0.45)'; } }}
                onMouseLeave={e => { const img = e.currentTarget.querySelector('.socio-ring'); if (img) { img.style.transform = 'scale(1)'; img.style.boxShadow = '0 10px 28px -14px rgba(11,16,32,0.35)'; } }}
              >
                {/* Foto redonda */}
                <div className="socio-ring" style={{ position: 'relative', width: 154, height: 154, borderRadius: '50%', padding: 4, background: '#fff', boxShadow: '0 10px 28px -14px rgba(11,16,32,0.35)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', background: A.line }}>
                    <img src={s.image} alt={s.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 38, height: 38, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: A.primary }}>
                    <IconCat />
                  </div>
                </div>
                {/* Nombre + localidad */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: A.ink, lineHeight: 1.25, marginBottom: 3 }}>{s.name}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, color: A.muted }}>
                    <span style={{ display: 'flex' }}><IcoPin /></span>{s.localidad}
                  </div>
                </div>
              </button>
              );
            })}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 12, width: 120, background: 'linear-gradient(to right, transparent, #fff1f6)', pointerEvents: 'none', zIndex: 2 }} />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
//  Feed "Descubrí salidas y aventura"
// ═══════════════════════════════════════════════════════════
const FEED_W = 280;
const FEED_H = Math.round(FEED_W * 16 / 9); // 498 — proporción 9:16 de los videos

function feedTokens(ahorro = 0) {
  if (ahorro <= 5000)  return 1;
  if (ahorro <= 15000) return 2;
  if (ahorro <= 30000) return 3;
  if (ahorro <= 50000) return 4;
  return 5;
}

const MOCK_VIDEOS = [
  { type: 'video', id: 'v1', negocio: 'Cabañas del Pinar', tipo: 'Alojamiento', localidad: 'Mar de las Pampas', avatar: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=80&fit=crop&q=80', titulo: 'Tres noches en el bosque. Así se vive.', fecha: 'hace 3 días', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=700&fit=crop&q=80', videoSrc: null, creditos: 2 },
  { type: 'video', id: 'v2', negocio: 'Balneario El Faro', tipo: 'Balneario', localidad: 'Villa Gesell', avatar: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=80&fit=crop&q=80', titulo: 'Vista al mar de 180°. Te esperamos este verano.', fecha: 'hace 1 semana', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=700&fit=crop&q=80', videoSrc: null, creditos: 1 },
  { type: 'video', id: 'v3', negocio: 'Spa Costas del Mar', tipo: 'Spa & Bienestar', localidad: 'Las Gaviotas', avatar: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=80&fit=crop&q=80', titulo: 'Un momento para vos. Relajate de verdad.', fecha: 'hace 2 días', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=700&fit=crop&q=80', videoSrc: null, creditos: 2 },
];

const MOCK_POSTS = [
  { type: 'post', id: 'p1', negocio: 'Spa Costas del Mar', localidad: 'Las Gaviotas', avatar: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=80&fit=crop&q=80', image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=600&fit=crop&q=80', texto: '💆 Martes de relax total. Turnos disponibles este finde. ¡Reservá con tu cupón y regalate un momento!', tiempoAgo: 'hace 2 horas', creditos: 2 },
  { type: 'post', id: 'p2', negocio: 'Parador Windy', localidad: 'Villa Gesell', avatar: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=80&fit=crop&q=80', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&fit=crop&q=80', texto: '☀️ Domingo de playa con vista al mar. Mesa disponible. 20% off en tu primera visita con tu cupón.', tiempoAgo: 'hace 5 horas', creditos: 1 },
  { type: 'post', id: 'p3', negocio: 'Cabañas del Pinar', localidad: 'Mar de las Pampas', avatar: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=80&fit=crop&q=80', image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=600&fit=crop&q=80', texto: 'Bienvenida Martina y Diego 🌲 Ya disfrutando del fogón. Esto es Villa Gesell en invierno.', tiempoAgo: 'ayer', creditos: 2 },
];

const MOCK_TESTIMONIALS = [
  { texto: '"Superó todas las expectativas. Volvería sin dudarlo, fue de lo mejor que hice en el viaje."', nombre: 'Lucía', fecha: 'hace 3 días', rating: 5.0 },
  { texto: '"El servicio fue increíble y la atención de primera. Totalmente recomendable para cualquier ocasión."', nombre: 'Martín', fecha: 'hace 1 semana', rating: 4.8 },
  { texto: '"Lugar mágico. Las vistas y el ambiente son únicos. Imposible no enamorarse."', nombre: 'Valentina', fecha: 'hace 5 días', rating: 4.9 },
  { texto: '"Relación calidad-precio inmejorable. Muy buena experiencia, todo estuvo a la altura."', nombre: 'Sebastián', fecha: 'hace 2 semanas', rating: 4.7 },
  { texto: '"Una experiencia que no me esperaba tan buena. Nos fuimos felices y con ganas de volver."', nombre: 'Camila', fecha: 'ayer', rating: 5.0 },
  { texto: '"Atención espectacular. Te hacen sentir como en casa desde el primer momento."', nombre: 'Diego', fecha: 'hace 4 días', rating: 4.6 },
];

function SocioHeaderOverlay({ avatar, negocio, sub }) {
  return (
    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.62) 0%, transparent 100%)', padding: '12px 14px 22px', display: 'flex', alignItems: 'center', gap: 9, zIndex: 2 }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff' }}>
        {avatar
          ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (negocio || '?')[0]}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{negocio}</div>
        {sub && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.72)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function VideoCard({ item }) {
  const videoRef = useRef(null);
  const cardRef  = useRef(null);

  // Mobile: autoplay muted via IntersectionObserver cuando entra al viewport
  useEffect(() => {
    if (!item.videoSrc || !videoRef.current || !cardRef.current) return;
    if (window.innerWidth >= 768) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) videoRef.current?.play().catch(() => {});
      else { videoRef.current?.pause(); if (videoRef.current) videoRef.current.currentTime = 0; }
    }, { threshold: 0.5 });
    obs.observe(cardRef.current);
    return () => obs.disconnect();
  }, [item.videoSrc]);

  const handleMouseEnter = () => {
    if (item.videoSrc && videoRef.current && window.innerWidth >= 768)
      videoRef.current.play().catch(() => {});
  };
  const handleMouseLeave = () => {
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width: FEED_W, height: FEED_H, borderRadius: 20, overflow: 'hidden', flexShrink: 0, position: 'relative', cursor: 'pointer', background: '#1a2a35' }}
    >
      {/* Fondo: video si hay src, imagen de fallback */}
      {item.videoSrc
        ? <video ref={videoRef} src={item.videoSrc} muted loop playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        : item.image && <img src={item.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      }
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.18) 55%, transparent 100%)' }} />

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 3 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(6px)', borderRadius: 999, padding: '4px 10px 4px 8px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>RESEÑA</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <HeartButton id={item.id} />
          <button onClick={e => e.stopPropagation()} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.42)', backdropFilter: 'blur(6px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Play — centrado exacto al card */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 62, height: 62, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
        <svg width="23" height="23" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
      </div>

      {/* Info cluster — fondo (precio a la misma altura que el resto: 17px) */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 16px 17px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.38)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {item.avatar ? <img src={item.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (item.negocio || '?')[0]}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.negocio}</span>
        </div>
        {item.titulo && (
          <p style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
            {item.titulo}
          </p>
        )}
        {item.fecha && (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.52)', letterSpacing: '0.01em' }}>{item.fecha}</span>
        )}
        <div style={{ marginTop: 3, textShadow: '0 1px 6px rgba(0,0,0,0.55)' }}>
          <PrecioCupon tokens_costo={item.creditos} color="#fff" mutedColor="rgba(255,255,255,0.85)" />
        </div>
      </div>
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? A.yellow : '#E7E9EE'} style={{ flexShrink: 0 }}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      ))}
      <span style={{ fontSize: 12, fontWeight: 700, color: A.ink, marginLeft: 2 }}>{rating.toFixed(1)}</span>
      <span style={{ fontSize: 11, color: A.muted }}>/5</span>
    </div>
  );
}

// ─── Reseña — insertada en la card unificada de "Descubrí experiencias reales" ──
function TestimonioSlot({ promo }) {
  const tIdx = (promo.proveedorNombre || '').charCodeAt(0) % MOCK_TESTIMONIALS.length;
  const testim = MOCK_TESTIMONIALS[isNaN(tIdx) ? 0 : tIdx];
  return (
    <div style={{ padding: '13px 16px 2px', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <StarRating rating={testim.rating} />
      <p style={{ fontSize: 12.5, fontStyle: 'italic', fontWeight: 400, color: A.ink2, margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {testim.texto}
      </p>
      <p style={{ fontSize: 11, color: A.muted, margin: 0, fontWeight: 500 }}>
        — {testim.nombre}, {testim.fecha}
      </p>
    </div>
  );
}

function SocialPostCard({ item }) {
  return (
    <div style={{ width: FEED_W, height: FEED_H, borderRadius: 20, overflow: 'hidden', flexShrink: 0, background: '#fff', border: `1px solid ${A.line}`, display: 'flex', flexDirection: 'column', boxShadow: '0 2px 14px -4px rgba(11,16,32,0.09)' }}>
      {/* Header socio — mismo alto que la ficha reseña (avatar 44 + padding 14/16/12) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '14px 16px 12px', flexShrink: 0 }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: A.bg, border: `1px solid ${A.line}` }}>
          {item.avatar && <img src={item.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: A.ink, margin: 0, lineHeight: 1.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.negocio}</p>
          <p style={{ fontSize: 12, color: A.muted, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.localidad}</p>
        </div>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={A.primary} strokeWidth="2.5" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>
      </div>
      {/* Foto — con 20px de aire lateral para que respire */}
      <div style={{ height: 292, flexShrink: 0, padding: '0 20px', overflow: 'hidden' }}>
        {item.image && <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16, display: 'block' }} />}
      </div>
      {/* Caption arriba + precio abajo — mismo ancho que la foto (20px lateral); precio a 17px como la reseña */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px 20px 17px' }}>
        {item.texto && (
          <p style={{ fontSize: 12, color: A.ink, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {item.texto}{' '}
            <span style={{ color: '#9CA3AF', fontWeight: 400 }}>· {item.tiempoAgo}</span>
          </p>
        )}
        <PrecioCupon tokens_costo={item.creditos} />
      </div>
    </div>
  );
}

function FeedSection() {
  // Sólo dos formatos: video y "post" (estilo red social). Se quitó el híbrido oferta+reseña.
  const feed = [];
  const vids  = [...MOCK_VIDEOS];
  const posts = [...MOCK_POSTS];
  let slot = 0;
  while (vids.length || posts.length) {
    if (slot % 2 === 0) feed.push(vids.length ? vids.shift() : posts.shift());
    else                feed.push(posts.length ? posts.shift() : vids.shift());
    slot++;
  }

  return (
    <section id="feed-ofertas" style={{ background: A.navy, padding: '72px 0' }}>
      <div style={{ paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingRight: 56, marginBottom: 36 }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#A9B6FF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
          <IcoBolt /> RESEÑAS DE SOCIOS Y VIAJEROS
        </div>
        <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', color: '#fff', margin: '0 0 8px' }}>Descubrí experiencias reales</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Ofertas y momentos inolvidables, contado por quienes te van a acompañar en este viaje.</p>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ overflowX: 'auto', paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingBottom: 44 }} className="no-scrollbar">
          <div style={{ display: 'flex', gap: 24, width: 'max-content', paddingRight: 56 }}>
            {feed.map((item) => {
              if (item.type === 'video') return <VideoCard key={item.id} item={item} />;
              if (item.type === 'post')  return <SocialPostCard key={item.id} item={item} />;
              return null;
            })}
          </div>
        </div>
        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 10, width: 120, background: `linear-gradient(to right, transparent, ${A.navy})`, pointerEvents: 'none', zIndex: 2 }} />
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
//  ¡Alquilá por menos!
// ═══════════════════════════════════════════════════════════
const TIPO_FILTER_MAP = {
  hoteles: ['Hotel', 'Hostel'],
  casas:   ['Casa', 'Cabaña'],
  aparts:  ['Departamento'],
  camping: ['Dormi'],
};

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
  const { addCupon } = useCuponera();

  useEffect(() => { setVisibleCount(10); scrollRef.current?.scrollTo({ left: 0 }); }, [filtroTipo]);

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
    <section data-nav-section={navSection} style={{ background: A.bg, padding: '57px 0', borderTop: conBordeSuperior ? `1px solid ${A.line}` : 'none', borderBottom: `1px solid ${A.line}` }}>
      <style>{`@keyframes skelPulse { 0%, 100% { opacity: 0.9 } 50% { opacity: 0.3 } }`}</style>
      {/* Header */}
      <div style={{ paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingRight: 56, marginBottom: 28 }}>
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
          style={{ overflowX: 'auto', paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingBottom: 44 }}
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
                {alojMostrados.map(promo => (
                  <div key={promo.id} style={{ width: 340, flexShrink: 0, display: 'flex' }}>
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
        <div style={{ maxWidth: 1328, margin: '0 auto', padding: '8px 40px 0', display: 'flex', justifyContent: 'center' }}>
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
//  CUPONERAS PREDISEÑADAS
// ─── Card de una cuponera (portada + beneficio + CTA) ───────
function CuponeraCard({ cuponera, onVerCuponera }) {
  const portada  = cuponera.images?.[0] || PHOTOS.cabin;
  const nCupones = cuponera.cupones?.length || 0;
  const BenIcon  = getBeneficioIcon(cuponera.beneficioIcono);
  // Precio total de la cuponera (con el descuento del beneficio, si aplica).
  const precioBase = (cuponera.cupones || []).reduce((s, c) => s + (Number(c.precio_activacion) || 0), 0);
  const { precio: precioCuponera } = aplicarBeneficioCuponera({
    tipo: cuponera.beneficioTipo, valor: cuponera.beneficioValor, puntosBase: 0, precioBase,
  });

  return (
    <button
      onClick={onVerCuponera}
      style={{
        position: 'relative', borderRadius: 24, overflow: 'hidden', minHeight: 520,
        display: 'flex', flexDirection: 'column',
        border: 'none', background: 'none', padding: 0, cursor: 'pointer',
        transition: 'transform .15s', width: '100%',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.98)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <PortadaCuponera cuponera={{ ...cuponera, images: [portada] }} alt={cuponera.title} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(5,10,25,0.95) 0%, rgba(5,10,25,0.35) 52%, rgba(5,10,25,0.5) 100%)' }} />

      {/* Beneficio adicional (círculo amarillo + texto amarillo) */}
      {cuponera.beneficioAdicional && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 11, padding: '20px 22px 0' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: A.yellow, display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}>
            <BenIcon size={21} color={A.navy} strokeWidth={2.4} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: A.yellow, lineHeight: 1.25 }}>{cuponera.beneficioAdicional}</span>
        </div>
      )}

      {/* Contenido inferior */}
      <div style={{ position: 'relative', marginTop: 'auto', padding: '0 26px 26px', textAlign: 'left' }}>
        <h3 style={{ fontSize: 30, fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.1, margin: '0 0 12px' }}>{cuponera.title}</h3>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', lineHeight: 1.5, margin: '0 0 22px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{cuponera.subtitle}</p>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 15, color: '#fff', fontSize: 15, fontWeight: 600 }}>
          <div style={{ position: 'relative', width: 40, height: 33 }}>
            <img src="/ico-disc.svg" alt="" style={{ width: 33, height: 33, position: 'absolute', top: 0, left: 0, zIndex: 2 }} />
            <img src="/ico-disc.svg" alt="" style={{ width: 33, height: 33, position: 'absolute', top: 0, left: 18, zIndex: 1, opacity: 0.55 }} />
          </div>
          {nCupones} cupones{precioCuponera > 0 ? `. Valor total: $${Math.round(precioCuponera).toLocaleString('es-AR')}` : ''}
        </div>
      </div>
    </button>
  );
}

function CuponerasSection({ onOpenPack, onVerPacks }) {
  const [modal, setModal] = useState(null); // { cuponera, startIndex }
  const [cuponeras, setCuponeras] = useState(null); // null = cargando

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { getCuponeras } = await import('../lib/datos');
      const data = await getCuponeras();
      if (vivo) setCuponeras(data.slice(0, 6));
    })();
    return () => { vivo = false; };
  }, []);

  // No renderizar la sección si no hay cuponeras cargadas en la DB.
  if (cuponeras !== null && cuponeras.length === 0) return null;

  return (
    <section data-nav-section="packs" style={{ background: '#fff', position: 'relative' }}>
      <style>{`
        @media (max-width: 980px) { .cuponeras-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (max-width: 640px) { .cuponeras-grid { grid-template-columns: 1fr !important; } }
        @keyframes cupSkel { 0%,100% { opacity: .35; } 50% { opacity: .12; } }
      `}</style>

      {/* Banda azul superior: cubre el header y baja hasta ~1/3 de la 1ª fila de cards */}
      <div style={{ background: A.navy, color: '#fff', paddingTop: 88, paddingBottom: 220 }}>
        <div style={{ paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingRight: 'max(40px, calc((100vw - 1328px) / 2 + 40px))' }}>

        {/* Header */}
        <div style={{ marginBottom: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'rgba(255,201,60,0.16)', color: A.yellow, borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18 }}>
            <IcoBolt /> Viajá con packs de cupones
          </div>
          <h2 style={{ fontSize: 'clamp(34px, 3vw, 52px)', fontWeight: 700, lineHeight: 1.05, margin: '0 0 10px' }}>
            Packs{' '}
            <button
              onClick={onVerPacks}
              style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', color: A.yellow, cursor: 'pointer', textDecoration: 'none', transition: 'opacity .15s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.78'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              todo incluído
            </button>
          </h2>
          <p style={{ fontSize: 21, fontStyle: 'italic', fontWeight: 400, color: 'rgba(255,255,255,0.8)', lineHeight: 1.45, letterSpacing: '-0.01em', margin: '18px 0 16px', maxWidth: 1120 }}>
            Ahorrá tiempo y dinero con cuponeras curadas por la plataforma. Llevate un pack cerrado de experiencias que ya incluyen el alojamiento.
          </p>
        </div>{/* /header */}
        </div>{/* /inner padding banda azul */}
      </div>{/* /banda azul */}

      {/* Grid — subido para que el tercio superior de las cards quede sobre el azul */}
      <div style={{ paddingLeft: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', paddingRight: 'max(40px, calc((100vw - 1328px) / 2 + 40px))', marginTop: -170, paddingBottom: 96, position: 'relative', zIndex: 1 }}>
        <div className="cuponeras-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {cuponeras === null
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} style={{ borderRadius: 24, aspectRatio: '1/1', background: 'rgba(255,255,255,0.08)', animation: 'cupSkel 1.4s ease-in-out infinite' }} />
              ))
            : cuponeras.map(c => (
                <CuponeraCard
                  key={c.id}
                  cuponera={c}
                  onVerCuponera={() => setModal({ cuponera: c, startIndex: 0 })}
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
        // MOCKUP: probando el rediseño a pantalla completa (CuponModalMock).
        // Para volver al original, cambiar CuponModalMock por CuponModal.
        <CuponModalMock
          cuponera={modal.cuponera}
          startIndex={modal.startIndex}
          onClose={() => setModal(null)}
        />
      )}
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
//  GASTRONOMÍA
// ═══════════════════════════════════════════════════════════
const GASTRO_FALLBACKS = [
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=400&q=60',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&q=60',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=60',
  'https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?auto=format&fit=crop&w=400&q=60',
];

function GastronomySection({ dining, onOpenDetail, onVerTodas }) {
  // #2 a #6 en la grilla de la derecha; el resto vive detrás de "Ver todo el ranking".
  const negociosGrid = dining.slice(0, 5);

  return (
    <section id="salidas" style={{ background: '#fff', padding: '56px 0', borderTop: `1px solid ${A.line}` }}>
      <div style={{ maxWidth: 1328, margin: '0 auto', padding: '0 40px' }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: A.primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
            <IcoBolt /> GASTRONOMÍA LOCAL
          </div>
          <h2 style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.025em', color: A.ink, margin: 0 }}>
            Top <em style={{ fontStyle: 'normal', color: A.primary }}>#10</em> donde comer y beber
          </h2>
        </div>

        {/* Layout: #1 grande a la izquierda + grilla 3×2 (5 negocios + "ver todo") a la derecha —
            7 miniaturas en total, mucho menos alto que la columna apilada de antes. */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 14, alignItems: 'stretch' }}>

          {/* ── #1 El Nido Bistró ── */}
          <div
            onClick={() => onOpenDetail && onOpenDetail({ id: 'nido', name: 'El Nido Bistró', localidad: 'Mar de las Pampas', image: '/nido.jpg', category: 'Restaurante' }, 'salidas')}
            style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', minHeight: 320 }}
            onMouseEnter={e => { e.currentTarget.querySelector('img').style.transform = 'scale(1.04)'; }}
            onMouseLeave={e => { e.currentTarget.querySelector('img').style.transform = 'scale(1)'; }}
          >
            {/* Foto de fondo full */}
            <img
              src="/nido.jpg"
              alt="El Nido Bistró — Mar de las Pampas"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
            />
            {/* Gradiente inferior */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,12,24,0.88) 0%, rgba(8,12,24,0.3) 55%, transparent 80%)' }} />

            {/* Info abajo */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '22px 24px' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Mar de las Pampas
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <div style={{ background: A.yellow, color: A.navy, width: 42, height: 42, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1, flexShrink: 0, boxShadow: '0 3px 12px rgba(255,201,60,0.45)' }}>
                  #1
                </div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  El Nido Bistró
                </div>
              </div>
              <div style={{ fontSize: 13.5, fontStyle: 'italic', color: 'rgba(255,255,255,0.82)', lineHeight: 1.4, marginBottom: 14 }}>
                Cocina inspirada en el bosque y el mar. El restaurante de la chef Laura Casentini.
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: A.primary, color: '#fff', borderRadius: 999, padding: '9px 20px', fontSize: 13, fontWeight: 700 }}>
                Ver restaurante <IcoArrowR />
              </div>
            </div>
          </div>

          {/* ── Grilla derecha: #2 a #6 + "Ver todo el ranking" (3 columnas × 2 filas) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: 10 }}>

            {negociosGrid.map((n, i) => (
              <div key={n.id}
                onClick={() => onOpenDetail(n, 'salidas')}
                style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.querySelector('img').style.transform = 'scale(1.06)'; }}
                onMouseLeave={e => { e.currentTarget.querySelector('img').style.transform = 'scale(1)'; }}
              >
                <img src={n.image} alt={n.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,12,24,0.75) 0%, transparent 65%)' }} />
                <div style={{ position: 'absolute', bottom: 8, left: 9, right: 9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ background: A.yellow, color: A.navy, width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, flexShrink: 0, letterSpacing: '-0.02em' }}>#{i + 2}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#fff', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Última celda: "Ver todo el ranking" — no es un negocio */}
            <div
              onClick={onVerTodas}
              style={{ position: 'relative', borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
            >
              {/* Grid de miniaturas desenfocadas */}
              <div style={{ position: 'absolute', inset: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 2 }}>
                {GASTRO_FALLBACKS.map((src, i) => (
                  <img key={i} src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(3px) brightness(0.5)', display: 'block' }} />
                ))}
              </div>
              {/* Overlay claro */}
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.88)' }} />
              {/* Texto centrado */}
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'rgb(41, 41, 41)', letterSpacing: '-0.01em', lineHeight: 1.25 }}>Ver todo<br/>el ranking</div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
