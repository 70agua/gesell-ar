// ============================================================
//  src/data/mockData.js
//  Todos los datos de prueba de Cuponear
//  Para agregar un nuevo alojamiento, copiá un objeto del
//  array mockAccommodations y cambiá sus valores.
// ============================================================

export const locations = [
  "Villa Gesell",
  "Mar de las Pampas",
  "Las Gaviotas",
  "Mar Azul",
  "Chacras del Mar",
  "Colonia Marina",
  "El Salvaje",
];

// Reemplazá el array mockAccommodations en src/data/mockData.js con esto:

export const mockAccommodations = [
  {
    id: 1,
    name: "Hotel Spa Las Olas",
    type: "Hotel",
    plan: "PLUS",
    precioMin: 85000,
    precioMinEspecial: 135000,
    unidadPrecio: 'noche',
    packPrecio: 220000,
    packNoches: 3,
    packAclaracion: 'Entre lunes y jueves',
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560185007-5f0bb1866cab?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    ],
    localidad: "Villa Gesell",
    zona: "Línea de playa",
    address: "Av. Buenos Aires 450, Villa Gesell",
    tags: ["Spa", "Pileta", "WiFi gratuito", "Desayuno", "Estacionamiento", "Cancelación flexible"],
    description: "Ubicado frente al mar, este hotel ofrece una experiencia de relax total con spa de última generación y vistas panorámicas de ensueño.",
  },
  {
    id: 2,
    name: "Cabañas del Pinar",
    type: "Cabaña",
    plan: "PLUS",
    precioMin: 65000,
    precioMinEspecial: 105000,
    unidadPrecio: 'noche',
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80",
    ],
    localidad: "Villa Gesell",
    zona: "Zona norte",
    address: "Calle 306 y Paseo 153, Villa Gesell",
    tags: ["Bosque", "Parrilla", "WiFi gratuito", "Pileta"],
    description: "Un hermoso complejo de cabañas de madera rodeado del pinar fundacional de Villa Gesell. Confort, tranquilidad y aire de mar.",
  },
  {
    id: 3,
    name: "Apart Sol y Arena",
    type: "Departamento",
    plan: "PLUS",
    precioMin: 28000,
    precioMinEspecial: 42000,
    unidadPrecio: 'huesped',
    rating: 4.5,
    image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560185007-5f0bb1866cab?auto=format&fit=crop&w=800&q=80",
    ],
    localidad: "Villa Gesell",
    zona: "A 100m de playa",
    address: "Paseo 112 y Av. 3, Villa Gesell",
    tags: ["Vista al Mar", "WiFi gratuito", "Check-in flexible"],
    description: "Departamentos modernos totalmente equipados a metros de la playa. Salí al balcón y respirá el Atlántico.",
  },
  {
    id: 4,
    name: "Boutique Pinar",
    type: "Hotel",
    plan: "PLUS",
    precioMin: 120000,
    precioMinEspecial: 195000,
    unidadPrecio: 'noche',
    packPrecio: 490000,
    packNoches: 5,
    packAclaracion: 'Temporada baja',
    rating: 4.9,
    image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560185007-5f0bb1866cab?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    ],
    localidad: "Mar de las Pampas",
    zona: "Bosque",
    address: "Ruta 11 km 422, Mar de las Pampas",
    tags: ["Exclusivo", "Spa", "Desayuno", "WiFi gratuito", "Estacionamiento", "Check-in flexible"],
    description: "Exclusividad, diseño minimalista y atención súper personalizada en el corazón del bosque de Mar de las Pampas.",
  },
  {
    id: 5,
    name: "Residencias del Mar",
    type: "Departamento",
    plan: "PLUS",
    precioMin: 18000,
    precioMinEspecial: 28000,
    unidadPrecio: 'huesped',
    rating: 4.3,
    image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    ],
    localidad: "Villa Gesell",
    zona: "Zona sur",
    address: "Av. 3 y Paseo 89, Villa Gesell",
    tags: ["Familiar", "Pileta"],
    description: "Ideal para venir con los chicos. Amplios departamentos en la zona sur con piscina y parque de juegos.",
  },
  {
    id: 6,
    name: "Hostería San Remo",
    type: "Hotel",
    plan: "PLUS",
    precioMin: 42000,
    precioMinEspecial: 68000,
    unidadPrecio: 'noche',
    rating: 4.2,
    image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
    ],
    localidad: "Villa Gesell",
    zona: "Centro",
    address: "Paseo 104 y Av. 3, Villa Gesell",
    tags: ["Desayuno"],
    description: "Un clásico geselino. Excelente relación calidad-precio en pleno centro y con desayuno buffet incluido.",
  },
  {
    id: 7,
    name: "Cabañas Ártico",
    type: "Cabaña",
    plan: "PLUS",
    precioMin: 75000,
    precioMinEspecial: 118000,
    unidadPrecio: 'noche',
    packPrecio: 128000,
    packNoches: 2,
    packAclaracion: 'De domingo a jueves',
    rating: 4.6,
    image: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1595576508898-0ad5c879a061?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80",
    ],
    localidad: "Las Gaviotas",
    zona: "Costa",
    address: "Av. Costanera y Calle 3, Las Gaviotas",
    tags: ["Jacuzzi", "Parrilla", "WiFi gratuito"],
    description: "Cabañas amplias con jacuzzi privado y deck exterior para disfrutar las tardes doradas de Las Gaviotas.",
  },
  {
    id: 8,
    name: "Alpen House",
    type: "Hotel",
    plan: "PLUS",
    precioMin: 32000,
    precioMinEspecial: 51000,
    unidadPrecio: 'huesped',
    rating: 4.7,
    image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560185007-5f0bb1866cab?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80",
    ],
    localidad: "Mar Azul",
    zona: "Bosque",
    address: "Calle Lucero s/n, Mar Azul",
    tags: ["Premium", "WiFi gratuito", "Desayuno", "Estacionamiento"],
    description: "Hostería de estilo alpino rodeada de vegetación, paz absoluta y a solo tres cuadras del mar.",
  },
  {
    id: 9,
    name: "La Paloma House",
    type: "Casa",
    plan: "PLUS",
    precioMin: 58000,
    precioMinEspecial: 92000,
    unidadPrecio: 'noche',
    packPrecio: 350000,
    packNoches: 7,
    packAclaracion: 'Noches consecutivas',
    rating: 4.4,
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=800&q=80",
    ],
    localidad: "Chacras del Mar",
    zona: "Zona residencial",
    address: "Calle Interna s/n, Chacras del Mar",
    tags: ["Familiar", "Jardín", "Parrilla"],
    description: "Casa familiar con amplio jardín y parrilla a metros de la playa.",
  },
  {
    id: 10,
    name: "El Rincón del Faro",
    type: "Departamento",
    plan: "PLUS",
    precioMin: 22000,
    precioMinEspecial: 35000,
    unidadPrecio: 'huesped',
    rating: 4.1,
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
    ],
    localidad: "Mar Azul",
    zona: "Costa",
    address: "Av. del Mar 12, Mar Azul",
    tags: ["Vista al Mar", "Tranquilo"],
    description: "Pequeño departamento con vista al mar para una pareja.",
  },
  {
    id: 11,
    name: "Hostel Arena y Pinos",
    type: "Hostel",
    plan: "PLUS",
    precioMin: 14000,
    precioMinEspecial: 20000,
    unidadPrecio: 'huesped',
    rating: 4.0,
    image: "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
    fotos: [
      "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80",
    ],
    localidad: "Villa Gesell",
    zona: "Zona norte",
    address: "Av. 3 y Paseo 145, Villa Gesell",
    tags: ["Social", "Mochileros"],
    description: "El clásico hostel de Villa Gesell para viajeros independientes. Pedí precio por temporada.",
  },
];

