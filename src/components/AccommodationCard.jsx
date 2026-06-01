// ============================================================
//  src/components/AccommodationCard.jsx — Aire design
// ============================================================
import React, { useState } from 'react';
import HeartButton from './HeartButton';

const A = { ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280', line: '#E7E9EE', primary: '#2545E6', bg: '#F7F7F8', font: "'Geist', system-ui, sans-serif" };

export default function AccommodationCard({ item, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onClick && onClick(item, 'alojamiento')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
    >
      {/* Imagen */}
      <div style={{ position: 'relative', height: 280, borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
        <img
          src={item.image}
          alt={item.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease', transform: hovered ? 'scale(1.04)' : 'scale(1)' }}
        />
        {/* Heart — bottom-right, fondo oscuro */}
        <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
          <HeartButton id={item.id} />
        </div>
        {/* Tipo badge */}
        {item.type && (
          <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(255,255,255,0.95)', padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 600, color: A.ink, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {item.type}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        {/* Localidad / zona */}
        {(item.localidad || item.zona) && (
          <div style={{ fontSize: 12, color: A.ink2, fontWeight: 500, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={A.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-6.5-7-12a7 7 0 1 1 14 0c0 5.5-7 12-7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg>
            <span style={{ color: A.primary, fontWeight: 600 }}>{item.localidad}</span>
            {item.zona && <span style={{ color: A.muted }}> · {item.zona}</span>}
          </div>
        )}

        {/* Nombre */}
        <div style={{ fontSize: 17, fontWeight: 600, color: hovered ? A.primary : A.ink, letterSpacing: '-0.01em', marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
          {item.name}
        </div>

        {/* Precio */}
        {item.precioMin > 0 ? (
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontSize: 12, color: hovered ? A.primary : A.muted, transition: 'color 0.15s' }}>Desde</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: hovered ? A.primary : A.ink, letterSpacing: '-0.02em', transition: 'color 0.15s' }}>
                ${item.precioMin.toLocaleString('es-AR')}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, color: hovered ? A.primary : A.ink2, transition: 'color 0.15s' }}>
                {item.unidadPrecio === 'huesped' ? 'por huésped' : 'por noche'}
              </span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={A.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6"/></svg>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: A.muted, marginTop: 6, fontStyle: 'italic' }}>Consultá disponibilidad</p>
        )}
      </div>
    </div>
  );
}
