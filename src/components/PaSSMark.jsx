// ============================================================
//  src/components/PaSSMark.jsx
//  El lockup de la marca: "GESELL" en NauryzRedkeds azul + "PaSS" en blanco
//  sobre una pastilla primary. Vive acá porque ya lo pintan la home, el
//  checkout del pase y las minifichas de oferta — una sola versión para todos.
// ============================================================
const PRIMARY = '#475BE1';
const NAURYZ  = "'NauryzRedkeds', sans-serif";

// `size` es el cuerpo de la tipografía; los corrimientos de la pastilla están
// calibrados a 20px y escalan solos con `k`. Van así porque la NauryzRedkeds
// trae los glifos descentrados dentro de su caja: se mueve la pastilla por su
// cuenta y el texto por la suya para que "PaSS" quede alineado con la frase.
// `prefijo` es "CUPON" por default (2026-08-10: era "GESELL" — la marca es
// "CUPON PaSS", no "GESELL PaSS", así que se cambió el default en vez de
// pisarlo en cada uno de los llamados que ya lo usaban). Sigue siendo
// override-able por si hace falta otro prefijo en el futuro.
// `color` pinta las dos mitades del lockup: la palabra del prefijo y la
// pastilla de "PaSS". Default primary, que es la marca. El panel "Pases de
// regalo" lo pasa en el dorado de giftpass-logo.svg (#FFB94A) para armar
// "GIft PaSS" — es la misma marca en otro tono, no un logo aparte, así que va
// por acá y no como un lockup duplicado.
// `colorTexto` es lo que se lee ADENTRO de la pastilla, blanco por default.
// Existe para el lockup invertido —pastilla blanca con "PaSS" azul, el que va
// sobre la cabecera primary del panel de ofertas—: `color` solo no alcanza,
// porque pinta la pastilla y la palabra del prefijo, y dejaba el texto blanco
// sobre blanco.
// `pro`: suma una etiqueta "PRO" abajo a la derecha, pegada al lockup — la
// variante que usa la pantalla de planes de suscripción (2026-08-11), para
// distinguirla del GIFT PaSS común del panel de regalo. Va en Inter, no en
// NauryzRedkeds: es una etiqueta, mismo lenguaje que el resto de los badges
// chicos de la app (.gp-opcion-tag, "El más elegido" en TramoPago) — texto
// uppercase con tracking, no parte de la tipografía de marca.
export default function PaSSMark({ size = 20, conGesell = false, prefijo = 'CUPON', color = PRIMARY, colorTexto = '#fff', pro = false }) {
  const k = size / 20;
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 10 * k, lineHeight: 1 }}>
      {conGesell && (
        <span style={{ fontFamily: NAURYZ, fontSize: size, letterSpacing: k, color, lineHeight: 1 }}>{prefijo}</span>
      )}
      <span style={{ position: 'relative', display: 'inline-block', fontSize: size, lineHeight: 1, padding: `${5 * k}px ${13 * k}px ${6 * k}px` }}>
        <span aria-hidden="true" style={{ position: 'absolute', inset: 0, transform: `translate(${-7 * k}px, ${-2 * k}px)`, background: color, borderRadius: 999 }} />
        {/* La fuente va también acá: index.css tiene un `* { font-family: Inter }`
            que le gana a la herencia. */}
        <span style={{ position: 'relative', left: -5 * k, fontFamily: NAURYZ, fontSize: size, letterSpacing: k, color: colorTexto, lineHeight: 1 }}>PaSS</span>
      </span>
      {pro && (
        // Fondo primary sólido + texto blanco (2026-08-12, vuelta atrás de un
        // outline que seguía a `color`): el lockup entero puede ir dorado
        // —la pantalla de Suscripción PRO lo pide así— pero el badge PRO se
        // fija en PRIMARY a propósito: es lo que lo distingue como una
        // variante aparte del GIFT PaSS común, no un tono que lo siga.
        <span aria-hidden="true" style={{
          position: 'absolute', right: -4 * k, bottom: -7 * k,
          fontFamily: "'Inter', system-ui, sans-serif", fontSize: 9 * k, fontWeight: 800,
          letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1,
          color: '#fff', background: PRIMARY, borderRadius: 999,
          padding: `${2 * k}px ${6 * k}px`,
        }}>
          PRO
        </span>
      )}
    </span>
  );
}
