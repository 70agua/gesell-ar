-- ============================================================
--  20260818_pases_destacado.sql
--  Checkout del Cupon PASS (brief 2026-08-18, §E) — jerarquía en la
--  elección de pase. `destacado` marca "El más elegido" y se lee desde
--  la tabla, no se hardcodea en el front. Mismo patrón que
--  `planes.destacado` (20260728_planes_pro.sql), pero el índice se
--  escopea por región: cada región puede tener su propio pase
--  destacado, y sólo uno por región.
-- ============================================================

alter table public.pases
  add column if not exists destacado boolean not null default false;

create unique index if not exists pases_un_destacado_por_region
  on public.pases (region_id) where destacado;

-- Seed: el pase de 7 días es el de mejor precio/día y más elecciones
-- premium — mismo criterio que pro_12 en planes (el compromiso mayor
-- es el destacado). Sólo toca las filas existentes hoy; no asume
-- duraciones futuras.
update public.pases set destacado = true where duracion_dias = 7 and activo = true;
