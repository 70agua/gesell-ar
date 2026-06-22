// ============================================================
//  src/lib/busqueda.js
//  Estado de sesión del buscador principal.
//  Las fechas persisten mientras el SPA no se recarga.
// ============================================================

let _state = {
  destino: 'Todos los destinos',
  desde:   null,   // Date | null
  hasta:   null,   // Date | null
  adultos: 2,
};

export const busqueda = {
  get()          { return { ..._state }; },
  setDestino(v)  { _state.destino = v; },
  setFechas(d,h) { _state.desde = d; _state.hasta = h; },
  setAdultos(n)  { _state.adultos = n; },
  clearFechas()  { _state.desde = null; _state.hasta = null; },
};
