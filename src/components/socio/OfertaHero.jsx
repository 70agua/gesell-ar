// ============================================================
//  src/components/socio/OfertaHero.jsx
//  La imagen del panel expandido: 16:9, con overlay de descuento.
//
//  ⚠️ El degradé es OBLIGATORIO, no decorativo. Sin él el texto blanco del
//  overlay desaparece sobre fotos claras — playa a mediodía, paredes blancas,
//  arena— que son exactamente las que sube un comercio de costa.
//
//  `object-position: top` va de la mano: el overlay ocupa la franja inferior,
//  así que el sujeto de la foto tiene que subir para no quedar tapado.
// ============================================================
import HeartButton from '../HeartButton';

const A = {
  ink: '#0B1020',
  font: "'Inter', system-ui, sans-serif",
};

export default function OfertaHero({ promo, onOpenOferta }) {
  const esFlash = promo.offerType === 'Flash';

  return (
    <div
      onClick={() => onOpenOferta?.(promo)}
      style={{
        position: 'relative', aspectRatio: '16 / 9', borderRadius: 10,
        overflow: 'hidden', background: '#1a2a35',
        cursor: onOpenOferta ? 'pointer' : 'default', fontFamily: A.font,
      }}
    >
      {promo.image && (
        <img
          src={promo.image}
          alt={promo.title || promo.titulo || ''}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
        />
      )}

      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent 55%)',
      }} />

      {esFlash && (
        <div style={{
          position: 'absolute', top: 10, left: 10, display: 'inline-flex', alignItems: 'center', gap: 4,
          background: '#fff', borderRadius: 999, padding: '3px 8px 3px 7px',
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: A.ink }}>OFERTA</span>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#e02020', fontStyle: 'italic' }}>FLASH</span>
        </div>
      )}

      <div style={{ position: 'absolute', top: 10, right: 10 }} onClick={e => e.stopPropagation()}>
        {/* El círculo translúcido lo trae el propio HeartButton en su variante
            sobre foto (rgba(0,0,0,.30) + blur). */}
        <HeartButton id={promo.id} size={32} />
      </div>

      <div style={{ position: 'absolute', left: 14, right: 52, bottom: 12 }}>
        {promo.badge && (
          <div style={{
            fontSize: 34, fontWeight: 900, color: '#fff', lineHeight: 1,
            letterSpacing: '-0.03em', marginBottom: 4,
          }}>{promo.badge}</div>
        )}
        <div style={{
          fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.95)', lineHeight: 1.3,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{promo.title || promo.titulo}</div>
      </div>
    </div>
  );
}
