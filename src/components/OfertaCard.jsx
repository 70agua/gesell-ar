// ============================================================
//  src/components/OfertaCard.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { secondsUntil } from '../lib/ofertas';
import CuponIcon from './CuponIcon';

// ─── Monedita SVG dorada ──────────────────────────────────────
function CoinIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display:'inline-block', verticalAlign:'middle', flexShrink:0 }}>
      <circle cx="12" cy="12" r="10" fill="#FFD700" stroke="#B8860B" strokeWidth="1.5"/>
      <ellipse cx="9" cy="9" rx="3" ry="1.5" fill="#FFE87C" opacity="0.6" transform="rotate(-20 9 9)"/>
      <text x="12" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="#7A5200" fontFamily="Arial, sans-serif"></text>
    </svg>
  );
}

// ─── Countdown Flash ──────────────────────────────────────────
function FlashTimer({ fechaFin }) {
  const [secs, setSecs] = useState(() => secondsUntil(fechaFin));
  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  if (secs <= 0) return null;
  return (
    <div className="flex items-center justify-center gap-0.5 mb-2">
      {[Math.floor(secs/3600), Math.floor((secs%3600)/60), secs%60].map((val, i) => (
        <React.Fragment key={i}>
          <span className="bg-white text-red-600 text-xs font-black px-2 py-1 rounded-lg shadow-sm tabular-nums min-w-[2rem] text-center">
            {String(val).padStart(2,'0')}
          </span>
          {i < 2 && <span className="text-white font-black text-sm leading-none">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
export default function OfertaCard({ promo, onClick, onAddToCuponera, onFilterLocalidad }) {
  const esFlash   = promo.offerType === 'Flash';
  const esSinCargo = promo.tokens_costo === 0;

  return (
    <div
      onClick={() => onClick && onClick(promo)}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
    >
      {/* ── Imagen cuadrada ── */}
      <div className="relative aspect-square overflow-hidden shrink-0">
        <img
          src={promo.image}
          alt={promo.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />

        {/* Badge Flash — arriba izquierda */}
        {esFlash && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-black italic px-2.5 py-1 rounded-lg shadow-md">
            ⚡ FLASH Sale!
          </div>
        )}

        {/* Badge tokens — arriba derecha */}
        <div className="absolute top-3 right-3">
          {esSinCargo ? (
            <div className="bg-green-500 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md">
              SIN CARGO
            </div>
          ) : promo.tokens_costo != null ? (
            <div className="bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md flex items-center gap-1">
              <CoinIcon size={12} />
              <span>{promo.tokens_costo}</span>
            </div>
          ) : (
            // Pendiente de aprobación — no muestra tokens aún
            <div className="bg-amber-400 text-amber-900 text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-md">
              Pendiente
            </div>
          )}
        </div>

        {/* Countdown Flash */}
        {esFlash && promo.fechaFinFlash && (
          <div className="absolute top-10 right-3 mt-1">
            <FlashTimer fechaFin={promo.fechaFinFlash} />
          </div>
        )}

        {/* Badge descuento centrado abajo */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-center">
          <p className="text-white text-4xl font-black drop-shadow-lg leading-none mb-1">
            {promo.badge}
          </p>
          <p className="text-white/85 text-xs font-medium leading-snug drop-shadow">
            {promo.title}
          </p>
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="p-4 flex flex-col flex-1">

        {/* Fila proveedor */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 shadow-sm bg-slate-100">
            {promo.proveedorImage ? (
              <img src={promo.proveedorImage} alt={promo.proveedorNombre} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-300 text-lg font-black">
                {(promo.proveedorNombre || '?')[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-slate-900 text-sm leading-tight truncate">
              {promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()}
            </p>
            {(promo.negocioLocalidad || promo.subtitle?.includes('·')) && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  const loc = promo.negocioLocalidad || promo.subtitle?.split('·')[1]?.trim();
                  onFilterLocalidad && onFilterLocalidad(loc);
                }}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-700 hover:underline text-xs font-bold mt-0.5 transition-colors cursor-pointer"
              >
                <MapPin size={9} />
                {promo.negocioLocalidad || promo.subtitle?.split('·')[1]?.trim()}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1" />

        {/* CTAs */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
          {/* Créditos del usuario */}
          {promo.tokens_costo != null && !esSinCargo && (
            <div className="flex items-center gap-1 shrink-0">
              <CoinIcon size={14} />
              <span className="text-slate-600 text-xs font-black">{promo.tokens_costo}</span>
            </div>
          )}
          {esSinCargo && (
            <span className="text-green-600 text-xs font-black shrink-0">SIN CARGO</span>
          )}
          <div className="flex-1" />
          <button
            onClick={e => { e.stopPropagation(); onAddToCuponera && onAddToCuponera(promo); }}
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black px-3 py-2.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <CuponIcon size={14} />
            Agregar a cuponera
          </button>
        </div>
      </div>
    </div>
  );
}
