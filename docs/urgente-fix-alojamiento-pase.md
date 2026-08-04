# URGENTE — Corrección: alojamiento SÍ entra en el Pase Gesell
**Motivo:** la regla vieja ("alojamiento fuera del Pase") quedó obsoleta. Puede estar repetida en varios docs y, más grave, puede estar **hardcodeada en la lógica de la app** (filtros de categoría, validaciones al armar el catálogo del Pase, etc.).

**Regla nueva:** alojamiento SÍ puede estar dentro del Pase, como oferta premium (alto monto). El turista puede solicitar disponibilidad de fecha específica incluso sin activar el pase todavía. Cuponear sigue vendiendo cupones de descuento, no reservas — no cambia el modelo de "nunca tocamos tu caja".

---

## Paso 1 — Buscar todas las menciones en docs

```bash
grep -rn "fuera del Pase\|alojamiento.*fuera\|excluye.*alojamiento" docs/ --include="*.md" --include="*.html"
```

Revisar cada resultado y actualizar el texto según la regla nueva. Ya corregido en este pase: `docs/pase-gesell.html` (adjunto, reemplazar el que está en el repo).

## Paso 2 — Buscar lógica de código que filtre alojamiento del Pase (esto es lo urgente de verdad)

```bash
grep -rn "alojamiento" src/ --include="*.jsx" --include="*.js" -i
```

Prestar especial atención a:
- Componentes que arman el catálogo/listado de ofertas del Pase (¿filtran por `categoria !== 'alojamiento'`?).
- Validaciones en el editor de ofertas (`OfertaEditorDrawer.jsx` u otro) que bloqueen marcar una oferta de alojamiento como "premium del Pase".
- Queries a Supabase (tabla `promociones` u otra) que excluyan la categoría alojamiento al traer ofertas elegibles para el Pase.
- Cualquier validación de "no se puede activar sin alojamiento reservado" o similar, que ya no debería existir para este caso.

Si aparece algo así: **sacar el filtro**, no comentar el código — que la categoría alojamiento sea elegible como cualquier otra para la capa premium del Pase.

## Paso 3 — Nueva funcionalidad a confirmar (si no existe todavía)

La regla nueva incluye algo que puede no estar implementado: **solicitar disponibilidad de fecha específica para un cupón de alojamiento, incluso antes de activar el Pase.** Si esto no existe en el flujo actual, marcarlo como pendiente y avisar — no improvisar la lógica sin brief aparte.

## Paso 4 — Reporte

Al terminar, listar:
- Qué docs se corrigieron.
- Si había o no lógica de código con el filtro viejo (y si se sacó).
- Si la funcionalidad de "solicitar fecha sin activar el pase" ya existe o queda pendiente.
