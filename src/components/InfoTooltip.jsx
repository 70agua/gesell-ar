import { useState, useEffect, useRef } from 'react';
const TEXTO = 'Monto estimado. Puede variar según fecha, disponibilidad y condiciones del proveedor.';
const TEXTO_CREDITO = '1 crédito publicitario = $2.000 + IVA al momento de la compra. Los créditos publicitarios no expiran.';

export function CreditTooltip() {
  return <InfoTooltip text={TEXTO_CREDITO} />;
}

export default function InfoTooltip({ text = TEXTO }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setVisible(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', marginLeft: 3 }}>
      <svg
        onClick={e => { e.stopPropagation(); setVisible(v => !v); }}
        width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ cursor: 'pointer', flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      {visible && (
        <span style={{
          position: 'fixed',
          background: '#fff', color: '#374151',
          fontSize: 11, fontWeight: 400, lineHeight: 1.5,
          padding: '8px 11px', borderRadius: 8, width: 200,
          zIndex: 99999,
          whiteSpace: 'normal', textAlign: 'left',
          boxShadow: '0 4px 20px rgba(0,0,0,0.14)', border: '1px solid #E7E9EE',
          pointerEvents: 'none',
          top: (() => { const r = ref.current?.getBoundingClientRect(); return r ? `${r.top - 8}px` : '0'; })(),
          left: (() => { const r = ref.current?.getBoundingClientRect(); return r ? `${r.left + 8}px` : '0'; })(),
          transform: 'translateY(-100%)',
        }}>
          {text}
        </span>
      )}
    </span>
  );
}
