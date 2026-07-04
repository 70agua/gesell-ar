// ============================================================
//  src/views/OfertasView.jsx — Listado de todas las ofertas
//  Diseño: mismo sistema Aire que MarketplaceView
// ============================================================
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { secondsUntil } from '../lib/ofertas';
import { getPromos }    from '../lib/datos';
import { ALL_PROMOS }   from '../data/mockData';
import { useCuponera } from '../lib/cuponera';
import HeartButton     from '../components/HeartButton';
import InfoTooltip, { CreditTooltip } from '../components/InfoTooltip';
import { useMostrarCreditos } from '../lib/sesion';

// ─── Tokens ──────────────────────────────────────────────────
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
  font:        "'Inter', system-ui, sans-serif",
};

const LOCALIDADES = ['Villa Gesell', 'Mar de las Pampas', 'Las Gaviotas', 'Mar Azul', 'Chacras del Mar', 'El Salvaje'];

const TITULOS = {
  alojamiento: [
    '¡Alquilá por menos! Es la que va',
    'No escatimes, acá conseguís el mejor precio',
    'Más barato que el colchón que tenés en casa y nunca cambiaste',
    'Llegá, tirate al mar y desconectate de todo',
    '¡Un buen descuento no se le niega a nadie!',
    'Pedí ese descuento que te merecés (no se lo contamos a tu vecino)',
    'Más estadía y menos "cuánto me alcanza"',
    'El mejor precio para quedarte... y quedarte un día más!',
  ],
  salidas: [
    'Salí y ahorrá (pero no en diversión)',
    'Esa serie mala puede esperar, salí a pasarla bien!',
    'Salís con cupones, volvés con historias para contar',
    'Soltá la culpa, salí que te lo merecés',
    '¡Cupones, cupones, calentitos los cupones!',
    'Comé, bailá y ahorrá. En ese orden',
    'Tu billetera también quiere salir!',
    'La vida es demasiado corta, come el postre primero',
  ],
  aventura_relax: [
    '¡Viví la experiencia, pagá menos!',
    'Usar gafas de sol no quita que uses bronceador. Sino te podés convertir en mapache',
    'Relax sin gastar de más, ni en ansiolíticos',
    'Explorá y ahorrá',
    'Tu próxima aventura tiene cupón y todo',
    'Descubrí más por menos (el mar sigue siendo gratis)',
    'La experiencia vale, la cuenta no tanto',
    'Transpirá la camiseta, no la tarjeta',
  ],
  default: [
    '¡Alquilá por menos! Es la que va',
    'Salí y ahorrá (pero no en diversión)',
    '¡Viví la experiencia, pagá menos!',
    '¡Un buen descuento no se le niega a nadie!',
  ],
};

// Elige un título de la lista rotando por día (estable durante la sesión)
const _tituloIdx = Math.floor(Date.now() / 86400000); // cambia cada día
function getTitulo(cat) {
  const lista = TITULOS[cat] || TITULOS.default;
  return lista[_tituloIdx % lista.length];
}

// Subcategorías primarias (tipo de negocio agrupado)
const SUBCATS_PRIMARY = {
  alojamiento: [
    { label: 'Hoteles',          tipos: ['Hotel'] },
    { label: 'Cabañas',          tipos: ['Cabaña'] },
    { label: 'Casas',            tipos: ['Casa'] },
    { label: 'Departamentos',    tipos: ['Departamento'] },
    { label: 'Dormis / Camping', tipos: ['Dormi', 'Carpa', 'Hostel', 'Domo', 'Glamping'] },
  ],
  salidas: [
    { label: 'Restaurantes',   tipos: ['Restaurante', 'Bodegón', 'Gourmet', 'Parrilla'] },
    { label: 'Bares',          tipos: ['Bar'] },
    { label: 'Cafés & Dulces', tipos: ['Café', 'Pastelería', 'Heladería', 'Panadería'] },
    { label: 'Balnearios',     tipos: ['Balneario'] },
    { label: 'Espectáculos',   tipos: ['Discoteca', 'Cine y Teatro', 'Show y Recital', 'Centro Cultural'] },
  ],
  aventura_relax: [
    { label: 'Spa & Bienestar',    tipos: ['Spa', 'Masajes a domicilio', 'Yoga / Bienestar'] },
    { label: 'Deportes acuáticos', tipos: ['Deportes acuáticos', 'Kitesurf'] },
    { label: 'Excursiones',        tipos: ['Excursion', 'Tour fotográfico', 'Cabalgatas', 'Senderismo'] },
    { label: 'Pesca deportiva',    tipos: ['Pesca deportiva'] },
    { label: 'Espectáculos',       tipos: ['Espectáculos'] },
  ],
};

