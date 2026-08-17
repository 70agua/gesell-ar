// ============================================================
//  src/components/HeartButton.jsx — Corazón de favoritos
//  Funciona en cualquier vista mientras esté dentro de FavoritosProvider
// ============================================================
import { useState } from 'react';
import { useFavoritos } from '../lib/favoritos';
export default function HeartButton({ id, size = 32, light = false }) {
  const ctx = useFavoritos();
  const [pulse, setPulse] = useState(false);

  // Guard: si no hay provider, no renderizar
  if (!ctx) return null;

  const { toggleFavorito, esFavorito } = ctx;
  const fav = esFavorito(id);
  const iconSize = Math.floor(size * 0.47);

  const handle = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setPulse(true);
    toggleFavorito(id);
    setTimeout(() => setPulse(false), 350);
  };

  // variante "light": para tarjetas sobre fondo blanco (sin imagen)
  const bg = light
    ? (fav ? 'rgba(239,68,68,0.10)' : '#ffffff')
    : (fav ? 'rgba(239,68,68,0.18)' : 'rgba(0,0,0,0.30)');
  const strokeColor = fav ? '#EF4444' : (light ? '#94a3b8' : 'rgba(255,255,255,0.92)');

  return (
    <button
      onClick={handle}
      style={{
        background: bg,
        border: light ? `1px solid ${fav ? '#fecaca' : '#e7e9ee'}` : 'none',
        borderRadius: '50%',
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        backdropFilter: light ? 'none' : 'blur(4px)',
        WebkitBackdropFilter: light ? 'none' : 'blur(4px)',
        boxShadow: light ? '0 1px 3px rgba(15,23,42,0.12)' : 'none',
        transform: pulse ? 'scale(1.45)' : 'scale(1)',
        transition: 'transform 0.25s cubic-bezier(.34,1.6,.64,1), background 0.2s',
        flexShrink: 0,
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={fav ? '#EF4444' : 'none'}
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'fill 0.18s, stroke 0.18s' }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>
  );
}
