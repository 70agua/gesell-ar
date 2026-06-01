# Handoff: Cuponera Drawer — Checkout lateral (variante "Ticket / Wallet")

## Overview
Cuando un usuario toca **"Añadir a mi cuponera"** en una pantalla de oferta de gesell.ar, se abre un **drawer lateral derecho** (carrito) que muestra todos los cupones acumulados como **tickets troquelados**, el total a pagar y el ahorro acumulado, con un **CTA primario que lleva directo al pago** — todo sin sacar al usuario de la pantalla de oferta donde estaba.

El objetivo de UX: el usuario sigue explorando y sumando ofertas, pero en cualquier momento ve el estado de su "cuponera" (como un carrito) y puede pasar al checkout de un toque. El drawer **no navega fuera de la página**; es un overlay.

> La dirección elegida por el cliente es la **variante 3 — "Ticket / Wallet"**. Las otras dos (Clásico, Confirmación) quedan en el prototipo solo como referencia; **implementar únicamente la Ticket**.

## About the Design Files
Los archivos de este bundle son **referencias de diseño hechas en HTML/React+Babel** — prototipos que muestran el look & feel y el comportamiento buscado, **no código de producción para copiar tal cual**. El JSX usa Babel standalone en el navegador y objetos de estilo inline; sirve para leer medidas, colores y estructura exactas.

La tarea es **recrear este diseño en el entorno del codebase real de gesell.ar** (React, Vue, etc.) usando sus patrones, su sistema de componentes y su librería de estilos ya establecidos. Si el proyecto aún no tiene entorno definido, elegir el framework más apropiado e implementarlo ahí. Los valores de diseño (tokens, medidas) son la fuente de verdad; la mecánica de Babel/inline-styles no debe replicarse.

## Fidelity
**High-fidelity (hifi).** Colores, tipografía, espaciados, radios y sombras son finales. Recrear el UI pixel-perfect con los componentes/librerías del codebase. Las únicas excepciones son las **fotos** (placeholders con gradientes — reemplazar por imágenes reales de cada oferta) y la **animación de entrada** (ver nota más abajo).

---

## Design Tokens (sistema "Aire")
Definidos en `components/dirA.jsx` como el objeto `A`. Migrar a los tokens equivalentes del codebase.

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#2545E6` | Azul de marca · CTA, links, acentos |
| `primarySoft` | `#EEF1FF` | Fondo suave azul (chips, highlight) |
| `primaryDark` | `#1731B8` | Azul hover/pressed |
| `ink` | `#0B1020` | Texto principal · fondo del header del drawer · badge oscuro |
| `ink2` | `#3D4255` | Texto secundario |
| `muted` | `#6B7280` | Texto terciario / metadatos |
| `line` | `#E7E9EE` | Bordes y divisores |
| `bg` | `#F7F7F8` | Fondo de página (y color de los "troqueles" del ticket) |
| `card` | `#FFFFFF` | Fondo de tarjetas |
| `navy` | `#0B1733` | Azul oscuro alternativo |
| `yellow` | `#FFC93C` | Cupones / destacados (texto sobre oscuro) |
| `green` | `#10A36B` | Ahorro / éxito |

**Tipografía:** `Geist` (Google Fonts), pesos 300–900. Mono: `Geist Mono`.
Escala usada en el drawer: 9.5 / 10 / 11 / 11.5 / 12 / 13.5 / 14 / 15 / 26 / 27 / 48 px.
`letter-spacing` negativo en números y títulos grandes (`-0.02em` a `-0.04em`); positivo en mayúsculas tipo overline (`0.06em`–`0.1em`).

**Radios:** ticket 16px · stub interno hereda · botones/CTA 14px · chips 999px · botón cerrar 10px.
**Sombras:** panel `-30px 0 80px -40px rgba(11,16,32,0.5)` · ticket `0 10px 26px -18px rgba(11,16,32,0.4)` · CTA `0 14px 30px -12px rgba(37,69,230,0.6)`.

---

## Screen / View: Drawer "Cuponera" (variante Ticket)

### Layout general
- **Scrim**: overlay fijo a pantalla completa, `rgba(11,16,32,0.45)` + `backdrop-filter: blur(2px)`. Click en el scrim cierra el drawer. `z-index: 80`.
- **Panel (`<aside>`)**: fijo a la derecha, `top:0`, alto `100vh`, **ancho 444px** (`max-width: 92vw` en mobile). Sombra de panel (ver arriba). `z-index: 81`. Flex column con 3 zonas: **header / lista scrolleable / footer**.
  - Header y footer son fijos; **solo la lista central scrollea** (`overflow-y: auto`, `flex: 1`).

### Zona 1 — Header (tipo "wallet", fondo oscuro)
- Fondo `ink` (`#0B1020`), texto blanco, padding `20px 24px 22px`, `position: relative; overflow: hidden`.
- **Dos círculos decorativos** absolutos detrás del contenido:
  - 150×150, `top:-40 right:-30`, `rgba(125,161,255,0.18)`.
  - 80×80, `top:20 right:30`, `rgba(255,201,60,0.22)`.
