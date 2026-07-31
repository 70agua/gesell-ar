# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server (Vite, default port 5173)
npm run build     # production build → dist/
npm run preview   # serve dist/ locally
npm run lint      # ESLint
```

Node >=20 required (see `.nvmrc`). Deployed to Vercel via `git push` to `main`.

---

## Architecture

**Single-page app** — React 19 + Vite + Tailwind CSS v4. No router library. Navigation is a `view` string in `App.jsx` state. All view transitions happen by calling `setView(name)`. Adding a new "page" means: (1) create `src/views/NewView.jsx`, (2) import and render it inside `App.jsx`'s `<main>` behind `{view === 'new-view' && ...}`.

### Data flow

```
Supabase ──► src/lib/datos.js ──► normalize functions ──► views/components
```

`datos.js` is the only file that queries Supabase for real data. It exports async functions (`getAlojamientos`, `getGastronomia`, `getPromos`, etc.) that return normalized JS objects. The normalize functions (`normalizeNegocio`, `normalizePromo`) are the canonical shape expected throughout the app — always go through them when pulling raw DB rows.

`src/data/mockData.js` still provides `ALL_PROMOS` and pack data that hasn't been migrated to Supabase yet. Prefer Supabase for new features.

### Supabase

Client singleton in `src/lib/supabase.js`. Import `{ supabase }` from there — never create a second client.

Key tables: `negocios`, `perfiles`, `promociones`, `alianzas`, `consultas`, `socio_tokens`, `token_compras`, `planes`, `suscripciones_socio`, `socio_alias`, `creditos_mensuales`.

Auth via `src/lib/auth.js`. Session is checked at app boot and stored in `App.jsx` state. `perfil` is the row from the `perfiles` table (includes `es_superadmin`, `negocio_id`, and the joined `negocios` row).

### Global contexts (providers in App.jsx)

| Context | File | What it does |
|---|---|---|
| `LoadingProvider` | `src/lib/loading.jsx` | Global overlay. Use `useLoadingFn(asyncFn)` to wrap any async call. |
| `CarritoProvider` | `src/lib/carrito.jsx` | Carrito de compra. `addCupon(oferta)` abre el drawer (`CarritoDrawer`). |
| `FavoritosProvider` | `src/lib/favoritos.jsx` | Heart-saves for accommodations, persisted to Supabase. |

### Business roles & plans

**Un solo modelo: PRO por tramos** (unificado el 2026-07-31 — el viejo Gratis/Plus se eliminó, filas y todo). Hay tres tramos del *mismo* plan, que sólo se diferencian por el compromiso, compartidos entre las tres categorías (Alojamiento, Salidas, Aventura & Relax):

| código | compromiso | precio/mes (sin IVA) | créditos/mes | bono |
|---|---|---|---|---|
| `pro_1` | sin permanencia | $45.000 | 15 | +5 |
| `pro_6` | 6 meses | $37.500 | 15 | +20 |
| `pro_12` | 12 meses | $30.000 | 15 | +60 |

Copy, precios y bonos viven en la tabla `planes` (editables desde SuperAdmin → General), **no** en constantes de código. Se leen con `getPlanesPro()` de `src/lib/planes.js`, única fuente de verdad. `planes.destacado` marca "El más elegido" y un índice parcial garantiza que sea uno solo.

- **Turista**: usuario público, recibe 2 créditos al registrarse.
- **Socio sin plan** (`negocios.plan === 'free'`): publicar es gratis y no requiere plan. No es un plan que se contrata — es el estado de quien todavía no pagó, y por eso *no* tiene fila en `suscripciones_socio`.
- **Socio PRO** (cualquier categoría): contrata un tramo con `crearSuscripcionPro(negocioId, { codigoPlan, unidadesDeclaradas })`. Eso hace upsert en `suscripciones_socio`, pone `negocios.plan = 'plus'` + `fecha_alta_plus`, genera el alias de 6 dígitos y acredita los créditos del primer mes más el bono del tramo. La reposición mensual la hace el cron `reponer-creditos-mensuales`.
- **Superadmin**: `perfil.es_superadmin === true`. Accede a `SuperAdminView`.

`negocios.plan` (`'free'|'plus'`) sigue siendo el flag denormalizado rápido que consultan media docena de componentes: la pregunta que se hacen es "¿paga?", no "¿qué tramo?". Cualquier tramo PRO guarda `'plus'` ahí. El tramo concreto vive en `suscripciones_socio`.

**El negocio no se aprueba.** El socio se da de alta y queda publicado (`aprobado` quedó obsoleta, siempre `true`). La visibilidad la decide `negocios.activo`, que maneja el propio socio. Lo único que se modera son las **ofertas** (`promociones.aprobada`).

### Terminología — vocabulario cerrado

"Cuponera" está **retirada**: no se usa para nada, ni en código ni en UI ni en comunicación. Las tres cosas que antes cubría esa palabra son:

| Concepto | Qué es | Dónde vive |
|---|---|---|
| **Carrito** | Mecanismo de compra de varios cupones sueltos | `src/lib/carrito.jsx`, `CarritoDrawer.jsx` |
| **Pase** | Acceso por N días: regulares ilimitados + N premium | `src/lib/pases.js` |
| **Cupopack** | Selección curada de cupones que arma Cuponear | `src/lib/cupopacks.js`, `CupopackModal.jsx`, `PortadaCupopack.jsx` |

Además: **créditos publicitarios** (del socio) y **puntos** (del turista) — nunca "créditos" ni "tokens" a secas.

**"Huésped" también se retiró del copy** (2026-07-31). El actor es **turista**, que es como ya se llama en el código. El plan no es sólo para alojamientos —también para agencias de turismo—, así que "huésped" quedaba corto. Para *contar gente* (capacidad de una unidad, cantidad en una solicitud) se dice **personas**, no "turistas": es un conteo, no el nombre del actor. Los identificadores de código y las columnas siguen igual (`unidad_precio='huesped'`, `min_huespedes`, `max_huespedes`, `num_huespedes`, `exclusivoHuespedes`).

### Dos monedas, cuatro tablas que dicen "token"

Los nombres de tabla son históricos y **todavía no se renombran** (renombrar esquema es riesgoso y no urgente). El mapeo canónico es:

| Tabla | Moneda | De quién | Se maneja en |
|---|---|---|---|
| `socio_tokens` | Créditos publicitarios (saldo) | Socio | `src/lib/cobros.js` |
| `token_compras` | Créditos publicitarios (compras) | Socio | `src/lib/cobros.js` |
| `usuario_tokens` | Puntos (saldo) | Turista | `src/lib/gamificacion.js` |
| `token_movimientos` | Puntos (historial) | Turista | `src/lib/gamificacion.js` |

Otros nombres legacy en base que **no** se renombraron: `cuponeras_locales` / `cuponeras_locales_cupones` / `cuponera_local_id` (son los Cupopacks), `cuponeras` / `cuponera_items` / `cuponera_id` (solicitudes de alojamiento), y los valores `gastado_cuponera` y `click_cuponera`.

### Credit system

Definido en `src/lib/cobros.js`. 1 crédito = $2.000 + 21% IVA. Saldos en `socio_tokens` (por `negocio_id`).

**Ningún socio paga por publicar ni por canjear.** El único débito de créditos es el impulso voluntario de una oferta (`src/lib/impulso.js`). El plan compra visibilidad, no funcionalidad básica.

### Offer types

Only two: `Flash` (has countdown, `fecha_fin_flash`) and `Normal`. Config and countdown helpers in `src/lib/ofertas.js`. The `badge` field on `promociones` is the human-visible label.

### Styling conventions

- Tailwind CSS v4 (PostCSS plugin, no `tailwind.config.js` theme extensions in use).
- Default font: `Inter` (self-hosted variable font in `public/fonts/`). Display font: `NauryzRedkeds`.
- Responsive breakpoints follow Tailwind defaults; hero layout uses custom `.hero-content` / `.hero-grid` classes in `src/index.css`.
- Inline styles are common for one-off animations and wizard overlays — that's intentional.

### Key icons & assets

- `<Token />` component (`src/components/Token.jsx`) — gold coin SVG, used everywhere credits appear.
- `<CuponIcon />` — coupon icon.
- Lucide React for all other icons (`import { X, Heart, ... } from 'lucide-react'`).
- SVGs in `public/` are referenced as `/filename.svg`.

### Map

`MapView.jsx` and `GastronomyView.jsx` use `react-leaflet`. Coordinates come from `lat`/`lng` on `negocios` rows. The Leaflet CSS must be imported where the map is rendered.

### Localidades

Canonical list in `src/lib/localidades.js`. Nearby-locality logic (for offer discovery) is in the `LOCALIDADES_CERCANAS` map inside `datos.js`.
