// ============================================================
//  src/components/socio/LineaPase.jsx
//  La línea debajo del CTA que cuenta qué hace el Pase con ESTA oferta.
//
//  Reemplaza al sticker rotado del Pase, que ocupaba el mejor píxel del panel
//  sin convertir.
//
//  ⚠️ Un solo string no sirve: "ya lo tenés incluido" es FALSO en una oferta
//  premium, donde el turista elige un puñado. El copy cambia según la capa, que
//  se deriva del ahorro declarado (nivelEnPase) — no de una columna.
//
//  ⚠️ Sólo se muestra SIN Pase. Con Pase, el bloque de acción ya dice el estado
//  real de esta oferta ("te quedan N elecciones", "entra en tu Pase"), y repetirlo
//  acá abajo sería el mismo dato dos veces con distinta redacción — la forma más
//  rápida de que las dos se desincronicen.
// ============================================================
import PaSSMark from '../PaSSMark';
import { usePasePropio } from '../../lib/pasePropio';
import { nivelEnPase, esOfertaEstadia } from '../../lib/pases';

const A = {
  ink2: '#3D4255', primary: '#2545E6', font: "'Inter', system-ui, sans-serif",
};

export default function LineaPase({ promo, onVerPase }) {
  const { pase } = usePasePropio();
  if (pase) return null;

  const premium = nivelEnPase(promo) === 'premium';
  // Alojamiento por debajo del umbral premium: no ocupa elección, pero el Pase
  // trae UNA sola estadía. Decirle "incluido" prometería ilimitado.
  const estadia = !premium && esOfertaEstadia(promo);

  let texto;
  if (premium) {
    // Sin Pase no se puede prometer un número: las elecciones son una por día y
    // todavía no eligió cuántos días compra.
    texto = <>Entra como una de tus experiencias PREMIUM del <PaSSMark size={11} conGesell /></>;
  } else if (estadia) {
    texto = <>Tu estadía con el <PaSSMark size={11} conGesell />: el Pase trae una</>;
  } else {
    texto = <>Incluido en el <PaSSMark size={11} conGesell /></>;
  }

  return (
    <button
      type="button"
      onClick={onVerPase}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap',
        width: '100%', marginTop: 10, padding: 0, border: 'none', background: 'none',
        cursor: onVerPase ? 'pointer' : 'default', textAlign: 'left',
        fontFamily: A.font, fontSize: 12.5, fontWeight: 500, color: A.ink2, lineHeight: 1.4,
      }}
    >
      {texto}
      {onVerPase && <span aria-hidden="true" style={{ color: A.primary, fontWeight: 700 }}>→</span>}
    </button>
  );
}
