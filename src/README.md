# gesell.ar — Guía de estructura del proyecto

Este documento explica **para qué sirve cada archivo** y **cómo editarlos**
sin ser programador.

---

## Estructura de carpetas

```
src/
│
├── App.jsx                     ← El "director de orquesta" de la app
│
├── data/
│   └── mockData.js             ← TODOS los datos: alojamientos, packs, restaurantes
│
├── components/
│   ├── Navbar.jsx              ← La barra de navegación (menú superior)
│   ├── Footer.jsx              ← El pie de página
│   └── AccommodationCard.jsx  ← Tarjeta individual de alojamiento
│
└── views/
    ├── HomeView.jsx            ← La pantalla principal (hero + grillas)
    └── DetailView.jsx          ← El detalle al hacer clic en una tarjeta
```

---

## ¿Qué editar para cada tarea?

### ✅ Agregar un nuevo alojamiento
Abrí `src/data/mockData.js` y agregá un nuevo objeto al array
`mockAccommodations`. Copiá uno existente y cambiá sus valores:

```js
{
  id: 9,                          // número único, diferente a los demás
  name: "Mi Nuevo Hotel",
  type: "Hotel",                  // Hotel | Cabaña | Departamento
  price: 70000,
  rating: 4.6,
  image: "https://...",           // URL de imagen de Unsplash
  location: "Las Gaviotas",
  tags: ["Pileta"],
  description: "Descripción breve del lugar.",
}
```

### ✅ Agregar un restaurante
Mismo archivo, array `mockDining`. Los valores de `iconName` disponibles son:
`Utensils`, `Cookie`, `Beer`, `Waves`, `Wine`, `Coffee`.

### ✅ Cambiar el texto del pie de página
Abrí `src/components/Footer.jsx` y editá el texto directamente.

### ✅ Cambiar el texto del hero (pantalla principal)
Abrí `src/views/HomeView.jsx`, buscá `<h1>` y `<p>` dentro del bloque `HERO`.

### ✅ Agregar una nueva zona al menú
Abrí `src/data/mockData.js` y agregá el nombre al array `locations`:
```js
export const locations = ["Villa Gesell", "Mar de las Pampas", "Las Gaviotas", "Mar Azul", "Nueva Zona"];
```

---

## Flujo de la aplicación (simplificado)

```
App.jsx
  ├── Navbar    (siempre visible)
  ├── HomeView  (si view === 'home')
  │     ├── Hero con buscador
  │     ├── AccommodationCard × 8
  │     ├── PacksSection
  │     └── GastronomySection
  ├── DetailView (si view === 'detail')
  └── Footer    (siempre visible)
```

---

## Convención de nombres

| Prefijo / sufijo | Significado |
|---|---|
| `View.jsx` | Pantalla completa |
| `Card.jsx` | Componente de tarjeta reutilizable |
| `Section` (interno) | Sección de una vista, no es un archivo separado |
| `mockData.js` | Datos de prueba — se reemplazarán por una API real |

---

## Próximos pasos sugeridos

1. **Conectar una base de datos real** → reemplazar `mockData.js` por llamadas a una API.
2. **Agregar página de resultados de búsqueda** → nuevo archivo `src/views/SearchView.jsx`.
3. **Agregar formulario de contacto** → nuevo componente `src/components/ContactForm.jsx`.
4. **Agregar mapa interactivo** → integrar Leaflet o Google Maps en `DetailView.jsx`.
