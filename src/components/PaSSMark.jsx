// ============================================================
//  src/components/PaSSMark.jsx
//  El lockup de la marca: "GESELL" en NauryzRedkeds azul + "PaSS" en blanco
//  sobre una pastilla primary. Vive acá porque ya lo pintan la home, el
//  checkout del pase y las minifichas de oferta — una sola versión para todos.
// ============================================================
const PRIMARY = '#2545E6';
const NAURYZ  = "'NauryzRedkeds', sans-serif";

// `size` es el cuerpo de la tipografía; los corrimientos de la pastilla están
// calibrados a 20px y escalan solos con `k`. Van así porque la NauryzRedkeds
// trae los glifos descentrados dentro de su caja: se mueve la pastilla por su
// cuenta y el texto por la suya para que "PaSS" quede alineado con la frase.
export default function PaSSMark({ size = 20, conGesell = false }) {
  const k = size / 20;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 * k, lineHeight: 1 }}>
      {conGesell && (
        <span style={{ fontFamily: NAURYZ, fontSize: size, letterSpacing: k, color: PRIMARY, lineHeight: 1 }}>GESELL</span>
      )}
      <span style={{ position: 'relative', display: 'inline-block', fontSize: size, lineHeight: 1, padding: `${5 * k}px ${13 * k}px ${6 * k}px` }}>
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, transform: `translate(${-7 * k}px, ${-2 * k}px)`, background: PRIMARY, borderRadius: 999 }} />
        {/* La fuente va también acá: index.css tiene un `* { font-family: Inter }`
            que le gana a la herencia. */}
        <span style={{ position: 'relative', left: -5 * k, fontFamily: NAURYZ, fontSize: size, letterSpacing: k, color: '#fff', lineHeight: 1 }}>PaSS</span>
      </span>
    </span>
  );
}
