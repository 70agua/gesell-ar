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
//     acción ("Conseguí este y muchos más con tu Gesell PaSS"); repetirla acá
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
import { nivelEnPase, esOfertaEstadia } from '../../lib/pases';

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

  if (pase) return null;

  // Alojamiento por debajo del umbral premium: no ocupa elección, pero el Pase
  // trae UNA sola estadía. Decirle "incluido" prometería ilimitado.
  const estadia = esOfertaEstadia(promo);
  return (
    <Linea onVerPase={onVerPase}>
      {estadia
        ? <>Tu estadía con el <PaSSMark size={11} conGesell />: el Pase trae una</>
        : <>Incluido en el <PaSSMark size={11} conGesell /></>}
    </Linea>
  );
}
