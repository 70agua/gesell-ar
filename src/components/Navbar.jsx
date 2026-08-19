// ============================================================
//  src/components/Navbar.jsx
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import AvisosBell from './AvisosBell';
import SelectorRegion from './SelectorRegion';
import { useCarrito } from '../lib/carrito';
import { EXPERIENCIAS_SALIDAS } from '../lib/datos';
import Icono from './Icono';

const A = {
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  primary:     '#475BE1',
  primarySoft: '#EEF0FD',
  bg:          '#F7F7F8',
  green:       '#10A36B',
  greenSoft:   '#E7F9F0',
  font:        "'Inter', system-ui, sans-serif",
};

// La display de la marca, la misma que usa el hero (ver NAURYZ en
// HeroPase.jsx). Hoy la usa un solo lugar —el logo de la pastilla—: llegó a
// usarla también el encabezado de SitiosDrop, que se sacó por repetir la
// marca a un palmo del logo.
const NAURYZ = "'NauryzRedkeds', 'Inter', sans-serif";

// ─── Medidas de la pastilla: expandida (max) / estrechada (min) ──
const NAV_TOP     = 12;
const NAV_TOP_MIN = 8;
const NAV_W_MAX   = 1240;
// Sin pastilla los elementos respiran a todo el ancho útil del sitio, como
// en cualquier navbar plana; encerrarlos en 1240 los dejaría flotando en el
// medio con aire muerto a los costados y se leería como una pastilla sin fondo.
const NAV_W_HERO  = 1600;
const NAV_W_MIN   = 1020;
const NAV_H_MAX   = 56;
const NAV_H_MIN   = 48;
const NAV_EASE    = 'cubic-bezier(.4,0,.2,1)';
// Scroll a partir del cual se condensa la navbar en las vistas sin ancla
// (listados): alcanza para dejar atrás el título del listado.
const SHRINK_FALLBACK_Y = 150;
// Píxeles de subida seguida que hacen falta para esconder la navbar en la home
// (bajar la muestra al toque). Ver el useEffect de dirección de scroll.
// Milisegundos de mouse quieto que hacen falta para esconder la navbar en la
// home. Ver el useEffect de mouse quieto, más abajo.

// ─── Chevrons ────────────────────────────────────────────────
function ChevD({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
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

// Subrayado de sección: barrita al pie del ítem, 4px más corta por la derecha
// para que no llegue al borde de la flechita. Entra creciendo desde el centro
// para que el cambio de tira no se sienta un salto.
function NavUnderline({ activo }) {
  return (
    <span aria-hidden="true" style={{
      position: 'absolute', left: 0, right: 4, bottom: 0, height: 2,
      borderRadius: 999, background: A.primary, pointerEvents: 'none',
      transformOrigin: 'center',
      transform: activo ? 'scaleX(1)' : 'scaleX(0.35)',
      opacity: activo ? 1 : 0,
      transition: `transform .34s ${NAV_EASE}, opacity .26s ease`,
    }} />
  );
}

// Los menús se despliegan centrados sobre la pastilla del navbar, no sobre su
// botón: así todos caen en el mismo eje y ninguno se sale de pantalla. Se
// corrige con `marginLeft` para no pisar las animaciones de entrada, que usan
// transform. Se remide mientras la navbar se estrecha o se ensancha al
// scrollear, para que el panel siga acompañando a la pastilla.
const DROP_MARGEN = 12;
function useDropCentrado(abierto, navRef) {
  const ref = useRef(null);
  useEffect(() => {
    if (!abierto) return;
    let raf = 0;
    const ajustar = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      el.style.marginLeft = '0px';
      const r = el.getBoundingClientRect();
      const nav = navRef?.current?.getBoundingClientRect();
      // Centrado sobre la pastilla; si por ancho no entra, se pega al borde.
      let destino = nav ? nav.left + (nav.width - r.width) / 2 : r.left;
      destino = Math.min(Math.max(destino, DROP_MARGEN), window.innerWidth - DROP_MARGEN - r.width);
      el.style.marginLeft = `${Math.round(destino - r.left)}px`;
    };
    const pedirAjuste = () => { if (!raf) raf = requestAnimationFrame(ajustar); };
    ajustar();
    // La pastilla tarda .38s en cambiar de ancho: el intervalo cubre ese tramo,
    // que el scroll dispara pero termina después de que el scroll paró.
    const tick = setInterval(ajustar, 100);
    window.addEventListener('scroll', pedirAjuste, { passive: true });
    window.addEventListener('resize', pedirAjuste);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      clearInterval(tick);
      window.removeEventListener('scroll', pedirAjuste);
      window.removeEventListener('resize', pedirAjuste);
    };
  }, [abierto, navRef]);
  return ref;
}

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
// ─── MINI OFERTA CARD — tarjeta destacada en dropdowns ─────
// ═══════════════════════════════════════════════════════════
function MiniOfertaCard({ img, badge, subtitulo, titulo, proveedorNombre = 'Villa Gesell', onNavigate, destino, opts = {} }) {
  return (
    <button
      onClick={() => onNavigate(destino || 'ofertas', opts)}
      style={{ display: 'flex', flexDirection: 'column', border: `1px solid ${A.line}`, borderRadius: 14, overflow: 'hidden', background: '#fff', cursor: 'pointer', textAlign: 'left', fontFamily: A.font, width: '100%', padding: 0, transition: 'box-shadow .18s, transform .18s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 10px 28px -8px rgba(11,16,32,0.18)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Header: avatar + nombre — mismo orden que la card grande */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 11px 7px' }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', background: A.primarySoft, border: `1px solid ${A.line}`, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
          <span style={{ fontSize: 10, fontWeight: 800, color: A.primary }}>{(proveedorNombre)[0]}</span>
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: A.ink, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{proveedorNombre}</span>
      </div>

      {/* Imagen 4:3 */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#e0e0ea', flexShrink: 0 }}>
        <img src={img} alt={titulo} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.55) 0%, transparent 55%)' }} />
        {subtitulo && (
          <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, fontWeight: 700, color: '#fff', background: 'rgba(11,16,32,0.52)', padding: '3px 8px', borderRadius: 7, backdropFilter: 'blur(4px)' }}>
            {subtitulo}
          </span>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '9px 11px 10px' }}>
          {badge && (
            <div style={{ fontSize: (badge.length || 0) > 5 ? 20 : 27, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1 }}>
              {badge}
            </div>
          )}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3, marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {titulo}
          </div>
        </div>
      </div>

      {/* Footer: Ver oferta */}
      <div style={{ padding: '9px 11px 11px' }}>
        <div style={{ width: '100%', textAlign: 'center', border: `1.5px solid ${A.ink}`, borderRadius: 9, padding: '6px 0', fontSize: 11.5, fontWeight: 800, color: A.ink }}>
          Ver oferta
        </div>
      </div>
    </button>
  );
}

