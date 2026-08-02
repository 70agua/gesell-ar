-- ============================================================
--  Fase 7 — Bloque Pase en el panel del socio
--  Aplicado a producción el 2026-08-01.
--
--  El checkout hotelero promete un código de 6 dígitos que el panel nunca
--  mostró. Esto lo cierra, con dos definiciones nuevas de producto
--  (docs/4-socio-distribuidor.md §5 y §6).
-- ============================================================

-- ─── 1) Tope GLOBAL de pases regalo ──────────────────────────
--  Antes: el plan pago daba pases regalo ILIMITADOS y el free 10/mes.
--  Eso socavaba el precio de las tandas del distribuidor — cualquiera tomaba
--  el plan y repartía gratis.
--
--  Ahora: tope mensual único de 150, igual para todos, editable desde
--  SuperAdmin → General → Pase. Es un parámetro GLOBAL y no un atributo del
--  plan, para calibrarlo con datos de temporada sin tocar código.
insert into public.configuracion (clave, valor, descripcion)
values ('pases_regalo_tope_mensual', '150',
        'Tope mensual de pases regalo por socio. Global, no por plan. Por encima, el socio compra tandas (ver docs/4-socio-distribuidor.md).')
on conflict (clave) do nothing;

-- ─── 2) Premium del pase regalo ──────────────────────────────
--  1 incluido, IGUAL PARA TODOS. Los tramos pro_1/pro_6/pro_12 son formas de
--  PAGO, no niveles de servicio: cambia el compromiso, no lo que recibe el
--  socio.
--
--  Bug que esto corrige: `activar_regalo_pase` no seteaba
--  `elecciones_premium`, quedaba en null y el fallback de useMiPase lo
--  llevaba a la duración en días — 7 premium en vez de 1.
--
--  Más premium = upgrade packs ($6.000 c/u, mínimo 10), +1 cada uno. Antes el
--  upgrade sólo habilitaba PUNTOS: el hotel pagaba $6.000 para que su turista
--  ganara 300. No cerraba y no se podía vender.

-- ─── Funciones ───────────────────────────────────────────────
-- Ver definición vigente con pg_get_functiondef:
--   activar_regalo_pase(text, uuid)   → tope global desde `configuracion`,
--     elecciones_premium = 1.
--   asignar_upgrade_pack(uuid)        → +1 premium. El descuento del saldo es
--     ATÓMICO (update ... where usados < comprados): antes era un
--     read-then-write desde el cliente que podía gastar dos veces el mismo.
--     Se puede asignar más de uno al mismo pase; suman.
--   bloque_pase_socio(uuid)           → alias, cupo del mes, saldo de packs,
--     activaciones y ahorro generado, en una sola llamada.
