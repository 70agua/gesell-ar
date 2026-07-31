-- ============================================================
--  Un solo modelo de planes: PRO por tramos (pro_1 / pro_6 / pro_12).
--  El viejo Gratis/Plus desaparece.
--
--  "free" deja de ser un plan que se contrata: es el estado de un negocio
--  que no pagó, y vive en `negocios.plan`. Por eso una suscripción al plan
--  'gratis' no significa nada y se borra: `suscripciones_socio` pasa a
--  querer decir "tiene un plan pago".
--
--  Valores de las filas que se eliminan, por si hiciera falta recrearlas:
--    gratis | FREEMIUM | precio_mes 0     | meses null | cred 0  | bono 0 | activo false
--    plus   | PLUS     | precio_mes 30000 | meses 12   | cred 50 | bono 0 | activo false
--
--  Aplicado a producción el 2026-07-31.
-- ============================================================

-- 1) Suscripciones al plan 'gratis' (eran 30): no representan nada.
delete from public.suscripciones_socio s
 using public.planes p
 where p.id = s.plan_id
   and p.codigo = 'gratis';

-- 2) Las filas legacy del catálogo, ya sin referencias.
delete from public.planes where codigo in ('gratis', 'plus');

-- 3) Un solo tramo puede ser el destacado ("El más elegido"): el índice
--    parcial lo garantiza a nivel base, no sólo en la UI del superadmin.
create unique index if not exists planes_un_solo_destacado
  on public.planes ((destacado)) where destacado;
