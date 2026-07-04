// ============================================================
//  src/components/OfertaCard.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { secondsUntil } from '../lib/ofertas';
import CuponIcon from './CuponIcon';
import InfoTooltip, { CreditTooltip } from './InfoTooltip';
import { useMostrarCreditos } from '../lib/sesion';

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
  const esFlash    = promo.offerType === 'Flash';
  const esSinCargo = promo.tokens_costo === 0;
  const mostrarCreditos = useMostrarCreditos();

  return (
    <div
      onClick={() => onClick && onClick(promo)}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
    >
      {/* ── Imagen 4:3 ── */}
      <div className="relative overflow-hidden shrink-0" style={{ aspectRatio: '4/3' }}>
        <img
          src={promo.image}
          alt={promo.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

        {/* Badge Flash — arriba izquierda */}
        {esFlash && (
          <div className="absolute top-2.5 left-2.5 bg-red-600 text-white text-[10px] font-black italic px-2 py-1 rounded-lg flex items-center gap-1">
            ⚡ FLASH
          </div>
        )}

        {/* Heart — arriba derecha */}
        <div className="absolute top-2.5 right-2.5">
          <CoinIcon size={12} />
        </div>

        {/* Badge + título — abajo izquierda */}
        <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-6">
          <p className="text-white font-black leading-none mb-1.5 drop-shadow-lg"
             style={{ fontSize: (promo.badge?.length || 0) > 5 ? 28 : 36, letterSpacing: '-0.025em' }}>
            {promo.badge}
          </p>
          <p className="text-white/88 text-[12px] font-bold leading-snug drop-shadow line-clamp-2">
            {promo.title}
          </p>
        </div>
      </div>

      {/* ── Cuerpo ── */}
      <div className="flex flex-col flex-1" style={{ padding: '11px 13px 13px', gap: 10 }}>

        {/* Fila proveedor */}
        <div className="flex items-center gap-2.5">
          <div className="shrink-0 rounded-full overflow-hidden border border-slate-100 bg-slate-100 flex items-center justify-center"
               style={{ width: 34, height: 34 }}>
            {promo.proveedorImage ? (
              <img src={promo.proveedorImage} alt={promo.proveedorNombre} className="w-full h-full object-cover" />
            ) : (
              <span className="text-slate-400 text-xs font-black">
                {(promo.proveedorNombre || '?')[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-900 text-[13px] font-extrabold leading-tight truncate">
              {promo.proveedorNombre || promo.subtitle?.split('·')[0]?.trim()}
            </p>
            {(promo.negocioLocalidad || promo.subtitle?.includes('·')) && (
              <button
                onClick={e => {
                  e.stopPropagation();
                  const loc = promo.negocioLocalidad || promo.subtitle?.split('·')[1]?.trim();
                  onFilterLocalidad && onFilterLocalidad(loc);
                }}
                className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-[11px] font-semibold mt-0.5 transition-colors cursor-pointer"
              >
                <MapPin size={9} />
                {promo.negocioLocalidad || promo.subtitle?.split('·')[1]?.trim()}
              </button>
            )}
          </div>
        </div>

        {/* Botón */}
        <button
          onClick={e => { e.stopPropagation(); onAddToCuponera && onAddToCuponera(promo); }}
          className="w-full flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-extrabold py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
        >
          <CuponIcon size={14} />
          Agregar a cuponera
        </button>

        {/* Info rows */}
        {promo.tokens_costo != null && (
          esSinCargo
            ? <div className="flex items-center gap-1.5 bg-green-50 rounded-lg px-3 py-2 border border-green-200">
                <span className="text-green-600 text-xs font-black">Cupón DE REGALO para vos</span>
              </div>
            : <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Lo activás con</span>
                  {mostrarCreditos ? (
                    <div className="flex items-center gap-1">
                      <CoinIcon size={13} />
                      <span className="text-[13px] font-extrabold text-slate-800">{promo.tokens_costo} crédito{promo.tokens_costo !== 1 ? 's' : ''}</span>
                      <CreditTooltip />
                      <span className="text-[10px] font-semibold text-slate-400">(${(promo.tokens_costo * 2000).toLocaleString('es-AR')} + IVA)</span>
                    </div>
                  ) : (
                    <span className="text-[13px] font-extrabold text-slate-800">${(promo.tokens_costo * 2000).toLocaleString('es-AR')} + IVA</span>
                  )}
                </div>
              </div>
        )}
      </div>
    </div>
  );
}
