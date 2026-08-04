// ============================================================
//  src/lib/condiciones.js
//  Las condiciones de canje de una oferta.
//
//  Por qué son obligatorias para publicar: en el canje el comercio es PASIVO
//  —no valida, no escanea, sólo recibe el comprobante—, así que las condiciones
//  son lo único que fija la expectativa antes de que el turista llegue al
//  mostrador. Sin ellas cada canje es una discusión potencial, y el reclamo cae
//  sobre Cuponear, que no estuvo en la conversación.
//
//  Se guardan como LISTA, un renglón por condición, en `promociones.condiciones`
//  (text). No es un párrafo: el detalle las muestra como ítems, y un párrafo
//  obliga a adivinar dónde termina cada una. La columna sigue siendo text y no
//  un array porque todos los lectores ya parten por renglón; migrar el esquema
//  no compraría nada.
//
//  El catálogo baja la fricción: la mayoría de las condiciones reales son las
//  mismas seis o siete, y tipearlas a mano es lo que hace que nadie las cargue.
// ============================================================

// `valor` opcional: si está, la condición pide un dato y se guarda "label: valor".
const UNIVERSALES = [
  { id: 'acumulable',     label: 'No acumulable con otras promociones' },
  { id: 'disponibilidad', label: 'Sujeto a disponibilidad' },
  { id: 'horario',        label: 'Días y horarios válidos', valor: 'Ej: lunes a jueves de 12 a 15 h' },
  { id: 'personas',       label: 'Cantidad de personas cubiertas', valor: 'Ej: 2 personas' },
  { id: 'aviso',          label: 'Requiere aviso previo', valor: 'Ej: 24 hs de anticipación' },
];

const POR_CATEGORIA = {
  alojamiento: [
    { id: 'tarifa',      label: 'Aplicable solo a tarifa estándar' },
    { id: 'anticipada',  label: 'Válido con reserva anticipada', valor: 'Ej: 48 hs antes' },
    { id: 'estadia_min', label: 'Estadía mínima', valor: 'Ej: 2 noches' },
  ],
  salidas: [
    { id: 'menu',    label: 'Aplica solo al menú regular' },
    { id: 'bebidas', label: 'No incluye bebidas' },
    { id: 'mesa',    label: 'Requiere reserva de mesa' },
  ],
  aventura_relax: [
    { id: 'clima', label: 'Sujeto a condiciones climáticas' },
    { id: 'turno', label: 'Con turno asignado previamente' },
    { id: 'grupo', label: 'Mínimo de participantes', valor: 'Ej: 4 personas' },
    { id: 'salud', label: 'Requiere declaración de salud o apto físico' },
  ],
};

// Las que se le ofrecen a un socio según su categoría. Sin categoría conocida
// van sólo las universales: mejor pocas y ciertas que un menú de opciones que
// no aplican a su rubro.
export function condicionesDeCategoria(categoria) {
  return [...UNIVERSALES, ...(POR_CATEGORIA[categoria] || [])];
}

// De la selección del editor al texto que va a la base. Un renglón por
// condición, en el orden del catálogo, y el texto libre al final.
export function serializarCondiciones(elegidas = {}, valores = {}, libre = '', categoria = null) {
  const items = condicionesDeCategoria(categoria)
    .filter(c => elegidas[c.id])
    .map(c => {
      const v = (valores[c.id] || '').trim();
      return c.valor && v ? `${c.label}: ${v}` : c.label;
    });
  const extra = (libre || '').split('\n').map(s => s.trim()).filter(Boolean);
  return [...items, ...extra].join('\n');
}

// Del texto de la base a la lista que muestra el detalle.
//
// Parte SÓLO por renglón. Antes se partía también después de cada punto
// (`/(?<=\.)\s+/`), lo que rompía una condición en dos cada vez que tenía una
// abreviatura o un precio con decimales — y convertía el párrafo de quien
// escribía corrido en ítems arbitrarios.
export function parsearCondiciones(texto) {
  return (texto || '').split('\n').map(s => s.trim()).filter(Boolean);
}

// Estado inicial del editor a partir de lo ya guardado: lo que coincide con el
// catálogo vuelve tildado, y lo que no, al campo libre. Sin esto, editar una
// oferta existente perdería las condiciones o las duplicaría.
export function hidratarCondiciones(texto, categoria) {
  const lineas = parsearCondiciones(texto);
  const cat = condicionesDeCategoria(categoria);
  const elegidas = {}, valores = {}, libres = [];

  for (const linea of lineas) {
    const match = cat.find(c => linea === c.label || linea.startsWith(`${c.label}: `));
    if (!match) { libres.push(linea); continue; }
    elegidas[match.id] = true;
    if (linea.length > match.label.length) valores[match.id] = linea.slice(match.label.length + 2);
  }
  return { elegidas, valores, libre: libres.join('\n') };
}
