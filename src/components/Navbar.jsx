// ============================================================
//  src/components/Navbar.jsx
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { locations } from '../data/mockData';
import { useCuponera } from '../lib/cuponera';

const A = {
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  bg:          '#F7F7F8',
  font:        "'Geist', system-ui, sans-serif",
};

// ─── Chevrons ────────────────────────────────────────────────
function ChevD({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  );
}
function ChevR() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6"/>
    </svg>
  );
}

// ─── Animación base dropdown ─────────────────────────────────
const DROP_BASE = {
  position: 'absolute', top: 'calc(100% + 10px)',
  background: '#fff', borderRadius: 16, border: `1px solid ${A.line}`,
  boxShadow: '0 24px 64px -16px rgba(11,16,32,0.20)',
  zIndex: 1001, overflow: 'hidden',
};


function useOutsideClose(refs, fn) {
  useEffect(() => {
    const refsArr = Array.isArray(refs) ? refs : [refs];
    const h = (e) => {
      if (refsArr.every(r => r.current && !r.current.contains(e.target))) fn();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
}

// ═══════════════════════════════════════════════════════════
// ─── MINI OFERTA CARD — usada en los 3 dropdowns ───────────
// ═══════════════════════════════════════════════════════════
function MiniOfertaCard({ img, badge, badgeColor = A.primary, lugar, titulo, subtitulo, onNavigate, destino }) {
  return (
    <button
      onClick={() => onNavigate(destino || 'marketplace', {})}
      style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${A.line}`, borderRadius: 14, overflow: 'hidden', background: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: A.font, width: '100%', transition: 'box-shadow .18s, transform .18s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(11,16,32,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Imagen con badge */}
      <div style={{ position: 'relative', height: 110, overflow: 'hidden', background: '#e0e0ea', flexShrink: 0 }}>
        <img src={img} alt={titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.55) 0%, transparent 55%)' }} />
        <div style={{ position: 'absolute', bottom: 9, left: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{badge}</span>
        </div>
        <span style={{ position: 'absolute', top: 9, right: 9, fontSize: 10, fontWeight: 700, color: badgeColor === A.primary ? A.primary : '#fff', background: badgeColor === A.primary ? A.primarySoft : badgeColor, padding: '3px 8px', borderRadius: 6 }}>{subtitulo}</span>
      </div>
      {/* Body */}
      <div style={{ padding: '10px 12px 12px' }}>
        {lugar && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={A.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: A.primary }}>{lugar}</span>
          </div>
        )}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#1a6b3c', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{titulo}</div>
        <div style={{ marginTop: 9, padding: '7px 10px', background: A.primarySoft, borderRadius: 8, fontSize: 12, fontWeight: 600, color: A.primary, textAlign: 'center' }}>
          Ver oferta →
        </div>
      </div>
    </button>
  );
}

// ─── Col helper ─────────────────────────────────────────────
function DropCol({ title, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 170, flexShrink: 0 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: A.primary, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, fontFamily: A.font, paddingLeft: 4 }}>{title}</span>
      {children}
    </div>
  );
}

function DropLink({ label, bold, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ width: '100%', textAlign: 'left', border: 'none', background: 'transparent', padding: '7px 4px', fontSize: 14, fontWeight: bold ? 600 : 400, color: bold ? A.ink : A.ink2, cursor: 'pointer', fontFamily: A.font, borderRadius: 8, transition: 'color .13s, background .13s' }}
      onMouseEnter={e => { e.currentTarget.style.background = A.bg; e.currentTarget.style.color = A.primary; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = bold ? A.ink : A.ink2; }}
    >
      {label}
    </button>
  );
}

function DropDivider() {
  return <div style={{ height: 1, background: A.line, margin: '4px 0' }} />;
}

// ═══════════════════════════════════════════════════════════
// ─── DROPDOWN ALOJAMIENTOS ──────────────────────────────────
// ═══════════════════════════════════════════════════════════
const ALOJ_UBICACIONES = [
  { label: 'Ciudad de Villa Gesell',       locs: ['Villa Gesell'] },
  { label: 'Mar de las Pampas',            locs: ['Mar de las Pampas'] },
  { label: 'Mar Azul y Las Gaviotas',      locs: ['Mar Azul', 'Las Gaviotas'] },
  { label: 'Chacras del mar / El Salvaje', locs: ['Chacras del Mar', 'El Salvaje'] },
];
const ALOJ_TIPOS_LIST = [
  { label: 'Hoteles',          val: 'Hotel' },
  { label: 'Cabañas',          val: 'Cabaña' },
  { label: 'Casas',            val: 'Casa' },
  { label: 'Departamentos',    val: 'Departamento' },
  { label: 'Dormis / Camping', val: 'Dormi' },
];

const EXT_LINK_STYLE = { display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', fontSize: 12, fontWeight: 400, color: A.muted, textDecoration: 'none', borderRadius: 8, transition: 'background .12s, color .12s' };
const EXT_ICON = <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>;

function AlojDrop({ onNavigate }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 0, padding: '24px 24px 20px' }}>

      {/* Col 1 */}
      <DropCol title="Por ubicación">
        {ALOJ_UBICACIONES.map(u => (
          <DropLink
            key={u.label}
            label={u.label}
            onClick={() => u.locs.length === 1
              ? onNavigate('marketplace', { localidad: u.locs[0] })
              : onNavigate('marketplace', { localidades: u.locs })
            }
          />
        ))}
        <DropDivider />
        <DropLink label="Todos los destinos" onClick={() => onNavigate('marketplace', { localidad: '' })} />
      </DropCol>

      {/* Separador vertical */}
      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Col 2 */}
      <DropCol title="Por tipo de alojamiento">
        {ALOJ_TIPOS_LIST.map(t => (
          <DropLink key={t.val} label={t.label} onClick={() => onNavigate('marketplace', { tipo: t.val })} />
        ))}
        <DropDivider />
        <DropLink label="Todos los tipos" onClick={() => onNavigate('marketplace', {})} />
      </DropCol>

      {/* Separador vertical */}
      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Derecha: imagen + mini oferta */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 220, flexShrink: 0 }}>
        <div style={{ borderRadius: 12, overflow: 'hidden', height: 100 }}>
          <img
            src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=440&q=80"
            alt="Villa Gesell"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
        <MiniOfertaCard
          img="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=440&q=80"
          badge="30% off"
          subtitulo="Cabaña"
          lugar="Mar de las Pampas"
          titulo="Cabaña frente al mar con acceso directo a la playa"
          onNavigate={onNavigate}
          destino="marketplace"
        />
      </div>
    </div>

      {/* Footer con links a otros dominios */}
      <div style={{ borderTop: `1px solid ${A.line}`, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 11, color: A.muted, marginRight: 8 }}>También en:</span>
        {[
          { href: 'https://madariaga.ar', label: 'madariaga.ar' },
          { href: 'https://costaatlantica.ar', label: 'costaatlantica.ar' },
          { href: 'https://alquileresmardelplata.ar', label: 'alquileresmardelplata.ar' },
        ].map(({ href, label }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            style={EXT_LINK_STYLE}
            onMouseEnter={e => { e.currentTarget.style.background = A.bg; e.currentTarget.style.color = A.primary; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = A.muted; }}>
            {EXT_ICON} {label}
          </a>
        ))}
      </div>
    </div>
  );
}


const GASTRO_QUE_COME = [
  'Pescados & Mariscos',
  'Panificados & Facturas',
  'Carnes & Parrilla',
  'Pastas artesanales',
  'Pizzas & Empanadas',
  'Helados & Dulces',
  'Vegano & Saludable',
  'Cocina internacional',
];

const GASTRO_EXPERIENCIA = [
  'Cita de a dos',
  'Plan familiar',
  'Pies en la arena',
  'Desayuno & Brunch',
  'Noche de bares',
  'Después de la playa',
  'Para grupos grandes',
  'Vista al mar',
];

function GastroDrop({ onNavigate }) {
  return (
    <div style={{ display: 'flex', gap: 0, padding: '24px 24px 20px' }}>

      {/* Col 1: Categoría */}
      <DropCol title="Categoría">
        {[
          { label: 'Restaurantes',        val: 'Restaurante' },
          { label: 'Bares',               val: 'Bar' },
          { label: 'Cafés & Dulces',      val: 'Café & Dulces' },
          { label: 'Heladerías',          val: 'Heladería' },
          { label: 'Panaderías',          val: 'Panadería' },
          { label: 'Discotecas',          val: 'Discoteca' },
          { label: 'Cines y Teatros',     val: 'Cine y Teatro' },
          { label: 'Shows y Recitales',   val: 'Show y Recital' },
          { label: 'Centros Culturales',  val: 'Centro Cultural' },
          { label: 'Otros',               val: 'Otro' },
        ].map(({ label, val }) => (
          <DropLink key={val} label={label} onClick={() => onNavigate('salidas', { gastroCategoria: val })} />
        ))}
        <DropDivider />
        <DropLink label="Todas las categorías" onClick={() => onNavigate('salidas', { gastroCategoria: '' })} />
      </DropCol>

      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Col 2: Tipo de experiencia */}
      <DropCol title="Tipo de experiencia">
        {GASTRO_EXPERIENCIA.map(l => (
          <DropLink key={l} label={l} onClick={() => onNavigate('salidas', { gastroExperiencia: l })} />
        ))}
        <DropDivider />
        <DropLink label="Todos los tipos" onClick={() => onNavigate('salidas', { gastroExperiencia: '' })} />
      </DropCol>

      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Derecha */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 220, flexShrink: 0 }}>
        <div style={{ borderRadius: 12, overflow: 'hidden', height: 100 }}>
          <img
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=440&q=80"
            alt="Salidas"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
        <MiniOfertaCard
          img="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=440&q=80"
          badge="2×1"
          subtitulo="Resto"
          lugar="Villa Gesell"
          titulo="Cena romántica frente al bosque con menú degustación"
          onNavigate={onNavigate}
          destino="salidas"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── DROPDOWN AVENTURA & RELAX ──────────────────────────────
// ═══════════════════════════════════════════════════════════
const AVENT_CATS_LIST = [
  'Todas las salidas y aventura & relax',
  'Excursiones & Paseos',
  'Deportes acuáticos',
  'Senderismo & Naturaleza',
  'Spa & Masajes',
  'Cabalgatas',
  'Yoga & Mindfulness',
  'Kitesurf & Viento',
];

function AventDrop({ onNavigate }) {
  return (
    <div style={{ display: 'flex', gap: 0, padding: '24px 24px 20px' }}>

      {/* Col única */}
      <DropCol title="Categorías">
        {AVENT_CATS_LIST.slice(1).map(l => (
          <DropLink key={l} label={l} onClick={() => onNavigate('ofertas')} />
        ))}
        <DropDivider />
        <DropLink label={AVENT_CATS_LIST[0]} onClick={() => onNavigate('ofertas')} />
      </DropCol>

      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Derecha */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 220, flexShrink: 0 }}>
        <div style={{ borderRadius: 12, overflow: 'hidden', height: 100 }}>
          <img
            src="https://images.unsplash.com/photo-1455729552865-3658a5d39692?w=440&q=80"
            alt="Aventura"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
        <MiniOfertaCard
          img="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=440&q=80"
          badge="-20%"
          subtitulo="Experiencia"
          lugar="Mar de las Pampas"
          titulo="Clase de yoga al amanecer en los médanos costeros"
          onNavigate={onNavigate}
          destino="ofertas"
        />
      </div>
    </div>
  );
}

// ─── Logo dinámico según dominio ─────────────────────────────
function SiteName() {
  const host = typeof window !== 'undefined'
    ? window.location.hostname.replace('www.', '').replace('localhost', 'Cuponear')
    : 'Cuponear';
  return (
    <span style={{ fontWeight: 500, fontSize: 14, color: A.primary, fontFamily: A.font }}>
      {host}
    </span>
  );
}

// ─── Packs ───────────────────────────────────────────────────
const PACKS_ICONS = {
  'Todos los packs': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  'Románticos': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  'Familias': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  'Aventura': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 18 12 2 21 18"/><polyline points="3 18 21 18"/>
    </svg>
  ),
  'Relax & Bienestar': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  'Salidas + alojamiento': (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l19-9-9 19-2-8-8-2z"/>
    </svg>
  ),
};
const PACKS_TIPOS = ['Todos los packs', 'Románticos', 'Familias', 'Aventura', 'Relax & Bienestar', 'Salidas + alojamiento'];

// ═══════════════════════════════════════════════════════════
export default function Navbar({ scrolled, view, setView, session, perfil, onLoginClick, onRegisterClick, onLogout, onPublicarOferta, onNavbarNav }) {
  const [openMenu,    setOpenMenu]    = useState(null);
  const [closingMenu, setClosingMenu] = useState(null);
  const animTimer = useRef(null);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [userMenuOpen,setUserMenuOpen]= useState(false);
  const { openDrawer } = useCuponera();

  const alojRef   = useRef(null);
  const gastroRef = useRef(null);
  const aventRef  = useRef(null);
  const packsRef  = useRef(null);
  const userRef   = useRef(null);
  const navRef    = useRef(null);

  // Un único listener: cierra todo cuando el click cae fuera del navbar completo
  useOutsideClose(navRef, () => { setOpenMenu(null); setUserMenuOpen(false); });

  // Timer para cerrar menú tras 3 s fuera
  const closeTimer = useRef(null);

  const hoverOpen = (name) => {
    clearTimeout(closeTimer.current);
    clearTimeout(animTimer.current);
    setClosingMenu(null);
    setOpenMenu(name);
  };

  const hoverLeave = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setClosingMenu(openMenu);
      clearTimeout(animTimer.current);
      animTimer.current = setTimeout(() => {
        setOpenMenu(null);
        setClosingMenu(null);
      }, 180);
    }, 1000);
  };

  // Limpiar timers al desmontar
  useEffect(() => () => { clearTimeout(closeTimer.current); clearTimeout(animTimer.current); }, []);

  const closeAll = () => { clearTimeout(closeTimer.current); setOpenMenu(null); setMobileOpen(false); };

  // nav: usa onNavbarNav si está disponible (con filtros), si no setView directo
  const nav = (v, opts = {}) => {
    if (onNavbarNav) onNavbarNav(v, opts);
    else setView(v);
    closeAll();
  };

  const navVerOferta = () => nav('marketplace', {});

  const esSocioOAdmin = session && (perfil?.negocio_id || perfil?.es_superadmin);
  const nombreDisplay = esSocioOAdmin
    ? (perfil?.negocios?.nombre || perfil?.nombre || session?.user?.email || 'Mi cuenta')
    : (perfil?.nombre || session?.user?.email || 'Mi cuenta');
  const avatarUrl = esSocioOAdmin
    ? (perfil?.negocios?.foto_perfil || perfil?.negocios?.imagen_url || perfil?.avatar_url || null)
    : (perfil?.avatar_url || null);
  const avatarLetra = (nombreDisplay)[0]?.toUpperCase() || 'U';

  const navBtnSt = {
    background: 'none', border: 'none', fontSize: 14, fontWeight: 500,
    color: A.ink2, cursor: 'pointer', padding: '4px 0', fontFamily: A.font,
    display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
    transition: 'color .15s',
  };

  return (
    <>
      <nav ref={navRef} style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: '#fff', borderBottom: `1px solid ${A.line}`,
        boxShadow: scrolled ? '0 2px 20px -8px rgba(11,16,32,0.14)' : 'none',
        transition: 'box-shadow 0.2s', fontFamily: A.font,
      }}>
        <div style={{ width: '100%', boxSizing: 'border-box', padding: '0 56px', height: 64, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>

          {/* ── Logo ── */}
          <div onClick={() => nav('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flexShrink: 0 }}>
            <img src="/logo-cuponera.svg" alt="Cuponear" style={{ height: 40, width: 'auto', display: 'block' }} />
            <SiteName />
          </div>

          {/* ── Desktop nav links ── */}
          <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, paddingLeft: 16 }}>

            {/* Alojamientos */}
            <div style={{ position: 'relative' }} ref={alojRef}
              onMouseEnter={() => hoverOpen('aloj')}
              onMouseLeave={hoverLeave}
            >
              <button style={{ ...navBtnSt, color: openMenu === 'aloj' ? A.primary : A.ink2 }}>
                alojamientos <ChevD />
              </button>
              {(openMenu === 'aloj' || closingMenu === 'aloj') && (
                <div style={{ ...DROP_BASE, left: 0, animation: closingMenu === 'aloj' ? 'dropFadeOut .18s ease-in forwards' : 'dropFade .15s ease-out' }}>
                  <AlojDrop onNavigate={(v, opts) => nav(v, opts)} onVerOferta={navVerOferta} />
                </div>
              )}
            </div>

            {/* Salidas */}
            <div style={{ position: 'relative' }} ref={gastroRef}
              onMouseEnter={() => hoverOpen('gastro')}
              onMouseLeave={hoverLeave}
            >
              <button style={{ ...navBtnSt, color: openMenu === 'gastro' ? A.primary : A.ink2 }}>
                salidas <ChevD />
              </button>
              {(openMenu === 'gastro' || closingMenu === 'gastro') && (
                <div style={{ ...DROP_BASE, left: '50%', transform: 'translateX(-50%)', animation: closingMenu === 'gastro' ? 'dropFadeCenterOut .18s ease-in forwards' : 'dropFadeCenter .15s ease-out' }}>
                  <GastroDrop onNavigate={(v, opts) => nav(v, opts)} />
                </div>
              )}
            </div>

            {/* Aventura & Relax */}
            <div style={{ position: 'relative' }} ref={aventRef}
              onMouseEnter={() => hoverOpen('aventura')}
              onMouseLeave={hoverLeave}
            >
              <button style={{ ...navBtnSt, color: openMenu === 'aventura' ? A.primary : A.ink2 }}>
                aventura & relax <ChevD />
              </button>
              {(openMenu === 'aventura' || closingMenu === 'aventura') && (
                <div style={{ ...DROP_BASE, left: '50%', transform: 'translateX(-50%)', animation: closingMenu === 'aventura' ? 'dropFadeCenterOut .18s ease-in forwards' : 'dropFadeCenter .15s ease-out' }}>
                  <AventDrop onNavigate={(v) => nav(v)} />
                </div>
              )}
            </div>

            {/* Separador visual */}
            <div style={{ width: 1, height: 18, background: A.line, margin: '0 2px', flexShrink: 0 }} />

            {/* Packs exclusivos */}
            <div style={{ position: 'relative' }} ref={packsRef}
              onMouseEnter={() => hoverOpen('packs')}
              onMouseLeave={hoverLeave}
            >
              <button style={{ ...navBtnSt, fontWeight: 600, color: openMenu === 'packs' ? A.primary : A.ink }}>
                packs exclusivos <ChevD />
              </button>
              {(openMenu === 'packs' || closingMenu === 'packs') && (
                <div style={{ ...DROP_BASE, left: '50%', transform: 'translateX(-50%)', minWidth: 220, animation: closingMenu === 'packs' ? 'dropFadeCenterOut .18s ease-in forwards' : 'dropFadeCenter .15s ease-out' }}>
                  <div style={{ padding: '8px 0' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: A.muted, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '8px 16px 4px', margin: 0, fontFamily: A.font }}>Packs</p>
                    {PACKS_TIPOS.filter(t => t !== 'Todos los packs').map(tipo => (
                      <button key={tipo} onClick={() => nav('packs')}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 400, color: A.ink2, cursor: 'pointer', textAlign: 'left', fontFamily: A.font }}
                        onMouseEnter={e => { e.currentTarget.style.background = A.bg; e.currentTarget.style.color = A.primary; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = A.ink2; }}
                      >
                        <span style={{ opacity: 0.7, flexShrink: 0, display: 'flex' }}>{PACKS_ICONS[tipo]}</span>
                        {tipo}
                      </button>
                    ))}
                    <div style={{ height: 1, background: A.line, margin: '4px 16px' }} />
                    <button onClick={() => nav('packs')}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: A.primary, cursor: 'pointer', textAlign: 'left', fontFamily: A.font }}
                      onMouseEnter={e => { e.currentTarget.style.background = A.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ opacity: 0.7, flexShrink: 0, display: 'flex' }}>{PACKS_ICONS['Todos los packs']}</span>
                      Todos los packs
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ── Derecha ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

            {esSocioOAdmin && (
              <button
                onClick={() => { onPublicarOferta && onPublicarOferta(); closeAll(); }}
                className="navbar-publicar-btn"
                style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 999, padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: A.font, boxShadow: '0 2px 10px rgba(37,69,230,0.28)', transition: 'background .15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1a35cc'; }}
                onMouseLeave={e => { e.currentTarget.style.background = A.primary; }}
              >
                Publicar oferta
              </button>
            )}

            {session ? (
              <div style={{ position: 'relative' }} ref={userRef}>
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: 10, fontFamily: A.font }}
                  onMouseEnter={e => e.currentTarget.style.background = A.bg}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${A.line}` }} />
                    : <div style={{ width: 32, height: 32, borderRadius: '50%', background: A.ink, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{avatarLetra}</div>
                  }
                  <span style={{ fontSize: 13, fontWeight: 600, color: A.ink, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nombreDisplay}</span>
                  <span style={{ color: A.muted, display: 'flex', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><ChevD /></span>
                </button>

                {userMenuOpen && (
                  <div style={{ ...DROP_BASE, right: 0, transform: 'none', minWidth: 220, padding: '8px 0', animation: 'dropFadeRight .15s ease-out' }}>
                    <UserMenuItem icon={HeartIco}    label="Favoritos"   onClick={() => { setView('favoritos');  setUserMenuOpen(false); }} />
                    <UserMenuItem icon={CuponeraIco} label="Cuponera"    onClick={() => { openDrawer();           setUserMenuOpen(false); }} />
                    <UserMenuItem icon={PersonIco}   label="Mi cuenta"   onClick={() => { setView('mi-cuenta');  setUserMenuOpen(false); }} />
                    {esSocioOAdmin && (
                      <>
                        <div style={{ height: 1, background: A.line, margin: '6px 0' }} />
                        <button onClick={() => { setView(perfil?.es_superadmin ? 'superadmin' : 'admin'); setUserMenuOpen(false); }}
                          style={menuItemSt(true)}
                          onMouseEnter={e => e.currentTarget.style.background = A.primarySoft}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}
                        >
                          <DashIco /> Panel de socio
                        </button>
                      </>
                    )}
                    <div style={{ height: 1, background: A.line, margin: '6px 0' }} />
                    <button onClick={() => { onLogout(); setUserMenuOpen(false); }}
                      style={menuItemSt(false, true)}
                      onMouseEnter={e => e.currentTarget.style.background = A.bg}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <LogoutIco /> Salir
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, fontFamily: A.font }} className="navbar-auth">
                <button onClick={() => onLoginClick && onLoginClick('ingresar')}
                  style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 500, color: A.ink2, cursor: 'pointer', padding: '6px 6px', fontFamily: A.font, whiteSpace: 'nowrap' }}
                  onMouseEnter={e => e.currentTarget.style.color = A.primary}
                  onMouseLeave={e => e.currentTarget.style.color = A.ink2}
                >Ingresar</button>
                <span style={{ color: A.line, fontSize: 14, userSelect: 'none' }}>/</span>
                <button onClick={() => onRegisterClick && onRegisterClick('registrarse')}
                  style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 500, color: A.ink2, cursor: 'pointer', padding: '6px 6px', fontFamily: A.font, whiteSpace: 'nowrap' }}
                  onMouseEnter={e => e.currentTarget.style.color = A.primary}
                  onMouseLeave={e => e.currentTarget.style.color = A.ink2}
                >Registrarse gratis</button>
              </div>
            )}

            <button className="navbar-hamburger" onClick={() => setMobileOpen(o => !o)}
              style={{ background: 'none', border: `1px solid ${A.line}`, borderRadius: 10, width: 38, height: 38, display: 'none', placeItems: 'center', cursor: 'pointer', color: A.ink, flexShrink: 0 }}
            >
              {mobileOpen
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
              }
            </button>
          </div>

        </div>
      </nav>

      {/* ── Mobile menu ── */}
      {mobileOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40, background: '#fff', paddingTop: 64, overflowY: 'auto', fontFamily: A.font }}>
          <div style={{ padding: '20px 24px 48px' }}>
            {[
              { label: 'alojamientos',  action: () => nav('marketplace') },
              { label: 'salidas',        action: () => nav('salidas') },
              { label: 'aventura & relax', action: () => nav('ofertas') },
              { label: 'packs exclusivos', action: () => nav('packs') },
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ width: '100%', textAlign: 'left', padding: '14px 0', border: 'none', borderBottom: `1px solid ${A.line}`, background: 'none', fontSize: 16, fontWeight: 500, color: A.ink, cursor: 'pointer', fontFamily: A.font }}>
                {item.label}
              </button>
            ))}
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {esSocioOAdmin && (
                <button onClick={() => { onPublicarOferta && onPublicarOferta(); closeAll(); }}
                  style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: A.primary, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: A.font }}>
                  Publicar oferta
                </button>
              )}
              {session ? (
                <>
                  <button onClick={() => { setView(perfil?.es_superadmin ? 'superadmin' : 'admin'); closeAll(); }} style={mobileBtnSt()}>Mi cuenta</button>
                  <button onClick={() => { onLogout(); closeAll(); }} style={{ ...mobileBtnSt(), background: A.bg, color: A.muted }}>Salir</button>
                </>
              ) : (
                <>
                  <button onClick={() => { onRegisterClick && onRegisterClick(); closeAll(); }} style={mobileBtnSt()}>Registrarse gratis</button>
                  <button onClick={() => { onLoginClick && onLoginClick(); closeAll(); }} style={{ ...mobileBtnSt(), background: A.bg, color: A.ink, border: `1px solid ${A.line}` }}>Ingresar</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes dropFade {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dropFadeCenter {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes dropFadeRight {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dropFadeOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-6px); }
        }
        @keyframes dropFadeCenterOut {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to   { opacity: 0; transform: translateX(-50%) translateY(-6px); }
        }
        @media (max-width: 900px) {
          .navbar-links       { display: none !important; }
          .navbar-publicar-btn { display: none !important; }
          .navbar-auth        { display: none !important; }
          .navbar-hamburger   { display: grid !important; }
        }
      `}</style>
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────
function NavSep() {
  return <div style={{ width: 1, height: 16, background: '#d8d8e4', margin: '0 2px', flexShrink: 0 }} />;
}

const menuItemSt = (primary = false, muted = false) => ({
  width: '100%', textAlign: 'left', background: 'none', border: 'none',
  padding: '10px 18px', fontSize: 14, fontWeight: primary ? 600 : 500,
  color: primary ? '#2545E6' : muted ? '#6B7280' : '#0B1020',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
  fontFamily: "'Geist', system-ui, sans-serif",
});

const mobileBtnSt = () => ({
  width: '100%', padding: '14px', border: 'none', borderRadius: 14,
  background: '#0B1020', fontSize: 15, fontWeight: 600, color: '#fff',
  cursor: 'pointer', fontFamily: "'Geist', system-ui, sans-serif",
});

function UserMenuItem({ icon: Icon, label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...menuItemSt(), background: hov ? '#F7F7F8' : 'none' }}
    >
      <Icon /> {label}
    </button>
  );
}

const HeartIco    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const CuponeraIco = () => <img src="/ico-disc.svg" alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />;
const PersonIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>;
const DashIco     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const LogoutIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