// ─── Fila compacta de oferta (columna derecha) ──────────────
// Fila compacta de "Más ofertas": el badge va en pastilla azul suave, igual que
// en el listado de packs, pegado al título en la misma línea para que entren
// seis sin estirar el menú.
function MiniOfertaRow({ badge, titulo, proveedorNombre = 'Villa Gesell', onNavigate, destino, opts = {} }) {
  return (
    <button
      onClick={() => onNavigate(destino || 'ofertas', opts)}
      style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: '7px 0', cursor: 'pointer', fontFamily: A.font, display: 'block', transition: 'opacity .12s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.72'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <div style={{ fontSize: 12, color: A.ink, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        <span style={{ background: A.primarySoft, color: A.primary, fontWeight: 800, borderRadius: 999, padding: '1px 7px', marginRight: 5, whiteSpace: 'nowrap' }}>{badge}</span>
        <span style={{ fontWeight: 600 }}>{titulo}</span>
      </div>
      <div style={{ fontSize: 10.5, fontWeight: 500, color: A.muted, marginTop: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
        {proveedorNombre}
      </div>
    </button>
  );
}

// Las seis ofertas de la columna "Más ofertas" de cada menú. Son de muestra:
// el día que salgan de la DB, se reemplaza este objeto por la consulta.
const MAS_OFERTAS = {
  alojamiento: [
    { badge: 'Cortesía', titulo: 'Desayuno buffet incluido para 2 personas',   proveedorNombre: 'Hotel del Bosque' },
    { badge: '-15%', titulo: 'Descuento en estadías de más de 3 noches',    proveedorNombre: 'Mar de las Pampas' },
    { badge: '-25%', titulo: 'Cabaña en el pinar para 4, media semana',     proveedorNombre: 'Cabañas Aromo' },
    { badge: '2x1', titulo: 'Segunda noche al 50% de domingo a jueves',    proveedorNombre: 'Apart Las Dunas' },
    { badge: 'Cortesía', titulo: 'Late check-out sin cargo hasta las 15hs',     proveedorNombre: 'Hostería Médanos' },
    { badge: '-10%', titulo: 'Domo con estufa a leña frente al bosque',     proveedorNombre: 'Glamping Mar Azul' },
  ],
  salidas: [
    { badge: 'Cortesía', titulo: 'Postre y brindis de cortesía para tu mesa',   proveedorNombre: 'Restaurante Amarena' },
    { badge: '-20%', titulo: 'Descuento en tragos y cocktails artesanales', proveedorNombre: 'Bar La Costa' },
    { badge: '2x1', titulo: 'Dos cafés con medialunas por el precio de uno', proveedorNombre: 'Café del Bosque' },
    { badge: '-15%', titulo: 'Menú de mar de tres pasos para dos',          proveedorNombre: 'Parador Windy' },
    { badge: 'Cortesía', titulo: 'Entrada sin cargo al show de la noche',       proveedorNombre: 'Centro Cultural VG' },
    { badge: '-25%', titulo: 'Cucurucho doble en la heladería del centro',  proveedorNombre: 'Heladería La Holandesa' },
  ],
  aventura_relax: [
    { badge: 'Cortesía', titulo: 'Paseo en kayak con guía al atardecer',        proveedorNombre: 'Deportes Acuáticos VG' },
    { badge: '-25%', titulo: 'Cabalgata nocturna por los médanos con fogón', proveedorNombre: 'Rancho El Viento' },
    { badge: '-20%', titulo: 'Masaje descontracturante de 50 minutos',      proveedorNombre: 'Spa Pinamar Sur' },
    { badge: '2x1', titulo: 'Clase de yoga al amanecer en la playa',       proveedorNombre: 'Yoga Mar Azul' },
    { badge: 'Cortesía', titulo: 'Primera clase de kitesurf de prueba',         proveedorNombre: 'Kite Gesell' },
    { badge: '-15%', titulo: 'Travesía 4x4 por los médanos del sur',        proveedorNombre: 'Travesías del Sur' },
  ],
};

// Columna "Más ofertas" — misma lista y mismo destino en los tres menús.
function MasOfertasCol({ categoria, onNavigate }) {
  return (
    <>
      <span style={{ fontSize: 10, fontWeight: 700, color: A.primary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: A.font, paddingLeft: 2, marginBottom: 4 }}>Más ofertas</span>
      {MAS_OFERTAS[categoria].map((o, i) => (
        <React.Fragment key={o.titulo}>
          {i > 0 && <div style={{ height: 1, background: A.line }} />}
          <MiniOfertaRow
            {...o}
            onNavigate={onNavigate}
            destino="ofertas"
            opts={{ ofertasCategoria: categoria }}
          />
        </React.Fragment>
      ))}
      <div style={{ height: 1, background: A.line, marginBottom: 8 }} />
    </>
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
  { label: 'Departamentos',    val: 'Departamento' },
  { label: 'Aparts',           val: 'Apart' },
  { label: 'Complejos',        val: 'Complejo' },
  { label: 'Hosterías',        val: 'Hostería' },
  { label: 'Resorts',          val: 'Resort' },
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
              ? onNavigate('ofertas', { ofertasCategoria: 'alojamiento', localidad: u.locs[0] })
              : onNavigate('ofertas', { ofertasCategoria: 'alojamiento', localidades: u.locs })
            }
          />
        ))}
        <DropDivider />
        <DropLink label="Todos los destinos" onClick={() => onNavigate('ofertas', { ofertasCategoria: 'alojamiento', localidad: '' })} />
      </DropCol>

      {/* Separador vertical */}
      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Col 2 */}
      <DropCol title="Por tipo de alojamiento">
        {ALOJ_TIPOS_LIST.map(t => (
          <DropLink key={t.val} label={t.label} onClick={() => onNavigate('ofertas', { ofertasCategoria: 'alojamiento', tipo: t.val })} />
        ))}
        <DropDivider />
        <DropLink label="Todos los tipos" onClick={() => onNavigate('ofertas', { ofertasCategoria: 'alojamiento' })} />
      </DropCol>

      {/* Separador vertical */}
      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Col 3: oferta destacada */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 210, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: A.primary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: A.font, paddingLeft: 2 }}>Oferta destacada</span>
        <MiniOfertaCard
          img="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=440&q=80"
          subtitulo="Cabaña"
          titulo="Cabaña frente al mar con acceso directo a la playa"
          proveedorNombre="Las Gaviotas Lodge"
          tokens={2}
          onNavigate={onNavigate}
          destino="ofertas"
          opts={{ ofertasCategoria: 'alojamiento' }}
        />
      </div>

      {/* Separador vertical */}
      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Col 4: más ofertas + CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: 264, flexShrink: 0, justifyContent: 'flex-start' }}>
        <MasOfertasCol categoria="alojamiento" onNavigate={onNavigate} />
        <button
          onClick={() => onNavigate('ofertas', { ofertasCategoria: 'alojamiento' })}
          style={{ width: '100%', background: 'none', border: `1px solid ${A.line}`, borderRadius: 10, padding: '8px 0', fontSize: 12, fontWeight: 700, color: A.ink2, cursor: 'pointer', fontFamily: A.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'border-color .12s, color .12s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.color = A.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.color = A.ink2; }}
        >
          Ver más ofertas →
        </button>
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

function GastroDrop({ onNavigate }) {
  return (
    <div style={{ display: 'flex', gap: 0, padding: '24px 24px 20px' }}>

      {/* Col 1: Categoría */}
      <DropCol title="Categoría">
        {[
          { label: 'Restaurantes',        val: 'Restaurantes' },
          { label: 'Bares',               val: 'Bares' },
          { label: 'Cafeterías',          val: 'Cafeterías' },
          { label: 'Heladerías',          val: 'Heladerías' },
          { label: 'Panaderías',          val: 'Panaderías' },
          { label: 'Discotecas',          val: 'Discotecas' },
          { label: 'Cines y Teatros',     val: 'Cines y Teatros' },
          { label: 'Shows y Recitales',   val: 'Shows y Recitales' },
          { label: 'Centros Culturales',  val: 'Centros Culturales' },
          { label: 'Otros',               val: 'Otros' },
        ].map(({ label, val }) => (
          <DropLink key={val} label={label} onClick={() => onNavigate('ofertas', { ofertasCategoria: 'salidas', gastroCategoria: val })} />
        ))}
        <DropDivider />
        <DropLink label="Todas las categorías" onClick={() => onNavigate('ofertas', { ofertasCategoria: 'salidas' })} />
      </DropCol>

      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Col 2: Tipo de experiencia */}
      <DropCol title="Tipo de experiencia">
        {EXPERIENCIAS_SALIDAS.map(l => (
          <DropLink key={l} label={l} onClick={() => onNavigate('ofertas', { ofertasCategoria: 'salidas', gastroExperiencia: l })} />
        ))}
        <DropDivider />
        <DropLink label="Todos los tipos" onClick={() => onNavigate('ofertas', { ofertasCategoria: 'salidas' })} />
      </DropCol>

      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Col 3: oferta destacada */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 210, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: A.primary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: A.font, paddingLeft: 2 }}>Oferta destacada</span>
        <MiniOfertaCard
          img="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=440&q=80"
          badge="2×1"
          subtitulo="Resto"
          titulo="Cena romántica frente al bosque con menú degustación"
          proveedorNombre="Restaurante Amarena"
          tokens={1}
          onNavigate={onNavigate}
          destino="ofertas"
          opts={{ ofertasCategoria: 'salidas' }}
        />
      </div>

      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Col 4: más ofertas + CTA */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: 264, flexShrink: 0 }}>
        <MasOfertasCol categoria="salidas" onNavigate={onNavigate} />
        <button
          onClick={() => onNavigate('ofertas', { ofertasCategoria: 'salidas' })}
          style={{ width: '100%', background: 'none', border: `1px solid ${A.line}`, borderRadius: 10, padding: '8px 0', fontSize: 12, fontWeight: 700, color: A.ink2, cursor: 'pointer', fontFamily: A.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'border-color .12s, color .12s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.color = A.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.color = A.ink2; }}
        >
          Ver más ofertas →
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ─── DROPDOWN AVENTURA & RELAX ──────────────────────────────
// ═══════════════════════════════════════════════════════════
const AVENT_CATS_LIST = [
  { label: 'Deportes acuáticos',      tipo: 'Deportes acuáticos' },
  { label: 'Cabalgatas',              tipo: 'Cabalgatas' },
  { label: 'Kitesurf & Viento',       tipo: 'Kitesurf' },
  { label: 'Yoga & Mindfulness',      tipo: 'Yoga / Bienestar' },
  { label: 'Masajes a domicilio',     tipo: 'Masajes a domicilio' },
  { label: 'Tour fotográfico',        tipo: 'Tour fotográfico' },
  { label: 'Pesca deportiva',         tipo: 'Pesca deportiva' },
  { label: 'Senderismo & Naturaleza', tipo: 'Senderismo' },
  { label: 'Espectáculos',            tipo: 'Espectáculos' },
];

function AventDrop({ onNavigate }) {
  return (
    <div style={{ display: 'flex', gap: 0, padding: '24px 24px 20px' }}>

      {/* Col categorías */}
      <DropCol title="Categorías">
        {AVENT_CATS_LIST.map(({ label, tipo }) => (
          <DropLink key={label} label={label} onClick={() => onNavigate('ofertas', { ofertasCategoria: 'aventura_relax', aventuraTipo: tipo })} />
        ))}
        <DropDivider />
        <DropLink label="Todo en Aventura & Relax" onClick={() => onNavigate('ofertas', { ofertasCategoria: 'aventura_relax' })} />
      </DropCol>

      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Centro: oferta destacada */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 210, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: A.primary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: A.font, paddingLeft: 2 }}>Oferta destacada</span>
        <MiniOfertaCard
          img="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=440&q=80"
          badge="-20%"
          subtitulo="Experiencia"
          titulo="Clase de yoga al amanecer en los médanos costeros"
          proveedorNombre="Yoga Gesell"
          tokens={1}
          onNavigate={onNavigate}
          destino="ofertas"
          opts={{ ofertasCategoria: 'aventura_relax' }}
        />
      </div>

      <div style={{ width: 1, background: A.line, margin: '0 20px', alignSelf: 'stretch', flexShrink: 0 }} />

      {/* Derecha: filas compactas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: 264, flexShrink: 0, justifyContent: 'flex-start' }}>
        <MasOfertasCol categoria="aventura_relax" onNavigate={onNavigate} />
        <button
          onClick={() => onNavigate('ofertas', { ofertasCategoria: 'aventura_relax' })}
          style={{ width: '100%', background: 'none', border: `1px solid ${A.line}`, borderRadius: 10, padding: '8px 0', fontSize: 12, fontWeight: 700, color: A.ink2, cursor: 'pointer', fontFamily: A.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'border-color .12s, color .12s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = A.primary; e.currentTarget.style.color = A.primary; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = A.line; e.currentTarget.style.color = A.ink2; }}
        >
          Ver más ofertas →
        </button>
      </div>
    </div>
  );
}

// ─── Logo dinámico según dominio ─────────────────────────────
// Exportado (2026-08-18, brief de scope regional): el consumo de esto se
// mudó a Footer.jsx ("La red Cuponear", discreto, al pie) porque el logo
// dejó de abrir este dropdown — colisionaba con la pill de región nueva,
// dos selectores geográficos a 40px de distancia. La definición se queda
// acá a propósito (dejar SITIOS_RED/siteHost donde están, mover sólo quién
// las consume): son datos de RED (dominios), no de navegación del viajero,
// así que no tienen nada que ver con src/lib/scope.js.
export function siteHost() {
  return typeof window !== 'undefined'
    ? window.location.hostname.replace('www.', '').replace('localhost', 'gesell.ar')
    : 'gesell.ar';
}

// ─── Sitios de la red ────────────────────────────────────────
// gesell.ar entró a la lista el 2026-08-10: antes quedaba afuera porque era
// el dominio que hacía de logo en la pastilla, así que ya estaba a la vista.
// Con el logo mostrando CUPONEaR, si no estuviera acá no habría forma de
// llegar a gesell.ar desde otro sitio de la red. Va primero por ser el
// principal.
export const SITIOS_RED = [
  'gesell.ar',
  'marazul.ar',
  'lasgaviotas.ar',
  'madariaga.ar',
  'costaesmeralda.ar',
  'alquileresmardelplata.ar',
  'costaatlantica.ar',
];

// ─── Dropdown "Planes y suscripción" ─────────────────────────
// Tres intenciones que no se parecen, en el orden en que conviene ofrecerlas:
// el turista que paga su pase, el que ya lo tiene pagado y sólo viene
// a canjearlo, y último el alojamiento que se suscribe — es el que menos
// tráfico trae y el único que ya sabe lo que vino a buscar.
// Los íconos ya no se dibujan acá: son los mismos archivos que usa el resto del
// sitio (/iconos y el sello del pase), servidos por <Icono>. Los .json son
// Lottie y se animan con el hover de la fila entera (hoverEn="padre").
const PLANES_OPCIONES = [
  {
    id: 'contratar',
    titulo: 'Cupon PASS',
    bajada: 'Todos los descuentos en la zona.',
    vista: 'checkout-pase',
    // Sin preguntarPerfil: este ítem YA es la elección de "soy turista" — el
    // alojamiento tiene su propia entrada al lado ('hoteleria', abajo). El
    // rótulo genérico "Planes y suscripción" (el botón que abre este
    // desplegable) sigue preguntando, porque ESE click no eligió nada todavía.
    opts: {},
    // Recoloreado a primary (2026-08-18): el archivo traía #3243D4, un azul
    // parecido pero no el de marca — no se notaba solo, al lado de gift.svg
    // y codigo.svg (los dos ya en #475BE1) sí.
    icono: '/iconos/cupon-line-05.svg',
    lado: 50,
  },
  {
    id: 'hoteleria',
    titulo: 'Regalá Gift PASS',
    bajada: 'Regalá a tus clientes todos los descuentos de la zona.',
    vista: 'checkout-hotelero',
    opts: {},
    // Antes la casita de cabania.json (Lottie, tono #2D44DD — off-primary
    // también). gift.svg ya viene en #475BE1, sin nada que recolorear.
    // Vive en /public directo, no en /iconos — mismo lugar que codigo.svg.
    icono: '/gift.svg',
    lado: 40,
    badge: 'EMPRESAS',
  },
  {
    id: 'regalo',
    titulo: 'Me regalaron un PASS',
    bajada: 'Activalo con el código de 6 números.',
    vista: 'canjear-regalo',
    opts: {},
    icono: '/codigo.svg',
    lado: 40,
  },
];

function PlanesDrop({ onNavigate }) {
  return (
    <div style={{ padding: 8, width: 340 }}>
      {PLANES_OPCIONES.map(({ id, titulo, bajada, vista, opts, icono, lado = 46, badge }) => (
        <button
          key={id}
          onClick={() => onNavigate(vista, opts)}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, width: '100%', textAlign: 'left',
            padding: '13px 12px', border: 'none', background: 'transparent', borderRadius: 12,
            cursor: 'pointer', fontFamily: A.font, transition: 'background .13s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = A.bg; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        >
          {/* Sin pastilla de fondo: los dibujos traen color propio y sobre el
              azul claro se ensuciaban. Los Lottie corren solos (`animar`), sin
              esperar el hover. `lado` afina cada dibujo por separado: vienen
              con distinto aire interno y al mismo tamaño no pesan lo mismo.
              La casilla creció a 50 (2026-08-18, era 46) para que el ícono
              de Cupon PASS entrara a su nuevo tamaño sin recortarse; los
              otros dos siguen centrados adentro con su `lado` propio. */}
          <span style={{ flexShrink: 0, display: 'grid', placeItems: 'center', width: 50, height: 50 }}>
            <Icono src={icono} animar style={{ width: lado, height: lado, display: 'block' }} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: A.ink, lineHeight: 1.3 }}>{titulo}</span>
              {/* EMPRESAS marca que ese camino no es del turista — mismo
                  patrón visual que el badge GRATIS del menú de usuario, pero
                  en tono primary (no es una promo, es un dato de a quién
                  le habla la opción). */}
              {badge && (
                <span style={{ fontSize: 9.5, fontWeight: 800, color: A.primary, background: A.primarySoft, borderRadius: 999, padding: '2px 7px', letterSpacing: '0.04em' }}>{badge}</span>
              )}
            </span>
            <span style={{ display: 'block', fontSize: 12.5, color: A.muted, lineHeight: 1.45, marginTop: 2 }}>{bajada}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
