// ============================================================
//  src/lib/socialProof.js
//  Prueba social "en vivo" — números estables por socio/oferta.
//
//  Mientras no haya analítica real, derivamos los números de
//  forma DETERMINÍSTICA a partir del id, para que sean estables
//  por ítem (no saltan en cada render) pero distintos entre sí.
//  El "viendo ahora" sí fluctúa suavemente para dar sensación viva.
// ============================================================
// Hash simple y estable a partir de cualquier id (número o string)
function hashId(id) {
  const s = String(id ?? '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

// Números base estables por ítem
export function socialProof(id) {
  const h = hashId(id);
  return {
    reservasSemana:    3 + (h % 13),          // 3–15 reservas esta semana
    viendoBase:        2 + ((h >> 3) % 8),     // 2–9  base de "viendo ahora"
    cuponesCanjeados:  40 + ((h >> 5) % 461),  // 40–500 canjeados (histórico)
  };
}

// ¿Está "en racha"? (umbral para mostrar el badge 🔥 de tendencia)
export function esTendencia(id) {
  return socialProof(id).reservasSemana >= 8;
}
