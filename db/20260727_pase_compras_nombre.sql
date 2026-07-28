-- ============================================================
--  Checkout del Pase — datos del comprador nuevo
--  El checkout distingue entre turista nuevo y usuario existente. El nuevo
--  deja nombre y apellido; el que ya tiene cuenta no (esos datos ya viven en
--  su perfil), por eso ambas columnas son nullable.
-- ============================================================
alter table public.pase_compras
  add column if not exists nombre   text,
  add column if not exists apellido text;
