// ============================================================
//  src/components/Token.jsx — Moneda dorada SVG
// ============================================================
import React from 'react';

export function CoinSVG({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0 }}>
      <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <ellipse cx="9" cy="9" rx="3" ry="1.5" fill="#FFE87C" opacity="0.6" transform="rotate(-20 9 9)"/>
      <text x="12" y="12" textAnchor="middle" dominantBaseline="central" fontSize="10" fontWeight="500" fill="#B8860B" fontFamily="'Geist', system-ui, sans-serif">C</text>
    </svg>
  );
}

export default function Token({ amount, size = 'md', className = '' }) {
  const sizes = { sm: 16, md: 20, lg: 26, xl: 32 };
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-xl' };
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <CoinSVG size={sizes[size]} />
      <span className={`font-black text-slate-900 ${textSizes[size]}`}>{amount}</span>
    </span>
  );
}

export function TokenLight({ amount, size = 'md', className = '' }) {
  const sizes = { sm: 16, md: 20, lg: 26, xl: 32 };
  const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base', xl: 'text-xl' };
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <CoinSVG size={sizes[size]} />
      <span className={`font-black text-white ${textSizes[size]}`}>{amount}</span>
    </span>
  );
}