export default function Navbar({ scrolled, view, setView, session, perfil, onLoginClick, onRegisterClick, onLogout, onPublicarOferta, onConvertirseSocio, onNavbarNav }) {
  const [openMenu,    setOpenMenu]    = useState(null);
  const [closingMenu, setClosingMenu] = useState(null);
  const animTimer = useRef(null);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  // Mismo criterio que closingMenu/dropFadeOut para los desplegables de
  // escritorio: el menú mobile no se desmonta de golpe, se anima saliendo
  // (mobileMenuOut) y recién al terminar se saca del DOM.
  const [mobileClosing, setMobileClosing] = useState(false);
  const mobileCloseTimer = useRef(null);
  const [userMenuOpen,setUserMenuOpen]= useState(false);
  // En 'home' la navbar arranca escondida —el hero queda despojado de menú a
  // propósito— y de ahí en más sigue la DIRECCIÓN del scroll (2026-08-11):
  // aparece apenas se baja, desde el primer píxel, y se esconde recién cuando
  // se acumulan 500px hacia arriba. Ver el useEffect más abajo.
  //
  // Antes dependía de un ancla en el DOM ([data-navbar-reveal], que ponía
  // HomeView justo antes de "Cuponeá antes de pagar"): era un punto fijo del
  // scroll, no una respuesta a lo que hace el usuario, así que arriba de ese
  // punto no había forma de sacar el menú. El ancla se eliminó junto con su
  // observer; [data-navbar-shrink] sigue, que contesta otra pregunta
  // (¿terminó el hero? → condensar). En cualquier otra vista, siempre visible.
  const [condensed,   setCondensed]   = useState(false);
  // La navbar ya no se esconde nunca (2026-08-17). Lo que cambia en la home es
  // su FORMA, no su presencia — ver `sobreHero`. Se deja la constante en vez de
  // barrer los ~8 usos de `revealed`: sigue nombrando la misma pregunta.
  const revealed = true;

  // Sobre el hero la navbar se muestra SIN contenedor: los elementos sueltos
  // sobre la imagen, sin pastilla, sin borde ni vidrio. La pastilla aparece
  // recién al entrar en "Cuponeá antes de pagar" — que es exactamente el
  // punto que ya marcaba `condensed` (el ancla [data-navbar-shrink] que pone
  // HomeView al terminar el hero). Una sola medida para las dos cosas: no
  // hace falta un segundo observer.
  const sobreHero = view === 'home' && !condensed;
  const { openDrawer } = useCarrito();

  // ── Animar el tamaño SÓLO si la navbar ya estaba en pantalla ──────
  // El condensado anima max-width y top acá, y height y padding en el div de
  // adentro: las cuatro son propiedades de LAYOUT, así que el navegador
  // recalcula la pastilla entera —logo, seis ítems de menú, botón— en cada uno
  // de los ~23 frames que dura, y encima sobre un elemento fixed con
  // backdrop-filter, que hay que volver a evaluar en cada uno.
  //
  // Ese pico no tiene por qué pagarse cuando la navbar está APARECIENDO: entra
  // desde opacity 0, así que nadie percibe que además se encoge. Se la deja
  // aparecer ya en su tamaño, sin transición, y la transición vuelve un frame
  // después — que es cuando sí se ve y tiene que animar: con la navbar en
  // pantalla, cruzando [data-navbar-shrink] o el fallback de los listados.
  //
  // (Se agregó cuando el revelado era por ancla y caía en el mismo punto que el
  // condensado —los dos a 760px, el borde inferior del hero—, o sea todo el
  // layout junto en una posición fija del scroll. Ahora que la navbar aparece
  // por dirección de scroll ese choque ya no es fijo, pero el criterio vale
  // igual: aparecer y redimensionar a la vez es trabajo que no se ve.)
  // No se anima en dos momentos: el primer pintado y el CRUCE hero↔pastilla.
  //
  // En el cruce `position` salta de absolute a fixed, que no es animable —
  // pero max-width (1600→1020), background (transparente→blanco) y box-shadow
  // (none→sombra) sí lo son, y seguían transicionando .25–.38s. O sea que la
  // pastilla se materializaba ancha y translúcida un instante después de haber
  // saltado de lugar: scrolleando fuerte eso se lee como un parpadeo.
  //
  // No alcanza con retrasar las transiciones un frame: un setState en un
  // efecto llega después del pintado, y el cuadro que se ve mal ya salió.
  const [montado, setMontado] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMontado(true));
    return () => cancelAnimationFrame(id);
  }, []);
  //
  // En 'home' se apagan del todo, y no se pierde nada: ahí la navbar tiene
  // exactamente DOS estados (suelta sobre el hero / pastilla condensada) y el
  // único cambio posible es el cruce. No existe el condensado gradual dentro
  // de la misma forma, que es para lo que las transiciones estaban puestas —
  // eso sí pasa en los listados, y ahí siguen andando.
  const animarTamano = montado && view !== 'home';
  const transLayout = (prop) => (animarTamano ? `${prop} .38s ${NAV_EASE}` : null);

  const alojRef   = useRef(null);
  const gastroRef = useRef(null);
  const aventRef  = useRef(null);
  const packsRef  = useRef(null);
  const ingresarRef = useRef(null);
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
      setOpenMenu(prev => {
        if (prev) {
          setClosingMenu(prev);
          clearTimeout(animTimer.current);
          animTimer.current = setTimeout(() => setClosingMenu(null), 180);
        }
        return null;
      });
    }, 250);
  };

  // Limpiar timers al desmontar
  useEffect(() => () => { clearTimeout(closeTimer.current); clearTimeout(animTimer.current); }, []);

  // ── Estrechado al pasar la primera sección ────────────────
  // La vista marca el fin del hero con <div data-navbar-shrink />. Cuando ese
  // punto cruza por debajo de la pastilla, la navbar se compacta. Las vistas que
  // no ponen el ancla —los listados— se condensan al pasar el alto del título.
  //
  // ⚠️ Esto era un IntersectionObserver y estaba MAL (arreglado el 2026-08-17).
  // El ancla mide 0px de alto, así que con threshold 0 `isIntersecting` da
  // false tanto cuando está abajo de la línea como cuando ya quedó muy arriba:
  // son dos estados sin cruce de umbral entre sí. Si el scroll salta de uno al
  // otro en un solo frame —un flick fuerte, un `scrollTo`, volver con el
  // historial— el observer NO dispara ningún callback y `condensed` se queda
  // en false para siempre. En la home eso significaba la navbar clavada en
  // modo hero, sin pastilla, en medio del catálogo.
  //
  // Con listener de scroll no hay estados intermedios que perderse: se compara
  // una posición contra una línea, y da lo mismo cómo se llegó ahí. El costo
  // es un getBoundingClientRect por frame de scroll, acotado con rAF; se lee
  // el ancla en vivo en vez de cachear su offset porque el hero cambia de alto
  // cuando cargan las imágenes y un valor cacheado quedaría viejo.
  useEffect(() => {
    const linea = NAV_TOP + NAV_H_MAX; // borde inferior de la pastilla expandida
    const anchor = document.querySelector('[data-navbar-shrink]');
    let pedido = null;

    const medir = () => {
      pedido = null;
      setCondensed(anchor
        ? anchor.getBoundingClientRect().top <= linea
        : window.scrollY > SHRINK_FALLBACK_Y);
    };
    const alScrollear = () => { if (pedido == null) pedido = requestAnimationFrame(medir); };

    medir();
    window.addEventListener('scroll', alScrollear, { passive: true });
    window.addEventListener('resize', alScrollear, { passive: true });
    return () => {
      if (pedido != null) cancelAnimationFrame(pedido);
      window.removeEventListener('scroll', alScrollear);
      window.removeEventListener('resize', alScrollear);
    };
  }, [view]);

  // ── Aparecer/esconderse: BORRADO el 2026-08-17 ────────────
  // Acá vivían cuatro efectos que existían sólo para calcular
  // `visiblePorScroll`: dirección de scroll (aparece bajando, se esconde tras
  // 500px de subida seguida), auto-ocultado tras 5s quieta, el revelado manual
  // por `cuponear:navbar-reveal`, y el pin/unpin que congelaba a los otros dos
  // durante el alta embebida de HeroPase.
  //
  // Se fueron con el cambio de criterio: la navbar ya no se esconde nunca, así
  // que no hay nada que revelar, esconder ni fijar. Lo que cambia sobre el hero
  // es su FORMA (sin contenedor) y eso lo decide `sobreHero`, que se apoya en
  // el ancla [data-navbar-shrink] que ya existía.
  //
  // Los emisores de HeroPase se borraron con ellos (2026-08-17): no quedan
  // `cuponear:navbar-pin`/`unpin`/`navbar-reveal` en ningún lado.


  // ── Subrayado según la sección que se está mirando ────────────
  // Las vistas marcan sus bloques con <section data-nav-section="aloj|gastro|
  // aventura|packs">. Se subraya el ítem del bloque que cruza la línea de
  // lectura (40% del alto de la ventana); fuera de esos bloques, nada.
  // Antes esto medía con getBoundingClientRect() en cada frame de scroll, o sea
  // forzaba un layout sincrónico por frame. Ahora lo resuelve el navegador: un
  // IntersectionObserver con un rootMargin que deja una franja de alto cero
  // justo sobre la línea de lectura — una sección "intersecta" exactamente
  // cuando la cruza. Cero trabajo en el hilo principal mientras se scrollea.
  const [seccionActiva, setSeccionActiva] = useState(null);
  useEffect(() => {
    const cruzando = new Set();
    const obs = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) cruzando.add(e.target);
          else cruzando.delete(e.target);
        }
        // Si hay solape, gana la primera en el orden del documento (mismo
        // criterio que el `break` del recorrido anterior).
        const activa = [...cruzando]
          .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))[0];
        setSeccionActiva(prev => {
          const val = activa?.dataset.navSection ?? null;
          return prev === val ? prev : val;
        });
      },
      { rootMargin: '-40% 0px -60% 0px', threshold: 0 }
    );

    // Las secciones se montan cuando llegan sus datos, así que hay que
    // reengancharlas: un MutationObserver avisa y se observa lo nuevo.
    const vistas = new WeakSet();
    const enganchar = () => {
      for (const nodo of document.querySelectorAll('[data-nav-section]')) {
        if (vistas.has(nodo)) continue;
        vistas.add(nodo);
        obs.observe(nodo);
      }
    };
    enganchar();
    const mo = new MutationObserver(enganchar);
    mo.observe(document.body, { childList: true, subtree: true });

    return () => { mo.disconnect(); obs.disconnect(); };
  }, [view]);

  // Sólo hay un dropdown montado por vez, así que una sola ref alcanza para los cuatro.
  const dropRef = useDropCentrado(openMenu || closingMenu, navRef);

  // Cierra el menú mobile con salida animada en vez de desmontarlo de golpe.
  const cerrarMobile = () => {
    setMobileClosing(true);
    clearTimeout(mobileCloseTimer.current);
    mobileCloseTimer.current = setTimeout(() => {
      setMobileOpen(false);
      setMobileClosing(false);
    }, 200);
  };
  useEffect(() => () => clearTimeout(mobileCloseTimer.current), []);

  const closeAll = () => { clearTimeout(closeTimer.current); setOpenMenu(null); if (mobileOpen) cerrarMobile(); };

  // nav: usa onNavbarNav si está disponible (con filtros), si no setView directo
  const nav = (v, opts = {}) => {
    if (onNavbarNav) onNavbarNav(v, opts);
    else setView(v);
    closeAll();
  };

  const navVerOferta = () => nav('marketplace', {});

  const esSocioOAdmin = session && (perfil?.negocio_id || perfil?.es_superadmin);
  // Solo socios/admins ya existentes ven "Publicar oferta" en la nav. Al turista
  // logueado (sin negocio) no se le muestra ese botón como anzuelo — su camino
  // para hacerse socio es "Publicá GRATIS" dentro del menú de usuario.
  const mostrarPublicarOferta = esSocioOAdmin;
  const nombreDisplay = esSocioOAdmin
    ? (perfil?.negocios?.nombre || perfil?.nombre || session?.user?.email || 'Mi cuenta')
    : (perfil?.nombre || session?.user?.email || 'Mi cuenta');
  const avatarUrl = esSocioOAdmin
    ? (perfil?.negocios?.foto_perfil || perfil?.negocios?.imagen_url || perfil?.avatar_url || null)
    : (perfil?.avatar_url || null);
  const avatarLetra = (nombreDisplay)[0]?.toUpperCase() || 'U';

  // Pastilla blanca: texto oscuro, marca en azul.
  const NAV_ON  = A.ink;
  const NAV_OFF = A.ink2;

  const navBtnSt = {
    background: 'none', border: 'none', fontSize: condensed ? 13 : 14, fontWeight: 500,
    color: NAV_OFF, cursor: 'pointer', padding: '4px 0', fontFamily: A.font,
    display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
    transition: `color .26s, font-size .35s ${NAV_EASE}`,
  };

  // El ítem de la sección que se está mirando va en color principal —la flechita
  // del select lo hereda por currentColor—; si no, sólo se oscurece al abrir.
  const colorNav = (name) => (seccionActiva === name ? A.primary : openMenu === name ? NAV_ON : NAV_OFF);

  return (
    <>
      <nav ref={navRef} className="navbar-flotante" aria-hidden={!revealed} style={{
        // Pastilla acotada y centrada: no se estira a todo el ancho.
        // Al pasar la primera sección (condensed) se estrecha y se achica.
        // Sobre el hero acompaña a la página (absolute): es una barra arriba
        // del documento, no una capa flotante. Clavada se quedaba encima del
        // contenido que sube —el selector de localidad le pasaba por debajo y
        // se encimaban—, y sin contenedor no hay nada que los separe. Al
        // cruzar a "Cuponeá" pasa a fixed y ahí sí es la pastilla que
        // acompaña el scroll.
        position: sobreHero ? 'absolute' : 'fixed',
        top: sobreHero ? NAV_TOP : (condensed ? NAV_TOP_MIN : NAV_TOP), left: 0, right: 0, zIndex: 1000,
        width: 'calc(100% - 44px)', maxWidth: sobreHero ? NAV_W_HERO : (condensed ? NAV_W_MIN : NAV_W_MAX), margin: '0 auto',
        borderRadius: 999,
        background: sobreHero ? 'transparent' : (condensed ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.80)'),
        // Un backdrop-filter sobre un elemento fixed se recalcula en CADA frame
        // de scroll de toda la página —tiene que volver a muestrear y
        // desenfocar lo que pasa por detrás—, así que es de lo poco que encarece
        // el scroll en todas las vistas por igual, no sólo donde está. De ahí
        // que el blur baje a 4px (el costo sigue al radio) y que se vaya el
        // saturate, que sumaba un pase de color por nada: sobre un fondo blanco
        // al 80-92% de opacidad casi no se veía.
        // Las dos propiedades ahora dicen lo mismo: estaban en 8px la estándar
        // y 22px la -webkit-, o sea que el vidrio se veía distinto según el
        // navegador (Chrome tomaba la primera, Safari la segunda).
        // Sobre el hero no hay vidrio que calcular: el blur de un elemento
        // fixed se re-evalúa en cada frame de scroll de toda la página, así
        // que apagarlo mientras no hay pastilla también es gratis en scroll.
        backdropFilter: sobreHero ? 'none' : 'blur(4px)',
        WebkitBackdropFilter: sobreHero ? 'none' : 'blur(4px)',
        border: sobreHero ? '1px solid transparent' : `1px solid ${A.line}`,
        boxShadow: sobreHero
          ? 'none'
          : condensed
            ? '0 14px 34px -12px rgba(11,16,32,0.22)'
            : scrolled ? '0 10px 30px -10px rgba(11,16,32,0.18)' : '0 6px 22px -12px rgba(11,16,32,0.14)',
        // Cross-fade con el ícono de esquina: cuando la navbar aparece (por
        // scroll o por click), se desliza .38s de -14px a su lugar. No es un
        // morph literal de las pastillas de imágenes en algo con forma de
        // navbar (eso implicaría coordinar geometría entre dos componentes
        // separados a ciegas, sin poder verlo andar); es un primer paso
        // razonable —fade + slide— para iterar desde ahí con feedback visual.
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(-14px)',
        pointerEvents: revealed ? 'auto' : 'none',
        // opacity/transform/box-shadow/background van siempre: las resuelve el
        // compositor y no cuestan layout. max-width y top se suman recién
        // cuando la navbar ya está en pantalla — ver animarTamano arriba.
        transition: animarTamano
          ? [
              transLayout('max-width'), transLayout('top'),
              'box-shadow .25s', 'background .25s',
              'opacity .38s ease', `transform .38s ${NAV_EASE}`,
            ].filter(Boolean).join(', ')
          : 'none',
        fontFamily: A.font,
      }}>
        <div style={{
          width: '100%', boxSizing: 'border-box',
          padding: condensed ? '0 16px' : '0 22px',
          height: condensed ? NAV_H_MIN : NAV_H_MAX,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          // Aire entre los tres grupos —logo | categorías | acciones— (2026-08-17).
          // Estaba en 14 y los tres bloques se leían como uno solo apretado.
          gap: condensed ? 32 : 48,
          // Mismo criterio que la pastilla de afuera: height y padding son
          // layout, así que sólo animan si la navbar ya estaba visible.
          transition: [transLayout('height'), transLayout('padding')].filter(Boolean).join(', ') || 'none',
        }}>

          {/* ── Logo + pill de región — UN solo grupo a la izquierda ──
              Los dos van adentro del mismo wrapper flex, no como hijos
              sueltos del row principal: ese row reparte con
              justifyContent:'space-between' asumiendo TRES grupos (logo |
              categorías | acciones); si la pill entrara como cuarto hijo
              suelto, el space-between le metería aire extra a los cuatro
              huecos por igual y separaría logo de pill tanto como de
              categorías — exactamente lo que no se quiere (tienen que
              leerse pegados). */}
          <div style={{ display: 'flex', alignItems: 'center', gap: condensed ? 10 : 14, flexShrink: 0 }}>
            {/* ── Logo — vuelve a ser sólo "ir al inicio" (2026-08-18) ──
                Antes abría SitiosDrop (la red de dominios). Se retiró: dos
                selectores geográficos a 40px de distancia —éste y la pill
                de región nueva, al lado— eran ruido, y SITIOS_RED lista
                DOMINIOS, no scopes de catálogo — es información de
                negocio, no navegación del viajero. La red sigue completa,
                sólo que ahora vive en Footer.jsx ("La red Cuponear"), que
                sí es un lugar de información institucional. */}
            <div style={{ position: 'relative' }}>
              {/* La marca es CUPONEaR, no el dominio (2026-08-10).
                  Sin fontWeight ni letter-spacing propios: los 700 y el
                  -0.03em estaban calzados para Inter; NauryzRedkeds ya
                  trae su peso y su espaciado dibujados en los glifos, y
                  forzarlos la deforma. El casing va tal cual —en esta
                  fuente mayúscula y minúscula son glifos distintos, no la
                  misma letra en dos tamaños—. */}
              <button
                onClick={() => {
                  nav('home');
                  // El panel "Regalá cuponeras" (GIFT PaSS PRO) vive DENTRO de
                  // la vista home —es un overlay de estado en HeroPase, no un
                  // `view` propio— así que si ya estabas en home con ese panel
                  // abierto, `nav('home')` no hacía nada: `setView('home')`
                  // sobre un view que ya es 'home' no dispara re-render, y el
                  // panel se quedaba ahí tapando todo (bug reportado: "el logo
                  // no lleva a la home"). Evento en window para cruzar de
                  // Navbar a HeroPase sin prop —el mismo patrón que
                  // cuponear:scroll-lock—: HeroPase lo escucha y cierra sus
                  // tres estados de overlay.
                  window.dispatchEvent(new Event('cuponear:home-reset'));
                }}
                aria-label="Cuponear — ir al inicio"
                style={{ ...navBtnSt, color: A.primary, gap: 6 }}
              >
                <span style={{
                  fontFamily: NAURYZ, lineHeight: 1,
                  /* −15% a pedido, sobre los 19/22 originales. */
                  fontSize: condensed ? 16.2 : 18.7,
                  transition: `font-size .35s ${NAV_EASE}`,
                }}>CUPONEaR</span>
              </button>
            </div>

            {/* Pill de región (2026-08-18) — scope persistente, no un
                filtro más. Ver src/lib/scope.js y SelectorRegion.jsx. */}
            <SelectorRegion condensed={condensed} />
          </div>

          {/* ── Desktop nav links ── */}
          <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: condensed ? 20 : 30, flexShrink: 0, transition: `gap .38s ${NAV_EASE}` }}>

            {/* Alojamientos. El wrapper externo se estira a todo el alto de la
                pastilla para colgar el subrayado del pie; el interno mantiene el
                anclaje del dropdown, que sigue saliendo del botón. */}
            <div style={{ position: 'relative', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }} ref={alojRef}
              onMouseEnter={() => hoverOpen('aloj')}
              onMouseLeave={hoverLeave}
            >
              <div style={{ position: 'relative' }}>
                <button onClick={() => nav('ofertas', { ofertasCategoria: 'alojamiento' })} style={{ ...navBtnSt, color: colorNav('aloj') }}>
                  Alojamientos <ChevD />
                </button>
                {(openMenu === 'aloj' || closingMenu === 'aloj') && (
                  <div ref={dropRef} style={{ ...DROP_BASE, left: 0, animation: closingMenu === 'aloj' ? 'dropFadeOut .18s ease-in forwards' : 'dropFade .15s ease-out' }}>
                    <AlojDrop onNavigate={(v, opts) => nav(v, opts)} onVerOferta={navVerOferta} />
                  </div>
                )}
              </div>
              <NavUnderline activo={seccionActiva === 'aloj'} />
            </div>

            {/* Salidas */}
            <div style={{ position: 'relative', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }} ref={gastroRef}
              onMouseEnter={() => hoverOpen('gastro')}
              onMouseLeave={hoverLeave}
            >
              <div style={{ position: 'relative' }}>
                <button onClick={() => nav('salidas')} style={{ ...navBtnSt, color: colorNav('gastro') }}>
                  Salidas <ChevD />
                </button>
                {(openMenu === 'gastro' || closingMenu === 'gastro') && (
                  <div ref={dropRef} style={{ ...DROP_BASE, left: '50%', transform: 'translateX(-50%)', animation: closingMenu === 'gastro' ? 'dropFadeCenterOut .18s ease-in forwards' : 'dropFadeCenter .15s ease-out' }}>
                    <GastroDrop onNavigate={(v, opts) => nav(v, opts)} />
                  </div>
                )}
              </div>
              <NavUnderline activo={seccionActiva === 'gastro'} />
            </div>

            {/* Aventura & Relax */}
            <div style={{ position: 'relative', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }} ref={aventRef}
              onMouseEnter={() => hoverOpen('aventura')}
              onMouseLeave={hoverLeave}
            >
              <div style={{ position: 'relative' }}>
                <button onClick={() => nav('ofertas', { ofertasCategoria: 'aventura_relax' })} style={{ ...navBtnSt, color: colorNav('aventura') }}>
                  Aventura & Relax <ChevD />
                </button>
                {(openMenu === 'aventura' || closingMenu === 'aventura') && (
                  <div ref={dropRef} style={{ ...DROP_BASE, left: '50%', transform: 'translateX(-50%)', animation: closingMenu === 'aventura' ? 'dropFadeCenterOut .18s ease-in forwards' : 'dropFadeCenter .15s ease-out' }}>
                    <AventDrop onNavigate={(v, opts) => nav(v, opts)} />
                  </div>
                )}
              </div>
              <NavUnderline activo={seccionActiva === 'aventura'} />
            </div>

            {/* Cupopacks — en negrita: es el producto propio de Cuponear, no
                una categoría más. Sin submenú (2026-08-18): lleva directo a
                la interna de los packs, como cualquier link de una sola
                intención. */}
            <div style={{ position: 'relative', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }} ref={packsRef}>
              <button onClick={() => nav('packs')} style={{ ...navBtnSt, fontWeight: 700, color: colorNav('packs') }}>
                Cupopacks
              </button>
              <NavUnderline activo={seccionActiva === 'packs'} />
            </div>

            {/* "Planes y suscripción" se borró el 2026-08-17. Era un rótulo
                genérico que no decía nada por sí solo y que además obligaba a
                preguntar la intención en el click. Sus tres caminos se mudaron
                enteros al desplegable de "Ingresar", que es donde el visitante
                anónimo ya va a buscar por dónde entrar. */}


          </div>

          {/* ── Derecha ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flex: 1 }}>

            {mostrarPublicarOferta && (
              <button
                onClick={() => { onPublicarOferta && onPublicarOferta(); closeAll(); }}
                className="navbar-publicar-btn"
                style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 999, padding: condensed ? '7px 16px' : '9px 20px', fontWeight: 700, fontSize: condensed ? 12.5 : 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: A.font, boxShadow: '0 2px 10px rgba(71,91,225,0.28)', transition: `background .15s, padding .38s ${NAV_EASE}` }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1a35cc'; }}
                onMouseLeave={e => { e.currentTarget.style.background = A.primary; }}
              >
                Publicar oferta
              </button>
            )}

            {/* Campanita: sólo con sesión, y antes del avatar. Los avisos son
                del usuario, así que viven junto a su identidad y no en la
                navegación del catálogo. */}
            {session && <AvisosBell session={session} onIr={destino => onNavbarNav?.(destino)} />}

            {session ? (
              <div style={{ position: 'relative' }} ref={userRef}>
                {/* Sólo avatar + flecha: el nombre se comía ancho de la pastilla
                    y ya está en el menú que se abre. Queda en el title/aria. */}
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  title={nombreDisplay}
                  aria-label={`Menú de ${nombreDisplay}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 10, fontFamily: A.font }}
                  onMouseEnter={e => e.currentTarget.style.background = A.bg}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${A.line}` }} />
                    : <div style={{ width: 32, height: 32, borderRadius: '50%', background: A.ink, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{avatarLetra}</div>
                  }
                  <span style={{ color: NAV_OFF, display: 'flex', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><ChevD /></span>
                </button>

                {userMenuOpen && (
                  <div style={{ ...DROP_BASE, right: 0, transform: 'none', minWidth: 220, padding: '8px 0', animation: 'dropFadeRight .15s ease-out' }}>
                    <UserMenuItem icon={CuponesIco} label="Mis cupones" onClick={() => { setView('mis-cupones'); setUserMenuOpen(false); }} />
                    <UserMenuItem icon={PaseIco}    label="Mi Pase"     onClick={() => { setView('mi-pase');     setUserMenuOpen(false); }} />
                    <UserMenuItem icon={HeartIco}    label="Favoritos"   onClick={() => { setView('favoritos');  setUserMenuOpen(false); }} />
                    <UserMenuItem icon={CarritoIco} label="Carrito"     onClick={() => { openDrawer();           setUserMenuOpen(false); }} />
                    {esSocioOAdmin ? (
                      <UserMenuItem icon={DashIco} label="Mi panel" onClick={() => { setView(perfil?.es_superadmin ? 'superadmin' : 'admin'); setUserMenuOpen(false); }} />
                    ) : (
                      <>
                        <UserMenuItem icon={PersonIco} label="Mi cuenta" onClick={() => { setView('home'); setUserMenuOpen(false); }} />
                        <UserMenuItem icon={StoreIco} label="Publicá una oferta" badge="GRATIS" sub="Es una cuenta de negocio, separada de tu perfil"
                          onClick={() => { onConvertirseSocio && onConvertirseSocio(); setUserMenuOpen(false); }} />
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: A.font }} className="navbar-auth">
                {/* "Ingresar" faltaba en desktop (2026-08-15). El menú mobile y
                    el footer siempre lo tuvieron, pero acá arriba el visitante
                    anónimo veía UN solo botón —"Publicá una oferta"—, que lleva
                    al alta de NEGOCIO. O sea que el turista que quería entrar a
                    su cuenta tenía que scrollear hasta el pie de la home para
                    encontrar la puerta. Son dos públicos distintos y ahora cada
                    uno tiene la suya.
                    Va en texto y no en pastilla: la única pastilla de la
                    derecha sigue siendo la del socio, que es la acción que el
                    negocio quiere empujar. Ingresar no compite, sólo tiene que
                    estar. */}
                {/* Botón blanco con desplegable (2026-08-17): absorbió los tres
                    caminos que estaban en "Planes y suscripción". El anónimo
                    tiene UNA sola puerta y adentro elige, en vez de dos rótulos
                    arriba compitiendo por el mismo click.
                    Blanco con borde y no relleno: la pastilla llena de la
                    derecha sigue siendo la del socio, que es la acción que el
                    negocio empuja. Sobre el hero el borde lo despega de la
                    imagen; dentro de la pastilla lo despega del blanco. */}
                <div style={{ position: 'relative' }} ref={ingresarRef}>
                  <button
                    onClick={() => setOpenMenu(m => (m === 'ingresar' ? null : 'ingresar'))}
                    aria-expanded={openMenu === 'ingresar'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#fff', color: A.ink, border: `1px solid ${A.line}`,
                      borderRadius: 999, cursor: 'pointer', fontFamily: A.font,
                      fontSize: condensed ? 12.5 : 13, fontWeight: 700,
                      padding: condensed ? '8px 16px' : '10px 20px',
                      whiteSpace: 'nowrap',
                      transition: `border-color .15s, padding .38s ${NAV_EASE}`,
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = A.primary}
                    onMouseLeave={e => e.currentTarget.style.borderColor = A.line}
                  >
                    Ingresar
                    <span style={{ display: 'flex', transform: openMenu === 'ingresar' ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><ChevD /></span>
                  </button>
                  {openMenu === 'ingresar' && (
                    <div style={{ ...DROP_BASE, right: 0, transform: 'none', animation: 'dropFadeRight .15s ease-out' }}>
                      {/* "Ya tengo cuenta" pasó a ir PRIMERO y con fondo propio
                          (2026-08-18, antes al pie y transparente): es la
                          minoría de los clicks, pero al que ya es de acá no
                          hay que hacerlo leer los tres caminos de alta para
                          encontrar el suyo. El tinte primary lo separa de las
                          tres filas de abajo, que están pensadas para leerse
                          como una lista, no como una acción puntual. */}
                      <div style={{ padding: 8 }}>
                        <button
                          onClick={() => { onLoginClick?.('ingresar'); setOpenMenu(null); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                            padding: '11px 12px', border: 'none', background: A.primarySoft, borderRadius: 12,
                            cursor: 'pointer', fontFamily: A.font, fontSize: 13.5, fontWeight: 700, color: A.primary,
                            transition: 'background .13s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#E2E6FA'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = A.primarySoft; }}
                        >
                          <PersonIco /> Ya tengo cuenta
                        </button>
                      </div>

                      <div style={{ height: 1, background: A.line, margin: '4px 8px' }} />

                      {/* La pregunta hace explícito lo que antes decía el
                          rótulo genérico "Planes y suscripción" sin decirlo:
                          en los tres casos de abajo la mayoría llega SIN
                          cuenta. "Empezá por acá" no es una categoría, es una
                          frase — por eso va en oración y no en mayúsculas de
                          etiqueta, como sí van los badges. */}
                      <div style={{ padding: '10px 14px 4px', fontSize: 12.5, fontWeight: 700, color: A.muted }}>
                        ¿Sos nuevo? Empezá por acá
                      </div>
                      <PlanesDrop onNavigate={(v, opts) => { nav(v, opts); setOpenMenu(null); }} />
                    </div>
                  )}
                </div>
                <button onClick={() => onRegisterClick?.('registrarse', 'comercial')}
                  style={{ background: A.ink, border: 'none', borderRadius: 999, fontSize: condensed ? 12.5 : 13, fontWeight: 700, color: '#fff', cursor: 'pointer', padding: condensed ? '8px 16px' : '10px 20px', fontFamily: A.font, whiteSpace: 'nowrap', transition: `background 0.15s, padding .38s ${NAV_EASE}` }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1c2333'}
                  onMouseLeave={e => e.currentTarget.style.background = A.ink}
                >Publicá una oferta</button>
              </div>
            )}

            {/* Hamburguesa/X de siempre (lucide). El cierre no desmonta el
                panel de golpe: cerrarMobile() lo anima saliendo
                (mobileMenuOut) y recién después lo saca del DOM. */}
            <button className="navbar-hamburger" onClick={() => (mobileOpen ? cerrarMobile() : setMobileOpen(true))}
              aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              style={{ background: 'none', border: `1px solid ${A.line}`, borderRadius: 10, width: 38, height: 38, display: 'none', placeItems: 'center', cursor: 'pointer', color: A.ink, flexShrink: 0 }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

        </div>
      </nav>

      {/* ── Mobile menu ──
          Se mantiene montado durante mobileClosing para que llegue a correr
          la animación de salida; mobileOpen/mobileClosing nunca están en
          true al mismo tiempo, así que la animación de entrada y la de
          salida no compiten. */}
      {(mobileOpen || mobileClosing) && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 40, background: '#fff', paddingTop: 64, overflowY: 'auto', fontFamily: A.font,
          animation: mobileClosing ? 'mobileMenuOut .2s ease-in forwards' : 'mobileMenuIn .22s ease-out',
        }}>
          <div style={{ padding: '20px 24px 48px' }}>
            {[
              { label: 'Alojamientos',     action: () => nav('ofertas', { ofertasCategoria: 'alojamiento' }) },
              { label: 'Salidas',          action: () => nav('salidas') },
              { label: 'Aventura & Relax', action: () => nav('ofertas', { ofertasCategoria: 'aventura_relax' }) },
              { label: 'Cupopacks',        action: () => nav('packs') },
              // En mobile no hay hover: el desplegable se abre en entradas planas.
              ...(session ? [] : [
                { label: 'Pase para viajeros',               action: () => nav('checkout-pase', {}) },
                { label: 'Me regalaron un PASS',  action: () => nav('canjear-regalo') },
                { label: 'Suscripción para hotelería', action: () => nav('checkout-hotelero') },
              ]),
            ].map(item => (
              <button key={item.label} onClick={item.action}
                style={{ width: '100%', textAlign: 'left', padding: '14px 0', border: 'none', borderBottom: `1px solid ${A.line}`, background: 'none', fontSize: 16, fontWeight: 500, color: A.ink, cursor: 'pointer', fontFamily: A.font }}>
                {item.label}
              </button>
            ))}
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {mostrarPublicarOferta && (
                <button onClick={() => { onPublicarOferta && onPublicarOferta(); closeAll(); }}
                  style={{ width: '100%', padding: '14px', border: 'none', borderRadius: 14, background: A.primary, fontSize: 15, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: A.font }}>
                  Publicar oferta
                </button>
              )}
              {session && !esSocioOAdmin && (
                <button onClick={() => { onConvertirseSocio && onConvertirseSocio(); closeAll(); }}
                  style={{ width: '100%', padding: '14px', border: `1.5px solid ${A.green}`, borderRadius: 14, background: A.greenSoft, fontSize: 15, fontWeight: 700, color: A.green, cursor: 'pointer', fontFamily: A.font }}>
                  Publicá GRATIS una oferta
                </button>
              )}
              {session ? (
                <>
                  <button onClick={() => { setView('mis-cupones'); closeAll(); }} style={mobileBtnSt()}>Mis cupones</button>
                  <button onClick={() => { setView('mi-pase'); closeAll(); }} style={mobileBtnSt()}>Mi Pase</button>
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
        @keyframes mobileMenuIn {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes mobileMenuOut {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-12px); }
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

const menuItemSt = (primary = false, muted = false) => ({
  width: '100%', textAlign: 'left', background: 'none', border: 'none',
  padding: '10px 18px', fontSize: 14, fontWeight: primary ? 600 : 500,
  color: primary ? '#475BE1' : muted ? '#6B7280' : '#0B1020',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
  fontFamily: "'Inter', system-ui, sans-serif",
});

const mobileBtnSt = () => ({
  width: '100%', padding: '14px', border: 'none', borderRadius: 14,
  background: '#0B1020', fontSize: 15, fontWeight: 600, color: '#fff',
  cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif",
});

function UserMenuItem({ icon: Icon, label, sub, badge, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ ...menuItemSt(), alignItems: sub ? 'flex-start' : 'center', background: hov ? '#F7F7F8' : 'none' }}
    >
      <Icon />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {label}
          {badge && (
            <span style={{ fontSize: 10, fontWeight: 800, color: A.green, background: A.greenSoft, borderRadius: 999, padding: '2px 7px', letterSpacing: '0.02em' }}>{badge}</span>
          )}
        </span>
        {sub && <span style={{ fontSize: 11, fontWeight: 500, color: A.muted }}>{sub}</span>}
      </span>
    </button>
  );
}

const HeartIco    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
const CarritoIco = () => <img src="/ico-disc.svg" alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />;
const PaseIco = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><path d="M7 15h4"/>
  </svg>
);
const CuponesIco = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M2 9V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2a3 3 0 0 0 0 6v2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-2a3 3 0 0 0 0-6Z"/>
    <path d="M13 5v14" strokeDasharray="2 3"/>
  </svg>
);
const PersonIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>;
const DashIco     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const LogoutIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const StoreIco    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/></svg>;