// Subcategorías secundarias (servicios / atributos del negocio via tags)
const SUBCATS_SECONDARY = {
  alojamiento: [
    { label: 'Cerca del mar',   tag: 'cerca-del-mar' },
    { label: 'Piscina',         tag: 'piscina' },
    { label: 'Desayuno',        tag: 'desayuno' },
    { label: 'Spa',             tag: 'spa' },
    { label: 'Acepta mascotas', tag: 'mascotas' },
  ],
  salidas: [
    { label: 'Al aire libre',      tag: 'aire-libre' },
    { label: 'Con música en vivo', tag: 'musica-en-vivo' },
    { label: 'Para grupos',        tag: 'grupos' },
    { label: 'Menú vegano',        tag: 'vegano' },
    { label: 'Con reserva',        tag: 'reserva' },
  ],
  aventura_relax: [
    { label: 'Para niños',    tag: 'ninos' },
    { label: 'En grupo',      tag: 'grupos' },
    { label: 'Con instructor',tag: 'instructor' },
    { label: 'Al atardecer',  tag: 'atardecer' },
    { label: 'Accesible',     tag: 'accesible' },
  ],
};

// ─── SVG Icons ───────────────────────────────────────────────
const IcoArrowL  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
const IcoBolt    = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z"/></svg>;
const IcoTicket  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M13 6v12" strokeDasharray="2 3"/></svg>;
const IcoSearch  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;

function CoinSVG({ size = 13 }) {
  return <img src="/cuponera-coin.svg" alt="crédito" width={size} height={size} style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0 }}/>;
}

