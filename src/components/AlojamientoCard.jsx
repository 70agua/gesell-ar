// ============================================================
//  src/components/AlojamientoCard.jsx
//  Tarjeta marketplace — foto + cuerpo extendido
//  Breadcrumb navegable: Localidad / Zona / Nombre
// ============================================================

import React from 'react';
import { ChevronRight, Tag } from 'lucide-react';
import HeartButton from './HeartButton';

const TIPO_EMOJI = {
  Hotel:        '🏨',
  Cabaña:       '🌲',
  Departamento: '🏢',
  Domo:         '⛺',
  Dormi:        '🛏️',
  Carpa:        '🏕️',
};

export default function AlojamientoCard({ item, onClick, onFilterLocalidad, onFilterZona }) {
  const emoji = TIPO_EMOJI[item.type] || '🏠';
  const mostrarPrecio = item.precioMin && item.precioMin > 0;

  return (
    <div
      onClick={() => onClick && onClick(item, 'alojamiento')}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
    >
      {/* Imagen */}
      <div className="relative h-52 overflow-hidden shrink-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-black px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
          <span>{emoji}</span>
          <span>{item.type}</span>
        </div>
        {/* Heart — bottom-right, fondo oscuro */}
        <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
          <HeartButton id={item.id} size={30} />
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-4 flex flex-col flex-1">

        {/* Breadcrumb navegable */}
        <div className="flex items-center gap-1 text-xs font-medium mb-1 flex-wrap">
          {item.localidad && (
            <button
              onClick={e => { e.stopPropagation(); onFilterLocalidad && onFilterLocalidad(item.localidad); }}
              className="text-blue-500 hover:text-blue-700 hover:underline font-bold transition-colors"
            >
              {item.localidad}
            </button>
          )}
          {item.localidad && item.zona && <span className="text-slate-300">/</span>}
          {item.zona && (
            <button
              onClick={e => { e.stopPropagation(); onFilterZona && onFilterZona(item.zona); }}
              className="text-slate-400 hover:text-slate-600 hover:underline transition-colors"
            >
              {item.zona}
            </button>
          )}
        </div>

        {/* Nombre */}
        <h3 className="font-black text-slate-900 text-base leading-tight mb-3 group-hover:text-blue-600 transition-colors">
          {item.name}
        </h3>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="flex items-center gap-1 bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Tag size={9} />{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Precio + CTA */}
        <div className="flex items-end justify-between pt-3 border-t border-slate-50 mt-2">
          {mostrarPrecio ? (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span className="text-slate-400 font-medium text-xs">Desde</span>
              <p className="font-black text-slate-900 text-lg leading-tight" style={{ margin: 0 }}>
                ${item.precioMin.toLocaleString('es-AR')}
              </p>
              <span className="text-slate-600 font-bold text-sm">
                {item.unidadPrecio === 'huesped' ? 'por huésped' : 'por noche'}
              </span>
            </div>
          ) : (
            <p className="text-slate-400 text-xs font-medium italic">Consultá disponibilidad</p>
          )}
          <div className="bg-slate-900 group-hover:bg-blue-600 text-white p-2.5 rounded-xl transition-colors duration-200 shrink-0 ml-3">
            <ChevronRight size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
