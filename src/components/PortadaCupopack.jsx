// ============================================================
//  src/components/PortadaCupopack.jsx
//  Portada de un Cupopack: o la foto cargada a mano (`imagen_url`), o un
//  mosaico armado con las portadas de las ofertas que incluye.
// ============================================================

// Con más de 5 ofertas las celdas quedan ilegibles, así que el mosaico se
// arma con las primeras 5 — que además cae siempre en el caso "impar".
const MAX_CELDAS = 5;
const SEPARACION = 3;

// Reparte las ofertas entre la celda grande y el resto.
// Cantidad impar → una va grande arriba de todo, y es la de alojamiento si la
// Cupopack incluye una (si no, la primera). Cantidad par → todas del mismo tamaño.
function repartirMosaico(cupones = []) {
  const conFoto = (cupones || []).filter(c => c && c.imagen);
  const usados = conFoto.slice(0, MAX_CELDAS);
  if (usados.length === 0)  return { grande: null, resto: [] };
  if (usados.length === 1)  return { grande: usados[0], resto: [] };
  if (usados.length % 2 === 0) return { grande: null, resto: usados };

  const iAloj = usados.findIndex(c => c.categoria === 'alojamiento');
  const iGrande = iAloj >= 0 ? iAloj : 0;
  return { grande: usados[iGrande], resto: usados.filter((_, i) => i !== iGrande) };
}

function Celda({ cupon, style }) {
  return (
    <div style={{ overflow: 'hidden', background: '#0B1020', ...style }}>
      <img
        src={cupon.imagen}
        alt=""
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </div>
  );
}

export default function PortadaCupopack({ cupopack, alt = '', style }) {
  const base = { position: 'absolute', inset: 0, width: '100%', height: '100%' };
  const { grande, resto } = repartirMosaico(cupopack?.cupones);
  const hayMosaico = !!grande || resto.length > 0;

  // Sin ofertas con foto no hay mosaico posible: cae a la portada cargada.
  if (cupopack?.portadaModo !== 'mosaico' || !hayMosaico) {
    return (
      <img
        src={cupopack?.images?.[0]}
        alt={alt}
        style={{ ...base, objectFit: 'cover', ...style }}
      />
    );
  }

  // Con 4 o menos celdas abajo, dos columnas; el caso de 1 sola ocupa el ancho.
  const columnas = resto.length <= 2 ? resto.length || 1 : 2;

  return (
    <div style={{ ...base, display: 'flex', flexDirection: 'column', gap: SEPARACION, background: '#0B1020', ...style }}>
      {/* La grande manda: se lleva algo más de la mitad del alto */}
      {grande && <Celda cupon={grande} style={{ flex: resto.length ? 1.35 : 1, minHeight: 0 }} />}
      {resto.length > 0 && (
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: `repeat(${columnas}, 1fr)`, gap: SEPARACION }}>
          {resto.map(c => <Celda key={c.id} cupon={c} style={{ minHeight: 0 }} />)}
        </div>
      )}
    </div>
  );
}
