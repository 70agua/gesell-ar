// ============================================================
//  src/lib/familiasPack.js
//  Las familias de cuponeras "todo incluido". Fuente única: la comparten el
//  menú del navbar, el filtro del listado de packs y el editor del superadmin.
//  `id` es lo que se guarda en cuponeras_locales.familia.
//  `icono` sale de /public/iconos y va servido por <Icono>: los .json son
//  Lottie con animación propia, los .svg son estáticos.
// ============================================================

export const FAMILIAS_PACK = [
  { id: 'romanticos', label: 'Románticos',        icono: '/iconos/amor.json' },
  { id: 'aventura',   label: 'Aventura',          icono: '/iconos/aventura.json' },
  { id: 'familias',   label: 'Familias',          icono: '/iconos/familia.json' },
  { id: 'relax',      label: 'Relax & Bienestar', icono: '/iconos/spa.json' },
  { id: 'foodie',     label: 'Foodie',            icono: '/iconos/restaurant.json' },
];

// Va siempre último: no filtra nada, lleva al listado completo.
export const MAS_PACKS = { id: null, label: 'Más packs', icono: '/iconos/mas.json' };

export const familiaLabel = id => FAMILIAS_PACK.find(f => f.id === id)?.label || '';
