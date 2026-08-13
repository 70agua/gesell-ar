// ============================================================
//  src/components/socio/LineaPase.jsx
//  La línea debajo del CTA que cuenta qué hace el Pase con ESTA oferta.
//
//  Reemplaza al sticker rotado del Pase, que ocupaba el mejor píxel del panel
//  sin convertir.
//
//  ⚠️ La capa premium se lee al revés de la base:
//
//   - Premium: sólo tiene sentido para quien YA tiene un Pase contratado
//     (activo o todavía dormido — `pase` alcanza, no hace falta `activo`).
//     Sin Pase, la invitación a comprarlo ya la hace el título del bloque de
//     acción ("Conseguí este y muchos más con tu Cupon PASS"); repetirla acá
//     sería la misma oferta empujada dos veces.
//   - Base/estadía: al revés — se muestran SIN Pase, como dato informativo de
//     que la oferta ya entra en la capa incluida. Con Pase, el bloque de
//     acción ya cubre ese caso ("Entra en tu Pase..."), así que repetirlo acá
//     sería el mismo dato dos veces con distinta redacción.
//
//  `pase` truthy ya implica turista logueado — usePasePropio() sólo llena el
//  pase cuando hay userId — así que no hace falta chequear sesión aparte.
// ============================================================
import PaSSMark from '../PaSSMark';
import { usePasePropio } from '../../lib/pasePropio';
import { nivelEnPase } from '../../lib/pases';

const A = {
  ink2: '#3D4255', primary: '#475BE1', font: "'Inter', system-ui, sans-serif",
};

function Linea({ children, onVerPase }) {
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
      {children}
      {onVerPase && <span aria-hidden="true" style={{ color: A.primary, fontWeight: 700 }}>→</span>}
    </button>
  );
}

export default function LineaPase({ promo, onVerPase }) {
  const { pase } = usePasePropio();
  const premium = nivelEnPase(promo) === 'premium';

  if (premium) {
    if (!pase) return null;
    return (
      <Linea onVerPase={onVerPase}>
        Entra como una de tus experiencias PREMIUM del <PaSSMark size={11} conGesell />
      </Linea>
    );
  }

  // Sin Pase ya no dice nada (2026-08-13). El bloque de acción del estado A se
  // rediseñó y ahora cierra él mismo el discurso del Pase —encabezado, precio,
  // "con un solo pase incluís esta oferta y muchas más", lockup y accesos—, así
  // que cualquier renglón extra abajo era el mismo argumento repetido con otra
  // redacción: justo lo que este archivo ya evitaba en los otros tres casos.
  //
  // Con eso quedó sin uso la variante de estadía ("el Pase trae una"). El dato
  // sigue siendo cierto y NO está dicho en el bloque nuevo; si hay que
  // recuperarlo, el lugar es el bloque de acción, no una línea suelta acá.
  return null;
}
