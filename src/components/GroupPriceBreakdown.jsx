// ============================================================
//  src/components/GroupPriceBreakdown.jsx
//  Precio por persona final, descuento aplicado y total.
//  Recibe el resultado ya calculado por useGroupPricing.
// ============================================================

const C = { ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280', line: '#E7E9EE', green: '#10A36B' };
const fmt = n => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR');

export default function GroupPriceBreakdown({ pricing }) {
  if (!pricing) return null;
  const { base, pricePp, discountPct, total, n } = pricing;

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${C.line}`, overflow: 'hidden', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <Fila label="Precio por persona">
        {discountPct > 0 && (
          <span style={{ fontSize: 12, color: C.muted, textDecoration: 'line-through', marginRight: 6 }}>{fmt(base)}</span>
        )}
        <span style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>{fmt(pricePp)}</span>
      </Fila>

      <Fila label="Descuento aplicado">
        <span style={{ fontSize: 14, fontWeight: 800, color: discountPct > 0 ? C.green : C.muted }}>
          {discountPct > 0 ? `−${discountPct}%` : 'Sin descuento'}
        </span>
      </Fila>

      <Fila label={`Total (${n} persona${n !== 1 ? 's' : ''})`} destacado>
        <span style={{ fontSize: 22, fontWeight: 900, color: C.ink, letterSpacing: '-0.02em' }}>{fmt(total)}</span>
      </Fila>
    </div>
  );
}

function Fila({ label, children, destacado }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
      borderTop: destacado ? `1px solid ${C.line}` : 'none',
      background: destacado ? '#F7F7F8' : '#fff',
    }}>
      <span style={{ fontSize: 13, fontWeight: destacado ? 700 : 500, color: destacado ? C.ink : C.ink2 }}>{label}</span>
      <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>{children}</span>
    </div>
  );
}
