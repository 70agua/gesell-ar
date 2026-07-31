// ============================================================
//  src/components/Navbar.jsx
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { locations } from '../data/mockData';
import { FAMILIAS_PACK, MAS_PACKS } from '../lib/familiasPack';
import { useCarrito } from '../lib/carrito';
import { EXPERIENCIAS_SALIDAS } from '../lib/datos';
import Icono from './Icono';

const A = {
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  bg:          '#F7F7F8',
  green:       '#10A36B',
  greenSoft:   '#E7F9F0',
  font:        "'Inter', system-ui, sans-serif",
};

// ─── Medidas de la pastilla: expandida (max) / estrechada (min) ──
const NAV_TOP     = 12;
const NAV_TOP_MIN = 8;
const NAV_W_MAX   = 1240;
const NAV_W_MIN   = 1020;
const NAV_H_MAX   = 56;
const NAV_H_MIN   = 48;
const NAV_EASE    = 'cubic-bezier(.4,0,.2,1)';
// Scroll a partir del cual se condensa la navbar en las vistas sin ancla
// (listados): alcanza para dejar atrás el título del listado.
const SHRINK_FALLBACK_Y = 150;

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
function siteHost() {
  return typeof window !== 'undefined'
    ? window.location.hostname.replace('www.', '').replace('localhost', 'gesell.ar')
    : 'gesell.ar';
}

// ─── Otros sitios de la red ──────────────────────────────────
const SITIOS_RED = [
  'marazul.ar',
  'lasgaviotas.ar',
  'madariaga.ar',
  'costaesmeralda.ar',
  'alquileresmardelplata.ar',
  'costaatlantica.ar',
];

function SitiosDrop() {
  const host = siteHost();
  return (
    <div style={{ padding: '8px 0', minWidth: 220 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, padding: '10px 16px 4px' }}>
        <span style={{ fontFamily: "'NauryzRedkeds', 'Inter', sans-serif", color: A.primary, fontSize: 17, lineHeight: 1 }}>CUPONEaR</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: A.muted, letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: A.font }}>es:</span>
      </div>
      {SITIOS_RED.filter(d => d !== host).map(dominio => (
        <a key={dominio} href={`https://${dominio}`} target="_blank" rel="noopener noreferrer"
          style={{ width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', fontSize: 14, fontWeight: 500, color: A.ink2, textDecoration: 'none', cursor: 'pointer', fontFamily: A.font }}
          onMouseEnter={e => { e.currentTarget.style.background = A.bg; e.currentTarget.style.color = A.primary; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = A.ink2; }}
        >
          <span style={{ opacity: 0.6, flexShrink: 0, display: 'flex' }}>{EXT_ICON}</span>
          {dominio}
        </a>
      ))}
    </div>
  );
}


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
    titulo: 'Pase turista',
    bajada: 'Comprá tu pase y usá los descuentos que se ofrecen en la zona.',
    vista: 'checkout-pase',
    opts: { preguntarPerfil: true },
    // El mismo sello del hero, con la misma inclinación.
    icono: '/gesell-pass-03.svg',
    girado: true,
  },
  {
    id: 'regalo',
    titulo: 'Me regalaron un Pase',
    bajada: 'Activala con el código de 6 números.',
    vista: 'canjear-regalo',
    opts: {},
    icono: '/iconos/regalo.json',
    lado: 41,
  },
  {
    id: 'hoteleria',
    titulo: 'Suscripción para hotelería',
    bajada: 'Regalá el Pase a todos tus turistas.',
    vista: 'checkout-hotelero',
    opts: {},
    // La misma casita que el bloque de alojamiento de la home.
    icono: '/iconos/cabania.json',
    lado: 37,
  },
];

