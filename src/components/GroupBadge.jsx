// ============================================================
//  src/components/GroupBadge.jsx
//  Chip "Más ahorro viajando en grupo" — label de marketing.
//  El posicionamiento (absolute sobre la card) lo decide el padre.
// ============================================================
import React from 'react';
import { Users } from 'lucide-react';

export default function GroupBadge({ descuentoMax, compact = false }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: 'linear-gradient(90deg, #7C3AED, #2545E6)',
      color: '#fff', borderRadius: 999,
      padding: compact ? '3px 9px' : '5px 11px',
      fontSize: compact ? 10 : 11.5, fontWeight: 700,
      letterSpacing: '0.01em', whiteSpace: 'nowrap',
      boxShadow: '0 2px 8px rgba(37,69,230,0.25)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <Users size={compact ? 11 : 13} strokeWidth={2.4} />
      <span>Más ahorro en grupo</span>
      {descuentoMax > 0 && (
        <span style={{ fontWeight: 900 }}>· hasta {descuentoMax}% off</span>
      )}
    </div>
  );
}
