// ============================================================
//  src/views/PacksListView.jsx — Listado editorial de packs
// ============================================================
import React from 'react';
import { Star, Check, ArrowRight, ChevronRight } from 'lucide-react';
import { mockPacks } from '../data/mockData';

const C = {
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  green:       '#10A36B',
  yellow:      '#FFC93C',
};

const BADGE_PALETTE = {
  'Más Vendido':  { accent: '#E63946', accentSoft: '#FEE2E2' },
  'Eco-Aventura': { accent: '#059669', accentSoft: '#D1FAE5' },
  'Gourmet':      { accent: '#D97706', accentSoft: '#FEF3C7' },
};

// Datos editoriales por pack (descripción + includes + stats)
const PACK_META = {
  1: {
    tagline: 'Para los que necesitan desconectarse juntos.',
    description: 'Dos noches en hotel frente al mar, cena a la luz de las velas, circuito de spa y el espumante esperándote en la habitación. Todo coordinado, sin sorpresas.',
    includes: ['2 noches de alojamiento', 'Cena romántica para 2', 'Circuito de spa 2hs', 'Espumante de bienvenida', 'Estacionamiento sin cargo'],
    stats: { dias: 3, noches: 2, personas: 2, rating: 4.9, resenas: 128 },
  },
  2: {
    tagline: 'Para los que prefieren el bosque a la pileta.',
    description: 'Cabaña en el pinar, excursión 4x4 por los médanos, picnic artesanal y todas las noches bajo las estrellas que quieras. Naturaleza sin renunciar al confort.',
    includes: ['Cabaña en el bosque', 'Excursión 4x4 por médanos', 'Picnic gourmet incluido', 'Fogón nocturno', 'Cupones de gastronomía'],
    stats: { dias: 3, noches: 2, personas: 4, rating: 4.8, resenas: 74 },
  },
  3: {
    tagline: 'Para los que viajan con el estómago.',
    description: 'Un recorrido gastronómico por los mejores sabores de la zona. Apart céntrico, degustación de vinos, churros históricos, cabalgata al atardecer y más.',
    includes: ['Apart en zona céntrica', 'Degustación de vinos', 'Churros El Topo incluidos', 'Cabalgata al atardecer', 'Cupones en 5 socios gastronómicos'],
    stats: { dias: 3, noches: 2, personas: 2, rating: 4.7, resenas: 91 },
  },
};