// ─── CheckRow (sidebar) — toda la fila es clickeable ─────────
function CheckRow({ label, checked, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', padding: '5px 0', userSelect: 'none' }}
    >
      <div style={{
        width: 17, height: 17, borderRadius: 5, flexShrink: 0,
        border: `2px solid ${checked ? A.primary : A.line}`,
        background: checked ? A.primary : '#fff',
        display: 'grid', placeItems: 'center', transition: 'all 0.15s',
      }}>
        {checked && <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </div>
      <span style={{ fontSize: 13, color: checked ? A.ink : A.ink2, fontWeight: checked ? 600 : 400, fontFamily: A.font }}>{label}</span>
    </div>
  );
}


const IcoPin = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>;

// ─── Oferta Card (misma estética que Home) ───────────────────
function OfertaCard({ promo, onAddToCuponera, onOpenOferta }) {
  const mostrarCreditos = useMostrarCreditos();
  const esFlash = promo.offerType === 'Flash';
  const [secs, setSecs] = useState(() => esFlash ? secondsUntil(promo.fechaFinFlash) : 0);

  useEffect(() => {
    if (!esFlash) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [esFlash]);

  const pad = n => String(n).padStart(2, '0');
  const th = Math.floor(secs / 3600);
  const tm = Math.floor((secs % 3600) / 60);
  const ts = secs % 60;

  return (
    <div
      onClick={() => onOpenOferta && onOpenOferta(promo)}
      style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s', fontFamily: A.font }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 16px 48px -16px rgba(11,16,32,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Imagen 4:3 */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden' }}>
        <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.75) 0%, rgba(11,16,32,0.15) 55%, transparent 100%)' }} />

        {/* Pill FLASH + timer — top */}
        {esFlash && secs > 0 && (
          <div style={{ position: 'absolute', top: 10, left: 10, right: 10, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ height: '100%', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EF4444', borderRadius: 999, padding: '0 10px 0 9px' }}>
              <span style={{ fontSize: 10, fontWeight: 500, color: '#fff', letterSpacing: '0.05em' }}>OFERTA</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: A.yellow, fontStyle: 'italic', letterSpacing: '0.05em' }}>FLASH</span>
              <span style={{ color: A.yellow, display: 'flex', alignItems: 'center' }}><IcoBolt /></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: '100%' }}>
              {[th, tm, ts].map((v, i) => (
                <React.Fragment key={i}>
                  <div style={{ background: '#fff', color: A.ink, borderRadius: 6, fontSize: 13, fontWeight: 800, height: '100%', minWidth: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}>
                    {i === 0 ? v : pad(v)}
                  </div>
                  {i < 2 && <span style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 900, fontSize: 14 }}>:</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Exclusivo huéspedes — top (sin flash) */}
        {promo.exclusivoHuespedes && (
          <>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 56, background: 'linear-gradient(to bottom, rgba(5,10,25,0.72) 0%, transparent 100%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M20 12v10H4V12"/><rect x="2" y="7" width="20" height="5" rx="1"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 500, color: '#fff', lineHeight: 1.3 }}>Exclusivo huéspedes {promo.exclusivoHuespedes}</span>
            </div>
          </>
        )}

        {/* Heart — top right */}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <HeartButton id={promo.id} />
        </div>

        {/* Badge + título — abajo */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px 13px' }}>
          <div style={{ fontSize: (promo.badge?.length || 0) > 5 ? 28 : 38, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1 }}>{promo.badge}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.88)', lineHeight: 1.35, marginTop: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{promo.title}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '11px 13px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Proveedor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: A.bg, border: `1px solid ${A.line}`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {promo.proveedorImage
              ? <img src={promo.proveedorImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 12, fontWeight: 700, color: A.muted }}>{(promo.proveedorNombre || '?')[0]}</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: A.ink, lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()}
            </div>
            {promo.negocioLocalidad && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: A.primary, marginTop: 2 }}>
                <IcoPin /> {promo.negocioLocalidad}
              </div>
            )}
          </div>
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); onOpenOferta && onOpenOferta(promo); }}
            style={{ width: '100%', background: '#fff', color: A.ink, border: `1px solid ${A.line}`, borderRadius: 11, padding: '9px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'border-color .13s, color .13s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.color = A.primary; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.color = A.ink; }}
          >
            Ver oferta
          </button>
          <button
            onClick={e => { e.stopPropagation(); onAddToCuponera && onAddToCuponera(promo); }}
            style={{ width: '100%', background: A.primary, color: '#fff', border: 'none', borderRadius: 11, padding: '9px 0', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = A.primaryDark}
            onMouseLeave={e => e.currentTarget.style.background = A.primary}
          >
            <IcoTicket /> Agregar a cuponera
          </button>
        </div>

        {/* Info rows */}
        {promo.tokens_costo != null && (
          promo.tokens_costo === 0
            ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0FDF4', borderRadius: 9, padding: '8px 11px', border: '1px solid #BBF7D0', flexShrink: 0 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10A36B" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4.5 4.5L20 6"/></svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#10A36B' }}>Cupón GRATIS</span>
              </div>
            : <div style={{ borderTop: `1px solid ${A.line}`, paddingTop: 9, display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: A.muted }}>Lo activás con</span>
                  {mostrarCreditos ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CoinSVG size={13} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: A.ink }}>{promo.tokens_costo} crédito{promo.tokens_costo !== 1 ? 's' : ''}</span>
                      <CreditTooltip />
                      <span style={{ fontSize: 10, fontWeight: 600, color: A.muted }}>(${(promo.tokens_costo * 2000).toLocaleString('es-AR')} + IVA)</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 800, color: A.ink }}>${(promo.tokens_costo * 2000).toLocaleString('es-AR')} + IVA</span>
                  )}
                </div>
              </div>
        )}
      </div>
    </div>
  );
}