export const mockPacks = [
  {
    id: 1,
    title: "Escapada Romántica",
    subtitle: "La combinación perfecta para celebrar en pareja: alojamiento boutique en los bosques de Mar de las Pampas, cena a la luz de las velas y masajes relajantes.",
    badge: "Más Vendido",
    location: "Mar de las Pampas",
    discountPct: 18,
    includes: ["Alojamiento 2 noches", "Cena romántica", "Spa & masajes en pareja", "Desayuno incluido"],
    color: "from-pink-500 to-rose-600",
    iconName: "Heart",
    images: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    ]
  },
  {
    id: 2,
    title: "Aventura en el Faro",
    subtitle: "Cabaña entre los médanos, excursión 4x4 hasta el Faro Querandí y picnic en la playa virgen. Para los que buscan naturaleza y emoción.",
    badge: "Eco-Aventura",
    location: "Las Gaviotas",
    discountPct: 12,
    includes: ["Cabaña 3 noches", "Excursión 4x4 al Faro", "Picnic gourmet", "Traslados incluidos"],
    color: "from-emerald-500 to-teal-600",
    iconName: "Compass",
    images: [
      "https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1533481405265-e9ce0c044abb?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
    ]
  },
  {
    id: 3,
    title: "Ruta Gastronómica",
    subtitle: "Recorrida curada por los mejores sabores de la Villa: apart céntrico, degustación de vinos y mariscos, churros históricos y cabalgata al atardecer.",
    badge: "Gourmet",
    location: "Villa Gesell",
    includes: ["Apart 2 noches", "Degustación de vinos", "Churros en El Topo", "Cabalgata al atardecer"],
    color: "from-amber-500 to-orange-600",
    iconName: "Utensils",
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=800&q=80",
    ]
  },
  {
    id: 4,
    title: "Familia Plena",
    subtitle: "Una semana sin preocupaciones para toda la familia: casa amplia con pileta, actividades para chicos, clases de surf y show de títeres.",
    badge: "Familias",
    location: "Villa Gesell",
    discountPct: 15,
    includes: ["Casa 5 noches", "Clases de surf", "Show de títeres", "Acceso parque acuático"],
    color: "from-blue-500 to-cyan-600",
    iconName: "Users",
    images: [
      "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1560090995-01632a28895b?auto=format&fit=crop&w=800&q=80",
    ]
  },
  {
    id: 5,
    title: "Relax Total",
    subtitle: "Desconectate del ruido y reconectate con vos. Cabaña en los bosques, yoga al amanecer, masajes y gastronomía saludable de autor.",
    badge: "Bienestar",
    location: "Mar de las Pampas",
    discountPct: 10,
    includes: ["Cabaña 3 noches", "Yoga & meditación", "Masajes relajantes", "Menú saludable"],
    color: "from-violet-500 to-purple-600",
    iconName: "Sparkles",
    images: [
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
    ]
  },
  {
    id: 6,
    title: "Amigos & Adrenalina",
    subtitle: "El plan ideal para grupos: alquiler completo, noche de fogón y asado, sandboard en los médanos y fiesta en terraza con DJ.",
    badge: "Grupos",
    location: "Villa Gesell Centro",
    includes: ["Casa completa 3 noches", "Sandboard en médanos", "Noche de fogón & asado", "Terraza con DJ"],
    color: "from-orange-500 to-red-600",
    iconName: "Zap",
    images: [
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1543965170-e399ce2a0fb0?auto=format&fit=crop&w=800&q=80",
    ]
  },
];

// ============================================================
//  CUPONES INCLUIDOS EN CADA CUPONERA PREDISEÑADA
//  Cada cuponera (antes "pack") reúne varios cupones de socios.
//  Cada cupón tiene su ficha (detalles, socio, galería y ubicación).
// ============================================================
const CUP_IMG = {
  hotel:    'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
  cabana:   'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=800&q=80',
  spa:      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80',
  cena:     'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
  vino:     'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80',
  cuatro4:  'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80',
  yoga:     'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
  surf:     'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80',
  caballos: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?auto=format&fit=crop&w=800&q=80',
  postre:   'https://images.unsplash.com/photo-1501443762994-82bd5dab89a5?auto=format&fit=crop&w=800&q=80',
  desayuno: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80',
  fogon:    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
  cafe:     'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80',
  pileta:   'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
  bar:      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
  bosque:   'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
  playa:    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
};

const TERMINOS_BASE = [
  'Válido presentando el cupón desde la app, sin necesidad de imprimir.',
  'No acumulable con otras promociones vigentes del mismo socio.',
  'Sujeto a disponibilidad del socio al momento del canje.',
  'Un cupón por persona/mesa salvo aclaración del socio.',
];

