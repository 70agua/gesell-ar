// ============================================================
//  src/components/ActivaloCon.jsx
//  Bloque "Activalo con …" que muestra el precio de una oferta.
//
//  - Socio Plus / superadmin → precio en créditos + ($ + IVA) entre líneas.
//  - Todos los demás (anónimo, turista, socio Gratis) → sólo $ + IVA,
//    sin ninguna mención a créditos.
//
//  Ver src/lib/sesion.jsx para la regla de negocio.
// ============================================================

import { CreditTooltip } from './InfoTooltip';
import { useMostrarCreditos } from '../lib/sesion';

const PRECIO_CREDITO = 2000; // $ sin IVA por crédito

export default function ActivaloCon({
  creditos,
  ink = '#0B1020',
  muted = '#6B7280',
  labelSize = 10,
  credSize = 12,
  pesoSize = 10,
  coin = 11,
}) {
  const mostrarCreditos = useMostrarCreditos();
  const n = Number(creditos) || 0;
  const pesos = `$${(n * PRECIO_CREDITO).toLocaleString('es-AR')} + IVA`;

  const label = (
    <span style={{ fontSize: labelSize, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '18px' }}>
      Activalo con
    </span>
  );

  if (!mostrarCreditos) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {label}
        <span style={{ fontSize: credSize, fontWeight: 800, color: ink }}>{pesos}</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      {label}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <img src="/cuponera-coin.svg" alt="" width={coin} height={coin} />
          <span style={{ fontSize: credSize, fontWeight: 800, color: ink }}>{n} crédito{n !== 1 ? 's' : ''}</span>
          <CreditTooltip />
        </div>
        <span style={{ fontSize: pesoSize, color: muted }}>{pesos}</span>
      </div>
    </div>
  );
}
