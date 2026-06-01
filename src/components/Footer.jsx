// ============================================================
//  src/components/Footer.jsx — Aire design
// ============================================================
import React from 'react';

const A = { ink: '#0B1020', muted: '#6B7280', line: '#E7E9EE', primary: '#2545E6' };

export default function Footer() {
  return (
    <footer style={{ padding: '36px 56px', background: '#fff', borderTop: `1px solid ${A.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: A.primary, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 18, letterSpacing: '-0.04em' }}>G</div>
        <span style={{ fontWeight: 800, fontSize: 18, color: A.ink, letterSpacing: '-0.02em' }}>gesell.ar</span>
      </div>

      <div style={{ display: 'flex', gap: 28, fontSize: 13, color: A.muted, flexWrap: 'wrap' }}>
        <span style={{ cursor: 'pointer' }}>Socios</span>
        <span style={{ cursor: 'pointer' }}>Términos</span>
        <span style={{ cursor: 'pointer' }}>Privacidad</span>
        <span style={{ cursor: 'pointer' }}>Contacto</span>
      </div>

      <div style={{ fontSize: 12, color: A.muted }}>© 2026 gesell.ar</div>
    </footer>
  );
}