// hash estable de un string → entero (para valores ficticios deterministas)
function hashStr(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// helper: completa defaults del cupón (galería, términos, campos para el mapa
// y valores ficticios de ahorro/precio de activación para poder mostrar el checkout)
function mkCupon(o) {
  const h = hashStr(o.id || o.titulo || '');
  return {
    galeria: [o.imagen, CUP_IMG.playa, CUP_IMG.bosque],
    terminos: TERMINOS_BASE,
    // campos que consume MapView (forma "promo")
    title: o.titulo,
    proveedorNombre: o.socio,
    // valores ficticios estables (mismo id → mismo valor siempre)
    ahorro_estimado: 3000 + (h % 13) * 1000,   // $3.000 – $15.000
    precio_activacion: 600 + (h % 9) * 150,     // $600 – $1.800
    ...o,
  };
}

const CUPONES_POR_CUPONERA = {
  // 1 · Escapada Romántica — Mar de las Pampas
  1: [
    mkCupon({ id: 'c1-1', badge: 'Cortesía', titulo: 'Espumante y welcome en la habitación', socio: 'Hotel del Bosque', tipo: 'Hotel', imagen: CUP_IMG.hotel, lat: -37.3225, lng: -56.9852, localidad: 'Mar de las Pampas',
      beneficio: 'Botella de espumante y tabla de bienvenida al llegar a tu habitación.', descripcionSocio: 'Hotel boutique entre los pinos de Mar de las Pampas, a 3 cuadras del mar. 24 habitaciones con desayuno de campo incluido.', detalles: ['Espumante nacional frío en la habitación', 'Tabla de quesos y frutos secos para 2', 'Válido en el check-in coordinando el horario'] }),
    mkCupon({ id: 'c1-2', badge: '2×1', titulo: 'Cena romántica a la luz de las velas', socio: 'Restaurante Amarena', tipo: 'Restaurante', imagen: CUP_IMG.cena, lat: -37.3241, lng: -56.9831, localidad: 'Mar de las Pampas',
      beneficio: 'Menú de 3 pasos para 2 personas pagando uno.', descripcionSocio: 'Cocina de autor con productos de la zona, ambientado a la luz de las velas. Reserva recomendada.', detalles: ['Entrada + principal + postre por persona', 'Aplica de domingo a jueves', 'No incluye bebidas'] }),
    mkCupon({ id: 'c1-3', badge: '-30%', titulo: 'Circuito de spa y masajes en pareja', socio: 'Spa Aqua Serena', tipo: 'Spa', imagen: CUP_IMG.spa, lat: -37.3210, lng: -56.9868, localidad: 'Mar de las Pampas',
      beneficio: '30% off en el circuito de spa de 2 horas para dos.', descripcionSocio: 'Circuito húmedo con hidromasaje, sauna finlandés y sala de relax. Masajes descontracturantes con turno previo.', detalles: ['Circuito húmedo 2 horas', 'Masaje relax de 30 min por persona', 'Turno con reserva anticipada'] }),
    mkCupon({ id: 'c1-4', badge: 'Regalo', titulo: 'Desayuno de campo servido en la cabaña', socio: 'Panadería La Espiga', tipo: 'Panadería', imagen: CUP_IMG.desayuno, lat: -37.3252, lng: -56.9845, localidad: 'Mar de las Pampas',
      beneficio: 'Canasta de desayuno artesanal para dos.', descripcionSocio: 'Panadería de masa madre y facturas artesanales. Elaboración diaria.', detalles: ['Facturas, pan casero y mermeladas', 'Jugo natural y café de especialidad', 'Coordinar entrega el día anterior'] }),
  ],
  // 2 · Aventura en el Faro — Las Gaviotas
  2: [
    mkCupon({ id: 'c2-1', badge: 'Cortesía', titulo: 'Cabaña en el pinar con fogón nocturno', socio: 'Las Gaviotas Lodge', tipo: 'Cabaña', imagen: CUP_IMG.cabana, lat: -37.3465, lng: -56.9925, localidad: 'Las Gaviotas',
      beneficio: 'Leña y kit de fogón sin cargo durante tu estadía.', descripcionSocio: 'Cabañas de madera entre los pinos, a 200 m de una bajada de playa tranquila. Ideal para desconectarse.', detalles: ['Kit de fogón con leña incluido', 'Quincho con parrilla disponible', 'Válido toda la estadía'] }),
    mkCupon({ id: 'c2-2', badge: '-15%', titulo: 'Excursión 4x4 al Faro Querandí', socio: 'Médanos Extremo', tipo: 'Aventura', imagen: CUP_IMG.cuatro4, lat: -37.3502, lng: -56.9948, localidad: 'Las Gaviotas',
      beneficio: '15% off en la excursión guiada 4x4 a la reserva del faro.', descripcionSocio: 'Excursiones off-road por la reserva Faro Querandí con guías habilitados. Salidas diarias según marea.', detalles: ['Recorrido de 3 horas por los médanos', 'Subida al faro incluida', 'Salida sujeta a condiciones climáticas'] }),
    mkCupon({ id: 'c2-3', badge: 'Regalo', titulo: 'Picnic gourmet en playa virgen', socio: 'Almacén del Médano', tipo: 'Gourmet', imagen: CUP_IMG.playa, lat: -37.3448, lng: -56.9910, localidad: 'Las Gaviotas',
      beneficio: 'Canasta de picnic artesanal para dos personas.', descripcionSocio: 'Almacén de productos regionales, tablas y viandas para llevar. Todo de productores locales.', detalles: ['Tabla de fiambres y quesos regionales', 'Vino o limonada artesanal', 'Retirar en el local coordinando horario'] }),
    mkCupon({ id: 'c2-4', badge: '-20%', titulo: 'Sandboard en los médanos', socio: 'Duna Sur', tipo: 'Aventura', imagen: CUP_IMG.surf, lat: -37.3520, lng: -56.9962, localidad: 'Mar Azul',
      beneficio: '20% off en la clase de sandboard con equipo.', descripcionSocio: 'Escuela de sandboard y actividades de médano. Instructores certificados y equipo incluido.', detalles: ['Clase de 90 minutos', 'Tabla y protecciones incluidas', 'Apto principiantes desde 8 años'] }),
  ],
  // 3 · Ruta Gastronómica — Villa Gesell
  3: [
    mkCupon({ id: 'c3-1', badge: 'Cortesía', titulo: 'Apart céntrico con late check-out', socio: 'Apart del Centro', tipo: 'Apart', imagen: CUP_IMG.hotel, lat: -37.2630, lng: -56.9762, localidad: 'Villa Gesell',
      beneficio: 'Late check-out sin cargo (hasta las 14 hs).', descripcionSocio: 'Aparts equipados en pleno centro, a una cuadra de la Avenida 3 y del mar.', detalles: ['Late check-out hasta las 14 hs', 'Sujeto a disponibilidad', 'Coordinar el día del egreso'] }),
    mkCupon({ id: 'c3-2', badge: '-25%', titulo: 'Degustación de vinos y mariscos', socio: 'Bodegón del Puerto', tipo: 'Restaurante', imagen: CUP_IMG.vino, lat: -37.2648, lng: -56.9748, localidad: 'Villa Gesell',
      beneficio: '25% off en la tabla de mariscos con maridaje.', descripcionSocio: 'Cocina de mar con carta de vinos de bodegas argentinas. Terraza con vista al centro.', detalles: ['Tabla de mariscos para 2', 'Copa de vino de maridaje incluida', 'Aplica hasta las 20 hs'] }),
    mkCupon({ id: 'c3-3', badge: '2×1', titulo: 'Churros históricos en El Topo', socio: 'Churros El Topo', tipo: 'Cafetería', imagen: CUP_IMG.cafe, lat: -37.2622, lng: -56.9771, localidad: 'Villa Gesell',
      beneficio: 'Docena de churros 2×1 con chocolate.', descripcionSocio: 'Un clásico histórico de la Villa. Churros rellenos de dulce de leche recién hechos.', detalles: ['Media docena + media docena de regalo', 'Chocolate caliente a elección', 'Válido todo el día'] }),
    mkCupon({ id: 'c3-4', badge: '-15%', titulo: 'Cabalgata al atardecer por la costa', socio: 'Cabalgatas del Sur', tipo: 'Aventura', imagen: CUP_IMG.caballos, lat: -37.2705, lng: -56.9820, localidad: 'Villa Gesell',
      beneficio: '15% off en la cabalgata guiada de atardecer.', descripcionSocio: 'Paseos a caballo por la playa y los médanos con guías. Caballos mansos, apto principiantes.', detalles: ['Cabalgata de 1 hora al atardecer', 'Guía y casco incluidos', 'Reserva anticipada según cupo'] }),
  ],
  // 4 · Familia Plena — Villa Gesell
  4: [
    mkCupon({ id: 'c4-1', badge: 'Cortesía', titulo: 'Casa con pileta y acceso al parque acuático', socio: 'Complejo Sol y Mar', tipo: 'Complejo', imagen: CUP_IMG.pileta, lat: -37.2660, lng: -56.9740, localidad: 'Villa Gesell',
      beneficio: 'Entradas al parque acuático para toda la familia.', descripcionSocio: 'Complejo familiar con pileta climatizada, juegos y salón. A pocas cuadras de la playa.', detalles: ['4 entradas al parque acuático', 'Uso de pileta y solárium', 'Válido durante la estadía'] }),
    mkCupon({ id: 'c4-2', badge: '-20%', titulo: 'Clases de surf para chicos', socio: 'Escuela de Surf VG', tipo: 'Aventura', imagen: CUP_IMG.surf, lat: -37.2690, lng: -56.9790, localidad: 'Villa Gesell',
      beneficio: '20% off en la clase grupal de surf para menores.', descripcionSocio: 'Escuela de surf con instructores certificados. Tablas blandas y neoprenes por talle.', detalles: ['Clase grupal de 90 minutos', 'Tabla y traje incluidos', 'Desde 7 años con autorización'] }),
    mkCupon({ id: 'c4-3', badge: 'Regalo', titulo: 'Show de títeres y entrada al teatro', socio: 'Teatro de la Villa', tipo: 'Cultura', imagen: CUP_IMG.cena, lat: -37.2618, lng: -56.9758, localidad: 'Villa Gesell',
      beneficio: 'Entrada de regalo para menores acompañados.', descripcionSocio: 'Espacio cultural con funciones familiares durante toda la temporada.', detalles: ['1 entrada de menor sin cargo por adulto', 'Función de tarde', 'Sujeto a la cartelera vigente'] }),
    mkCupon({ id: 'c4-4', badge: '-15%', titulo: 'Merienda familiar con helado', socio: 'Heladería La Perla', tipo: 'Heladería', imagen: CUP_IMG.postre, lat: -37.2635, lng: -56.9776, localidad: 'Villa Gesell',
      beneficio: '15% off en el combo de merienda familiar.', descripcionSocio: 'Helado artesanal y meriendas. Más de 30 gustos de elaboración propia.', detalles: ['1 kg de helado + churros', 'Bebidas para 4 personas', 'Válido de lunes a viernes'] }),
  ],
  // 5 · Relax Total — Mar de las Pampas
  5: [
    mkCupon({ id: 'c5-1', badge: 'Cortesía', titulo: 'Cabaña de descanso en el bosque', socio: 'Cabañas Aromo', tipo: 'Cabaña', imagen: CUP_IMG.cabana, lat: -37.3218, lng: -56.9858, localidad: 'Mar de las Pampas',
      beneficio: 'Kit de té de hierbas y aromaterapia en la cabaña.', descripcionSocio: 'Cabañas rodeadas de aromos y pinos, pensadas para el descanso. Silencio y naturaleza.', detalles: ['Kit de infusiones y aromaterapia', 'Difusor de esencias en la habitación', 'Válido toda la estadía'] }),
    mkCupon({ id: 'c5-2', badge: 'Regalo', titulo: 'Yoga y meditación al amanecer', socio: 'Yoga Gesell', tipo: 'Bienestar', imagen: CUP_IMG.yoga, lat: -37.3235, lng: -56.9872, localidad: 'Mar de las Pampas',
      beneficio: 'Una clase de yoga al amanecer sin cargo.', descripcionSocio: 'Clases de hatha y vinyasa en los médanos al amanecer. Mats disponibles.', detalles: ['Clase de 75 minutos', 'Mat y accesorios incluidos', 'Cupos limitados, reservar antes'] }),
    mkCupon({ id: 'c5-3', badge: '-30%', titulo: 'Masaje relajante descontracturante', socio: 'Spa Aqua Serena', tipo: 'Spa', imagen: CUP_IMG.spa, lat: -37.3212, lng: -56.9866, localidad: 'Mar de las Pampas',
      beneficio: '30% off en el masaje descontracturante de 50 min.', descripcionSocio: 'Masajes terapéuticos y de relajación con aceites esenciales. Turnos individuales.', detalles: ['Masaje de cuerpo completo 50 min', 'Aceites esenciales incluidos', 'Turno con reserva previa'] }),
    mkCupon({ id: 'c5-4', badge: '2×1', titulo: 'Menú saludable de autor', socio: 'Verde Bistró', tipo: 'Restaurante', imagen: CUP_IMG.cena, lat: -37.3248, lng: -56.9838, localidad: 'Mar de las Pampas',
      beneficio: 'Plato principal saludable 2×1.', descripcionSocio: 'Cocina plant-based y saludable con productos orgánicos de la zona.', detalles: ['Principal + principal de regalo', 'Opciones veganas y sin TACC', 'Aplica al mediodía'] }),
  ],
  // 6 · Amigos & Adrenalina — Villa Gesell Centro
  6: [
    mkCupon({ id: 'c6-1', badge: 'Cortesía', titulo: 'Casa completa con quincho y parrilla', socio: 'Casa Duna', tipo: 'Casa', imagen: CUP_IMG.hotel, lat: -37.2652, lng: -56.9752, localidad: 'Villa Gesell',
      beneficio: 'Kit de asado y leña para la primera noche.', descripcionSocio: 'Casa amplia para grupos con quincho, parrilla y terraza. A metros del centro.', detalles: ['Kit de asado + leña incluidos', 'Quincho y terraza de uso exclusivo', 'Válido la primera noche'] }),
    mkCupon({ id: 'c6-2', badge: 'Regalo', titulo: 'Noche de fogón y asado en la playa', socio: 'Fogón Costero', tipo: 'Gourmet', imagen: CUP_IMG.fogon, lat: -37.2700, lng: -56.9810, localidad: 'Villa Gesell',
      beneficio: 'Fogón guiado con picada de regalo para el grupo.', descripcionSocio: 'Experiencias de fogón en la playa con guía, música y picada regional.', detalles: ['Picada regional para el grupo', 'Fogón y leña incluidos', 'Sujeto a permisos y clima'] }),
    mkCupon({ id: 'c6-3', badge: '-20%', titulo: 'Sandboard nocturno en médanos', socio: 'Duna Sur', tipo: 'Aventura', imagen: CUP_IMG.surf, lat: -37.2718, lng: -56.9832, localidad: 'Villa Gesell',
      beneficio: '20% off en la salida de sandboard nocturna.', descripcionSocio: 'Salidas de sandboard con linternas y equipo. Adrenalina bajo las estrellas.', detalles: ['Salida guiada de 2 horas', 'Tabla, casco y linterna incluidos', 'Apto mayores de 12 años'] }),
    mkCupon({ id: 'c6-4', badge: '2×1', titulo: 'Tragos de autor en terraza con DJ', socio: 'Bar La Costa', tipo: 'Bar', imagen: CUP_IMG.bar, lat: -37.2628, lng: -56.9766, localidad: 'Villa Gesell',
      beneficio: 'Cocktails de autor 2×1 en la terraza.', descripcionSocio: 'Rooftop bar con DJ en vivo y coctelería de autor. La previa perfecta del grupo.', detalles: ['Trago + trago de regalo por persona', 'Aplica hasta las 22 hs', 'Música en vivo los fines de semana'] }),
  ],
};

mockPacks.forEach(p => { p.cupones = CUPONES_POR_CUPONERA[p.id] || []; });

// ─── Beneficio adicional por cuponera (texto amarillo + ícono) ─
const BENEFICIO_POR_CUPONERA = {
  1: { texto: 'Triplica los puntos que obtenés', icono: 'trending' },
  2: { texto: 'Sumás puntos por cada aventura',   icono: 'zap' },
  3: { texto: 'Doble de puntos en gastronomía',   icono: 'sparkles' },
  4: { texto: 'Te regalamos un cupón',            icono: 'gift' },
  5: { texto: 'Beneficios de bienestar exclusivos', icono: 'heart' },
  6: { texto: 'Triplica los puntos que obtenés',  icono: 'party' },
};
mockPacks.forEach(p => {
  const b = BENEFICIO_POR_CUPONERA[p.id];
  if (b) { p.beneficioAdicional = b.texto; p.beneficioIcono = b.icono; }
});

// Alias semántico: las "cuponeras prediseñadas" son los mockPacks enriquecidos.
export const mockCuponeras = mockPacks;

export const mockDining = [
  {
    id: 'nido',
    name: "El Nido Bistró",
    category: "Restaurante",
    localidad: "Mar de las Pampas",
    zona: "Bosque",
    priceRange: "$$$",
    description: "Cocina de autor en el corazón del bosque. Experiencia gastronómica única frente a los pinos.",
    image: "/nido.jpg",
    iconName: "Utensils",
    address: "Mar de las Pampas",
    menuUrl: null,
  },
  {
    id: 1,
    name: "El Viejo Hobby",
    category: "Restaurante",
    localidad: "Villa Gesell",
    zona: "Centro",
    priceRange: "$$",
    description: "Bodegón clásico con las mejores minutas y ambiente familiar. Una institución de la Villa.",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    iconName: "Utensils",
    address: "Av. 3 esq. Paseo 106, Villa Gesell",
    menuUrl: null,
  },
  {
    id: 2,
    name: "Churros El Topo",
    category: "Cafeterías",
    localidad: "Villa Gesell",
    zona: "Casco histórico",
    priceRange: "$",
    description: "Un hito histórico de la Villa. Imperdibles los de dulce de leche, la merienda perfecta.",
    image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=80",
    iconName: "Cookie",
    address: "Av. Buenos Aires 101, Villa Gesell",
    menuUrl: "https://cupone.ar",
  },
  {
    id: 3,
    name: "Cervecería Dublin",
    category: "Bar",
    localidad: "Villa Gesell",
    zona: "Centro",
    priceRange: "$$",
    description: "Cerveza artesanal tirada y las mejores papas con cheddar. Ambiente relajado todo el día.",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=800&q=80",
    iconName: "Beer",
    address: "Paseo 112 y Av. 3, Villa Gesell",
    menuUrl: "https://cupone.ar",
  },
  {
    id: 4,
    name: "Parador Windy",
    category: "Balneario",
    localidad: "Las Gaviotas",
    zona: "Línea de playa",
    priceRange: "$$$",
    description: "Almuerzos frente al mar y las mejores rabas de la zona. Vista panorámica al Atlántico.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    iconName: "Waves",
    address: "Av. de las Dunas s/n, Las Gaviotas",
    menuUrl: null,
  },
  {
    id: 5,
    name: "Restaurante Amarena",
    category: "Gourmet",
    localidad: "Mar de las Pampas",
    zona: "Bosque",
    priceRange: "$$$",
    description: "Cocina de autor en un ambiente íntimo rodeado de pinos. Degustación de temporada.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
    iconName: "Wine",
    address: "Ruta 11 y Orión, Mar de las Pampas",
    menuUrl: "https://cupone.ar",
  },
  {
    id: 6,
    name: "La Holandesa",
    category: "Pastelería",
    localidad: "Villa Gesell",
    zona: "Centro",
    priceRange: "$",
    description: "Tortas artesanales y té de hierbas para las tardes de lluvia. Clásico inevitable.",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80",
    iconName: "Coffee",
    address: "Paseo 108 y Av. 5, Villa Gesell",
    menuUrl: null,
  },
  {
    id: 7,
    name: "La Esquina del Mar",
    category: "Restaurante",
    localidad: "Las Gaviotas",
    zona: "Costa",
    priceRange: "$$",
    description: "Pescados y mariscos frescos con vista directa al Atlántico. Especialidad en rabas y langostinos.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80",
    iconName: "Utensils",
    address: "Av. Costanera s/n, Las Gaviotas",
    menuUrl: null,
  },
  {
    id: 8,
    name: "Pizzería Don Vito",
    category: "Restaurante",
    localidad: "Villa Gesell",
    zona: "Zona norte",
    priceRange: "$",
    description: "Pizzas a la piedra y empanadas geselinas desde 1987. Toda la familia en mesa.",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80",
    iconName: "Utensils",
    address: "Av. 3 y Paseo 141, Villa Gesell",
    menuUrl: null,
  },
  {
    id: 9,
    name: "Café del Bosque",
    category: "Cafeterías",
    localidad: "Mar de las Pampas",
    zona: "Acceso principal",
    priceRange: "$$",
    description: "Desayunos y meriendas en el corazón del bosque de pinos. Ambiente tranquilo y sereno.",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
    iconName: "Coffee",
    address: "Acceso Mar de las Pampas s/n",
    menuUrl: "https://cupone.ar",
  },
  {
    id: 10,
    name: "El Parrillón",
    category: "Parrilla",
    localidad: "Villa Gesell",
    zona: "Zona de hoteles",
    priceRange: "$$$",
    description: "Parrilla familiar con cortes premium y atención personalizada. El asado de la Costa.",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    iconName: "Utensils",
    address: "Av. Buenos Aires y Paseo 120, Villa Gesell",
    menuUrl: null,
  },
  {
    id: 11,
    name: "Rincón del Pino",
    category: "Restaurante",
    localidad: "Mar de las Pampas",
    zona: "Bosque",
    priceRange: "$$",
    description: "Cocina casera entre los pinos. Pastas rellenas artesanales y vino de la casa.",
    image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?auto=format&fit=crop&w=800&q=80",
    iconName: "Utensils",
    address: "Av. del Pino s/n, Mar de las Pampas",
    menuUrl: null,
  },
  {
    id: 12,
    name: "Heladería Costanera",
    category: "Heladería",
    localidad: "Villa Gesell",
    zona: "Costanera",
    priceRange: "$",
    description: "Helados artesanales con sabores únicos de la región. Cola de media cuadra en temporada, y lo vale.",
    image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?auto=format&fit=crop&w=800&q=80",
    iconName: "IceCream",
    address: "Costanera y Paseo 104, Villa Gesell",
    menuUrl: null,
  },
  {
    id: 13,
    name: "Bar El Faro",
    category: "Bar",
    localidad: "Las Gaviotas",
    zona: "Acceso principal",
    priceRange: "$$",
    description: "Cócteles de autor y tapas. El lugar para el after-beach cuando el sol baja.",
    image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=80",
    iconName: "Beer",
    address: "Ruta 11 y Acceso Las Gaviotas",
    menuUrl: null,
  },
  {
    id: 14,
    name: "La Cantina del Puerto",
    category: "Restaurante",
    localidad: "Villa Gesell",
    zona: "Sur",
    priceRange: "$$",
    description: "Mariscos frescos del día y cazuela de centolla. Ambiente marinero auténtico.",
    image: "https://images.unsplash.com/photo-1432139555190-58524dae6a55?auto=format&fit=crop&w=800&q=80",
    iconName: "Utensils",
    address: "Av. Costanera Sur 890, Villa Gesell",
    menuUrl: null,
  },
  {
    id: 15,
    name: "Café Bosque Negro",
    category: "Cafeterías",
    localidad: "Mar Azul",
    zona: "Centro",
    priceRange: "$",
    description: "El espresso más oscuro de la costa y medialunas de manteca recién horneadas.",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
    iconName: "Coffee",
    address: "Av. del Bosque 55, Mar Azul",
    menuUrl: null,
  },
  {
    id: 16,
    name: "Sushi Paraná",
    category: "Gourmet",
    localidad: "Villa Gesell",
    zona: "Centro",
    priceRange: "$$$",
    description: "Rolls de autor con mariscos locales. Fusión japo-criolla que sorprende.",
    image: "https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=800&q=80",
    iconName: "Wine",
    address: "Paseo 120 y Av. 3, Villa Gesell",
    menuUrl: "https://cupone.ar",
  },
  {
    id: 17,
    name: "Panadería La Espiga",
    category: "Pastelería",
    localidad: "Villa Gesell",
    zona: "Zona norte",
    priceRange: "$",
    description: "Pan de masa madre, facturas sin TACC y tortas personalizadas para cada ocasión.",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80",
    iconName: "Cookie",
    address: "Av. 3 y Paseo 156, Villa Gesell",
    menuUrl: null,
  },
  {
    id: 18,
    name: "Bodegón Los Aromos",
    category: "Bodegón",
    localidad: "Las Gaviotas",
    zona: "Bosque",
    priceRange: "$$",
    description: "Milanesas napoletanas y guisos caseros de olla. Comida de campo a 100 metros del mar.",
    image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
    iconName: "Utensils",
    address: "Los Aromos 220, Las Gaviotas",
    menuUrl: null,
  },
  {
    id: 19,
    name: "El Último Malón",
    category: "Bar",
    localidad: "Mar de las Pampas",
    zona: "Acceso principal",
    priceRange: "$$",
    description: "Bares con alma rockera, picadas generosas y birras de autor. La noche del bosque empieza acá.",
    image: "https://images.unsplash.com/photo-1574096079513-d8259312b785?auto=format&fit=crop&w=800&q=80",
    iconName: "Beer",
    address: "Ruta 11 km 396, Mar de las Pampas",
    menuUrl: null,
  },
  {
    id: 20,
    name: "Resto Dunas",
    category: "Balneario",
    localidad: "Villa Gesell",
    zona: "Línea de playa",
    priceRange: "$$",
    description: "Deck sobre las dunas, langostinos al ajillo y mojitos de elaboración propia. El verano en un plato.",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
    iconName: "Waves",
    address: "Playa Punta 95, Villa Gesell",
    menuUrl: null,
  },
];
// Reemplazá tu array ALL_PROMOS completo en src/data/mockData.js con esto:

// Reemplazá tu array ALL_PROMOS en src/data/mockData.js con esto:

// Reemplazá tu array ALL_PROMOS en src/data/mockData.js con esto:

export const ALL_PROMOS = [
  // ── ALOJAMIENTOS ──────────────────────────────────────────
  {
    id: 1, negocioId: 2, offerType: 'Flash', categoria: 'alojamiento',
    title: 'Liquidación Flash: 48hs de descuento total.',
    subtitle: 'Cabañas del Pinar · Barrio Norte',
    badge: '-40%', tokens_costo: 2, ahorroEstimado: 32000,
    image: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=600&q=80',
    fechaFinFlash: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
    proveedorNombre: 'Cabañas del Pinar', negocioLocalidad: 'Villa Gesell', negocioZone: 'Barrio Norte',
  },
  {
    id: 2, negocioId: 1, offerType: 'Normal', categoria: 'alojamiento',
    title: 'Finde romántico: Jacuzzi y espumante de regalo.',
    subtitle: 'Hotel Spa Las Olas · Centro',
    badge: 'Regalo', tokens_costo: 1, ahorroEstimado: 15000,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Hotel Spa Las Olas', negocioLocalidad: 'Villa Gesell', negocioZone: 'Línea de playa',
  },
  {
    id: 3, negocioId: 8, offerType: 'Normal', categoria: 'alojamiento',
    title: 'Early Bird: Asegurá tu verano con descuento.',
    subtitle: 'Alpen House · Mar Azul',
    badge: '-20%', tokens_costo: 2, ahorroEstimado: 19000,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Alpen House', negocioLocalidad: 'Mar Azul', negocioZone: 'Costa',
  },
  {
    id: 4, negocioId: 5, offerType: 'Normal', categoria: 'alojamiento',
    title: 'Tu mascota viaja gratis: Alojamientos pet friendly.',
    subtitle: 'Residencias del Mar · Sur',
    badge: 'Pet OK', tokens_costo: 1, ahorroEstimado: 8000,
    image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Residencias del Mar', negocioLocalidad: 'Villa Gesell', negocioZone: 'Zona sur',
  },
  {
    id: 5, negocioId: 7, offerType: 'Flash', categoria: 'alojamiento',
    title: 'Último momento: Cabañas libres este finde.',
    subtitle: 'Cabañas Ártico · Las Gaviotas',
    badge: '-35%', tokens_costo: 3, ahorroEstimado: 44000,
    image: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=600&q=80',
    fechaFinFlash: new Date(Date.now() + 1000 * 60 * 60 * 6).toISOString(),
    proveedorNombre: 'Cabañas Ártico', negocioLocalidad: 'Las Gaviotas', negocioZone: 'Bosque',
  },
  {
    id: 6, negocioId: 3, offerType: 'Normal', categoria: 'alojamiento',
    title: 'Reservá 3 noches y pagás solo 2.',
    subtitle: 'Apart Sol y Arena · Playa',
    badge: '3x2', tokens_costo: 3, ahorroEstimado: 65000,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Apart Sol y Arena', negocioLocalidad: 'Villa Gesell', negocioZone: 'A 100m de playa',
  },
  {
    id: 7, negocioId: 6, offerType: 'Normal', categoria: 'alojamiento',
    title: 'Hot Sale: Hoteles frente al mar con -35%.',
    subtitle: 'Hostería San Remo · Centro',
    badge: '-35%', tokens_costo: 3, ahorroEstimado: 55000,
    image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Hostería San Remo', negocioLocalidad: 'Villa Gesell', negocioZone: 'Centro',
  },
  {
    id: 8, negocioId: 4, offerType: 'Normal', categoria: 'alojamiento',
    title: 'Slow Week: Descuento especial de lunes a jueves.',
    subtitle: 'Boutique Pinar · Mar de las Pampas',
    badge: '-25%', tokens_costo: 2, ahorroEstimado: 30000,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Boutique Pinar', negocioLocalidad: 'Mar de las Pampas', negocioZone: 'Bosque',
  },

  // ── SALIDAS ───────────────────────────────────────────
  {
    id: 9, negocioId: null, offerType: 'Normal', categoria: 'salidas',
    title: '2x1 en la mítica tarde de churros.',
    subtitle: 'Churros El Topo · Villa Gesell',
    badge: '2x1', tokens_costo: 1, ahorroEstimado: 4000,
    image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Churros El Topo', negocioLocalidad: 'Villa Gesell',
    proveedorImage: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Villa Gesell',
    stock: 20, stockUsado: 17,
  },
  {
    id: 10, negocioId: null, offerType: 'Flash', categoria: 'salidas',
    title: 'Venta nocturna: Cená frente al mar con -20%.',
    subtitle: 'Parador Windy · Playa Norte',
    badge: '-20%', tokens_costo: 1, ahorroEstimado: 6000,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=600&q=80',
    fechaFinFlash: new Date(Date.now() + 1000 * 60 * 60 * 4).toISOString(),
    proveedorNombre: 'Parador Windy', negocioLocalidad: 'Villa Gesell',
    proveedorImage: 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Villa Gesell',
  },
  {
    id: 11, negocioId: null, offerType: 'Normal', categoria: 'salidas',
    title: 'Regalo de bienvenida: Picada artesanal y cerveza.',
    subtitle: 'Cervecería Dublin · Centro',
    badge: 'Regalo', tokens_costo: 1, ahorroEstimado: 5000,
    exclusivoHuespedes: 'Boutique Pinar',
    image: 'https://images.unsplash.com/photo-1567529692333-de9fd6772897?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Cervecería Dublin', negocioLocalidad: 'Villa Gesell',
    // Bartender con barba hipster
    proveedorImage: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Villa Gesell',
  },
  {
    id: 12, negocioId: null, offerType: 'Normal', categoria: 'salidas',
    title: 'Ruta de la cerveza: 2x1 en pintas artesanales.',
    subtitle: 'Cervecería Dublin · Centro',
    badge: '2x1', tokens_costo: 1, ahorroEstimado: 6000,
    image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Cervecería Dublin', negocioLocalidad: 'Villa Gesell',
    proveedorImage: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Villa Gesell',
  },
  {
    id: 13, negocioId: null, offerType: 'Normal', categoria: 'salidas',
    title: 'Cena romántica: Postre y brindis de cortesía.',
    subtitle: 'Restaurante Amarena · Mar de las Pampas',
    badge: 'Cortesía', tokens_costo: 1, ahorroEstimado: 7000,
    exclusivoHuespedes: 'Hotel Spa Las Olas',
    image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Restaurante Amarena', negocioLocalidad: 'Mar de las Pampas',
    // Chef con uniforme blanco
    proveedorImage: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Mar de las Pampas',
  },
  {
    id: 14, negocioId: null, offerType: 'Normal', categoria: 'salidas',
    title: 'Merienda frente al mar: 2x1 en tortas.',
    subtitle: 'La Holandesa · Villa Gesell',
    badge: '2x1', tokens_costo: 1, ahorroEstimado: 4500,
    image: 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'La Holandesa', negocioLocalidad: 'Villa Gesell',
    // Mujer pastelera sonriente
    proveedorImage: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Villa Gesell',
  },
  {
    id: 15, negocioId: null, offerType: 'Normal', categoria: 'salidas',
    title: 'Hora feliz: Tragos de autor al 2x1.',
    subtitle: 'Cervecería Dublin · Centro',
    badge: '2x1', tokens_costo: 1, ahorroEstimado: 5500,
    image: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Cervecería Dublin', negocioLocalidad: 'Villa Gesell',
    proveedorImage: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Villa Gesell',
  },

  // ── AVENTURA & RELAX ──────────────────────────────────────────
  {
    id: 16, negocioId: null, offerType: 'Normal', categoria: 'aventura_relax',
    title: 'Aventura 4x4 al Faro con picnic incluido.',
    subtitle: 'Excursiones Gesell · Villa Gesell',
    badge: 'Picnic', tokens_costo: 1, ahorroEstimado: 8000,
    exclusivoHuespedes: 'Cabañas Ártico',
    image: 'https://images.unsplash.com/photo-1533481405265-e9ce0c044abb?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Martín — Guía 4x4', negocioLocalidad: 'Villa Gesell',
    // Hombre con ropa outdoor y expresión aventurera
    proveedorImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Villa Gesell',
  },
  {
    id: 17, negocioId: null, offerType: 'Normal', categoria: 'aventura_relax',
    title: 'Cabalgata entre los pinos al atardecer.',
    subtitle: 'Rancho Gesell · Barrio Norte',
    badge: '-15%', tokens_costo: 1, ahorroEstimado: 6000,
    image: 'https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Diego — Guía Ecuestre', negocioLocalidad: 'Villa Gesell',
    // Gaucho con sombrero y ropa de campo
    proveedorImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Villa Gesell',
  },
  {
    id: 18, negocioId: null, offerType: 'Flash', categoria: 'aventura_relax',
    title: 'Travesía nocturna por las dunas en descuento.',
    subtitle: 'Médanos Aventura · Las Gaviotas',
    badge: '-30%', tokens_costo: 2, ahorroEstimado: 12000,
    image: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=600&q=80',
    fechaFinFlash: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
    proveedorNombre: 'Lucas — Guía de Dunas', negocioLocalidad: 'Las Gaviotas',
    // Joven con ropa de arena y expresión energética
    proveedorImage: 'https://images.unsplash.com/photo-1530268729831-4b0b9e170218?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Las Gaviotas',
  },
  {
    id: 19, negocioId: null, offerType: 'Normal', categoria: 'aventura_relax',
    title: 'Clase de surf gratis con tu estadía.',
    subtitle: 'Surf School Gesell · Playa',
    badge: 'Gratis', tokens_costo: 1, ahorroEstimado: 9000,
    exclusivoHuespedes: 'Apart Sol y Arena',
    image: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Nico — Instructor de Surf', negocioLocalidad: 'Villa Gesell',
    // Surfista joven bronceado con aspecto costero
    proveedorImage: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Villa Gesell',
  },
  {
    id: 20, negocioId: null, offerType: 'Normal', categoria: 'aventura_relax',
    title: 'Día de spa relax con beneficio exclusivo.',
    subtitle: 'Spa Pinar · Mar de las Pampas',
    badge: '-25%', tokens_costo: 1, ahorroEstimado: 7000,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Valeria — Terapeuta', negocioLocalidad: 'Villa Gesell',
    // Mujer con ropa de spa, expresión tranquila y profesional
    proveedorImage: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Mar de las Pampas',
  },
  {
    id: 21, negocioId: null, offerType: 'Normal', categoria: 'aventura_relax',
    title: 'Yoga al amanecer frente al mar gratis.',
    subtitle: 'Playa Norte · Villa Gesell',
    badge: 'Gratis', tokens_costo: 2, ahorroEstimado: 11000,
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Sofía — Instructora de Yoga', negocioLocalidad: 'Mar de las Pampas',
    // Mujer joven con ropa deportiva, aspecto sereno
    proveedorImage: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Villa Gesell',
  },
  {
    id: 22, negocioId: null, offerType: 'Normal', categoria: 'aventura_relax',
    title: 'Experiencia astronómica: Noche de estrellas.',
    subtitle: 'Observatorio Gesell · Mar Azul',
    badge: 'Especial', tokens_costo: 1, ahorroEstimado: 8500,
    image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Roberto — Astrónomo', negocioLocalidad: 'Villa Gesell',
    // Hombre mayor con gafas y aspecto científico
    proveedorImage: 'https://images.unsplash.com/photo-1553267751-1c148a7280a1?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Mar Azul',
  },
  {
    id: 23, negocioId: null, offerType: 'Normal', categoria: 'aventura_relax',
    title: 'Pesca embarcada: Salida grupal con tarifa promocional.',
    subtitle: 'Mar Abierto Gesell · Puerto',
    badge: 'Grupal', tokens_costo: 2, ahorroEstimado: 15000,
    image: 'https://images.unsplash.com/photo-1545450143-f57bb14c1bc5?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Jorge — Capitán de Pesca', negocioLocalidad: 'Villa Gesell',
    // Hombre curtido, con aspecto de marinero/pescador
    proveedorImage: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Villa Gesell',
  },
  {
    id: 24, negocioId: null, offerType: 'Normal', categoria: 'aventura_relax',
    title: 'Sandboard en los médanos: Diversión familiar.',
    subtitle: 'Médanos Aventura · Villa Gesell',
    badge: 'Familia', tokens_costo: 1, ahorroEstimado: 9500,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Médanos Aventura', negocioLocalidad: 'Mar de las Pampas',
    proveedorImage: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&w=100&q=80',
    negocioZone: 'Villa Gesell',
  },

  // ── PROMOS PROPIAS DE HOTELES sin oferta propia ────────────
  {
    id: 25, negocioId: 9, offerType: 'Normal', categoria: 'alojamiento',
    title: 'Semana completa con precio especial de temporada.',
    subtitle: 'La Paloma House · Chacras del Mar',
    badge: '-20%',
    image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'La Paloma House',
    negocioZone: 'Chacras del Mar',
  },
  {
    id: 26, negocioId: 10, offerType: 'Flash', categoria: 'alojamiento',
    title: 'Flash: Último piso con vista al mar disponible.',
    subtitle: 'El Rincón del Faro · Mar Azul',
    badge: '-30%',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=600&q=80',
    fechaFinFlash: new Date(Date.now() + 1000 * 60 * 60 * 8).toISOString(),
    proveedorNombre: 'El Rincón del Faro',
    negocioZone: 'Mar Azul',
  },
  {
    id: 27, negocioId: 11, offerType: 'Normal', categoria: 'alojamiento',
    title: 'Mochilero: Reservá 4 noches al precio de 3.',
    subtitle: 'Hostel Arena y Pinos · Villa Gesell',
    badge: '4x3',
    image: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Hostel Arena y Pinos',
    negocioZone: 'Villa Gesell',
  },
  {
    id: 28, negocioId: 1, offerType: 'Normal', categoria: 'alojamiento',
    title: 'Spa day gratuito al reservar 3 noches o más.',
    subtitle: 'Hotel Spa Las Olas · Villa Gesell',
    badge: 'Spa Gratis',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Hotel Spa Las Olas',
    negocioZone: 'Villa Gesell',
  },
  {
    id: 29, negocioId: 4, offerType: 'Flash', categoria: 'alojamiento',
    title: 'Escapada express: 2 noches + cena de bienvenida.',
    subtitle: 'Boutique Pinar · Mar de las Pampas',
    badge: 'Cena Incl.',
    fechaFinFlash: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
    proveedorNombre: 'Boutique Pinar',
    negocioZone: 'Mar de las Pampas',
  },
];

// ── Metadata extra para enriquecer promos ────────────────────
// tokens_costo   → créditos que cuesta canjear la oferta
// tarifaValidez  → solo en promos propias de alojamientos
// description    → descripción extendida para PropiaOfferCard
// badgeDesc      → texto corto bajo el badge en el área de color (2-3 líneas)
export const PROMO_META = {
  // ── Alojamientos propios ──────────────────────────────────
  1:  { tokens_costo: 10, tarifaValidez: 'todas',
        badgeDesc: 'de descuento en toda la estadía',
        description: 'Aprovechá el fin de semana con tu pareja. Jacuzzi privado en habitación, espumante de bienvenida y late check-out hasta las 14 hs sin cargo.' },
  2:  { tokens_costo:  8, tarifaValidez: 'comun',
        badgeDesc: 'noche regalada en tu próxima reserva',
        description: 'Por 48 horas solamente: descuento real del 40% en cualquier cabaña disponible. Mínimo 2 noches. No acumulable con otras promos.' },
  3:  { tokens_costo:  6, tarifaValidez: 'comun',
        badgeDesc: 'reservando con 60 días de anticipación',
        description: 'Reservá con 60 días de anticipación y pagás el 20% menos automáticamente. Ideal para planificar con tranquilidad.' },
  4:  { tokens_costo:  5, tarifaValidez: 'todas',
        badgeDesc: 'tu mascota sin costo adicional',
        description: 'Tu mascota es parte de la familia. Sin cargo extra por tu perro o gato durante todo el año, en todas nuestras unidades.' },
  5:  { tokens_costo:  9, tarifaValidez: 'comun',
        badgeDesc: 'de descuento este fin de semana',
        description: '¡Urgente! Tenemos cabañas libres este fin de semana. Reservá ahora y llevate el 35% de descuento. Disponibilidad limitada, confirmación inmediata.' },
  6:  { tokens_costo: 12, tarifaValidez: 'comun',
        badgeDesc: 'noches por el precio de dos',
        description: 'Reservá 3 noches seguidas y la tercera no la pagás. Todas nuestras unidades con balcón al mar participan de esta promo.' },
  7:  { tokens_costo:  8, tarifaValidez: 'comun',
        badgeDesc: 'oferta especial Hot Sale nacional',
        description: 'Nuestra mejor oferta del año, solo durante el Hot Sale nacional. Asegurá tu alojamiento al precio más bajo.' },
  8:  { tokens_costo:  7, tarifaValidez: 'comun',
        badgeDesc: 'viajando de lunes a jueves',
        description: 'De lunes a jueves la hostería está más tranquila y los precios lo reflejan. Descuento del 25% automático al reservar entre semana.' },
  25: { tokens_costo:  6, tarifaValidez: 'comun',
        badgeDesc: 'quedándote la semana completa',
        description: 'Quedarte una semana completa tiene su recompensa. Precio de temporada baja garantizado independientemente de cuándo reserves.' },
  26: { tokens_costo:  8, tarifaValidez: 'comun',
        badgeDesc: 'en el último piso con vista al mar',
        description: 'El piso más alto disponible, con vista directa al Atlántico. Precio especial válido solo mientras tengamos disponibilidad en ese nivel.' },
  27: { tokens_costo:  5, tarifaValidez: 'comun',
        badgeDesc: 'noches por el precio de tres',
        description: 'Quedate 4 noches al precio de 3. Para mochileros que quieren explorar la costa sin apuro y sin reventar el presupuesto.' },
  28: { tokens_costo: 15, tarifaValidez: 'todas',
        badgeDesc: 'en reservas de 3 noches o más',
        description: 'Con cualquier reserva de 3 noches o más te regalamos un día completo en nuestro spa: masajes, circuito termal y pileta cubierta climatizada.' },
  29: { tokens_costo: 12, tarifaValidez: 'especial',
        badgeDesc: 'cena gourmet incluida en tu estadía',
        description: 'Dos noches de escapada con cena de bienvenida preparada por nuestro chef. Menú de temporada con productos locales y copa de vino.' },

  // ── Salidas ───────────────────────────────────────────
  9:  { tokens_costo: 2 }, 10: { tokens_costo: 2 }, 11: { tokens_costo: 1 },
  12: { tokens_costo: 1 }, 13: { tokens_costo: 3 }, 14: { tokens_costo: 1 },
  15: { tokens_costo: 1 },

  // ── Aventura & Relax ──────────────────────────────────────────
  16: { tokens_costo: 3 }, 17: { tokens_costo: 2 }, 18: { tokens_costo: 2 },
  19: { tokens_costo: 2 }, 20: { tokens_costo: 3 }, 21: { tokens_costo: 1 },
  22: { tokens_costo: 2 }, 23: { tokens_costo: 3 }, 24: { tokens_costo: 2 },
};

// ── Beneficios exclusivos: socios externos por hotel ─────────
// negocioId = hotel que ofrece el beneficio a sus huéspedes
// promoId   = promo (gastro/experiencia) de otro socio
export const mockAlianzas = [
  // Hotel Spa Las Olas (id:1) — Villa Gesell
  { id: 'ali-1',  negocioId: 1,  promoId: 11 }, // Cervecería Dublin — regalo bienvenida
  { id: 'ali-2',  negocioId: 1,  promoId: 19 }, // Surf School — clase gratis
  { id: 'ali-3',  negocioId: 1,  promoId: 21 }, // Yoga al amanecer
  { id: 'ali-4',  negocioId: 1,  promoId: 17 }, // Cabalgata entre pinos

  // Cabañas del Pinar (id:2) — Villa Gesell
  { id: 'ali-5',  negocioId: 2,  promoId: 9  }, // Churros El Topo 2x1
  { id: 'ali-6',  negocioId: 2,  promoId: 16 }, // Aventura 4x4 con picnic
  { id: 'ali-7',  negocioId: 2,  promoId: 14 }, // La Holandesa merienda

  // Apart Sol y Arena (id:3) — Villa Gesell
  { id: 'ali-8',  negocioId: 3,  promoId: 10 }, // Parador Windy -20%
  { id: 'ali-9',  negocioId: 3,  promoId: 15 }, // Dublin hora feliz
  { id: 'ali-10', negocioId: 3,  promoId: 24 }, // Sandboard familiar

  // Boutique Pinar (id:4) — Mar de las Pampas
  { id: 'ali-11', negocioId: 4,  promoId: 13 }, // Restaurante Amarena
  { id: 'ali-12', negocioId: 4,  promoId: 20 }, // Spa Pinar -25%

  // Residencias del Mar (id:5) — Villa Gesell
  { id: 'ali-13', negocioId: 5,  promoId: 9  }, // Churros El Topo
  { id: 'ali-14', negocioId: 5,  promoId: 12 }, // Dublin 2x1 pintas
  { id: 'ali-15', negocioId: 5,  promoId: 23 }, // Pesca embarcada grupal

  // Hostería San Remo (id:6) — Villa Gesell
  { id: 'ali-16', negocioId: 6,  promoId: 14 }, // La Holandesa merienda
  { id: 'ali-17', negocioId: 6,  promoId: 17 }, // Cabalgata -15%

  // Cabañas Ártico (id:7) — Las Gaviotas
  { id: 'ali-18', negocioId: 7,  promoId: 18 }, // Dunas nocturnas -30%
  { id: 'ali-19', negocioId: 7,  promoId: 10 }, // Parador Windy cena -20%

  // Alpen House (id:8) — Mar Azul
  { id: 'ali-20', negocioId: 8,  promoId: 22 }, // Observatorio astronómico
  { id: 'ali-21', negocioId: 8,  promoId: 20 }, // Spa Pinar

  // La Paloma House (id:9) — Chacras del Mar
  { id: 'ali-22', negocioId: 9,  promoId: 16 }, // Aventura 4x4
  { id: 'ali-23', negocioId: 9,  promoId: 17 }, // Cabalgata

  // El Rincón del Faro (id:10) — Mar Azul
  { id: 'ali-24', negocioId: 10, promoId: 22 }, // Observatorio astronómico
  { id: 'ali-25', negocioId: 10, promoId: 18 }, // Dunas nocturnas

  // Hostel Arena y Pinos (id:11) — Villa Gesell
  { id: 'ali-26', negocioId: 11, promoId: 19 }, // Surf — clase gratis
  { id: 'ali-27', negocioId: 11, promoId: 16 }, // Aventura 4x4
  { id: 'ali-28', negocioId: 11, promoId: 24 }, // Sandboard familiar
];
// ============================================================
//  Agregá esto al final de src/data/mockData.js
//  Son los 30 proveedores de ejemplo (10 por categoría)
// ============================================================

export const mockProveedores = [

  // ── ALOJAMIENTOS (10) ─────────────────────────────────────
  {
    id: 'prov-1',
    nombre: 'Hotel Spa Las Olas',
    tipo: 'Hotel',
    localidad: 'Villa Gesell',
    zona: 'Línea de playa',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Hotel frente al mar con spa de última generación.',
    email: 'lasolas@cupone.ar',
  },
  {
    id: 'prov-2',
    nombre: 'Cabañas del Pinar',
    tipo: 'Cabaña',
    localidad: 'Villa Gesell',
    zona: 'Zona norte',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Complejo de cabañas en el pinar fundacional.',
    email: 'pinar@cupone.ar',
  },
  {
    id: 'prov-3',
    nombre: 'Apart Sol y Arena',
    tipo: 'Departamento',
    localidad: 'Villa Gesell',
    zona: 'A 100m de playa',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Departamentos modernos a metros del mar.',
    email: 'solyarena@cupone.ar',
  },
  {
    id: 'prov-4',
    nombre: 'Boutique Pinar',
    tipo: 'Hotel',
    localidad: 'Mar de las Pampas',
    zona: 'Bosque',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Diseño minimalista en el corazón del bosque.',
    email: 'boutique@cupone.ar',
  },
  {
    id: 'prov-5',
    nombre: 'Residencias del Mar',
    tipo: 'Departamento',
    localidad: 'Villa Gesell',
    zona: 'Zona sur',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Amplios departamentos con piscina y parque.',
    email: 'residencias@cupone.ar',
  },
  {
    id: 'prov-6',
    nombre: 'Alpen House',
    tipo: 'Hotel',
    localidad: 'Mar Azul',
    zona: 'Bosque',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Hostería alpina a tres cuadras del mar.',
    email: 'alpen@cupone.ar',
  },
  {
    id: 'prov-7',
    nombre: 'Cabañas Ártico',
    tipo: 'Cabaña',
    localidad: 'Las Gaviotas',
    zona: 'Costa',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Cabañas con jacuzzi privado y deck exterior.',
    email: 'artico@cupone.ar',
  },
  {
    id: 'prov-8',
    // Alquiler particular — foto de persona, no logo
    nombre: 'Depto de Carla',
    tipo: 'Departamento',
    localidad: 'Villa Gesell',
    zona: 'Centro',
    esEmpresa: false,
    fotoPerfil: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Departamento particular frente al mar, 2 ambientes.',
    email: 'carla.gesell@gmail.com',
  },
  {
    id: 'prov-9',
    // Alquiler particular
    nombre: 'Casa de Roberto y Ana',
    tipo: 'Departamento',
    localidad: 'Mar de las Pampas',
    zona: 'Zona residencial',
    esEmpresa: false,
    fotoPerfil: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Casa familiar con jardín en Mar de las Pampas.',
    email: 'roberto.ana@gmail.com',
  },
  {
    id: 'prov-10',
    nombre: 'Hostería San Remo',
    tipo: 'Hotel',
    localidad: 'Villa Gesell',
    zona: 'Centro',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Clásico geselino con desayuno buffet incluido.',
    email: 'sanremo@cupone.ar',
  },

  // ── GASTRONOMÍA (10) ──────────────────────────────────────
  {
    id: 'prov-11',
    nombre: 'El Viejo Hobby',
    tipo: 'Restaurante',
    localidad: 'Villa Gesell',
    zona: 'Centro',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Bodegón clásico con las mejores minutas.',
    email: 'hobby@cupone.ar',
  },
  {
    id: 'prov-12',
    nombre: 'Churros El Topo',
    tipo: 'Café',
    localidad: 'Villa Gesell',
    zona: 'Casco histórico',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Un hito histórico de la Villa. Churros de dulce de leche.',
    email: 'eltopo@cupone.ar',
  },
  {
    id: 'prov-13',
    nombre: 'Cervecería Dublin',
    tipo: 'Bar',
    localidad: 'Villa Gesell',
    zona: 'Centro',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Cerveza artesanal tirada y las mejores papas con cheddar.',
    email: 'dublin@cupone.ar',
  },
  {
    id: 'prov-14',
    nombre: 'Parador Windy',
    tipo: 'Balneario',
    localidad: 'Villa Gesell',
    zona: 'Línea de playa',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Almuerzos frente al mar y las mejores rabas.',
    email: 'windy@cupone.ar',
  },
  {
    id: 'prov-15',
    nombre: 'Restaurante Amarena',
    tipo: 'Gourmet',
    localidad: 'Mar de las Pampas',
    zona: 'Bosque',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Cocina de autor en ambiente íntimo rodeado de pinos.',
    email: 'amarena@cupone.ar',
  },
  {
    id: 'prov-16',
    nombre: 'La Holandesa',
    tipo: 'Pastelería',
    localidad: 'Villa Gesell',
    zona: 'Centro',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Tortas artesanales y té de hierbas para tardes de lluvia.',
    email: 'laholandesa@cupone.ar',
  },
  {
    id: 'prov-17',
    nombre: 'La Esquina del Mar',
    tipo: 'Restaurante',
    localidad: 'Las Gaviotas',
    zona: 'Costa',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Pescados y mariscos frescos con vista al Atlántico.',
    email: 'esquinadelmar@cupone.ar',
  },
  {
    id: 'prov-18',
    nombre: 'Pizzería Don Vito',
    tipo: 'Restaurante',
    localidad: 'Villa Gesell',
    zona: 'Zona norte',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Pizzas a la piedra y empanadas geselinas desde 1987.',
    email: 'donvito@cupone.ar',
  },
  {
    id: 'prov-19',
    nombre: 'Café del Bosque',
    tipo: 'Café',
    localidad: 'Mar de las Pampas',
    zona: 'Acceso principal',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Desayunos y meriendas en el corazón del bosque.',
    email: 'cafebosque@cupone.ar',
  },
  {
    id: 'prov-20',
    nombre: 'El Parrillón',
    tipo: 'Restaurante',
    localidad: 'Villa Gesell',
    zona: 'Zona de hoteles',
    esEmpresa: false,
    // Emprendimiento familiar — foto del dueño
    fotoPerfil: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Parrilla familiar con cortes premium y atención personalizada.',
    email: 'elparrillon@gmail.com',
  },

  // ── EXPERIENCIAS (10) ─────────────────────────────────────
  {
    id: 'prov-21',
    nombre: 'Médanos Aventura',
    tipo: 'Experiencia',
    localidad: 'Villa Gesell',
    zona: 'Barrio de los médanos',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1533481405265-e9ce0c044abb?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Safari 4x4, sandboard y travesías nocturnas por las dunas.',
    email: 'medanos@cupone.ar',
  },
  {
    id: 'prov-22',
    nombre: 'Surf School Gesell',
    tipo: 'Experiencia',
    localidad: 'Villa Gesell',
    zona: 'Línea de playa',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Clases de surf y bodyboard para todos los niveles.',
    email: 'surf@cupone.ar',
  },
  {
    id: 'prov-23',
    nombre: 'Rancho Los Pinos',
    tipo: 'Experiencia',
    localidad: 'Villa Gesell',
    zona: 'Zona norte',
    esEmpresa: false,
    // Guía ecuestre individual
    fotoPerfil: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Cabalgatas entre pinos y playa al atardecer.',
    email: 'diego.rancho@gmail.com',
  },
  {
    id: 'prov-24',
    nombre: 'Spa Pinar',
    tipo: 'Experiencia',
    localidad: 'Mar de las Pampas',
    zona: 'Bosque',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Masajes, aromaterapia y tratamientos en el bosque.',
    email: 'spapinar@cupone.ar',
  },
  {
    id: 'prov-25',
    nombre: 'Mar Abierto Gesell',
    tipo: 'Experiencia',
    localidad: 'Villa Gesell',
    zona: 'Costa',
    esEmpresa: false,
    // Capitán de pesca
    fotoPerfil: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Salidas de pesca embarcada grupal e individual.',
    email: 'jorge.pesca@gmail.com',
  },
  {
    id: 'prov-26',
    nombre: 'Yoga Frente al Mar',
    tipo: 'Experiencia',
    localidad: 'Villa Gesell',
    zona: 'Línea de playa',
    esEmpresa: false,
    // Instructora de yoga
    fotoPerfil: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Clases de yoga al amanecer y atardecer frente al mar.',
    email: 'sofia.yoga@gmail.com',
  },
  {
    id: 'prov-27',
    nombre: 'Observatorio Austral',
    tipo: 'Experiencia',
    localidad: 'Mar Azul',
    zona: 'Zona residencial',
    esEmpresa: false,
    // Astrónomo
    fotoPerfil: 'https://images.unsplash.com/photo-1553267751-1c148a7280a1?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Noches de observación astronómica con telescopio.',
    email: 'roberto.astro@gmail.com',
  },
  {
    id: 'prov-28',
    nombre: 'Kayak Las Gaviotas',
    tipo: 'Experiencia',
    localidad: 'Las Gaviotas',
    zona: 'Costa',
    esEmpresa: true,
    fotoPerfil: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Paseos en kayak por la laguna y la costa atlántica.',
    email: 'kayak@cupone.ar',
  },
  {
    id: 'prov-29',
    nombre: 'Tour Histórico VG',
    tipo: 'Experiencia',
    localidad: 'Villa Gesell',
    zona: 'Casco histórico',
    esEmpresa: false,
    // Guía de turismo
    fotoPerfil: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Caminata guiada por la historia pionera de la Villa.',
    email: 'pablo.guia@gmail.com',
  },
  {
    id: 'prov-30',
    nombre: 'Panadería Artesanal',
    tipo: 'Experiencia',
    localidad: 'Mar de las Pampas',
    zona: 'Acceso principal',
    esEmpresa: false,
    // Panadera artesana
    fotoPerfil: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80',
    descripcion: 'Talleres de panadería artesanal con masa madre.',
    email: 'laura.pan@gmail.com',
  },
];