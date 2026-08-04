# Auditoría y consolidación de design tokens
**Motivo:** `CLAUDE.md` admite "no tailwind.config.js theme extensions in use" — no hay paleta de colores ni escala de spacing formalizada en el código. Cada componente nuevo define valores sueltos, lo que genera inconsistencia visual entre pantallas.
**Regla:** no inventar colores/spacing nuevos. Todo sale de lo que YA existe en el código — este brief es de consolidación, no de rediseño.

---

## Paso 1 — Auditoría (solo lectura, no tocar nada todavía)

Recorrer `src/**/*.jsx` y `src/index.css` y extraer:

1. **Todos los valores de color hardcodeados**: hex (`#1C2B30`), rgb/rgba, y clases Tailwind de color (`text-slate-800`, `bg-emerald-600`, etc.).
2. **Todos los valores de spacing hardcodeados fuera de la escala estándar de Tailwind** (ej. `px-[13px]`, `mt-[22px]`) — señal de que alguien "ojeó" un valor en vez de usar la escala.
3. **Tipografías usadas** además de Inter/NauryzRedkeds (si hay alguna colada).

Armar una tabla simple: `valor | cuántas veces aparece | en qué archivos`.

## Paso 2 — Consolidación (agrupar, no decidir estética nueva)

- Agrupar valores de color que son "el mismo color" con pequeñas variaciones (ej. 3 tonos de verde parecidos que probablemente deberían ser 1).
- Identificar cuáles son claramente **el color primario de marca**, **secundario**, **de éxito/alerta/error**, **neutros/texto/fondo** — según el uso real (dónde aparecen: botones primarios, textos, fondos, badges).
- **No agregar colores nuevos.** Si falta un caso (ej. no hay color de "error" definido), marcarlo como hueco pendiente — no inventarlo.

## Paso 3 — Generar el archivo de tokens

Crear `src/styles/tokens.css` usando `@theme` (sintaxis CSS-first de Tailwind v4, reemplaza `tailwind.config.js`):

```css
@theme {
  /* Primitivos — extraídos de la auditoría, valores reales ya en uso */
  --color-brand-600: #____;
  --color-brand-700: #____;
  
  /* Semánticos — alias por propósito */
  --color-primary: var(--color-brand-600);
  --color-text: #____;
  --color-bg: #____;
  --color-success: #____;
  --color-error: #____;

  /* Spacing — solo si la auditoría encontró un patrón real fuera de la escala default */
}
```

Importar desde `src/index.css`.

## Paso 4 — Actualizar CLAUDE.md

En "Styling conventions", reemplazar *"no tailwind.config.js theme extensions in use"* por referencia a `src/styles/tokens.css` como fuente de verdad, con la lista de tokens semánticos disponibles (2-3 líneas, no todo el archivo).

## Paso 5 — Migración (incremental, NO en este mismo pase)

No reemplazar todos los hex hardcodeados de una — dejarlo para PRs futuros, componente por componente, a medida que se tocan por otras razones. Este brief es para que **exista** la fuente de verdad, no para migrar todo el código de una sentada.

---

## Output esperado de Code al terminar
- `src/styles/tokens.css` creado.
- Tabla de auditoría (colores encontrados → a qué token semántico se mapeó) — pegarla en el chat o en un comentario del PR, para que Mariano confirme que la agrupación tiene sentido de marca antes de que se use en componentes nuevos.
- `CLAUDE.md` actualizado.
