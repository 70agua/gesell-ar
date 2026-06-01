# Handoff · gesell.ar · Dirección "Aire"

Diseño hi-fi para implementar en el codebase existente de **gesell.ar** — portal hyperlocal de turismo para Villa Gesell, Mar de las Pampas y zona.

---

## 1 · Sobre estos archivos

Lo que está en `source/` son **prototipos de diseño en HTML/React (Babel inline)** — sirven como referencia visual de pixel-perfect. **No son código de producción para copiar tal cual.** La tarea es:

> Replicar estas pantallas en el codebase actual de gesell.ar, usando sus patrones, componentes y stack ya establecidos (React/Vite a juzgar por el `localhost:5173` de las capturas iniciales).

Si te encontrás con un componente ya existente que cubre el mismo rol (ej. un `<Card>` o `<Button>` interno), **usalo y extendelo** antes que crear uno nuevo. El objetivo es coherencia con lo que ya hay.

## 2 · Fidelidad

**Hi-fi.** Todos los valores (colores hex, tamaños de fuente, espaciados, radios, sombras) son finales. Replicar pixel-perfect.

## 3 · Decisión de dirección visual

Se exploraron 3 direcciones (Aire, Costa, Verano '26). El usuario eligió **Aire** porque resuelve la pain principal del diseño actual ("viejo, pesado, sobrecargado, estático"):

- **Mantiene el azul como primario** (continuidad de marca) pero más refinado.
- **Más respiración** entre secciones — padding generoso, menos densidad de info.
- **Cards más limpias** — sombras suaves, bordes 1px, radios 16px.
- **Tipografía moderna** — Geist como display y body.
- **Mismo espíritu** que el actual pero con calidad de marca premium.

---

## 4 · Design tokens

### Colores

| Token | Hex | Uso |
|---|---|---|
| `--aire-primary` | `#2545E6` | CTAs principales, links, badges informativos |
| `--aire-primary-soft` | `#EEF1FF` | Backgrounds suaves de hint/info |
| `--aire-primary-dark` | `#1731B8` | Hover de primary |
| `--aire-ink` | `#0B1020` | Texto principal, headings, badges oscuros |
| `--aire-ink-2` | `#3D4255` | Texto secundario |
| `--aire-muted` | `#6B7280` | Texto terciario, captions, hints |
| `--aire-line` | `#E7E9EE` | Bordes de cards, separadores |
| `--aire-bg` | `#F7F7F8` | Background de secciones alternas |
| `--aire-card` | `#FFFFFF` | Background de cards |
| `--aire-navy` | `#0B1733` | Background sección "Packs" + sidebar admin |
| `--aire-yellow` | `#FFC93C` | Ratings (estrellas), monedas/cupones |
| `--aire-green` | `#10A36B` | Estados positivos, "Activo", precios destacados |
| `--aire-coral` | `#FF3D7F` | Tag "MÁS VENDIDO" (uso muy restringido) |

### Tipografía

- **Familia:** Geist (Google Fonts) — `'Geist', system-ui, sans-serif`
- **Pesos cargados:** 300, 400, 500, 600, 700, 800, 900

**Escala (con line-height y letter-spacing):**

| Rol | Size | Weight | LH | LS |
|---|---|---|---|---|
| Display XL (Hero h1) | 76px | 600/700 | 0.98 | -0.035em |
| Display L (Section h2) | 44–56px | 700 | 1 | -0.025em |
| Display M (Page h1) | 28–38px | 700 | 1.1 | -0.025em |
| Heading (h3) | 20–22px | 600 | 1.3 | -0.015em |
| Title (cards) | 15–18px | 600 | 1.3 | -0.01em |
| Body L | 16–17px | 400 | 1.5 | normal |
| Body | 14px | 400/500 | 1.5 | normal |
| Caption | 12–13px | 500 | 1.4 | normal |
| Eyebrow | 11–12px | 600 | 1 | 0.06em (`uppercase`) |
| Micro | 10–11px | 600 | 1 | 0.08em (`uppercase`) |

### Espaciado

Escala base 4px. Patrones recurrentes:

- **Sección padding vertical:** 72–80px
- **Sección padding horizontal:** 56px (desktop)
- **Card padding interno:** 16–24px
- **Gap entre cards (grid):** 14–24px
- **Gap entre form fields:** 14px

### Radios

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 8–10px | Inputs, botones secundarios, badges |
| `radius-md` | 12–14px | Cards menores, botones primarios |
| `radius-lg` | 16–20px | Cards principales, contenedores |
| `radius-xl` | 24px | Hero collages, modal containers |
| `radius-pill` | 999px | Chips, pills, avatars, action buttons |

### Sombras

- **Card lift (soft):** `0 14px 40px -20px rgba(11,16,32,0.18)` — search box, floating elements
- **Card lift (medium):** `0 20px 60px -30px rgba(11,16,32,0.22)` — sticky booking cards
- **Card lift (strong):** `0 30px 80px -30px rgba(0,0,0,0.3)` — hero collage photos
- **No usar sombras pesadas en grids de cards** — preferir border `1px solid var(--aire-line)`.

### Iconos

Lucide-style strokes — `stroke-width: 2`, `stroke-linecap: round`, `stroke-linejoin: round`. Se incluye un set custom en `source/components/primitives.jsx` (`Icon.search`, `Icon.pin`, `Icon.heart`, etc.) — replicarlos con la lib que ya uses (lucide-react funciona perfecto).

---

## 5 · Componentes base reutilizables

Identificar en el codebase actual o crear:

### `<Button>`
- **Primary:** `bg: --aire-primary`, `color: #fff`, `radius: 14`, `padding: 12px 18px`, `font: 600/15`. Hover: `bg: --aire-primary-dark`.
- **Secondary:** `bg: #fff`, `border: 1px solid --aire-line`, `color: --aire-ink`, mismo padding/radius.
- **Ghost:** `bg: transparent`, `color: --aire-ink-2`, sin border.
- **Pill:** `radius: 999`, `padding: 8px 14px`, `font: 500/13`. Variantes active/inactive.

### `<Card>`
- `bg: --aire-card`, `border: 1px solid --aire-line`, `radius: 16–20`, `padding: 16–24`. Sin sombra por default.

### `<Chip>`
- `radius: 999`, `padding: 5–8px 10–14px`, `font: 500–600/12–13`. Variantes:
  - Default: `bg: #fff` o `--aire-bg`, `border: 1px solid --aire-line`
  - Active: `bg: --aire-ink`, `color: #fff`
  - Info: `bg: --aire-primary-soft`, `color: --aire-primary`
  - Success: `bg: #E8F5EC`, `color: --aire-green`
  - Warning: `bg: #FFF4E0`, `color: #C28A1B`
  - Danger: `bg: #FCEAEA`, `color: #C03030`

### `<Avatar>`
- Círculo con `radius: 50%`. Tamaños: 22/28/36/40px. Soporta foto o fallback con gradient.

### `<Eyebrow>`
- Texto pequeño en uppercase para etiquetar secciones. `font: 600/11–12`, `letter-spacing: 0.06–0.1em`, `text-transform: uppercase`, `color: --aire-primary` o `--aire-muted`.

### `<StarRating>`
- Estrellas filled en `--aire-yellow`. Tamaño 11–14px.

### `<CoinBadge>`
- Pill chico con dot amarillo + número. Indica cupones disponibles. `bg: rgba(255,255,255,0.95)` cuando va sobre foto, `bg: --aire-primary-soft` cuando va en chrome.

### `<DiscountTile>`
- Tile cuadrado con descuento en blanco/negro o en color. `bg: --aire-ink` con texto blanco grande (`font: 800/16–22`, `letter-spacing: -0.02em`). Variante grande para hero (88px).

---

## 6 · Pantallas

> Numeradas igual que en el design canvas (`source/Gesell.ar Explorations.html`). Abrirlo en el browser para verlas todas a la vez con pan/zoom.

### 01 · Home — `1440 × 2800`

**Componentes:**
- **Nav** (60–80px alto, `bg: #fff`, `border-bottom: 1px solid --aire-line`): logo izquierda, items centrales (Inicio, Zonas ▾, Gastronomía, Socios, Más ▾), "Soy socio" + CTA "Ingresar" derecha.
- **Hero** (`padding: 64px 56px 80px`): grid `1.05fr / 1fr`.
  - Izquierda: eyebrow "TEMPORADA 2026" → `<h1>` 76px ("Tu descanso en **Villa Gesell**." con la 2ª línea en `--aire-primary`) → subtítulo → **search card** (grid 4 columnas: Destino · Check-in · Huéspedes · botón Buscar) → chips de filtros (5 pills con icon) → **stats** (3 números grandes con label).
  - Derecha: collage de 3 fotos con bordes blancos + sombras + 1 review card flotante.
- **Ofertas imperdibles** (`padding: 72px 56px`, `bg: --aire-bg`): header con eyebrow + h2 + link "Ver todas →". Grid 4 columnas de `<OfertaCard>` (foto 200px alto + tile descuento grande blanco + partner + CTA "Añadir a cuponera").
- **Alojamientos destacados** (`padding: 72px 56px`, `bg: #fff`): header + tab pills (Todos/Hotel/Cabaña/Departamento) + grid 4 columnas de `<AlojCard>` (foto 320px alto + heart icon + type pill + título + rating + ubicación + precio).
- **Packs exclusivos** (`padding: 80px 56px`, `bg: --aire-navy`, `color: #fff`): header con eyebrow amarillo + h2 + descripción. Layout `2fr / 1fr`:
  - Featured pack card (foto a la izquierda, contenido a la derecha con título, descripción, 3 items con check, precio en verde, CTA).
  - 3 secondary packs en vertical (thumbnail 72px + título + sub + precio + chevron).
- **Footer** (`padding: 40px 56px`, `bg: #fff`, `border-top`): logo + links + copy.

**Comportamiento:**
- Heart icon en cards: toggle filled/outline. Persistir favoritos (localStorage o backend).
- Tabs de alojamientos: filtran client-side por tipo.
- Chips de filtros del hero: cada uno aplica el filtro y va a `/buscar` con query param.
- "Añadir a cuponera": añade a wallet del usuario, requiere login.

---

### 02 · Búsqueda + Resultados — `1440 × 1800`

**Layout:**
- **Search bar sticky** arriba (`top: 0`, `z-index: 5`): grid 5 columnas idéntico al del hero pero más compacto.
- **Cuerpo:** grid `280px / 1fr`.
  - **Sidebar filtros** (`sticky top: 100`):
    - Header "Filtros" + "Limpiar" link.
    - Sección **Zona** — checkbox list con count derecho.
    - Sección **Tipo** — idem.
    - Sección **Precio por noche** — dual range slider con dos handles redondos (20px, `bg: #fff`, `border: 2px solid --aire-primary`). Track activo en primary.
    - Sección **Servicios** — checkbox + icon + label.
    - Sección **Calificación** — checkbox + 5 estrellas (opacidad reducida en las no alcanzadas).
  - **Results:** header con título "78 alojamientos en Villa Gesell" + meta (fechas, huéspedes), derecha tabs grid/mapa + sort select. Chips de filtros activos abajo. Grid 3 columnas de cards (foto 220px + heart + cupones badge + type eyebrow + título + rating + ubicación + service tags + precio + chevron). Paginación al final.

---

### 03 · Detalle de alojamiento — `1440 × 1700`

**Componentes:**
- **Breadcrumb** (Alojamientos / Villa Gesell / Hotel Spa Las Olas).
- **Header** (`padding: 18px 56px 32px`): título 44px + meta (rating, ubicación, verified badge en verde) + acciones derecha (Guardar, Compartir).
- **Gallery** (`margin-top: 22px`): grid `2fr 1fr 1fr / 1fr 1fr`, primera celda ocupa 2 filas, height 480px, gap 8px, radius 20px. La última celda lleva un botón "+18 fotos" flotante.
- **Body** (`padding: 0 56px 64px`): grid `1.6fr / 1fr`.
  - Izquierda: **Qué incluye** (grid 2×3 de amenity rows con icon en `--aire-primary-soft`), **Sobre el lugar** (párrafo), **Ofertas activas en este alojamiento** (2 cards en fila con tile descuento + título + meta + chevron).
  - Derecha: **booking card sticky** (`bg: #fff`, sombra medium, padding 22, radius 20).
    - Precio grande "$85.000 / noche" + "Precio directo, sin comisión" en verde.
    - Selector check-in / check-out / huéspedes (mini-grid 2×2 con bordes).
    - CTA primary "Consultar disponibilidad" + secondary "Chatear con el socio".
    - Hint box en `--aire-primary-soft` con "3 cupones disponibles" + explicación.

**Comportamiento:**
- Botón "Compartir": abre share menu nativo o copia link.
- Heart fav: toggle.
- "Consultar disponibilidad": abre booking flow (validar fechas, contactar al socio).
- Las dos ofertas en "Ofertas activas" linkean al detalle de oferta (#04).

---

### 04 · Detalle de oferta / cupón — `1440 × 1700`

**Layout:** grid `1.4fr / 1fr` debajo del breadcrumb.

**Izquierda:**
- **Hero de oferta** (radius 24, height 460): foto + badge "Flash Sale · vence en 2 días" arriba izq (`bg: --aire-ink`, `color: --aire-yellow`) + nombre del socio en eyebrow + descuento gigante (92px, weight 800, white). 
- **Título 38px** descriptivo.
- Párrafo de explicación.
- **Cómo se usa** — 3 step cards en grid 3 cols (número en círculo + título + descripción).
- **Condiciones** — lista bullet con check verde + texto.
- **Otras ofertas del socio** — 2 cards en grid 2 cols (tile descuento color + título + count + chevron).

**Derecha:**
- **Action card sticky:**
  - "Cupones disponibles" + dot amarillo "3 / 50".
  - Divider.
  - "Ahorro estimado" + monto verde gigante (36px) + tachado anterior.
  - CTA primary "Añadir a mi cuponera" con icon ticket.
  - CTA secondary "Consultar con el socio".
  - Mini card del socio (avatar + nombre + "responden en 30min").
  - Garantía gesell.ar (shield icon verde + texto).

---

### 05 · Detalle de pack — `1440 × 2100`

**Layout similar al #03 pero más rico:**

- **Gallery** (height 440): grid `2fr 1fr 1fr / 1fr 1fr` con 5 fotos.
- **Body:** grid `1.5fr / 1fr`.
  - Izquierda:
    - Badge "MÁS VENDIDO · 142 packs este verano" en `--aire-coral`.
    - **Título 52px** ("Escapada **Romántica**." con la 2ª en primary).
    - Meta inline (rating, "2 noches · 3 días", "2 personas").
    - Párrafo intro.
    - **Qué incluye este pack** — 4 cards verticales (foto 96×96 + icon en círculo + título + descripción + tag con check verde y nombre del socio).
    - **Cómo es el día a día** — timeline vertical con dot numerado (`bg: --aire-primary`, `color: #fff`) y línea vertical en `--aire-line`. Cada día: eyebrow ("Día 1") + título + descripción.
  - Derecha: **booking card sticky** similar al #03, agregando:
    - Precio principal $145.000 + tachado $210.000 + "Ahorrás $65.000" en verde.
    - Hint box "Bonus: + 4 cupones para canjear".

---

### 06 · Gastronomía listado — `1440 × 1400`

- **Hero strip** (`padding: 40px 56px 24px`): eyebrow → h1 56px → párrafo → row de filtros (tabs por tipo + selects zona/rango).
- **Grid 3 columnas** de cards (radius 20, border 1px):
  - Foto 200px alto con icon circle primary arriba izq (`<Icon.utensils>` etc.) y opcionalmente badge cupones arriba der.
  - Type eyebrow.
  - Título 18px + rango precio ($/$$/$$$) inline derecha.
  - Descripción 2 líneas.
  - Footer: ubicación con pin + rating estrella.
  - CTA "Ver menú y ubicación →".

---

### 07 · Gastronomía detalle — `1440 × 1850`

- Breadcrumb.
- **Header** (`padding: 18px 56px 24px`): eyebrow chip ("Restaurant · Bodegón") + título 56px + descripción + meta (rating, dirección, "Abierto · cierra 1:30am" en verde).
- **Gallery** (height 380): grid `2fr 1fr 1fr` con sub-rows.
- **Body** (`padding: 0 56px 64px`, grid `1.5fr / 1fr`):
  - Izquierda: **Lo imperdible** (grid 3 cols de menu items con título + precio en primary + nota), **El lugar** (párrafo + cita en muted italic), **Qué dicen** (grid 2 cols de review cards con avatar + nombre + 5 estrellas + quote).
  - Derecha: **info card sticky** con:
    - **Mini-mapa** (200px, gradient placeholder, pin centrado) + "Cómo llegar →".
    - **Horarios** (lista lun-jue / vie-sáb destacado en verde / dom).
    - **Cupón box** (`bg: --aire-primary-soft`): "1 cupón activo acá", "-20% en cenas Lun-Mié", botón "Añadir cupón".
    - **Acciones split** (botón primary "Reservar" + botón secondary "WhatsApp" con icon chat).

---

### 08 · Cuponera mobile — `390 × 844`

Mobile-first wallet del usuario.

- **Status bar** (38px, fake "9:41 · ●●●●").
- **Header** (`padding: 14px 20px 0`): saludo "Buen día, **María 👋**" + bell icon con dot rojo.
- **Wallet card** (`bg: --aire-ink`, `color: #fff`, radius 20, padding 18, position relative):
  - Decoraciones absolutas: dos blobs blur (uno `bg: rgba(125,161,255,0.18)`, otro `bg: rgba(255,201,60,0.25)`).
  - Eyebrow "Mi cuponera".
  - Número gigante "7" (48px, weight 800) + "cupones activos".
  - 2 pills: "3 vencen pronto" (translúcida) + "+2 esta semana" (yellow).
- **Tabs** (Activos · 7 / Usados · 12) — pill activa `bg: --aire-ink`.
- **Lista de cupones** (gap 12, padding 14px 20px):
  - Card horizontal split: foto 92px izquierda con descuento overlay grande blanco, contenido derecha (título + partner + "Vence X" con calendar icon + botón QR flotante en primary/dark/green).
- **Sugerencias** ("Cerca tuyo"): eyebrow + card simple (foto 48 + título + meta + botón "Sumar").
- **Bottom nav** fija (`bg: #fff`, `border-top`, `padding: 10px 0 28px`): 4 items (Inicio · Cupones · Mapa · Cuenta) con icon + label, activo en primary.

---

### 09 · Onboarding socio — `1440 × 1100`

Multi-step form, layout grid `320px / 1fr`.

**Sidebar** (`bg: #fff`, `border-right`):
- Logo arriba.
- Eyebrow "Sumate como socio" + título "Te llevará 5 minutos."
- **Stepper vertical** con línea conectora gris detrás:
  - Done: círculo verde con check.
  - Current: círculo primary con número.
  - Pending: círculo blanco con border y número en muted.
  - Cada paso tiene título + descripción 1 línea.
- Help card en `--aire-primary-soft` con WhatsApp.

**Main** (`padding: 40px 64px`):
- Eyebrow "Paso 2 de 5".
- Título 38px "Contanos sobre tu negocio."
- Subtítulo muted.
- **Form grid 2 cols** (gap 14):
  - Inputs estándar (label uppercase 12px, input radius 12 border 1px padding 12×14).
  - Selects con chevron custom.
  - Textarea con char counter.
  - **Servicios** — chips toggleables (active: `bg: --aire-primary-soft`, `border: 1px solid --aire-primary`, `color: --aire-primary` + check icon).
- **Footer del form** (border-top separador): "Volver" (ghost izquierda) + "Guardar y salir" (secondary) + "Siguiente →" (primary derecha).

**State a manejar:** `currentStep`, `formData` con shape `{ businessName, businessType, description, zone, address, services: string[] }`. Validación inline.

---

### 10 · Admin · Resumen — `1440 × 900`

- **Sidebar** (240px, `bg: --aire-navy`, `color: #fff`): logo + role badge + nav items con icons y badge count (item activo en `bg: --aire-primary`). Footer con "Sesión activa · Superadmin".
- **Main** (`padding: 22px 28px`):
  - Header: h1 "Resumen" + fecha + botón "↻ Actualizar".
  - **4 KPI cards** (grid 4 cols): icon en círculo de color suave + número grande + label + cambio (e.g. "+18% vs abril").
  - **2 cards** (grid `1.4fr / 1fr`):
    - **Últimos socios:** rows con avatar + nombre + sub + status pill verde.
    - **Últimas ofertas:** rows con tile descuento + partner + título + count cupones.

---

### 11 · Admin · Ofertas — `1440 × 900`

- Sidebar.
- Main:
  - Header h1 + botón primary "Crear oferta".
  - Tab pills: "Todas (37)", "Activas (36)", "Pendientes (0)", "Inactivas (1)".
  - Lista de filas (card-style con `border` y `radius: 14`, `overflow: hidden`):
    - Thumbnail 44×44 radius 10.
    - Tile descuento (3×4, 2×7, -35%, etc.) — texto en `--aire-ink` weight 700.
    - Partner + categoría (eyebrow muted) + título.
    - Dot yellow + count cupones.
    - Status pill (Activa/Inactiva).
    - Botón "Editar" ghost.

---

### 12 · Admin · Socios — `1440 × 900`

- Sidebar.
- Main:
  - Header h1 + meta + acciones (Exportar, Invitar socio primary).
  - **Search + 2 selects** (categoría, estado) en grid.
  - **Table** (`bg: #fff`, `border: 1px`, `radius: 14`):
    - Header row con check + columnas en uppercase muted.
    - Rows con grid columnas `24px 1.4fr 1fr 0.6fr 0.5fr auto`:
      - Checkbox, avatar+nombre+type, ubicación, ofertas count, status pill, acciones (Editar + menu).
  - Paginación abajo.

---

### 13 · Admin · Ventas — `1440 × 900`

- Sidebar.
- Main:
  - Header h1 + date range select + "Exportar CSV".
  - **4 KPI cards** con icon, número grande, "↑ +X% vs período anterior".
  - **2 cards** (grid `1.5fr / 1fr`):
    - **Chart card:** legend (Alojamiento azul / Cupones yellow / Packs green) + **stacked bar chart** simple — barras finas alineadas a bottom, 3 segmentos apilados por día (27 días). Eje X con 5 ticks (1, 7, 14, 21, 26).
    - **Últimas ventas:** rows con icon en círculo + título + partner + monto bold + count cupones.

> **Implementación del chart:** usar la librería ya instalada (Recharts / Chart.js / Visx). Stacked bar con datos `[{day, alojamiento, cupones, packs}, …]`.

---

### 14 · Admin · Consultas — `1440 × 900`

Inbox split (estilo Gmail/Linear).

- Sidebar de nav.
- Sub-layout grid `360px / 1fr`:
  - **Lista** (`bg: #fff`, scroll vertical):
    - Header sticky: h1 + tabs (Sin responder/Todas/Archivadas) + search.
    - Filas con avatar (con dot rojo si unread), nombre + fecha, subject + preview 1 línea. Fila activa: `bg: --aire-primary-soft`, `border-left: 3px solid --aire-primary`.
  - **Detail:**
    - Header: status eyebrow + título + meta (avatar mini + user + email + oferta linkeada) + acciones (Archivar, Marcar leído, menu).
    - Scroll de **mensajes** (chat bubbles alternados):
      - Inbound: avatar izquierda + bubble blanca con border-radius `12 12 12 4`.
      - Outbound: bubble primary derecha con border-radius `12 12 4 12`, color blanco.
    - **Compose box** abajo (border-top):
      - Quick reply chips ("Hola María", "Confirmación", "Re-envío", "Plantilla").
      - Textarea sin border.
      - Footer: info "María recibirá tu respuesta por email" + Guardar borrador + **Enviar respuesta** primary.

**State:** `inbox: Conversation[]`, `activeId`, `draft` por conversation. Optimistic update al enviar.

---

## 7 · Interacciones y comportamiento

### Patrones globales

- **Heart / fav:** toggle outline ↔ filled. Persistir en backend si user logged-in, sino prompt login.
- **"Añadir a cuponera":** requiere login. Si no logged: redirect a /ingresar con returnTo. Si sí: optimistic update del wallet, toast confirmación.
- **Filtros:** mantener en URL (`?zona=centro&tipo=hotel&precio=60000-140000`). Server-side render si es Next/Remix, sino client filter.
- **Booking CTAs:** redirigen a flow propio del socio (link directo o intermediario que registra la consulta).

### Transiciones / animaciones

- **Hover en cards:** `transform: translateY(-2px)` + sombra ligera. Duración 180ms ease-out.
- **Tabs pill (alojamientos):** fondo se mueve con `transition: all 200ms`. Idealmente con `layoutId` de Framer Motion para morph.
- **Modal / drawer:** fade + slide 240ms.
- **Toast:** slide-in desde abajo derecha, auto-dismiss 4s.
- **No abusar de animaciones** — esta dirección es sobria.

### Estados de loading

- **Skeleton cards** durante fetch — bloques gris claro pulsantes (`bg: linear-gradient` animado entre `--aire-line` y `--aire-bg`).
- **Lazy load images** con blur placeholder.

### Estados vacíos

- Para "Sin ventas aún" / "No hay cupones" / etc.: ilustración SVG simple o icon grande en `--aire-muted` + título + descripción + CTA primary opcional.

### Estados de error

- Toast destructive en rojo claro `bg: #FCEAEA`, `color: #C03030`, con icon alerta + mensaje + opcional "Reintentar".

### Responsive (no diseñado en detalle, pero pautas)

- **Breakpoints sugeridos:** mobile <640, tablet 640–1024, desktop >1024.
- **En mobile:**
  - Nav colapsa a hamburger + drawer.
  - Hero: stack vertical (texto arriba, collage abajo).
  - Búsqueda: bottom sheet con filtros (no sidebar fijo).
  - Detalles: gallery en carrusel horizontal con scroll snap. Booking card pasa a bottom sticky bar con precio + CTA principal, expand a full sheet al tap.
  - Grids de cards: 1–2 columnas según viewport.
  - Admin: sidebar colapsable a icon-only bajo 1024px.

---

## 8 · Assets

**No se incluyen imágenes reales** — los prototipos usan placeholders con gradientes CSS (`.ph-beach`, `.ph-pool`, etc.) en `Gesell.ar Explorations.html`. En producción, las fotos vienen del backend (subidas por los socios).

**Iconos:** lucide-react o set similar. Replicar los del `primitives.jsx` con los nombres equivalentes.

**Tipografía:** Geist desde Google Fonts. Snippet:
```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

**Logo:** dummy "G" en cuadrado primary con la palabra "gesell.ar" al lado. Si hay logo definitivo en el codebase actual, usar ese.

---

## 9 · Archivos en este bundle

```
README.md                          ← Empezá acá
screenshots/                       ← Hero shots de cada pantalla (top-of-page)
  01-home.jpg
  02-busqueda.jpg
  03-alojamiento-detalle.jpg
  04-oferta-detalle.jpg
  05-pack.jpg
  06-gastronomia-listado.jpg
  07-gastronomia-detalle.jpg
  08-cuponera-mobile.jpg
  09-onboarding-socio.jpg
  10-admin-resumen.jpg
  11-admin-ofertas.jpg
  12-admin-socios.jpg
  13-admin-ventas.jpg
  14-admin-consultas.jpg
source/
  Gesell.ar Explorations.html      ← Abrir en browser para ver TODO a pantalla completa
  design-canvas.jsx                ← Wrapper de pan/zoom canvas (utility)
  tweaks-panel.jsx                 ← Panel de tweaks live (utility)
  components/
    primitives.jsx                 ← Set de iconos + Logo + Photo placeholder
    dirA.jsx                       ← Home + Detalle alojamiento + Cuponera mobile
    dirA-more.jsx                  ← Búsqueda + Oferta detalle + Pack detalle + Gastro + Onboarding
    admin.jsx                      ← Admin Resumen + Admin Ofertas
    admin-more.jsx                 ← Admin Socios + Ventas + Consultas
    app.jsx                        ← Orquestador del canvas
```

> **Sobre los screenshots:** son "hero shots" del top de cada pantalla (limitados por el viewport de captura, ~924×540). Sirven para tener una idea rápida del look. **Para ver el diseño completo de cada pantalla, abrir `source/Gesell.ar Explorations.html` en el browser** — usa un canvas con pan/zoom donde podés ver todo a tamaño real, hacer click en cualquier artboard para verlo fullscreen, navegar con ←/→ entre pantallas, y Esc para volver.

---

## 10 · Prioridad sugerida de implementación

1. **Design tokens + componentes base** (Button, Card, Chip, etc.) — sin esto, nada lo demás escala.
2. **Home (#01)** — máximo impacto, valida el sistema.
3. **Detalle alojamiento (#03)** + **Búsqueda (#02)** — el corazón del flow turista.
4. **Cuponera mobile (#08)** + **Detalle oferta (#04)** — el diferencial vs Booking.
5. **Pack detalle (#05)** + **Gastronomía (#06–07)**.
6. **Admin (#10–14)** — funcionalidad interna, puede ir en paralelo.
7. **Onboarding socio (#09)** — captación.

---

## 11 · Preguntas abiertas / decisiones pendientes

Cosas que el dev probablemente necesita confirmar con el usuario:

- ¿El sistema actual usa Tailwind / CSS-in-JS / CSS Modules / vanilla? — adoptar el patrón vigente.
- ¿Hay i18n? — los textos están en español (es-AR) hardcoded en los mocks.
- ¿Hay sistema de auth ya implementado? — los CTAs asumen que sí (Ingresar, gates a wallet).
- ¿El backend ya tiene endpoints para ofertas / packs / consultas? — el shape de datos en los mocks es indicativo, no canónico.
- Versión definitiva del logo y favicon.

Cualquier inconsistencia entre estos mocks y patterns ya establecidos del codebase: **gana el codebase**. El diseño es referencia visual, no constitución.
