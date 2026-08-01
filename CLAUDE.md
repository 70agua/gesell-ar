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

Key tables: `negocios`, `perfiles`, `promociones`, `alianzas`, `consultas`, `socio_tokens`, `token_compras`, `planes`, `suscripciones_socio`, `socio_alias`, `creditos_mensuales`, `ventas`, `venta_items`, `cupones_usuario`.

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

**Precio del cupón** (lo que paga el turista) — `calcularPrecioCupon(ahorro)`:
`clamp(redondear_centena(comisión × 1.21), PRECIO_MIN, PRECIO_MAX)` con `PRECIO_MIN = 2500`, `PRECIO_MAX = 20000`.
La comisión es **marginal** (como ganancias): 20% sobre la porción hasta $15.000, 15% de $15.000 a $40.000, 10% de $40.000 a $100.000, 7% por encima. Marginal y no por tramo entero para que el precio sea monótono: antes, subir el ahorro de $15.000 a $15.001 bajaba el cupón de $3.600 a $2.700.
El techo se toca a partir de un ahorro de $153.395, así que los cuatro tramos son alcanzables.
`promociones.precio_manual` saltea la escalera y es **override exclusivo del superadmin** — el socio no lo ve ni lo escribe.
- `AHORRO_MIN = 5000` es el ahorro mínimo publicable (se valida en el editor del socio).
- Debajo de `AHORRO_CUPON_ENTRADA = 10000` es un **cupón de entrada**: precio clavado en $2.500. Se comunica por su **ganancia neta** (`gananciaNeta(ahorro)` = ahorro − precio), no por el ahorro bruto, y no entra en espacios destacados.

**Ningún socio paga por publicar ni por canjear.** El único débito de créditos es el impulso voluntario de una oferta (`src/lib/impulso.js`). El plan compra visibilidad, no funcionalidad básica.

### Compra del turista

`src/lib/compras.js`. Toda la escritura pasa por la RPC **`registrar_compra_turista(p_items, p_forma_pago, p_usar_puntos)`**, que en una transacción: recalcula el precio de cada ítem server-side, inserta `ventas` + `venta_items`, emite un `cupones_usuario` por ítem con su código de 8 caracteres, debita los puntos usados y acredita el 5% de cashback.

- **El precio no viene del cliente.** Lo recalcula `precio_cupon()` en SQL, espejo de `calcularPrecioCupon()` de `cobros.js` — **si cambia la escalera en JS hay que cambiarla en SQL también**. La única excepción es el total congelado de un cupón grupal, porque `grupos.js` no está portado.
- `ventas`/`venta_items` no tienen policy de INSERT: sólo escribe la RPC (SECURITY DEFINER).
- `cupones_usuario` es el **activo** que el turista canjea (código, estado, vigencia), distinto de `venta_items`, que es la línea contable. Es contra esta tabla que valida la Fase 5.
- **Transferencia:** la venta queda `pendiente` y **no se emiten cupones ni se mueven puntos**. Nadie pagó todavía.
- Vigencia del cupón: la `fecha_vencimiento` de la oferta si la tiene; si no, 12 meses.
- Pantalla: `MisCuponesView` (`view === 'mis-cupones'`).

### Canje

`src/lib/canjes.js`. **Un solo mecanismo** para el cupón comprado y para el Pase: los dos escriben `canjes` y pasan por la RPC `canjear_beneficio(p_tipo, p_ref)`. `pase_canjes` quedó obsoleta (vacía, sin escritores).

- **El QR es estático por socio**, no por cupón: `?canjear=<negocioId>` (`urlQrSocio`). El comercio es **pasivo** — no escanea, no valida, no necesita pantalla. El turista escanea, `beneficios_en_negocio()` le arma una sola lista con sus cupones de ese socio + lo que le habilita su Pase, elige, confirma con advertencia y muestra el **comprobante** de 6 caracteres. Fallback: tipear el código de 8 del cupón.
- **Anular devuelve el beneficio.** Los índices `canjes_cupon_unico` y `canjes_pase_por_comercio` son parciales sobre `estado='confirmado'`, así que pasar a `anulado` libera solo. No hay lógica de reversión aparte.
- El socio **reporta**, no anula (`reportar_canje_erroneo`) → cola del superadmin. Anular es sólo del superadmin: un canje anulado es un error operativo y necesita verificación.
- **Bandeja única** en el superadmin (`TabPendientes`): canjes reportados + ventas por transferencia + créditos por conciliar, con filtro por tipo. Reemplazó los tabs sueltos.
- ⚠️ Pendiente de la Fase 5b: anular un canje de Pase debería **liberar el slot premium**. Hoy los slots no se consumen por solicitud, así que la elección queda intacta y el turista puede volver a canjear.

### Mi Pase

`src/views/MiPaseView.jsx` (`view === 'mi-pase'`). Dos estados que cambian todo:

- **Pendiente** — comprado y sin arrancar. Puede activarlo ahora (`activar_pase`) o **programar la fecha** (`programar_activacion_pase` + cron `activar-pases-programados`). Programar es **prerequisito de la Fase 5b**: sin eso, para pedir fechas hay que activar el pase y se queman días esperando respuesta.
- **Activo** — billetera (días, ahorro, canjes, estadía) + elección de premium.

**§4.3 — los slots premium se ocupan, no se consumen.** `elegir_premium_pase` / `quitar_premium_pase`: se llenan y vacían libremente y sólo quedan congelados al canjear. Antes faltaba la mitad (no había forma de soltar) y el slot se consumía al elegir.

`useMiPase` devuelve también el pase **pendiente** (`pendiente: true`), no sólo el activo: quien ya compró no debe ver el upsell de comprarlo otra vez.

### Tracking y estadísticas del socio

`src/lib/tracking.js` → RPC `registrar_evento(tipo, negocio, promocion)`. Es **SECURITY DEFINER** porque el visitante suele ser anónimo y no puede escribir sobre las métricas de todos los socios. Resuelve el `negocio_id` desde la oferta (no lo elige el cliente) y **descarta al socio mirando su propia ficha**.

| evento | dónde se guarda | dónde se dispara |
|---|---|---|
| `vista_ficha` | `visitas` (contador diario por negocio) | `DetailView` |
| `vista_oferta` | `oferta_stats` | `OfertaDetailView` |
| `carrito` | `oferta_stats` | `carrito.jsx` (único camino al carrito) |

Ventas y canjes no se instrumentan aparte: ya viven en `ventas` y `canjes`.

`stats_negocio(negocio, dias)` devuelve todo lo que muestra `TabEstadisticas` en una llamada, recortado al negocio del socio. **Con poco historial no se rellena**: la pantalla muestra lo que hay y avisa que faltan datos. Nunca mock.

No se mide "click a contacto": ese botón se eliminó en la Fase 2b.

### Cupo premium — elección explícita

Una oferta con ahorro > $15.000 entra en la capa premium del Pase, y el socio **tiene que elegir** entre un cupo mensual N o `premium_ilimitado = true`. Sin default: la constraint `promociones_premium_definido` no deja publicarla si no eligió (los borradores sí). El cupo protege al socio de alto ticket; el ilimitado es una opción real, no un 0.

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
