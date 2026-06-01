// ============================================================
//  src/lib/localidades.js
// ============================================================

export const LOCALIDADES = [
  "Villa Gesell",
  "Mar de las Pampas",
  "Las Gaviotas",
  "Mar Azul",
];

// Zonas transversales — aplican a cualquier localidad
export const ZONAS = [
  "Centro",
  "Zona norte",
  "Zona sur",
  "Línea de playa",
  "A 100m de playa",
  "Casco histórico",
  "Barrio de los médanos",
  "Bosque",
  "Zona de hoteles",
  "Zona residencial",
  "Costa",
  "Acceso principal",
];

// Localidades vecinas ordenadas por cercanía
export const VECINAS = {
  "Villa Gesell":      ["Las Gaviotas", "Mar de las Pampas", "Mar Azul"],
  "Las Gaviotas":      ["Villa Gesell", "Mar de las Pampas", "Mar Azul"],
  "Mar de las Pampas": ["Las Gaviotas", "Mar Azul", "Villa Gesell"],
  "Mar Azul":          ["Mar de las Pampas", "Las Gaviotas", "Villa Gesell"],
};

export function getVecinas(localidad) {
  return VECINAS[localidad] || LOCALIDADES.filter(l => l !== localidad);
}