- Fila superior: overline **"MI CUPONERA"** (11px, weight 700, `letter-spacing:0.1em`, uppercase, `rgba(255,255,255,0.6)`) + **botón cerrar** a la derecha.
- **Contador grande**: número en 48px / weight 800 / `-0.04em` + label "cupones listos para canjear" (14px, `rgba(255,255,255,0.7)`), alineados a baseline, gap 8.
- **Chip de ahorro**: pill `rgba(255,201,60,0.16)`, texto `yellow`, 12px/700, padding `6px 12px`, con ícono "bolt" (rayo) 12px + texto **"Ahorrás $XX.XXX en total"**.

### Zona 2 — Lista de tickets (scrolleable)
- Padding `20px 22px`, flex column, **gap 16px** entre tickets.
- Un **TicketCard por cupón**. Al final, un botón **"Agregar otro cupón"** (cierra el drawer para seguir explorando): fondo blanco, borde `1px dashed line`, radio 14px, texto `primary` 13.5/600, ícono "+" 16px, centrado, padding `13px 0`.

#### Componente: TicketCard
Tarjeta horizontal con efecto de ticket troquelado. `position: relative; display:flex; background:#fff; border-radius:16px; overflow:hidden;` + sombra de ticket.
- **Stub (talón) izquierdo**: ancho fijo **104px**, fondo = **color de acento del cupón** (`c.accent`), texto blanco, centrado vertical y horizontal, padding `16px 8px`. Contiene:
  - Descuento `c.d` (ej. "−35%", "2×1") en 26px / 800 / `-0.03em` / line-height 1.
  - Label **"CUPÓN"** en 9.5px / 700 / `0.08em` / uppercase / opacity 0.85, `margin-top:6`.
- **Troquel** (perforación) en `left: 104px`:
  - Línea vertical: `border-left: 2px dashed line`, de `top:0` a `bottom:0`.
  - Dos **muescas circulares** de 16×16, `border-radius:50%`, color = `bg` (`#F7F7F8`, el fondo del drawer), una en `top:-8` y otra en `bottom:-8`, ambas `transform: translateX(-50%)`. Simulan el recorte del ticket.
- **Cuerpo derecho**: `flex:1; min-width:0;` padding `14px 44px 14px 20px` (el `44px` a la derecha reserva lugar para el botón de quitar), flex column:
  - Overline: nombre del socio/lugar `c.p` (10px / 700 / `0.06em` / uppercase / `muted`).
  - Título de la oferta `c.t` (14px / 600 / line-height 1.3, `margin-top:3`).
  - Fila inferior (`margin-top:auto`, `padding-top:10`, space-between):
    - Vencimiento: ícono "calendar" 12px + `c.exp` (ej. "Vence 30 Ene"), 11px / `muted`.
    - Precio `c.price` formateado, 15px / 800 / `-0.02em`.
- **Botón quitar cupón**: posición absoluta `top:10 right:10`, **26×26**, radio 8px, fondo blanco, borde `1px solid line`, ícono "✕" 13px color `muted`. `onClick → onRemove(c.id)`. `aria-label="Quitar <título>"`. Hover sugerido: borde/ícono a tono de peligro suave o `ink`.

