# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**El producto se llama Cuponear.** El repo (`gesell-ar`), el dominio (`gesell.ar`) y las URLs conservan el nombre histórico a propósito — no renombrar. "Villa Gesell" aparte es la localidad, y ahí "Gesell" es correcto.

---

## Memoria del proyecto

Hay una segunda fuente de contexto además de este archivo, en `~/.claude/projects/-Users-mariano-gesell-ar/memory/`. **Las dos no dicen lo mismo y no deben pisarse:**

| | qué contiene |
|---|---|
| **CLAUDE.md** (este archivo) | **El estado actual.** Arquitectura, tablas, reglas de negocio vigentes, convenciones. Se lee siempre. |
| **`memory/`** | **El porqué y el descarte.** Decisiones con su motivo, modelos de negocio muertos, bugs que ya costaron tiempo, preferencias de Mariano. Se lee a demanda. |

Si algo describe *cómo funciona hoy* → va acá. Si describe *por qué es así, qué se probó antes, o con qué hay que tener cuidado* → va en memoria. **Al documentar algo nuevo, elegir uno de los dos, nunca ambos.**

`memory/MEMORY.md` tiene la tabla de ruteo completa (qué archivo leer según la tarea). Los atajos que más se usan:

| Antes de tocar… | Leer |
|---|---|
| planes, precios de plan, suscripciones | `10-historia-modelos-de-plan` — BASE/PLUS/BLACK y Gratis/Plus están muertos |
| precios de cupón, comisiones, puntos | `10-monedas-puntos-y-creditos` |
| nombres, copy, terminología | `10-vocabulario-por-que` |
| cualquier idea que suene nueva | `10-decisiones-abiertas` — puede estar planteada y sin cerrar |
| queries, migraciones o RPCs | `20-gotchas-supabase` |
| un cambio visual que "no se ve" | `20-ruteo-de-vistas` |

Mapa visual navegable: `node tools/memory-map.mjs` regenera `tools/memory-map.html`.

---

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

**Ser hotelero no es condición para suscribirse; tener cuenta sí** (2026-08-02). `CheckoutHoteleroView` dejó de abrir con un formulario "TU ALOJAMIENTO": ahora abre con el ingreso a Cuponear, y al que es nuevo se le piden **dos** datos del negocio —tipo de empresa (Alojamiento / Agencia de turismo / Inmobiliaria / Revendedor / Otros) y nombre—, nada más. Localidad, descripción y fotos se piden después del pago, desde el panel. El que ya tiene cuenta **y** negocio no crea otro: se le contrata el plan al que ya está (`crearSuscripcionPro`). Los tres tipos nuevos se sumaron al CHECK de `negocios.tipo` (`db/20260802_tipos_empresa_socio.sql`) y a los sets de `categoriaDeNegocio`: Inmobiliaria → alojamiento, Agencia de turismo → aventura_relax, Revendedor → salidas por descarte.

### ⚠️ Un dato que falta no se rellena

Van **tres** casos en los que la app tapó un hueco con contenido fabricado, y los tres pasaron desapercibidos porque *se veían bien*:

| dónde | qué inventaba |
|---|---|
| `OfertaDetailView` (stock) | buscaba la oferta en el mock por título y si no estaba usaba `28` totales / `11` usados — el aviso "¡Últimos cupones!" salía con números falsos en ofertas sin stock |
| `OfertaDetailView` (descripción) | un párrafo genérico *"Aprovechá esta oferta exclusiva de uno de nuestros socios verificados…"* que se hacía pasar por texto del socio en las 33 ofertas sin descripción |
| `OfertasView` / `OfertasRegaloView` | concatenaban o caían a `mockData`, así que el catálogo visible mezclaba ofertas que no existen |

**Regla: cuando falta un dato, se muestra vacío o no se muestra.** Aplica a stock, descripciones, métricas y catálogos. Nunca un default inventado, nunca un respaldo al mock, nunca un promedio de relleno.

