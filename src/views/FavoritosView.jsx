// ============================================================
//  src/views/FavoritosView.jsx — Mis favoritos
// ============================================================
import React from 'react';
import { ArrowLeft, Heart } from 'lucide-react';
import AccommodationCard from '../components/AccommodationCard';
import OfertaCard from '../components/OfertaCard';
import { useFavoritos } from '../lib/favoritos';

const A = {
  primary: '#475BE1', primarySoft: '#EEF0FD',
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280',
  line: '#E7E9EE', bg: '#F7F7F8', font: "'Inter', system-ui, sans-serif",
};

function Seccion({ titulo, children }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: A.font, fontSize: 18, fontWeight: 800, color: A.ink, margin: '0 0 16px', letterSpacing: '-0.02em' }}>{titulo}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 18 }}>
        {children}
      </div>
    </div>
  );
}

export default function FavoritosView({ accommodations = [], dining = [], promos = [], onOpenDetail, onOpenOferta, onBack }) {
  const ctx = useFavoritos();
  const idSet = new Set((ctx?.ids || []).map(String));
  const isFav = (id) => idSet.has(String(id));

  const favAloj   = accommodations.filter(a => isFav(a.id));
  const favSalidas = dining.filter(d => isFav(d.id));
  const favPromos = promos.filter(p => isFav(p.id));
  const total = favAloj.length + favSalidas.length + favPromos.length;

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: A.font, paddingTop: 92 }}>
      <div style={{ maxWidth: 'var(--site-max)', margin: '0 auto', padding: '0 var(--site-pad) 64px' }}>

        {/* Header */}
        <button onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: A.primary, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: A.font, padding: 0, marginBottom: 18 }}>
          <ArrowLeft size={16} /> Volver
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <h1 style={{ fontFamily: A.font, fontSize: 34, fontWeight: 800, color: A.ink, margin: 0, letterSpacing: '-0.03em' }}>Mis favoritos</h1>
          <Heart size={26} fill="#ef4444" stroke="#ef4444" />
        </div>
        <p style={{ fontSize: 15, color: A.ink2, margin: '0 0 32px' }}>
          {total > 0 ? `${total} guardado${total !== 1 ? 's' : ''} para que no se te escape ninguno.` : 'Acá vas a ver todo lo que guardes con el corazón.'}
        </p>

        {/* Empty state */}
        {total === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 24px', background: A.bg, borderRadius: 20, border: `1px solid ${A.line}` }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', border: `1px solid ${A.line}`, display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
              <Heart size={28} stroke={A.muted} />
            </div>
            <h3 style={{ fontFamily: A.font, fontSize: 18, fontWeight: 700, color: A.ink, margin: '0 0 6px' }}>Todavía no guardaste favoritos</h3>
            <p style={{ fontSize: 14, color: A.muted, margin: '0 0 20px', lineHeight: 1.5 }}>Tocá el corazón ♡ en cualquier alojamiento u oferta para guardarlo acá.</p>
            <button onClick={onBack} style={{ background: A.primary, color: '#fff', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: A.font }}>
              Explorar ofertas
            </button>
          </div>
        )}

        {/* Secciones */}
        {favAloj.length > 0 && (
          <Seccion titulo="Alojamientos">
            {favAloj.map(item => (
              <AccommodationCard key={item.id} item={item} onClick={(it) => onOpenDetail?.(it, 'alojamiento')} />
            ))}
          </Seccion>
        )}

        {favSalidas.length > 0 && (
          <Seccion titulo="Salidas y experiencias">
            {favSalidas.map(item => (
              <AccommodationCard key={item.id} item={item} onClick={(it) => onOpenDetail?.(it, 'salidas')} />
            ))}
          </Seccion>
        )}

        {favPromos.length > 0 && (
          <Seccion titulo="Ofertas">
            {favPromos.map(promo => (
              <OfertaCard key={promo.id} promo={promo} onOpen={(p) => onOpenOferta?.(p)} />
            ))}
          </Seccion>
        )}

      </div>
    </div>
  );
}