function PlanesDrop({ onNavigate }) {
  return (
    <div style={{ padding: 8, width: 340 }}>
      {PLANES_OPCIONES.map(({ id, titulo, bajada, vista, opts, icono, girado, lado = 46 }) => (
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
              azul claro se ensuciaban. El sello del pase va girado como en el
              hero; los Lottie corren solos (`animar`), sin esperar el hover.
              `lado` afina cada dibujo por separado: vienen con distinto aire
              interno y al mismo tamaño no pesan lo mismo. La casilla queda fija
              en 46 para que los tres textos arranquen alineados. */}
          <span style={{ flexShrink: 0, display: 'grid', placeItems: 'center', width: 46, height: 46 }}>
            <Icono src={icono} animar={!girado}
              style={girado
                ? { width: 55, height: 'auto', display: 'block', transform: 'rotate(-25deg)' }
                : { width: lado, height: lado, display: 'block' }} />
          </span>
          <span style={{ minWidth: 0 }}>
            <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: A.ink, lineHeight: 1.3 }}>{titulo}</span>
            <span style={{ display: 'block', fontSize: 12.5, color: A.muted, lineHeight: 1.45, marginTop: 2 }}>{bajada}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── Dropdown de Cupopacks ─────
// Todo el desplegable va al 75%: ancho, paddings, gaps e íconos. El cuerpo de
// letra NO escala — a 12,5px ya estaba en el piso legible.
function PacksDrop({ onNavigate }) {
  return (
    <div style={{ padding: '23px 23px 21px', width: 555 }}>
      {/* Sin pop de CSS sobre el ícono: la única animación del hover es la que
          trae el propio Lottie (ver components/Icono.jsx). */}
      <div style={{ fontSize: 14, fontWeight: 500, color: A.primary, marginBottom: 13, fontFamily: A.font }}>Experiencias con alojamiento incluído:</div>
      {/* Íconos grandes, uno al lado del otro, con el título debajo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        {[...FAMILIAS_PACK, MAS_PACKS].map(f => (
          <button key={f.label} onClick={() => onNavigate('packs', { packFamilia: f.id })}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, border: 'none', background: 'transparent', padding: '14px 5px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: A.font, fontSize: 12.5, fontWeight: 600, lineHeight: 1.3, textAlign: 'center', color: A.ink2, transition: 'background .13s, color .13s' }}
            onMouseEnter={e => { e.currentTarget.style.background = A.bg; e.currentTarget.style.color = A.primary; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = A.ink2; }}
          >
            <Icono src={f.icono} hoverEn="padre" style={{ width: 48, height: 48, display: 'block' }} />
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
export default function Navbar({ scrolled, view, setView, session, perfil, onLoginClick, onRegisterClick, onLogout, onPublicarOferta, onConvertirseSocio, onNavbarNav }) {
  const [openMenu,    setOpenMenu]    = useState(null);
  const [closingMenu, setClosingMenu] = useState(null);
  const animTimer = useRef(null);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [userMenuOpen,setUserMenuOpen]= useState(false);
  const [condensed,   setCondensed]   = useState(false);
  const { openDrawer } = useCarrito();

  const sitiosRef = useRef(null);
  const alojRef   = useRef(null);
  const gastroRef = useRef(null);
  const aventRef  = useRef(null);
  const packsRef  = useRef(null);
  const planesRef = useRef(null);
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
  useEffect(() => {
    const linea = NAV_TOP + NAV_H_MAX; // borde inferior de la pastilla expandida
    const anchor = document.querySelector('[data-navbar-shrink]');

    if (!anchor) {
      const onScroll = () => setCondensed(window.scrollY > SHRINK_FALLBACK_Y);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      return () => window.removeEventListener('scroll', onScroll);
    }

    const obs = new IntersectionObserver(
      ([e]) => setCondensed(e.boundingClientRect.top <= linea),
      { rootMargin: `-${linea}px 0px 0px 0px`, threshold: 0 }
    );
    obs.observe(anchor);
    return () => obs.disconnect();
  }, [view]);

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

  const closeAll = () => { clearTimeout(closeTimer.current); setOpenMenu(null); setMobileOpen(false); };

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
  const NAV_SEP = A.line;

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
      <nav ref={navRef} className="navbar-flotante" style={{
        // Pastilla acotada y centrada: no se estira a todo el ancho.
        // Al pasar la primera sección (condensed) se estrecha y se achica.
        position: 'fixed', top: condensed ? NAV_TOP_MIN : NAV_TOP, left: 0, right: 0, zIndex: 1000,
        width: 'calc(100% - 44px)', maxWidth: condensed ? NAV_W_MIN : NAV_W_MAX, margin: '0 auto',
        borderRadius: 999,
        background: condensed ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.80)',
        backdropFilter: 'blur(8px) saturate(150%)',
        WebkitBackdropFilter: 'blur(22px) saturate(150%)',
        border: `1px solid ${A.line}`,
        boxShadow: condensed
          ? '0 14px 34px -12px rgba(11,16,32,0.22)'
          : scrolled ? '0 10px 30px -10px rgba(11,16,32,0.18)' : '0 6px 22px -12px rgba(11,16,32,0.14)',
        transition: `max-width .38s ${NAV_EASE}, top .38s ${NAV_EASE}, box-shadow .25s, background .25s`,
        fontFamily: A.font,
      }}>
        <div style={{
          width: '100%', boxSizing: 'border-box',
          padding: condensed ? '0 16px' : '0 22px',
          height: condensed ? NAV_H_MIN : NAV_H_MAX,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14,
          transition: `height .38s ${NAV_EASE}, padding .38s ${NAV_EASE}`,
        }}>

          {/* ── Logo — el dominio del sitio es la marca, con su select de red ── */}
          <div style={{ position: 'relative', flexShrink: 0, flex: 1 }} ref={sitiosRef}
            onMouseEnter={() => hoverOpen('sitios')}
            onMouseLeave={hoverLeave}
          >
            <button
              onClick={() => nav('home')}
              style={{
                ...navBtnSt, color: A.primary, fontWeight: 700,
                fontSize: condensed ? 17 : 19, letterSpacing: '-0.03em', gap: 6,
              }}
            >
              {siteHost()} <ChevD />
            </button>
            {(openMenu === 'sitios' || closingMenu === 'sitios') && (
              <div style={{ ...DROP_BASE, left: 0, animation: closingMenu === 'sitios' ? 'dropFadeOut .18s ease-in forwards' : 'dropFade .15s ease-out' }}>
                <SitiosDrop />
              </div>
            )}
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

            {/* Cupopacks — en negrita: es el
                producto propio de Cuponear, no una categoría más. */}
            <div style={{ position: 'relative', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }} ref={packsRef}
              onMouseEnter={() => hoverOpen('packs')}
              onMouseLeave={hoverLeave}
            >
              <div style={{ position: 'relative' }}>
                <button onClick={() => nav('packs')} style={{ ...navBtnSt, fontWeight: 700, color: colorNav('packs') }}>
                  Cupopacks <ChevD />
                </button>
                {(openMenu === 'packs' || closingMenu === 'packs') && (
                  <div ref={dropRef} style={{ ...DROP_BASE, left: '50%', transform: 'translateX(-50%)', animation: closingMenu === 'packs' ? 'dropFadeCenterOut .18s ease-in forwards' : 'dropFadeCenter .15s ease-out' }}>
                    <PacksDrop onNavigate={(v, opts) => nav(v, opts)} />
                  </div>
                )}
              </div>
              <NavUnderline activo={seccionActiva === 'packs'} />
            </div>

            {/* Planes y suscripción — pricing/contratación, paso previo al
                registro: al que ya tiene cuenta no le decimos nada nuevo.
                Abre en dos, porque son dos intenciones que no se parecen: el
                que va a pagar algo y el que llega con un código en la mano. */}
            {!session && (
              <>
                <div style={{ width: 1, height: 18, background: NAV_SEP, margin: '0 2px', flexShrink: 0 }} />
                <div style={{ position: 'relative', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }} ref={planesRef}
                  onMouseEnter={() => hoverOpen('planes')}
                  onMouseLeave={hoverLeave}
                >
                  <div style={{ position: 'relative' }}>
                    <button onClick={() => nav('checkout-pase', { preguntarPerfil: true })} style={{ ...navBtnSt, fontWeight: 700, color: A.primary }}>
                      Planes y suscripción <ChevD />
                    </button>
                    {(openMenu === 'planes' || closingMenu === 'planes') && (
                      <div ref={dropRef} style={{ ...DROP_BASE, right: 0, animation: closingMenu === 'planes' ? 'dropFadeCenterOut .18s ease-in forwards' : 'dropFadeCenter .15s ease-out' }}>
                        <PlanesDrop onNavigate={(v, opts) => nav(v, opts)} />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

          </div>

          {/* ── Derecha ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flex: 1 }}>

            {mostrarPublicarOferta && (
              <button
                onClick={() => { onPublicarOferta && onPublicarOferta(); closeAll(); }}
                className="navbar-publicar-btn"
                style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 999, padding: condensed ? '7px 16px' : '9px 20px', fontWeight: 700, fontSize: condensed ? 12.5 : 13, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: A.font, boxShadow: '0 2px 10px rgba(37,69,230,0.28)', transition: `background .15s, padding .38s ${NAV_EASE}` }}
                onMouseEnter={e => { e.currentTarget.style.background = '#1a35cc'; }}
                onMouseLeave={e => { e.currentTarget.style.background = A.primary; }}
              >
                Publicar oferta
              </button>
            )}

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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: A.font }} className="navbar-auth">
                {/* Única acción a la derecha para el visitante anónimo: entra
                    por el registro/login de siempre (LoginView), no por el
                    atajo de convertir una cuenta que todavía no existe. */}
                <button onClick={() => onRegisterClick?.('registrarse', 'comercial')}
                  style={{ background: A.ink, border: 'none', borderRadius: 999, fontSize: condensed ? 12.5 : 13, fontWeight: 700, color: '#fff', cursor: 'pointer', padding: condensed ? '8px 16px' : '10px 20px', fontFamily: A.font, whiteSpace: 'nowrap', transition: `background 0.15s, padding .38s ${NAV_EASE}` }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1c2333'}
                  onMouseLeave={e => e.currentTarget.style.background = A.ink}
                >Publicá una oferta</button>
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
              { label: 'Alojamientos',     action: () => nav('ofertas', { ofertasCategoria: 'alojamiento' }) },
              { label: 'Salidas',          action: () => nav('salidas') },
              { label: 'Aventura & Relax', action: () => nav('ofertas', { ofertasCategoria: 'aventura_relax' }) },
              { label: 'Cuponeras',        action: () => nav('packs') },
              // En mobile no hay hover: el desplegable se abre en entradas planas.
              ...(session ? [] : [
                { label: 'Pase turista',               action: () => nav('checkout-pase', { preguntarPerfil: true }) },
                { label: 'Me regalaron un Pase',  action: () => nav('canjear-regalo') },
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

const menuItemSt = (primary = false, muted = false) => ({
  width: '100%', textAlign: 'left', background: 'none', border: 'none',
  padding: '10px 18px', fontSize: 14, fontWeight: primary ? 600 : 500,
  color: primary ? '#2545E6' : muted ? '#6B7280' : '#0B1020',
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
const PersonIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>;
const DashIco     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const LogoutIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const StoreIco    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/></svg>;
