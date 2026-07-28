// ============================================================
//  src/lib/familiasPack.js
//  Las familias de cuponeras "todo incluido". Fuente única: la comparten el
//  menú del navbar, el filtro del listado de packs y el editor del superadmin.
//  `id` es lo que se guarda en cuponeras_locales.familia.
// ============================================================

export const FAMILIAS_PACK = [
  { id: 'romanticos', label: 'Románticos',        icono: '/iconos/amor.svg' },
  { id: 'aventura',   label: 'Aventura',          icono: '/iconos/aventura.svg' },
  { id: 'familias',   label: 'Familias',          icono: '/iconos/familia.svg' },
  { id: 'relax',      label: 'Relax & Bienestar', icono: '/iconos/relax.svg' },
  { id: 'foodie',     label: 'Foodie',            icono: '/iconos/restaurant.svg' },
];

// Va siempre último: no filtra nada, lleva al listado completo.
export const MAS_PACKS = { id: null, label: 'Más packs', icono: '/iconos/mas.svg' };

export const familiaLabel = id => FAMILIAS_PACK.find(f => f.id === id)?.label || '';