**Colores de acento por cupón (`c.accent`)** en el prototipo: hotel → `primary` (#2545E6), gastronomía → `ink` (#0B1020), aire libre → `green` (#10A36B). En producción, asignar el acento según categoría de la oferta.

### Zona 3 — Footer fijo (CTA al pago)
- `border-top: 1px solid line`, padding `16px 22px 22px`, fondo blanco.
- Fila **"Total a pagar"** (15px / 600) ↔ monto total (27px / 800 / `-0.03em`), alineados a baseline, `margin-bottom:14`.
- **CTA primario `PayCTA`** (ancho completo): fondo `primary`, texto blanco 15.5px / 600 / `-0.01em`, radio 14px, padding `15px 0`, ícono flecha-derecha 18px a la derecha del label, sombra de CTA. **Label: "Pagar y activar N cupones"** (N dinámico).
  - Hover sugerido: fondo `primaryDark` (#1731B8).
- **TrustLine** debajo (`margin-top:12`): ícono candado 13px + **"Pago protegido · Garantía gesell.ar"**, 11.5px / `muted`, centrado.

---

## Interactions & Behavior
- **Apertura**: al tocar cualquier botón "Añadir a (mi) cuponera" en la página de oferta, el drawer se monta abierto. (En el prototipo se hace por delegación de eventos buscando el texto "cuponera"; en producción, disparar desde el handler real de "agregar al carrito".)
- **Cierre**: (a) click en el scrim, (b) botón "✕" del header, (c) tecla **Escape**, (d) botón "Agregar otro cupón" / "Seguir explorando" (cierra y devuelve a la página).
- **Animación de entrada (recomendada en producción)**: el panel entra deslizando desde la derecha — `transform: translateX(105%) → translateX(0)`, **420ms**, easing `cubic-bezier(.22,1,.36,1)`; el scrim hace fade de opacidad 0→1 en ~320ms. El scroll del body debería bloquearse mientras el drawer está abierto.
  > ⚠️ En el prototipo entregado la animación de slide está **desactivada** (montaje directo en posición final) porque el entorno de previsualización congela el reloj de animaciones. En el codebase real, reactivar el slide con los valores de arriba.
- **Quitar cupón**: cada ticket tiene un botón "✕" (arriba a la derecha) que llama `onRemove(id)` → filtra el ítem del array y **recalcula Total, Ahorro y el contador** del header en el momento. El label del CTA también se actualiza (`Pagar y activar N cupones`, singular/plural). Implementado en el prototipo.
- **Estado vacío**: si se quitan todos los cupones, la lista muestra un placeholder (ícono ticket en círculo `primarySoft`, título "Tu cuponera está vacía" + texto), el chip de ahorro del header se oculta, el CTA de pago queda **deshabilitado** (gris `line`/`muted`, "Agregá un cupón para pagar") y el botón secundario pasa a "Explorar ofertas".
- **Responsive**: en viewports < ~482px el panel ocupa `92vw`. Header, lista y footer mantienen la misma estructura.

## State Management
Estado mínimo necesario:
- `cupones: Cupon[]` — items de la cuponera (el carrito). Cada `Cupon`: `{ id, descuento ('d'), titulo ('t'), socio ('p'), thumbnail ('ph'), price, was (precio tachado/original), exp (vencimiento), accent (color por categoría) }`.
- `drawerOpen: boolean` — visibilidad del drawer.
- **Derivados** (memoizar): `total = Σ price`, `saved = Σ (was − price)`, `count = cupones.length`.
- Transiciones: `addCupon(oferta)` → push al array + `drawerOpen = true`; `removeCupon(id)` → filtra; `close()` → `drawerOpen = false`; navegación a checkout en el CTA.
- Persistencia sugerida: guardar `cupones` (localStorage o backend del carrito) para que sobreviva recargas.

## Formato de moneda
Pesos argentinos con separador de miles: `'$' + n.toLocaleString('es-AR')` → `$165.750`. (Helper `fmt` en el prototipo.)

## Datos de ejemplo (en el prototipo)
3 cupones: Hotel Spa Las Olas (−35%, $165.750 / $255.000), Cervecería Dublín (2×1, $3.900 / $7.800), Rancho Los Pinos (−15%, $12.750 / $15.000). Total $182.400 · Ahorro $99.450. Reemplazar por datos reales del carrito.

## Assets
- **Iconos**: SVG inline en `components/primitives.jsx` (objeto `Icon`: `ticket`, `arrowR`, `plus`, `check`, `bolt`, `calendar`, `chevD`, etc.) y en `cuponera-drawer.jsx` (`XIcon`, `Trash`, `Lock`). Reemplazar por el set de iconos del codebase (Lucide/Heroicons/propio) manteniendo grosor de trazo ~1.8–2 y tamaños indicados.
- **Fotos de ofertas**: en el prototipo son **placeholders con gradientes CSS** (clases `.ph-*` en el HTML, vía componente `Photo`). En producción usar las imágenes reales de cada oferta; en el ticket actual el thumbnail NO se muestra (el talón es de color), pero `ph` queda disponible si se quiere mostrar miniatura.
- **Logo**: `LogoG` en `primitives.jsx`.
- **Fuente**: Geist desde Google Fonts (`https://fonts.googleapis.com/css2?family=Geist:wght@300..900`).

## Files (en este bundle)
- `Cuponera Drawer.html` — shell: carga de fuentes, estilos de placeholders, animaciones (`@keyframes drawerIn/Out`, `scrimIn/Out`, `pop`, `rise`) y orden de scripts.
- `components/cuponera-drawer.jsx` — **el drawer**. Implementar **`DrawerTicket` + `TicketCard`** (variante 3). También contiene el shell `Drawer`, `CloseBtn`, `PayCTA`, `TrustLine`, los datos `CUPONES`, helpers `fmt/TOTAL/SAVED`, y el `App` host (delegación del trigger, fit-to-width de la página, switcher de variantes — esto último es solo andamiaje del prototipo).
- `components/dirA.jsx` — tokens del sistema "Aire" (objeto `A`) + componentes de la página de oferta.
- `components/dirA-more.jsx` — `AOfertaDetalle` (la pantalla de oferta de fondo) y otras pantallas públicas.
- `components/primitives.jsx` — set de iconos `Icon`, `Photo`, `LogoG`.

## Para empezar
Buscar `VARIANTE 3 — TICKET / WALLET` en `components/cuponera-drawer.jsx`. Ahí están `TicketCard` y `DrawerTicket` completos con todas las medidas. El resto del archivo es contexto/andamiaje del prototipo.
