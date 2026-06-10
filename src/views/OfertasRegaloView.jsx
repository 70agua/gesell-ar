// ============================================================
//  src/views/OfertasRegaloView.jsx
//  Vista limpia (sin sidebar) de ofertas destacadas por el superadmin
// ============================================================
import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { getOfertasDestacadas } from '../lib/datos';
const MiniLoader = () => <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'60px 0' }}><video autoPlay loop muted playsInline style={{ width:90, height:'auto' }}><source src="/loading-casa.webm" type="video/webm"/></video></div>;
import { useCuponera } from '../lib/cuponera';
import { ALL_PROMOS } from '../data/mockData';

const C = {
  primary:     '#2545E6',
  primarySoft: '#EEF1FF',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  green:       '#10A36B',
  red:         '#EF4444',
  font:        "'Geist', system-ui, sans-serif",
};

// ─── OfertaCard compacta (reutiliza la de OfertaDetailView / Home) ────
function OfertaCard({ promo, onClick, onAddToCuponera }) {
  const esFlash = promo.offerType === 'Flash';
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={() => onClick?.(promo)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: '#fff',
        borderRadius: 16,
        border: `1px solid ${C.line}`,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.18s, transform 0.18s',
        boxShadow: hover ? '0 12px 40px -12px rgba(11,16,32,0.18)' : '0 2px 8px -4px rgba(11,16,32,0.08)',
        transform: hover ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: C.font,
      }}
    >
      {/* Imagen */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={promo.image}
          alt={promo.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s', transform: hover ? 'scale(1.04)' : 'scale(1)' }}
        />
        {/* Badge tipo */}
        <div style={{
          position: 'absolute', top: 12, left: 12,
          background: esFlash ? C.red : C.primary,
          color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', padding: '4px 10px', borderRadius: 999,
        }}>
          {esFlash ? 'Oferta Flash' : 'Cupón descuento'}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {promo.proveedorNombre && (
          <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
            {promo.proveedorNombre}
          </p>
        )}
        <h3 style={{ fontSize: 15, fontWeight: 700, color: C.ink, margin: 0, lineHeight: 1.35,
          display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>
          {promo.title}
        </h3>
        {promo.negocioLocalidad && (
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>{promo.negocioLocalidad}</p>
        )}

        {/* CTA */}
        <div style={{ marginTop: 'auto', paddingTop: 12 }}>
          <button
            onClick={e => { e.stopPropagation(); onAddToCuponera?.(promo); }}
            style={{
              width: '100%', padding: '10px 0', borderRadius: 999,
              background: C.primary, color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: C.font,
            }}
          >
            Agregar a cuponera
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OfertasRegaloView({ onBack, onOpenOferta }) {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addCupon } = useCuponera();

  useEffect(() => {
    (async () => {
      setLoading(true);
      let data = await getOfertasDestacadas();
      // Si no hay destacadas en DB todavía, mostramos las primeras promos como respaldo
      if (!data || data.length === 0) data = ALL_PROMOS.slice(0, 12);
      setOfertas(data);
      setLoading(false);
    })();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, paddingTop: 70 }}>
      <div style={{ maxWidth: 1328, margin: '0 auto', padding: '40px 40px 80px' }}>

        {/* Back */}
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: C.muted, fontFamily: C.font,
            marginBottom: 32, padding: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = C.ink}
          onMouseLeave={e => e.currentTarget.style.color = C.muted}
        >
          <ChevronLeft size={16} /> Volver al inicio
        </button>

        {/* Header */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: C.primarySoft, borderRadius: 999, padding: '6px 16px',
            marginBottom: 16,
          }}>
            <img src="/ico-vouchers.svg" alt="" style={{ width: 22 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              Descuentos de regalo, registrándote gratis!
            </span>
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.025em', color: C.ink, margin: '0 0 12px' }}>
            Elegí dos cupones, no te cobramos comisión!
          </h1>
          <p style={{ fontSize: 16, color: C.muted, margin: 0, maxWidth: 560 }}>
            Seleccionamos estas ofertas especialmente para vos. Agregá las que más te gusten a tu cuponera.
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <MiniLoader />
        ) : ofertas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.muted }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: C.ink2, marginBottom: 8 }}>Próximamente</p>
            <p style={{ fontSize: 15 }}>Pronto el equipo de gesell.ar va a seleccionar ofertas especiales para vos.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 24,
          }}>
            {ofertas.map(oferta => (
              <OfertaCard
                key={oferta.id}
                promo={oferta}
                onClick={p => onOpenOferta?.(p)}
                onAddToCuponera={p => addCupon(p)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
