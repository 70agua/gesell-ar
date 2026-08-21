// ============================================================
//  src/lib/busqueda.js
//  Estado de sesión del buscador principal.
//  Las fechas persisten mientras el SPA no se recarga.
//
//  `destino` se borró (2026-08-18, brief de scope regional): duplicaba el
//  scope que ahora vive en src/lib/scope.js. Auditado antes de tocarlo —
//  cero imports de este módulo en todo el repo, así que no había ningún
//  consumidor que migrar a scope.ciudad. Si algún día alguien conecta este
//  buscador a algo real, la ciudad/región vienen de useScope(), no de acá.
// ============================================================

let _state = {
  desde:   null,   // Date | null
  hasta:   null,   // Date | null
  adultos: 2,
};

export const busqueda = {
  get()          { return { ..._state }; },
  setFechas(d,h) { _state.desde = d; _state.hasta = h; },
  setAdultos(n)  { _state.adultos = n; },
  clearFechas()  { _state.desde = null; _state.hasta = null; },
};
