// ============================================================
//  src/components/Navbar.jsx
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { locations } from '../data/mockData';
import { useCuponera } from '../lib/cuponera';
import { EXPERIENCIAS_SALIDAS, getCuponerasDestacadas } from '../lib/datos';

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
function MiniOfertaRow({ badge, badgeColor = '#10A36B', titulo, proveedorNombre = 'Villa Gesell', onNavigate, destino, opts = {} }) {
  return (
    <button
      onClick={() => onNavigate(destino || 'ofertas', opts)}
      style={{ width: '100%', textAlign: 'left', border: 'none', background: 'none', padding: '9px 0', cursor: 'pointer', fontFamily: A.font, display: 'flex', flexDirection: 'column', gap: 4, transition: 'opacity .12s' }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.72'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <div style={{ width: 18, height: 18, borderRadius: '50%', background: A.primarySoft, flexShrink: 0, display: 'grid', placeItems: 'center' }}>
          <span style={{ fontSize: 8, fontWeight: 800, color: A.primary }}>{(proveedorNombre)[0]}</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: A.ink2, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{proveedorNombre}</span>
      </div>
      <span style={{ display: 'inline-flex', alignSelf: 'flex-start', fontSize: 10.5, fontWeight: 700, color: '#fff', background: badgeColor, padding: '2px 8px', borderRadius: 999 }}>
        {badge}
      </span>
      <div style={{ fontSize: 12, fontWeight: 700, color: A.ink, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {titulo}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: 200, flexShrink: 0, justifyContent: 'flex-start' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: A.primary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: A.font, paddingLeft: 2, marginBottom: 4 }}>Más ofertas</span>
        <MiniOfertaRow
          badge="Cortesía"
          badgeColor="#10A36B"
          titulo="Desayuno buffet incluido para 2 personas"
          proveedorNombre="Hotel del Bosque"
          tokens={1}
          onNavigate={onNavigate}
          destino="ofertas"
          opts={{ ofertasCategoria: 'alojamiento' }}
        />
        <div style={{ height: 1, background: A.line }} />
        <MiniOfertaRow
          badge="-15%"
          badgeColor={A.primary}
          titulo="Descuento en estadías de más de 3 noches"
          proveedorNombre="Mar de las Pampas"
          tokens={2}
          onNavigate={onNavigate}
          destino="ofertas"
          opts={{ ofertasCategoria: 'alojamiento' }}
        />
        <div style={{ height: 1, background: A.line, marginBottom: 8 }} />
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: 200, flexShrink: 0 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: A.primary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: A.font, paddingLeft: 2, marginBottom: 4 }}>Más ofertas</span>
        <MiniOfertaRow
          badge="Cortesía"
          badgeColor="#10A36B"
          titulo="Postre y brindis de cortesía para tu mesa"
          proveedorNombre="Restaurante Amarena"
          tokens={1}
          onNavigate={onNavigate}
          destino="ofertas"
          opts={{ ofertasCategoria: 'salidas' }}
        />
        <div style={{ height: 1, background: A.line }} />
        <MiniOfertaRow
          badge="-20%"
          badgeColor={A.primary}
          titulo="Descuento en tragos y cocktails artesanales"
          proveedorNombre="Bar La Costa"
          tokens={1}
          onNavigate={onNavigate}
          destino="ofertas"
          opts={{ ofertasCategoria: 'salidas' }}
        />
        <div style={{ height: 1, background: A.line, marginBottom: 8 }} />
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, width: 200, flexShrink: 0, justifyContent: 'flex-start' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: A.primary, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: A.font, paddingLeft: 2, marginBottom: 4 }}>Más ofertas</span>
        <MiniOfertaRow
          badge="Cortesía"
          badgeColor="#10A36B"
          titulo="Paseo en kayak con guía al atardecer"
          proveedorNombre="Deportes Acuáticos VG"
          tokens={1}
          onNavigate={onNavigate}
          destino="ofertas"
          opts={{ ofertasCategoria: 'aventura_relax' }}
        />
        <div style={{ height: 1, background: A.line }} />
        <MiniOfertaRow
          badge="-25%"
          badgeColor={A.primary}
          titulo="Cabalgata nocturna por los médanos con fogón"
          proveedorNombre="Rancho El Viento"
          tokens={2}
          onNavigate={onNavigate}
          destino="ofertas"
          opts={{ ofertasCategoria: 'aventura_relax' }}
        />
        <div style={{ height: 1, background: A.line, marginBottom: 8 }} />
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
      <p style={{ fontSize: 10, fontWeight: 700, color: A.muted, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '8px 16px 4px', margin: 0, fontFamily: A.font }}>Otros sitios de la red</p>
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