function PackRow({ pack, onOpenPack, reverse }) {
  const meta    = PACK_META[pack.id] || {};
  const palette = BADGE_PALETTE[pack.badge] || { accent: C.primary, accentSoft: C.primarySoft };
  const mainImg = pack.images?.[0] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80';
  const sideImg = pack.images?.[1] || mainImg;
  const precioOriginal = Math.round((pack.price || 145000) * 1.25);
  const descPct = Math.round(((precioOriginal - pack.price) / precioOriginal) * 100);

  return (
    <article
      style={{
        display: 'grid',
        gridTemplateColumns: reverse ? '1fr 1.2fr' : '1.2fr 1fr',
        gap: 0,
        minHeight: 460,
        borderRadius: 28,
        overflow: 'hidden',
        border: `1px solid ${C.line}`,
        background: '#fff',
      }}
    >
      {/* ── Imagen (alterna lado) ── */}
      {!reverse && (
        <ImageSide mainImg={mainImg} sideImg={sideImg} palette={palette} pack={pack} />
      )}

      {/* ── Contenido ── */}
      <div style={{ padding: '48px 52px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          {/* Badge */}
          {pack.badge && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 20, background: palette.accentSoft, color: palette.accent }}>
              <Star size={10} fill={palette.accent} color={palette.accent} /> {pack.badge}
            </div>
          )}

          {/* Título */}
          <h2 style={{ fontSize: 'clamp(28px,3vw,42px)', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.05, margin: '0 0 8px', color: C.ink }}>
            {pack.title}
          </h2>
          <p style={{ fontSize: 16, color: palette.accent, fontWeight: 600, margin: '0 0 4px' }}>
            {pack.subtitle}
          </p>
          {meta.tagline && (
            <p style={{ fontSize: 14, color: C.muted, fontStyle: 'italic', margin: '0 0 24px' }}>
              {meta.tagline}
            </p>
          )}

          {/* Descripción */}
          <p style={{ fontSize: 15, color: C.ink2, lineHeight: 1.7, margin: '0 0 24px' }}>
            {meta.description}
          </p>

          {/* Includes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
            {(meta.includes || []).map((inc, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: C.ink2 }}>
                <Check size={14} color={C.green} strokeWidth={2.5} style={{ flexShrink: 0 }} />
                {inc}
              </div>
            ))}
          </div>

          {/* Stats */}
          {meta.stats && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, paddingTop: 20, borderTop: `1px solid ${C.line}`, marginBottom: 28 }}>
              {[
                { label: `${meta.stats.dias} días / ${meta.stats.noches} noches` },
                { label: `Hasta ${meta.stats.personas} personas` },
                { label: `★ ${meta.stats.rating}`, sub: `(${meta.stats.resenas} reseñas)` },
              ].map((s, i) => (
                <div key={i} style={{ fontSize: 13, color: C.ink2, fontWeight: 500 }}>
                  {s.label}
                  {s.sub && <span style={{ color: C.muted, fontWeight: 400 }}> {s.sub}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Precio + CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Pack completo desde</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-0.03em', color: C.ink }}>${pack.price.toLocaleString('es-AR')}</span>
              <span style={{ fontSize: 14, textDecoration: 'line-through', color: C.muted }}>${precioOriginal.toLocaleString('es-AR')}</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: palette.accentSoft, color: palette.accent }}>-{descPct}%</span>
            </div>
          </div>
          <button
            onClick={() => onOpenPack && onOpenPack(pack)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 26px', borderRadius: 16, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none', background: C.ink, color: '#fff', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = C.primary}
            onMouseLeave={e => e.currentTarget.style.background = C.ink}
          >
            Ver pack <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Imagen lado derecho */}
      {reverse && (
        <ImageSide mainImg={mainImg} sideImg={sideImg} palette={palette} pack={pack} />
      )}
    </article>
  );
}

function ImageSide({ mainImg, sideImg, palette, pack }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', minHeight: 460 }}>
      {/* Imagen principal */}
      <img src={mainImg} alt={pack.title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
      {/* Overlay sutil */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(11,16,32,0.25) 0%, transparent 60%)' }} />
      {/* Segunda foto en chip superpuesto */}
      {pack.images?.[1] && (
        <div style={{ position: 'absolute', bottom: 20, right: 20, width: 120, height: 90, borderRadius: 14, overflow: 'hidden', border: '3px solid #fff', boxShadow: '0 8px 24px rgba(11,16,32,0.2)' }}>
          <img src={pack.images[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      {/* Badge flotante */}
      {pack.badge && (
        <div style={{ position: 'absolute', top: 20, left: 20, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', background: palette.accentSoft, color: palette.accent }}>
          {pack.badge}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════
export default function PacksListView({ onBack, onOpenPack }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: "'Geist', system-ui, sans-serif", paddingTop: 70 }}>

      {/* ── Header ── */}
      <div style={{ background: C.ink, color: '#fff' }}>
        <div style={{ maxWidth: 1328, margin: '0 auto', padding: '56px 40px 60px' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 28 }}>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: 0 }}>Inicio</button>
            <ChevronRight size={12} />
            <span>Packs</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'end' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                Aventura & Relax curadas
              </div>
              <h1 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.0, margin: 0, color: '#fff' }}>
                Packs Cuponear
              </h1>
            </div>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, margin: 0 }}>
              Alojamiento, gastronomía y experiencias únicas, todo coordinado y confirmado. Llegás y solo pensás en disfrutar.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, marginTop: 36, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {[
              { num: mockPacks.length, label: 'packs disponibles' },
              { num: '100%', label: 'coordinados de antemano' },
              { num: '+293', label: 'viajeros satisfechos' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{s.num}</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Lista de packs ── */}
      <div style={{ maxWidth: 1328, margin: '0 auto', padding: '56px 40px 80px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {mockPacks.map((pack, i) => (
          <PackRow
            key={pack.id}
            pack={pack}
            onOpenPack={onOpenPack}
            reverse={i % 2 !== 0}
          />
        ))}
      </div>

    </div>
  );
}