Un hueco visible es información —dice que falta cargar algo— y alguien lo va a corregir. Un relleno inventado es una mentira que nadie audita: se ve completo, nadie lo reporta, y el turista toma decisiones con datos falsos. Si una pantalla queda pobre con datos reales, eso *es* el estado real del catálogo.

Corolario para las métricas: `stats_negocio` no rellena períodos sin historial, avisa que faltan datos (ver §Tracking).

### ⚠️ Los CHECK constraints se desactualizan y no fallan hasta que corren

Van **tres** casos en los que un `CHECK` viejo bloqueó vocabulario nuevo, y los tres se descubrieron recién al ejecutar:

| campo | qué rompía |
|---|---|
| `token_movimientos.tipo` | **todos** los movimientos de puntos del Pase venían fallando desde que se escribió `pases.js` |
| `ventas.estado` | `'pagada'` no era válido — los válidos son `pendiente`/`completada`/`cancelada` |
| `oferta_stats.evento` | seguía en `'vista'`/`'click_cuponera'`/`'click_ampliar'` |

**Regla: antes de agregar un valor nuevo a un campo con CHECK, mirar la restricción en la base.** El código no falla al escribirlo ni al compilar — falla en runtime, y si el camino es poco transitado puede tardar semanas en aparecer.

```sql
select conname, pg_get_constraintdef(oid) from pg_constraint
where conrelid = 'public.<tabla>'::regclass and contype = 'c';
```

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

### Pase regalo del socio

Bloque en el panel del socio (`TabCanjes` → `BloquePase`), datos vía `bloque_pase_socio()`.

- **Tope de regalos: global, 150/mes, igual para todos.** Vive en `configuracion.pases_regalo_tope_mensual` y se edita en SuperAdmin → General → Pase. **No es un atributo del plan**: antes el plan pago daba regalos ilimitados y eso socavaba el precio de las tandas del distribuidor. Por encima del tope, el socio compra tandas (`docs/4-socio-distribuidor.md`, sin implementar).
- **Premium: 1 incluido, igual para todos.** `pro_1`/`pro_6`/`pro_12` son formas de **pago**, no niveles de servicio.
- **Upgrade packs** ($6.000 c/u, mínimo 10) dan **+1 premium** cada uno sobre un pase regalo concreto, vía `asignar_upgrade_pack()` (descuento de saldo atómico). Se pueden acumular en el mismo pase. Antes sólo habilitaban puntos, que no se podía vender.

### Solicitudes de fecha (premium con reserva)

`src/lib/solicitudes.js` + tabla `solicitudes_fecha`. **No se reutiliza `consultas`**: es una máquina de estados con timeouts y bloqueo de slots.

`promociones.requiere_fecha` es atributo de la **oferta**, no del plan. Con eso marcado, el premium no se elige: se **pide** (fecha + cantidad de personas, sin texto libre) y el socio contesta **Sí / No / Otra fecha**.

**Cómo se ocupa un slot premium** — `slots_premium_ocupados()` es la única definición:

| estado | slot |
|---|---|
| `enviada` | en suspenso (cuenta como solicitud) |
| `aceptada` | **consumido** — se crea la `pase_eleccion`, y recién ahí es canjeable |
| `rechazada` / `contrapropuesta` / `cancelada` / `vencida` | liberado |

Que la aceptación cree la elección es lo que evita una segunda ruta de canje: `canjear_beneficio` sigue mirando `pase_elecciones`.

- **Se puede pedir con el pase sin activar.** Al aceptarse, la RPC devuelve `proponer_activacion` para ofrecerle activar desde esa fecha — proponer, nunca activar solo.
- **Timeout 72 h**, o el vencimiento del pase si llega antes. Cron `vencer-solicitudes-fecha`.
- El tope es **atómico** (`for update` sobre el pase): validado en el cliente, dos pedidos simultáneos pasarían el mismo último slot.
- ⚠️ **Copy no negociable** (Ley 18.829): nunca "reservá" ni "disponibilidad". Cuponear *transmite* una solicitud; confirma el socio.