// ─── Cuponeras ───────────────────────────────────────────────
const PACKS_ICONS = {
  'Todas las cuponeras': (
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
const PACKS_TIPOS = ['Todas las cuponeras', 'Románticos', 'Familias', 'Aventura', 'Relax & Bienestar', 'Salidas + alojamiento'];

// ═══════════════════════════════════════════════════════════
export default function Navbar({ scrolled, view, setView, session, perfil, onLoginClick, onRegisterClick, onLogout, onPublicarOferta, onConvertirseSocio, onNavbarNav }) {
  const [openMenu,    setOpenMenu]    = useState(null);
  const [closingMenu, setClosingMenu] = useState(null);
  const animTimer = useRef(null);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [userMenuOpen,setUserMenuOpen]= useState(false);
  const [cuponerasDestacadas, setCuponerasDestacadas] = useState([]);
  const { openDrawer } = useCuponera();

  const sitiosRef = useRef(null);
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

  // Cargar cuponeras destacadas
  useEffect(() => {
    (async () => {
      try {
        const destacadas = await getCuponerasDestacadas();
        setCuponerasDestacadas(destacadas);
      } catch (e) {
        console.error('Error cargando cuponeras destacadas:', e);
      }
    })();
  }, []);

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
          </div>

          {/* ── Desktop nav links ── */}
          <div className="navbar-links" style={{ display: 'flex', alignItems: 'center', gap: 20, flex: 1, paddingLeft: 8 }}>

            {/* Sitios de la red — gesell.ar + dominios */}
            <div style={{ position: 'relative' }} ref={sitiosRef}
              onMouseEnter={() => hoverOpen('sitios')}
              onMouseLeave={hoverLeave}
            >
              <button onClick={() => nav('home')} style={{ ...navBtnSt, color: A.primary, fontWeight: 600 }}>
                {siteHost()} <ChevD />
              </button>
              {(openMenu === 'sitios' || closingMenu === 'sitios') && (
                <div style={{ ...DROP_BASE, left: 0, animation: closingMenu === 'sitios' ? 'dropFadeOut .18s ease-in forwards' : 'dropFade .15s ease-out' }}>
                  <SitiosDrop />
                </div>
              )}
            </div>

            {/* Alojamientos */}
            <div style={{ position: 'relative' }} ref={alojRef}
              onMouseEnter={() => hoverOpen('aloj')}
              onMouseLeave={hoverLeave}
            >
              <button onClick={() => nav('ofertas', { ofertasCategoria: 'alojamiento' })} style={{ ...navBtnSt, color: openMenu === 'aloj' ? A.primary : A.ink2 }}>
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
              <button onClick={() => nav('ofertas', { ofertasCategoria: 'salidas' })} style={{ ...navBtnSt, color: openMenu === 'gastro' ? A.primary : A.ink2 }}>
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
              <button onClick={() => nav('ofertas', { ofertasCategoria: 'aventura_relax' })} style={{ ...navBtnSt, color: openMenu === 'aventura' ? A.primary : A.ink2 }}>
                aventura & relax <ChevD />
              </button>
              {(openMenu === 'aventura' || closingMenu === 'aventura') && (
                <div style={{ ...DROP_BASE, left: '50%', transform: 'translateX(-50%)', animation: closingMenu === 'aventura' ? 'dropFadeCenterOut .18s ease-in forwards' : 'dropFadeCenter .15s ease-out' }}>
                  <AventDrop onNavigate={(v, opts) => nav(v, opts)} />
                </div>
              )}
            </div>

            {/* Separador visual */}
            <div style={{ width: 1, height: 18, background: A.line, margin: '0 2px', flexShrink: 0 }} />

            {/* Cuponeras */}
            <div style={{ position: 'relative' }} ref={packsRef}
              onMouseEnter={() => hoverOpen('packs')}
              onMouseLeave={hoverLeave}
            >
              <button style={{ ...navBtnSt, fontWeight: 600, color: openMenu === 'packs' ? A.primary : A.ink }}>
                viajá con packs <ChevD />
              </button>
              {(openMenu === 'packs' || closingMenu === 'packs') && (
                <div style={{ ...DROP_BASE, left: '50%', transform: 'translateX(-50%)', minWidth: 220, animation: closingMenu === 'packs' ? 'dropFadeCenterOut .18s ease-in forwards' : 'dropFadeCenter .15s ease-out' }}>
                  <div style={{ padding: '8px 0' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: A.muted, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '8px 16px 4px', margin: 0, fontFamily: A.font }}>Cuponeras</p>
                    {cuponerasDestacadas.map(cuponera => (
                      <button key={cuponera.id} onClick={() => openDrawer() && nav('home')}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 400, color: A.ink2, cursor: 'pointer', textAlign: 'left', fontFamily: A.font }}
                        onMouseEnter={e => { e.currentTarget.style.background = A.bg; e.currentTarget.style.color = A.primary; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = A.ink2; }}
                      >
                        <span style={{ opacity: 0.7, flexShrink: 0, display: 'flex' }}>📦</span>
                        {cuponera.title}
                      </button>
                    ))}
                    <div style={{ height: 1, background: A.line, margin: '4px 16px' }} />
                    <button onClick={() => nav('packs')}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 16px', border: 'none', background: 'transparent', fontSize: 13, fontWeight: 600, color: A.primary, cursor: 'pointer', textAlign: 'left', fontFamily: A.font }}
                      onMouseEnter={e => { e.currentTarget.style.background = A.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <span style={{ opacity: 0.7, flexShrink: 0, display: 'flex' }}>📦</span>
                      Ver todas las cuponeras
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ── Derecha ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>

            {mostrarPublicarOferta && (
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
                <button onClick={() => onLoginClick && onLoginClick('ingresar')}
                  style={{ background: 'none', border: 'none', fontSize: 13, fontWeight: 500, color: A.ink2, cursor: 'pointer', padding: '6px 6px', fontFamily: A.font, whiteSpace: 'nowrap' }}
                  onMouseEnter={e => e.currentTarget.style.color = A.primary}
                  onMouseLeave={e => e.currentTarget.style.color = A.ink2}
                >Ingresar</button>
                <button onClick={() => onRegisterClick && onRegisterClick('registrarse')}
                  style={{ background: A.ink, border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer', padding: '8px 16px', fontFamily: A.font, whiteSpace: 'nowrap', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1c2333'}
                  onMouseLeave={e => e.currentTarget.style.background = A.ink}
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
              { label: 'alojamientos',     action: () => nav('ofertas', { ofertasCategoria: 'alojamiento' }) },
              { label: 'salidas',          action: () => nav('ofertas', { ofertasCategoria: 'salidas' }) },
              { label: 'aventura & relax', action: () => nav('ofertas', { ofertasCategoria: 'aventura_relax' }) },
              { label: 'packs inteligentes', action: () => nav('packs') },
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

// ─── Helpers ─────────────────────────────────────────────────
function NavSep() {
  return <div style={{ width: 1, height: 16, background: '#d8d8e4', margin: '0 2px', flexShrink: 0 }} />;
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
const CuponeraIco = () => <img src="/ico-disc.svg" alt="" style={{ width: 20, height: 20, flexShrink: 0 }} />;
const PersonIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>;
const DashIco     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
const LogoutIco   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const StoreIco    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M3 9a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0"/><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/></svg>;
