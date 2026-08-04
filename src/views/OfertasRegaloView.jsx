// ============================================================
//  src/views/OfertasRegaloView.jsx
//  Vista limpia (sin sidebar) de ofertas destacadas por el superadmin
// ============================================================
import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { getPromos } from '../lib/datos';
const MiniLoader = () => <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'60px 0' }}><video autoPlay loop muted playsInline style={{ width:90, height:'auto' }}><source src="/loading-casa.webm" type="video/webm"/></video></div>;
import { useCarrito } from '../lib/carrito';

const C = {
  primary:     '#475BE1',
  primarySoft: '#EEF0FD',
  ink:         '#0B1020',
  ink2:        '#3D4255',
  muted:       '#6B7280',
  line:        '#E7E9EE',
  bg:          '#F7F7F8',
  green:       '#10A36B',
  red:         '#EF4444',
  font:        "'Inter', system-ui, sans-serif",
};

// ─── OfertaCard compacta (reutiliza la de OfertaDetailView / Home) ────
function OfertaCard({ promo, onClick, onAddToCarrito }) {
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
      {/* Imagen 4:3 */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', flexShrink: 0 }}>
        <img
          src={promo.image}
          alt={promo.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.3s', transform: hover ? 'scale(1.04)' : 'scale(1)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,16,32,0.75) 0%, rgba(11,16,32,0.15) 55%, transparent 100%)' }} />

        {/* Flash badge top-left */}
        {esFlash && (
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EF4444', borderRadius: 999, padding: '4px 10px 4px 9px' }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: '#fff', letterSpacing: '0.05em' }}>OFERTA</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#FFC93C', fontStyle: 'italic', letterSpacing: '0.05em' }}>FLASH</span>
          </div>
        )}

        {/* Badge + título — abajo */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 13px 12px' }}>
          <div style={{ fontSize: (promo.badge?.length || 0) > 5 ? 27 : 36, fontWeight: 900, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1 }}>{promo.badge}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.88)', lineHeight: 1.35, marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{promo.title}</div>
        </div>
      </div>

      {/* Cuerpo */}
      <div style={{ padding: '11px 13px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Proveedor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 7, background: '#F7F7F8', border: `1px solid ${C.line}`, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {promo.proveedorImage
              ? <img src={promo.proveedorImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <span style={{ fontSize: 11, fontWeight: 700, color: C.muted }}>{(promo.proveedorNombre || '?')[0]}</span>
            }
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, lineHeight: 1.2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              {promo.proveedorNombre}
            </div>
            {promo.negocioLocalidad && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 600, color: C.primary, marginTop: 2 }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
                {promo.negocioLocalidad}
              </div>
            )}
          </div>
        </div>

        {/* Botón */}
        <button
          onClick={e => { e.stopPropagation(); onAddToCarrito?.(promo); }}
          style={{ width: '100%', padding: '10px 0', borderRadius: 11, background: C.primary, color: '#fff', border: 'none', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: C.font, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M13 6v12" strokeDasharray="2 3"/></svg>
          Agregar al carrito
        </button>
      </div>
    </div>
  );
}

export default function OfertasRegaloView({ onBack, onOpenOferta }) {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addCupon } = useCarrito();

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Ofertas de regalo = las que no se cobran (`tokens_costo === 0`).
      // Sin respaldo de mock: si no hay ofertas de regalo cargadas, la pantalla
      // lo dice. El respaldo tapaba el dato importante —cuántas hay de verdad—
      // con doce ofertas inventadas que además no se podían canjear.
      const todas = await getPromos(300);
      setOfertas((todas || []).filter(p => p.tokens_costo === 0));
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
            Seleccionamos estas ofertas especialmente para vos. Agregá las que más te gusten a tu carrito.
          </p>
        </div>

        {/* Grid */}
        {loading ? (
          <MiniLoader />
        ) : ofertas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: C.muted }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: C.ink2, marginBottom: 8 }}>Próximamente</p>
            <p style={{ fontSize: 15 }}>Pronto el equipo de Cuponear va a seleccionar ofertas especiales para vos.</p>
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
                onAddToCarrito={p => addCupon(p)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