`TabInbox` es la **bandeja única del socio**: solicitudes de fecha + consultas, con filtro por tipo. Mismo criterio que `TabPendientes` en el superadmin.

### Offer types

Only two: `Flash` (has countdown, `fecha_fin_flash`) and `Normal`. Config and countdown helpers in `src/lib/ofertas.js`. The `badge` field on `promociones` is the human-visible label.

### Styling conventions

- Tailwind CSS v4 (PostCSS plugin, no `tailwind.config.js`). Theme extensions viven en `src/styles/tokens.css` vía `@theme` — ver abajo.
- Default font: `Inter` (self-hosted variable font in `public/fonts/`). Display font: `NauryzRedkeds`.
- Responsive breakpoints follow Tailwind defaults; hero layout uses custom `.hero-content` / `.hero-grid` classes in `src/index.css`.
- Inline styles are common for one-off animations and wizard overlays — that's intentional.
- **Efectos de scroll: apagados por interruptor** (2026-08-13). `SCROLL_SUAVE` en `src/lib/efectos.js` está en `false`, así que el smooth-scroll con inercia (Lenis) no se monta ni en `useLenisSmoothScroll` ni en el panel PRO de `HeroPase`: el scroll de la página es 100% nativo. Se apagó para aislar dos síntomas —el scroll se trababa en el detalle de socio/oferta y el general se sentía lento— y **apagarlo resolvió los dos** (confirmado con rueda real). Se reactiva desde ahí. Los efectos de la navbar quedaron prendidos a propósito.

**Antes de un cambio visual (componente nuevo, rediseño, layout, spacing, color, tipografía) — coherencia es criterio de aceptación, no un paso opcional para ahorrar lectura:**
- Mirá 2-3 componentes existentes de la misma familia (si tocás una Card, mirá las otras Cards) antes de definir spacing, color o tipografía nueva. No inventes un patrón si ya hay uno establecido.
- Reusá las clases/tokens que ya aparecen en componentes vecinos en vez de valores sueltos por criterio propio (si el resto usa `px-3`, no metas `px-3.5` porque "se ve mejor" sin comparar).
- **Fuente de verdad de tokens:** `src/styles/tokens.css` (auditoría en `docs/design-tokens-audit-brief.md`). Semánticos disponibles: `--color-primary`/`-hover`/`-soft`, `--color-text`/`-muted`, `--color-border`, `--color-bg`, `--color-success`/`-bg`, `--color-warning`/`-bg`, `--color-error`/`-icon`/`-bg`, `--color-accent`/`-bg` (usar en componentes nuevos vía clases Tailwind, ej. `text-primary`, `bg-error-bg`). El código existente sigue con sus hex sueltos — migración es incremental, no se tocó de una. Cualquier color/spacing que no tenga token todavía se valida contra lo ya usado en componentes vecinos — nunca un hex o un valor de spacing inventado sobre la marcha.
- Antes de dar la tarea por terminada: comparar el resultado contra 1-2 pantallas vecinas ya shippeadas. Si el spacing, la paleta o la tipografía no coinciden con el resto de la sección, ajustar antes de avisar que terminó.

### Key icons & assets

- `<Token />` component (`src/components/Token.jsx`) — gold coin SVG, used everywhere credits appear.
- `<CuponIcon />` — coupon icon.
- Lucide React for all other icons (`import { X, Heart, ... } from 'lucide-react'`).
- SVGs in `public/` are referenced as `/filename.svg`.

### Map

`MapView.jsx` and `GastronomyView.jsx` use `react-leaflet`. Coordinates come from `lat`/`lng` on `negocios` rows. The Leaflet CSS must be imported where the map is rendered.

### Localidades

Canonical list in `src/lib/localidades.js`. Nearby-locality logic (for offer discovery) is in the `LOCALIDADES_CERCANAS` map inside `datos.js`.
