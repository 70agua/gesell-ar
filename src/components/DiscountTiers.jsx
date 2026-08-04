// ============================================================
//  src/components/DiscountTiers.jsx
//  Barra segmentada de tramos. Resalta el tramo activo y sugiere
//  el próximo salto ("Sumá 1 más para llegar a 25%").
// ============================================================
import React from 'react';
import { TrendingUp } from 'lucide-react';
import { resolveTier, siguienteTramo } from '../lib/grupos';

const C = { ink: '#0B1020', muted: '#6B7280', line: '#E7E9EE', primary: '#475BE1', green: '#10A36B' };

export default function DiscountTiers({ tramos = [], n }) {
  if (!Array.isArray(tramos) || tramos.length === 0) return null;

  const ordenados = [...tramos].sort((a, b) => a.min_pax - b.min_pax);
  const activo = resolveTier(ordenados, n);
  const proximo = siguienteTramo(ordenados, n);
  const faltan = proximo ? proximo.min_pax - n : 0;

  return (
    <div>
      <div style={{ display: 'flex', gap: 6 }}>
        {ordenados.map((t, i) => {
          const esActivo = activo && t.min_pax === activo.min_pax && t.max_pax === activo.max_pax;
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{
                height: 6, borderRadius: 999, marginBottom: 6,
                background: esActivo ? C.primary : C.line,
                transition: 'background 0.15s',
              }} />
              <div style={{ fontSize: 14, fontWeight: 800, color: esActivo ? C.primary : C.muted, lineHeight: 1 }}>
                {t.discount_pct}%
              </div>
              <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2 }}>
                {t.min_pax === t.max_pax ? `${t.min_pax}` : `${t.min_pax}-${t.max_pax}`}
              </div>
            </div>
          );
        })}
      </div>

      {proximo && faltan > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 12.5, fontWeight: 600, color: C.green }}>
          <TrendingUp size={14} />
          Sumá {faltan} más para llegar a {proximo.discount_pct}% off
        </div>
      )}
    </div>
  );
}
