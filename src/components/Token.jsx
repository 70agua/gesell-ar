// ============================================================
//  src/components/Token.jsx — Moneda dorada SVG
// ============================================================
import React from 'react';

export function CoinSVG({ size = 20 }) {
  return <img src="/credito-coin.svg" alt="crédito" width={size} height={size} style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0 }}/>;
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
