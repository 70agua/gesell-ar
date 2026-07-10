// ============================================================
//  src/components/PaxSelector.jsx
//  Select de beneficiarios (min..max). Emite onChange(N).
// ============================================================
import React from 'react';
import { Users } from 'lucide-react';

const C = { ink: '#0B1020', muted: '#6B7280', line: '#E7E9EE', primary: '#2545E6' };

export default function PaxSelector({ minPax, maxPax, value, onChange }) {
  const min = Math.max(1, Number(minPax) || 1);
  const max = Math.max(min, Number(maxPax) || min);
  const opciones = [];
  for (let n = min; n <= max; n++) opciones.push(n);

  return (
    <div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
        <Users size={13} /> ¿Cuántos van?
      </label>
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            width: '100%', appearance: 'none', WebkitAppearance: 'none',
            padding: '12px 40px 12px 14px', borderRadius: 12,
            border: `1.5px solid ${C.line}`, background: '#fff',
            fontSize: 15, fontWeight: 600, color: C.ink, cursor: 'pointer',
            fontFamily: "'Inter', system-ui, sans-serif", outline: 'none',
          }}
        >
          {opciones.map(n => (
            <option key={n} value={n}>{n} persona{n !== 1 ? 's' : ''}</option>
          ))}
        </select>
        <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.muted }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </div>
    </div>
  );
}