// ─── Sección colapsable del sidebar ──────────────────────────
function SideSection({ title, children, onLimpiar, bold }) {
  return (
    <div style={{ borderBottom: `1px solid ${A.line}`, paddingBottom: 16, marginBottom: 16 }}>
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0 10px' }}>
          {bold
            ? <span style={{ fontSize: 14, fontWeight: 700, color: A.ink }}>{title}</span>
            : <span style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</span>
          }
          {onLimpiar && (
            <button onClick={onLimpiar} style={{ background: 'none', border: 'none', fontSize: 11, color: A.primary, cursor: 'pointer', fontWeight: 600, fontFamily: A.font, padding: 0 }}>
              Limpiar
            </button>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}

// Pill de selección única para categorías
function CategoriaPill({ label, checked, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 999, cursor: 'pointer',
        fontFamily: A.font, fontSize: 13.5, fontWeight: 500,
        border: `1.5px solid ${checked ? '#38f' : 'transparent'}`,
        background: checked ? '#fff' : '#def',
        color: checked ? '#3d4255' : '#777',
        transition: 'all 0.15s',
        whiteSpace: 'nowrap',
        boxShadow: checked ? '0 1px 4px rgba(11,16,32,0.08)' : 'none',
      }}
    >
      {label}
      {checked && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3d4255" strokeWidth="2.5" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12"/>
        </svg>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
//  VISTA PRINCIPAL
// ═══════════════════════════════════════════════════════════
function useWindowWidth() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return w;
}

export default function OfertasView({ onBack, onOpenOferta, initialCategoria = null, initialLocalidades = [] }) {
  const [promos,      setPromos]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [busqueda,    setBusqueda]    = useState('');
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [shownCount,  setShownCount]  = useState(10);
  const sentinelRef = useRef(null);
  const { addCupon }                  = useCuponera();
  const winW    = useWindowWidth();
  const isMobile = winW < 768;

  // Filtros — pre-activados si viene con initialCategoria
  const [tipoAloj,    setTipoAloj]    = useState(initialCategoria === 'alojamiento');
  const [tipoSalidas,  setTipoGastro]  = useState(initialCategoria === 'salidas');
  const [tipoExp,     setTipoExp]     = useState(initialCategoria === 'aventura_relax');
  const [soloFlash,       setSoloFlash]       = useState(false);
  const [localidades,     setLocalidades]     = useState(initialLocalidades);
  const [subcatPrimaria,  setSubcatPrimaria]  = useState(new Set());
  const [subcatSecundaria,setSubcatSecundaria]= useState(new Set());

  useEffect(() => {
    async function cargar() {
      setLoading(true);
      const { supabase } = await import('../lib/supabase');
      const now = new Date().toISOString();

      const { data } = await supabase
        .from('promociones')
        .select('*, negocios(nombre, tipo, ubicacion, localidad, zona, foto_perfil, imagen_url)')
        .eq('activa', true)
        .eq('aprobada', true)
        .order('creado_en', { ascending: false });

      const TIPOS_ALOJ   = new Set(['Hotel', 'Cabaña', 'Departamento', 'Casa', 'Hostel', 'Dormi']);
      const TIPOS_GASTRO = new Set(['Restaurante', 'Bar', 'Café', 'Balneario', 'Gourmet', 'Pastelería', 'Parrilla', 'Heladería', 'Bodegón', 'Café & Dulces']);
      const catDe = (tipo, nid) => {
        if (!tipo && nid)        return 'alojamiento';
        if (!tipo)               return 'aventura_relax';
        if (TIPOS_ALOJ.has(tipo))   return 'alojamiento';
        if (TIPOS_GASTRO.has(tipo)) return 'salidas';
        return nid ? 'alojamiento' : 'aventura_relax';
      };

      const reales = (data || [])
        .map(p => ({
          id:               p.id,
          negocioId:        p.negocio_id,
          offerType:        p.offer_type || 'Normal',
          title:            p.titulo,
          subtitle:         p.subtitulo || p.negocios?.nombre || '',
          badge:            p.badge || 'Promo',
          image:            p.imagen_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
          fechaFinFlash:    p.fecha_fin_flash,
          tokens_costo:     p.tokens_costo,
          ahorroEstimado:   p.ahorro_estimado || 0,
          categoria:        catDe(p.negocios?.tipo, p.negocio_id),
          negocioTipo:      p.negocios?.tipo || '',
          negocioTags:      p.negocios?.tags || [],
          proveedorNombre:  p.negocios?.nombre || '',
          negocioLocalidad: p.negocios?.localidad || p.negocios?.ubicacion || '',
          negocioZone:      p.negocios?.zona || '',
          esReal:           true,
        }))
        // Flash solo si tiene fecha futura válida; sin fecha = se descarta igual
        .filter(p => p.offerType !== 'Flash' || (p.fechaFinFlash && new Date(p.fechaFinFlash) > new Date()))
        // Ocultar ofertas de regalo (tokens_costo = 0) de las vistas regulares
        .filter(p => p.tokens_costo !== 0);

      const { PROMO_META } = await import('../data/mockData');
      const idsReales = new Set(reales.map(p => String(p.id)));
      const mockExtra = ALL_PROMOS
        .filter(p => !idsReales.has(String(p.id)))
        .filter(p => p.offerType !== 'Flash' || (p.fechaFinFlash && new Date(p.fechaFinFlash) > new Date()))
        .filter(p => p.tokens_costo !== 0)
        .map(p => ({ ...p, ...(PROMO_META[p.id] || {}) }));

      setPromos([...reales, ...mockExtra]);
      setLoading(false);
    }
    cargar();
  }, []);

  // ── Categoría activa (single-select) ─────────────────────────
  const catActiva = tipoAloj ? 'alojamiento' : tipoSalidas ? 'salidas' : tipoExp ? 'aventura_relax' : null;

  const seleccionarCategoria = (cat) => {
    const ya = catActiva === cat;
    setTipoAloj(cat === 'alojamiento' && !ya);
    setTipoGastro(cat === 'salidas' && !ya);
    setTipoExp(cat === 'aventura_relax' && !ya);
    setSubcatPrimaria(new Set());
    setSubcatSecundaria(new Set());
  };

  // ── Destinos con suficientes ofertas (≥4) ────────────────────
  const conteoPorDestino = {};
  promos.forEach(p => {
    const loc = p.negocioLocalidad;
    if (loc) conteoPorDestino[loc] = (conteoPorDestino[loc] || 0) + 1;
  });
  const destinosValidos = LOCALIDADES.filter(l => (conteoPorDestino[l] || 0) >= 4);
  const hayOtrosDestinos = LOCALIDADES.some(l => {
    const n = conteoPorDestino[l] || 0;
    return n > 0 && n < 4;
  });

  // ── Tipos válidos según subcatPrimaria seleccionada ──────────
  const tiposValidos = (() => {
    if (!catActiva || subcatPrimaria.size === 0) return null;
    const set = new Set();
    (SUBCATS_PRIMARY[catActiva] || []).forEach(sc => {
      if (subcatPrimaria.has(sc.label)) sc.tipos.forEach(t => set.add(t));
    });
    return set;
  })();

  // Tags válidos según subcatSecundaria seleccionada
  const tagsRequeridos = (() => {
    if (!catActiva || subcatSecundaria.size === 0) return null;
    return (SUBCATS_SECONDARY[catActiva] || [])
      .filter(sc => subcatSecundaria.has(sc.label))
      .map(sc => sc.tag);
  })();

  // ── Aplicar filtros ─────────────────────────────────────────
  const hayTipo = tipoAloj || tipoSalidas || tipoExp;
  const visibles = promos.filter(p => {
    if (busqueda && !p.title.toLowerCase().includes(busqueda.toLowerCase()) &&
        !(p.proveedorNombre || p.subtitle || '').toLowerCase().includes(busqueda.toLowerCase())) return false;
    if (hayTipo) {
      const ok = (tipoAloj && p.categoria === 'alojamiento') ||
                 (tipoSalidas && p.categoria === 'salidas') ||
                 (tipoExp && p.categoria === 'aventura_relax');
      if (!ok) return false;
    }
    if (tiposValidos && !tiposValidos.has(p.negocioTipo)) return false;
    if (tagsRequeridos && !tagsRequeridos.some(t => (p.negocioTags || []).includes(t))) return false;
    if (soloFlash && p.offerType !== 'Flash') return false;
    if (localidades.length > 0) {
      const enDestino = localidades.filter(l => l !== '__otros__').includes(p.negocioLocalidad);
      const esOtro = localidades.includes('__otros__') && !destinosValidos.includes(p.negocioLocalidad);
      if (!enDestino && !esOtro) return false;
    }
    return true;
  });

  const hayOtrosFiltros = subcatPrimaria.size > 0 || subcatSecundaria.size > 0;
  const limpiarFiltros = () => {
    setTipoAloj(false); setTipoGastro(false); setTipoExp(false);
    setSoloFlash(false); setLocalidades([]);
    setSubcatPrimaria(new Set()); setSubcatSecundaria(new Set());
    setBusqueda('');
  };
  const hayFiltros = hayTipo || soloFlash || localidades.length > 0 || hayOtrosFiltros || busqueda;

  // Infinite scroll
  const filterKey = `${busqueda}|${tipoAloj}|${tipoSalidas}|${tipoExp}|${soloFlash}|${localidades.join()}|${[...subcatPrimaria].join()}|${[...subcatSecundaria].join()}`;
  useEffect(() => { setShownCount(10); }, [filterKey]);
  useEffect(() => {
    if (!sentinelRef.current) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setShownCount(n => n + 10);
    }, { rootMargin: '200px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [sentinelRef.current]);

  const visiblesPaged = visibles.slice(0, shownCount);
  const hayMas = shownCount < visibles.length;

  // Cols responsive
  const cols = isMobile ? 1 : winW < 1024 ? 2 : 3;

  const SidebarContent = (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', borderBottom: `1px solid ${A.line}` }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: A.ink }}>Filtros</span>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hayFiltros && <button onClick={limpiarFiltros} style={{ background: 'none', border: 'none', fontSize: 12, color: A.primary, cursor: 'pointer', fontWeight: 600, fontFamily: A.font }}>Limpiar filtros</button>}
          {isMobile && <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: A.muted, display: 'flex', padding: 4 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>}
        </div>
      </div>
      <div style={{ padding: '16px 20px 8px' }}>

        {/* ── BENEFICIOS EN (categoría, single-select pills) ── */}
        <SideSection title="Beneficios en">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            <CategoriaPill label="Alojamientos"     checked={tipoAloj}    onClick={() => seleccionarCategoria('alojamiento')} />
            <CategoriaPill label="Salidas"          checked={tipoSalidas} onClick={() => seleccionarCategoria('salidas')} />
            <CategoriaPill label="Aventura & Relax" checked={tipoExp}     onClick={() => seleccionarCategoria('aventura_relax')} />
          </div>
        </SideSection>

        {/* ── DESTINO (solo destinos con ≥4 ofertas) ── */}
        {!loading && (
          <SideSection
            title="Destino"
            onLimpiar={localidades.length > 0 ? () => setLocalidades([]) : null}
          >
            {destinosValidos.map(loc => (
              <CheckRow
                key={loc} label={loc}
                checked={localidades.includes(loc)}
                onChange={() => setLocalidades(prev => prev.includes(loc) ? prev.filter(l => l !== loc) : [...prev, loc])}
              />
            ))}
            {hayOtrosDestinos && (
              <CheckRow
                label="Otros destinos cerca"
                checked={localidades.includes('__otros__')}
                onChange={() => setLocalidades(prev => prev.includes('__otros__') ? prev.filter(l => l !== '__otros__') : [...prev, '__otros__'])}
              />
            )}
          </SideSection>
        )}

        {/* ── FLASH SALE (sin título, directo el checkbox) ── */}
        <SideSection>
          <CheckRow
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                Solo ofertas{' '}
                <span style={{ fontWeight: 900, fontStyle: 'italic', color: '#EF4444', letterSpacing: '0.05em' }}>FLASH</span>
                <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center' }}><IcoBolt /></span>
              </span>
            }
            checked={soloFlash}
            onChange={() => setSoloFlash(v => !v)}
          />
        </SideSection>

        {/* ── Separador + OTROS FILTROS ── */}
        {catActiva && (
          <SideSection
            title="Otros filtros"
            bold
            onLimpiar={hayOtrosFiltros ? () => { setSubcatPrimaria(new Set()); setSubcatSecundaria(new Set()); } : null}
          >
            {/* Subcategorías primarias */}
            {SUBCATS_PRIMARY[catActiva] && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {catActiva === 'alojamiento' ? 'Tipo de alojamiento' : catActiva === 'salidas' ? 'Tipo de salida' : 'Tipo de experiencia'}
                </div>
                <CheckRow
                  label="Todos los tipos"
                  checked={subcatPrimaria.size === 0}
                  onChange={() => setSubcatPrimaria(new Set())}
                />
                {SUBCATS_PRIMARY[catActiva].map(sc => (
                  <CheckRow
                    key={sc.label} label={sc.label}
                    checked={subcatPrimaria.has(sc.label)}
                    onChange={() => setSubcatPrimaria(prev => {
                      const next = new Set(prev);
                      next.has(sc.label) ? next.delete(sc.label) : next.add(sc.label);
                      return next;
                    })}
                  />
                ))}
              </div>
            )}

            {/* Subcategorías secundarias */}
            {SUBCATS_SECONDARY[catActiva] && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: A.muted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {catActiva === 'alojamiento' ? 'Servicios incluidos' : catActiva === 'salidas' ? 'Características' : 'Modalidad'}
                </div>
                {SUBCATS_SECONDARY[catActiva].map(sc => (
                  <CheckRow
                    key={sc.label} label={sc.label}
                    checked={subcatSecundaria.has(sc.label)}
                    onChange={() => setSubcatSecundaria(prev => {
                      const next = new Set(prev);
                      next.has(sc.label) ? next.delete(sc.label) : next.add(sc.label);
                      return next;
                    })}
                  />
                ))}
              </div>
            )}
          </SideSection>
        )}

      </div>
    </>
  );

  return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.font, paddingTop: 70 }}>

      {/* Drawer mobile */}
      {isMobile && drawerOpen && (
        <>
          <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(11,16,32,0.4)', zIndex: 100 }} />
          <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 300, background: '#fff', zIndex: 101, overflowY: 'auto', boxShadow: '4px 0 32px rgba(0,0,0,0.15)' }}>
            {SidebarContent}
          </div>
        </>
      )}

      <div style={{ maxWidth: 1328, margin: '0 auto', padding: isMobile ? '16px 16px 72px' : '32px 40px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>

        {/* Sidebar desktop */}
        {!isMobile && (
          <div style={{ width: 260, flexShrink: 0 }}>
            <aside style={{ background: '#fff', borderRadius: 18, border: `1px solid ${A.line}`, overflow: 'hidden' }}>
              {SidebarContent}
            </aside>
          </div>
        )}

        {/* Resultados */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header: título + [filtros mobile] + search */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: A.ink, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.25 }}>
                {getTitulo(catActiva || 'default')}
              </h1>
              <p style={{ fontSize: 13, color: A.muted, margin: '4px 0 0' }}>
                {loading ? 'Cargando...' : `${visibles.length} oferta${visibles.length !== 1 ? 's' : ''} disponible${visibles.length !== 1 ? 's' : ''} en Villa Gesell y alrededores`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {isMobile && (
                <button onClick={() => setDrawerOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', background: hayFiltros ? A.primary : '#fff', color: hayFiltros ? '#fff' : A.ink, border: `1.5px solid ${hayFiltros ? A.primary : A.line}`, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/></svg>
                  Filtros{hayFiltros ? ` (${[tipoAloj,tipoSalidas,tipoExp,soloFlash].filter(Boolean).length + localidades.length + subcatPrimaria.size + subcatSecundaria.size})` : ''}
                </button>
              )}
              <div style={{ position: 'relative' }}>
                <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar en ofertas"
                  style={{ width: isMobile ? 170 : 260, paddingLeft: 14, paddingRight: 40, paddingTop: 10, paddingBottom: 10, border: `1.5px solid ${A.line}`, borderRadius: 12, fontSize: 14, fontFamily: A.font, background: '#fff', color: A.ink, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.target.style.borderColor = A.primary} onBlur={e => e.target.style.borderColor = A.line}
                />
                <span style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: A.muted, display: 'flex', pointerEvents: 'none' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 16 : 20 }}>
              {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 340, background: A.line, borderRadius: 20, opacity: 0.5 }} />)}
            </div>
          ) : visibles.length === 0 ? (
            <div style={{ background: '#fff', border: `1px solid ${A.line}`, borderRadius: 18, padding: '60px 24px', textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: A.muted, margin: 0 }}>No hay ofertas para esta combinación de filtros.</p>
              <button onClick={limpiarFiltros} style={{ marginTop: 14, background: A.primary, color: '#fff', border: 'none', borderRadius: 10, padding: '9px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: A.font }}>Limpiar filtros</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 16 : 20 }}>
              {visiblesPaged.map(promo => (
                <OfertaCard key={promo.id} promo={promo} onAddToCuponera={addCupon} onOpenOferta={onOpenOferta} />
              ))}
            </div>
          )}

          {/* Sentinel infinite scroll */}
          {hayMas && (
            <div ref={sentinelRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
              <div style={{ width: 28, height: 28, border: `3px solid ${A.line}`, borderTopColor: A.primary, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          )}
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    </div>
  );
}
