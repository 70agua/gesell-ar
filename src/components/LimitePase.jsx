// ============================================================
//  src/components/LimitePase.jsx
//  Cuánto se puede usar esta oferta con el Pase. Va en el detalle, antes del
//  CTA, y es lo que REEMPLAZA al "incluido" que sacamos del sello.
//
//  El sello dice a qué producto pertenece la oferta ("Usá tu GESELL PaSS") y
//  no cuánto rinde, porque en una mini-ficha no entra la explicación. Acá sí,
//  y por eso acá va el número explícito: sin número, "premium" no significa
//  nada y el turista descubre el límite recién cuando se le acaba.
//
//  ⚠️ El nivel BASE no es ilimitado. El índice `canjes_pase_por_comercio` es
//  único por (pase, negocio): con el Pase se canjea UNA VEZ POR COMERCIO. Lo
//  ilimitado es a cuántos comercios podés ir, no cuántas veces al mismo — y
//  decir "todas las veces que quieras" sería el mismo sobre-prometido que se
//  corrigió en las premium y en la estadía.
// ============================================================
import { nivelEnPase, esOfertaEstadia } from '../lib/pases';
import { usePasePropio } from '../lib/pasePropio';

const A = {
  ink: '#0B1020', ink2: '#3D4255', muted: '#6B7280',
  line: '#E7E9EE', primary: '#475BE1', primarySoft: '#EEF0FD',
  green: '#10A36B', greenSoft: '#EDFAF4', amber: '#B5852A', amberSoft: '#FFF7ED',
  font: "'Inter', system-ui, sans-serif",
};

export default function LimitePase({ promo, onSoltar }) {
  const { activo, total, libres, premiumIlimitado, elegidasIds, estadia } = usePasePropio();

  const premium   = nivelEnPase(promo) === 'premium';
  const esEstadia = !premium && esOfertaEstadia(promo);
  const yaElegida = premium && elegidasIds.includes(promo.id);
  const conFecha  = promo.requiereFecha || promo.requiereReserva;

  // Ya la eligió: no se le vuelve a contar el límite, se le dice dónde está
  // parado y cómo salir. Repetirle "te quedan 2 de 3" cuando una de esas 3 es
  // justamente ésta es contarle el cuento al revés. Con pase sin límite no hay
  // "cupo" que devolver, así que ahí ni se ofrece soltarla.
  if (yaElegida) {
    return (
      <Caja tono="ok">
        {premiumIlimitado
          ? <><b>Ya la elegiste con tu Pase.</b> Con este Pase tenés todo el catálogo PREMIUM disponible.</>
          : <><b>Ya la elegiste con tu Pase.</b> Ocupa uno de tus {total} beneficios PREMIUM.</>}
        {conFecha && <> Coordinás la fecha con el comercio antes de usarlo.</>}
        {onSoltar && !premiumIlimitado && (
          <button onClick={onSoltar} style={{
            display: 'block', marginTop: 8, padding: 0, border: 'none', background: 'none',
            fontFamily: A.font, fontSize: 12.5, fontWeight: 700, color: A.primary,
            textDecoration: 'underline', textUnderlineOffset: 3, cursor: 'pointer',
          }}>Soltarla y elegir otra</button>
        )}
      </Caja>
    );
  }

  let cuerpo;
  if (premium) {
    // premiumIlimitado se revisa ANTES que `activo`: un pase comprado de 12
    // días que todavía no arrancó (pendiente) ya tiene el flag congelado —
    // decirle "un beneficio por cada día" ahí sería lo mismo que sobre-prometer
    // al revés, subestimando lo que ya compró.
    cuerpo = premiumIlimitado
      ? <><b>Todo el catálogo PREMIUM disponible</b> con tu Pase: sin tope de elecciones.</>
      : !activo
        ? <>El Pase incluye <b>un beneficio PREMIUM por cada día</b>, a elección. Éste es uno de ellos.</>
        : <><b>Te quedan {libres} de {total}</b> beneficios PREMIUM.</>;
  } else if (esEstadia) {
    cuerpo = activo
      ? (estadia?.disponible
          ? <><b>Tu descuento de estadía está disponible.</b> El Pase trae uno solo.</>
          : <><b>Ya usaste tu descuento de estadía.</b> El Pase trae uno por pase.</>)
      : <>El Pase incluye <b>un descuento de estadía</b>, uno por pase.</>;
  } else {
    cuerpo = activo
      ? <><b>Sin límite de cantidad:</b> usalo en todos los comercios que quieras, una vez en cada uno.</>
      : <>Con el Pase, los cupones como éste <b>no gastan ninguna elección</b>: los usás en cada comercio que visites.</>;
  }

  return (
    <Caja tono={premium ? 'premium' : 'neutro'}>
      {cuerpo}
      {conFecha && <> Coordinás la fecha con el comercio antes de usarlo.</>}
    </Caja>
  );
}

const TONOS = {
  ok:      { bg: A.greenSoft,   borde: '#BFE9D5', color: A.ink2 },
  premium: { bg: A.primarySoft, borde: '#C7D2FE', color: A.ink2 },
  neutro:  { bg: '#F7F7F8',     borde: A.line,    color: A.ink2 },
};

function Caja({ tono = 'neutro', children }) {
  const t = TONOS[tono] || TONOS.neutro;
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 12,
      background: t.bg, border: `1px solid ${t.borde}`,
      fontFamily: A.font, fontSize: 13, lineHeight: 1.5, color: t.color,
    }}>
      {children}
    </div>
  );
}
