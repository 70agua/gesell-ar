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

Key tables: `negocios`, `perfiles`, `promociones`, `alianzas`, `consultas`, `socio_tokens`, `token_compras`, `ordenes_cobro`, `planes`, `suscripciones_socio`, `socio_alias`.

Auth via `src/lib/auth.js`. Session is checked at app boot and stored in `App.jsx` state. `perfil` is the row from the `perfiles` table (includes `es_superadmin`, `negocio_id`, and the joined `negocios` row).

### Global contexts (providers in App.jsx)

| Context | File | What it does |
|---|---|---|
| `LoadingProvider` | `src/lib/loading.jsx` | Global overlay. Use `useLoadingFn(asyncFn)` to wrap any async call. |
| `CuponeraProvider` | `src/lib/cuponera.jsx` | Wallet of active coupons. `addCupon(oferta)` opens the drawer. |
| `FavoritosProvider` | `src/lib/favoritos.jsx` | Heart-saves for accommodations, persisted to Supabase. |

### Business roles & plans

**Cuponear v2 pivot (Fase 1, unified plan model):** the old Freemium/Plus/Black three-tier model is gone. There are now exactly two plans, shared across all three partner categories (Alojamiento, Salidas, Aventura & Relax): **Gratis** and **Plus** ($20.000+IVA/mes). Plan copy/pricing/features live in `src/lib/planes.js` (`PLAN_DEFS`) — this is the single source of truth; `SociosView.jsx` and `LoginView.jsx` both import from it instead of declaring their own copies.

- **Turista**: public user, gets 2 credits on registration.
- **Socio Gratis** (any category): free to publish. Alojamiento pays credits per canje (`debeUsarTokens`); Salidas/Aventura & Relax never pay.
- **Socio Plus** (any category, $20.000+IVA/mes, $240.000+IVA/año): no per-publish charge; alojamiento still pays credits per canje. Gets 50 créditos on signup, a unique 6-digit alias (`socio_alias`), and (from Fase 2 onward) can build gift cuponeras. Use `crearSuscripcionPlus(negocioId, { unidadesDeclaradas })` from `src/lib/planes.js` to upgrade a negocio — it upserts `suscripciones_socio`, syncs `negocios.plan`/`fecha_alta_plus`, and generates the alias.
- **Superadmin**: `perfil.es_superadmin === true`. Accesses `SuperAdminView`.
- Gastronomy/experience partners: always free to publish; income via credit sales to tourists (unaffected by Plus signup, which is a separate subscription fee).

`negocios.plan` (`'free'|'plus'`) remains the fast denormalized flag most components gate on. `planes` (catalog) and `suscripciones_socio` (one row per negocio — billing lifecycle: `estado`, `fecha_renovacion`, `meses_gratis_acumulados/usados`) are the source of truth for subscription state, used by later phases (referidos, extras).

### Credit/token system

Defined in `src/lib/cobros.js`. 1 crédito = $2.000 + 21% IVA. `debeUsarTokens(tipo, plan)` tells you if a business owes tokens. Balances live in `socio_tokens` (per `negocio_id`). `src/lib/gamificacion.js` handles credits earned by tourists.

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
