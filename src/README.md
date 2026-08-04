# Cuponear — Guía de estructura del proyecto

Dónde vive cada cosa y dónde tocar para cambiarla.

> Para las **reglas de negocio** —planes, precios, puntos, Pase, Cupopacks,
> vocabulario— la fuente es `CLAUDE.md` en la raíz. Este archivo es sólo el mapa
> de archivos.

---

## De dónde salen los datos

**De Supabase, siempre.** No hay datos de prueba en la app: todo lo que ve el
turista sale de la base.

```
Supabase ──► src/lib/datos.js ──► funciones normalize ──► vistas y componentes
```

`src/lib/datos.js` es el **único** archivo que consulta el catálogo. Expone
funciones async (`getAlojamientos`, `getGastronomia`, `getAventura`,
`getPromos`, `getCupopacks`…) que devuelven objetos ya normalizados.
`normalizeNegocio` y `normalizePromo` definen la forma que espera todo el resto
de la app: si traés filas crudas de la base, pasalas por ahí.

Los otros módulos de `src/lib/` consultan lo suyo: `pases.js` el Pase,
`compras.js` la compra del turista, `canjes.js` el canje, `cobros.js` los
créditos del socio, `solicitudes.js` las solicitudes de fecha.

> ⚠️ `src/data/mockData.js` sigue en disco pero **está huérfano**: ningún
> archivo lo importa. Quedó como referencia histórica. No lo uses como respaldo
> cuando una consulta devuelve poco — ver la regla "un dato que falta no se
> rellena" en `CLAUDE.md`.

---

## Estructura de carpetas

```
src/
├── App.jsx              ← Director de orquesta: sesión, providers y el string
│                          `view` que hace de router
├── lib/                 ← Lógica de negocio y acceso a datos
│   ├── supabase.js      ← Cliente único (nunca crear un segundo)
│   ├── datos.js         ← Catálogo: negocios y ofertas
│   ├── pases.js         ← Pase: niveles, slots premium, estadía
│   ├── cupopacks.js     ← Cupopacks: catálogo y llenado de slots
│   ├── cobros.js        ← Precio del cupón y créditos del socio
│   ├── gamificacion.js  ← Puntos del turista (5% de lo pagado)
│   └── condiciones.js   ← Catálogo de condiciones de canje
├── components/          ← Piezas reutilizables (OfertaCard, CtaPase, modales)
├── views/               ← Una pantalla por archivo
│   └── socio/           ← Pestañas del panel del socio
└── data/mockData.js     ← Huérfano (ver arriba)

db/                      ← Migraciones SQL, una por cambio
docs/                    ← Documentos de producto
```

---

## Cómo se navega

No hay librería de router. `App.jsx` guarda un string `view` en su estado y cada
pantalla se muestra con `{view === 'nombre' && <LaVista />}`.

**Agregar una pantalla** = (1) crear `src/views/NuevaView.jsx`, (2) importarla en
`App.jsx` y renderizarla detrás de su `view === 'nueva'`, (3) si es pública,
sumar el nombre al array `PUBLIC_VIEWS`.

---

## ¿Qué edito para cada tarea?

| Quiero… | Dónde |
|---|---|
| Cambiar una oferta o un negocio | En la app: panel del socio o SuperAdmin. **No en código** |
| Cambiar el precio de un cupón | `src/lib/cobros.js` — la escalera de comisiones |
| Cambiar cuántos puntos da una compra | `src/lib/gamificacion.js` (`CASHBACK_PCT`) |
| Cambiar el hero de la home | `src/components/landing/HeroPase.jsx` |
| Cambiar el pie de página | `src/components/Footer.jsx` |
| Sumar una localidad | `src/lib/localidades.js` |
| Sumar una condición de canje frecuente | `src/lib/condiciones.js` |
| Cambiar precios o textos de los planes | En la app: SuperAdmin → General (viven en la tabla `planes`) |

---

## Convención de nombres

| Prefijo / sufijo | Significado |
|---|---|
| `View.jsx` | Pantalla completa, en `views/` |
| `Card.jsx` | Tarjeta reutilizable |
| `Drawer.jsx` / `Modal.jsx` | Panel lateral / ventana superpuesta |
| `Tab*.jsx` | Pestaña de un panel (socio o superadmin) |
| `use*.js` | Hook de React |
| `Section` (interno) | Sección dentro de una vista, no es un archivo aparte |

---

## Antes de tocar la base

Las restricciones `CHECK` y las definiciones de funciones **en los archivos de
`db/` pueden estar desactualizadas** respecto de lo que corre. Consultá siempre
la base antes de agregar un valor nuevo o modificar una RPC. El detalle y las
consultas están en `CLAUDE.md`.
