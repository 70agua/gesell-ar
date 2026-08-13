// ============================================================
//  src/components/hero/destinosRegalo.js
//  Las dos puertas de "regalar un Pase": persona y empresa.
//
//  Vivía adentro de HeroPase, que era el único que las pintaba. Se mudó acá
//  cuando el panel de ofertas del socio (BloqueAccion → PaseRegaloDrawer)
//  pasó a abrir el mismo drawer: dos copias de estas tarjetas se despegan a
//  la primera vez que alguien retoca un título en una sola de las dos.
//
//  `quien` va antes que `detalle` a propósito: primero que el que lee se
//  reconozca ("soy esto"), después qué se lleva. Al revés obliga a deducir de
//  la mecánica si la opción es para uno. En "persona" no hay `quien` — el
//  título ya quedó corto ("Regalar un pase") y sumarle una línea de quién es
//  le devolvía el peso de dos renglones que "Suscripción PRO" sí necesita
//  para lo suyo.
//
//  Cada opción ES el botón: clickearla arranca su camino, no la deja
//  seleccionada esperando un "Continuar" (2026-08-11). Con dos opciones y sin
//  nada que revisar entre elegir y seguir, el paso intermedio sólo sumaba un
//  click. Por eso tampoco hay punto de radio: no es un formulario que se
//  completa, son dos puertas.
//
//  Sólo "empresa" lleva tag (2026-08-11 lo probó también en "persona" por
//  simetría, pero el tag "Personas" ahí no aportaba nada que el título
//  "Regalar un pase" no dijera ya, así que se sacó de nuevo). `tagColor` es
//  el primary de la app — es la que lleva a otro producto (suscripción) y no
//  al dorado de GIFT PaSS.
//
//  `icono` es el SVG que va a la izquierda de cada opción (2026-08-11):
//  gift-01 (etiqueta/porcentaje) para el regalo suelto, gift-02 (caja con
//  moño) para la suscripción — la caja es la que de verdad regala EN SERIE.
// ============================================================
export const DESTINOS = [
  {
    id: 'persona',
    icono: '/gift-01.svg',
    titulo: 'Regalar un pase a alguien',
    detalle: 'Alojamientos, excursiones, gastronomía y más. Acceso a todos los descuentos de la red.',
  },
  {
    id: 'empresa',
    icono: '/gift-02.svg',
    titulo: 'Suscripción PRO',
    tag: 'Empresas',
    tagColor: '#475BE1',
    quien: 'Para hoteleros, agencias de turismo e inmobiliarias.',
    detalle: 'Obsequiás acceso a todos tus huéspedes. Desde $30.000 /mes adquirí tu membresía.',
  },
];
