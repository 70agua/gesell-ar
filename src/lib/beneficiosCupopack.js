// ============================================================
//  src/lib/beneficiosCupopack.js
//  Beneficio adicional ESTRUCTURADO de un Cupopack: define qué
//  valor se ve afectado y cuánto, para que el checkout sepa qué
//  recalcular y qué tachar.
// ============================================================

// Tipos elegibles en el panel. `afecta` indica qué columna del
// footer se recalcula (y se tacha el valor original).
export const BENEFICIO_TIPOS = [
  { id: '',             label: 'Sin beneficio adicional',        afecta: null,     needsValor: false },
  { id: 'puntos_mult',  label: 'Multiplica los puntos',          afecta: 'puntos', needsValor: true,  unidad: '×',  ayuda: 'Ej: 3 = triplica los puntos' },
  { id: 'precio_pct',   label: 'Descuento % en la activación',   afecta: 'precio', needsValor: true,  unidad: '%',  ayuda: 'Ej: 20 = 20% menos en el precio' },
  { id: 'precio_fijo',  label: 'Descuento fijo ($) en activación', afecta: 'precio', needsValor: true, unidad: '$', ayuda: 'Pesos que se restan del precio' },
  { id: 'cupon_regalo', label: 'Regala un cupón (no afecta precio)', afecta: null,  needsValor: false },
];

export function tipoBeneficio(id) {
  return BENEFICIO_TIPOS.find(t => t.id === (id || '')) || BENEFICIO_TIPOS[0];
}

// Aplica el beneficio sobre los totales base. Devuelve el valor final
// y —si corresponde— el valor original a tachar (`*Tachado`).
export function aplicarBeneficioCupopack({ tipo, valor, puntosBase, precioBase }) {
  const v = Number(valor) || 0;
  let puntos = puntosBase, precio = precioBase;
  let puntosTachado = null, precioTachado = null;

  if (tipo === 'puntos_mult' && v > 1) {
    puntos = Math.round(puntosBase * v);
    puntosTachado = puntosBase;
  } else if (tipo === 'precio_pct' && v > 0) {
    precio = Math.max(0, Math.round(precioBase * (1 - v / 100)));
    precioTachado = precioBase;
  } else if (tipo === 'precio_fijo' && v > 0) {
    precio = Math.max(0, precioBase - v);
    precioTachado = precioBase;
  }
  return { puntos, precio, puntosTachado, precioTachado };
}
