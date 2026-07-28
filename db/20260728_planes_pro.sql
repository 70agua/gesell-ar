-- ============================================================
--  20260728_planes_pro.sql
--  Fin del modelo Freemium/Plus. Pasa a tres tramos de un único plan PRO,
--  que se diferencian sólo por el compromiso: 1, 6 o 12 meses.
--
--  NO se borra ninguna fila. `suscripciones_socio` tiene 30 filas apuntando
--  al plan 'gratis' y borrarlo rompería la FK; en vez de eso las dos filas
--  viejas quedan con activo = false, fuera de los listados pero enteras.
--
--  Columnas nuevas:
--    activo        → si el plan se sigue ofreciendo (lo que filtra el checkout)
--    destacado     → el "más elegido", uno solo
--    creditos_bono → créditos publicitarios de una vez al dar de alta.
--                    `creditos_incluidos` sigue siendo el recurrente mensual.
-- ============================================================

alter table public.planes
  add column if not exists activo        boolean not null default true,
  add column if not exists destacado     boolean not null default false,
  add column if not exists creditos_bono integer not null default 0;

-- El CHECK viejo sólo admitía 'gratis' y 'plus'.
alter table public.planes drop constraint if exists planes_codigo_check;
alter table public.planes add  constraint planes_codigo_check
  check (codigo in ('gratis', 'plus', 'pro_1', 'pro_6', 'pro_12'));

-- Un solo destacado a la vez.
create unique index if not exists planes_un_solo_destacado
  on public.planes ((destacado)) where destacado;

update public.planes set activo = false, destacado = false
  where codigo in ('gratis', 'plus');

-- ─── Los tres tramos ─────────────────────────────────────────
--  Precio de referencia = el mensual ($45.000). Los otros dos se pagan
--  por adelantado y el descuento está calibrado para que caiga en meses
--  redondos contra ese precio:
--    6 meses  → $225.000 = 5 meses al precio mensual  (1 bonificado)
--   12 meses  → $360.000 = 8 meses al precio mensual  (4 bonificados)
insert into public.planes
  (codigo, nombre, precio_mes, meses_contrato, creditos_incluidos, creditos_bono, destacado, activo, descripcion, beneficios)
values
  ('pro_1', 'PRO mensual', 45000, 1, 15, 0, false, true,
   'Todo PRO, mes a mes y sin permanencia.',
   '["Publicás tus ofertas sin límite","Regalás el pase a tus huéspedes, sin tope mensual","15 créditos por mes para impulsar tus ofertas","Tu código de 6 dígitos para el check-in","Te das de baja cuando querés"]'::jsonb),

  ('pro_6', 'PRO 6 meses', 37500, 6, 15, 20, false, true,
   'Pagás 5 meses y tenés 6. Ideal para cubrir la temporada.',
   '["Todo lo del plan mensual","1 mes bonificado: pagás $225.000 por 6 meses","20 créditos extra de bienvenida","15 créditos por mes para impulsar tus ofertas"]'::jsonb),

  ('pro_12', 'PRO 12 meses', 30000, 12, 15, 60, true, true,
   'El mejor precio por mes. Pagás 8 meses y tenés el año entero.',
   '["Todo lo del plan de 6 meses","4 meses bonificados: pagás $360.000 por 12 meses","60 créditos extra de bienvenida para impulsar tus ofertas","El precio por mes más bajo: $30.000","Prioridad en los listados frente a los tramos más cortos"]'::jsonb)

on conflict (codigo) do update set
  nombre             = excluded.nombre,
  precio_mes         = excluded.precio_mes,
  meses_contrato     = excluded.meses_contrato,
  creditos_incluidos = excluded.creditos_incluidos,
  creditos_bono      = excluded.creditos_bono,
  destacado          = excluded.destacado,
  activo             = excluded.activo,
  descripcion        = excluded.descripcion,
  beneficios         = excluded.beneficios;

-- ─── Rollback ────────────────────────────────────────────────
--  update public.planes set activo = true  where codigo in ('gratis','plus');
--  update public.planes set activo = false where codigo like 'pro_%';
