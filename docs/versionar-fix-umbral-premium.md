# Versionar el fix del umbral base/premium ($40.000)
**Riesgo encontrado:** el umbral que decide si una oferta es "premium" dentro del Pase estuvo duplicado en dos valores contradictorios — `$15.000` (hardcodeado en 5 lugares de SQL) vs `$40.000` (en `AHORRO_BASE_MAX`, `src/lib/pases.js`). Según `db/20260803_umbral_premium_40000.sql`, se corrigió a `$40.000` en la base de datos en vivo **"vía MCP"** — pero ese archivo es solo un comentario, sin sentencias SQL ejecutables. Los 5 lugares en los archivos de migración versionados del repo todavía tienen `$15.000` hardcodeado en el cuerpo de las funciones.

**Por qué importa:** si alguna vez se reconstruye la base desde estas migraciones (entorno nuevo, staging, disaster recovery, otro dev con `supabase db reset`), el bug viejo vuelve — silenciosamente, porque el fix real nunca quedó en el historial versionado.

---

## Los 5 lugares a corregir (según el comentario de `20260803_umbral_premium_40000.sql`)

Buscarlos y confirmar cuál valor tiene cada uno HOY en la base de datos en vivo (con `Supabase:execute_sql` o `Supabase:list_migrations`/`get_advisors` si hace falta) antes de escribir el fix, para no asumir que todos quedaron en $40.000 — puede que el cambio "vía MCP" no haya tocado los 5:

1. `beneficios_en_negocio` — label 'premium'/'incluida' + filtro de listado
2. `canjear_beneficio` — exige elección previa si es premium
3. `elegir_premium_pase` — rechaza con `'no_es_premium'` si no supera el piso (hoy en el archivo versionado: `db/20260717_pase_cuponera.sql` y `db/20260728_pase_dias_reales.sql`, ambos con `<= 15000`)
4. `enviar_solicitud_fecha` — `v_premium` define si la solicitud consume slot (hoy en `db/20260802_fase8_elegir_con_pase_pendiente.sql`, con `<= 15000`)
5. `promociones_premium_definido` (CHECK constraint) — exige cupo/ilimitado si es premium

## Qué hacer

1. Confirmar el valor real vigente en cada uno de los 5 (RPC actual en la base ≠ necesariamente lo que dice el archivo .sql viejo del repo).
2. Escribir **una migración nueva** (`db/20260805_fix_umbral_premium_versionado.sql` o fecha que corresponda) con los `CREATE OR REPLACE FUNCTION` / `ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT` reales, fijando los 5 en `$40.000`, de forma que quede en el historial y sea reproducible desde cero.
3. NO tocar `precio_cupon()` / `calcularPrecioCupon()` en `cobros.js` — esos `15000`/`40000` son los bordes de la escalera de comisión marginal, un concepto distinto que comparte número por coincidencia (así lo aclara el comentario del archivo original).
4. Verificar con un conteo antes/después (como se hizo la vez pasada) que ninguna fila existente viola el constraint nuevo.

## Reporte esperado

- Confirmación de qué valor tenía cada uno de los 5 antes de tocar nada.
- La migración nueva creada.
- Resultado del conteo de verificación.
