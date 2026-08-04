// ============================================================
//  src/lib/beneficiosCupopack.js
//  Beneficio adicional ESTRUCTURADO de un Cupopack: define qué
//  valor se ve afectado y cuánto, para que el checkout sepa qué
//  recalcular y qué tachar.
// ============================================================

import { puntosDeCompra } from './gamificacion';

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

// Aplica el beneficio sobre el precio base. Devuelve el precio final, los
// puntos que deja y —si corresponde— el valor original a tachar (`*Tachado`).
//
// ⚠️ Los puntos NO son un parámetro: se derivan acá del precio FINAL, que es
// lo único que el turista paga de verdad. Antes entraban como `puntosBase` y
// el modal los calculaba con su propia fórmula sobre el AHORRO DECLARADO
// (ahorro/4 = 25%), lo que daba 79.506 puntos por una compra de $21.900 — y
// como 1 punto = $1 y se pueden usar hasta cubrir el 100% de la compra
// siguiente, eso es regalar varias veces el valor de la venta.
//
// Derivarlos adentro cierra la puerta: ningún llamador puede pasar otra base.
// El orden importa: primero el descuento sobre el precio, después el 5% sobre
// lo que quedó, y recién ahí el multiplicador.
export function aplicarBeneficioCupopack({ tipo, valor, precioBase }) {
  const v = Number(valor) || 0;
  let precio = Number(precioBase) || 0;
  let precioTachado = null;

  if (tipo === 'precio_pct' && v > 0) {
    precio = Math.max(0, Math.round(precio * (1 - v / 100)));
    precioTachado = precioBase;
  } else if (tipo === 'precio_fijo' && v > 0) {
    precio = Math.max(0, precio - v);
    precioTachado = precioBase;
  }

  const base = puntosDeCompra(precio);
  let puntos = base, puntosTachado = null;
  if (tipo === 'puntos_mult' && v > 1) {
    puntos = Math.round(base * v);
    puntosTachado = base;
  }
  return { puntos, precio, puntosTachado, precioTachado };
}
