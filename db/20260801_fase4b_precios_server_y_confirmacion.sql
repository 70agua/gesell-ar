-- ============================================================
--  Fase 4b — Cerrar los agujeros de precio y la traba del turista
--  Aplicado a producción el 2026-08-01.
-- ============================================================

-- ─── 1) Techo nuevo: PRECIO_MAX = 20.000 ─────────────────────
-- Con $14.520 el techo se tocaba a los ~$92.700 de ahorro y los tramos del
-- 10% y del 7% eran inalcanzables. Con $20.000 se toca a los ~$153.400 y los
-- cuatro tramos vuelven a aplicarse.
create or replace function public.precio_cupon(p_ahorro numeric)
returns numeric language sql immutable as $$
  select case when coalesce(p_ahorro,0) <= 0 then 0 else
    least(greatest(
      round((
          0.20 * least(p_ahorro, 15000)
        + 0.15 * greatest(least(p_ahorro,  40000) -  15000, 0)
        + 0.10 * greatest(least(p_ahorro, 100000) -  40000, 0)
        + 0.07 * greatest(p_ahorro - 100000, 0)
      ) * 1.21 / 100) * 100, 2500), 20000)
  end;
$$;

-- ─── 2) Escalera GRUPAL en SQL ───────────────────────────────
-- Era el único precio que la RPC no validaba: el cliente mandaba
-- `total_grupal` y se le creía. Espejo de calcularPrecioGrupal() de
-- src/lib/grupos.js. MANTENER SINCRONIZADOS.
create or replace function public.precio_cupon_grupal(p_promocion_id uuid, p_personas integer)
returns numeric language plpgsql stable as $$
declare v_promo promociones; v_desc numeric := 0; v_precio_pp numeric;
begin
  select * into v_promo from promociones where id = p_promocion_id;
  if not found or not coalesce(v_promo.is_group, false) then return null; end if;
  if p_personas is null
     or p_personas < coalesce(v_promo.group_min_pax, 0)
     or p_personas > coalesce(v_promo.group_max_pax, 2147483647) then return null; end if;

  select coalesce((t->>'discount_pct')::numeric, 0) into v_desc
    from jsonb_array_elements(coalesce(v_promo.group_tiers, '[]'::jsonb)) t
   where p_personas >= (t->>'min_pax')::int and p_personas <= (t->>'max_pax')::int limit 1;

  v_precio_pp := round(coalesce(v_promo.base_price_pp, 0) * (1 - coalesce(v_desc,0) / 100));
  return floor(v_precio_pp * p_personas / 100) * 100;   -- siempre hacia abajo
end; $$;

-- ─── 3) La venta recuerda lo suyo ────────────────────────────
-- La emisión de cupones pasó a ser un paso aparte (para poder confirmarla más
-- tarde en una transferencia), así que la venta tiene que guardar por sí sola
-- los puntos usados y el precio de cada ítem.
alter table public.ventas      add column if not exists puntos_usados integer not null default 0;
alter table public.venta_items add column if not exists personas      integer;
alter table public.venta_items add column if not exists precio        numeric not null default 0;

-- ─── 4) Emisión reutilizable + confirmación del superadmin ───
-- `emitir_cupones_de_venta(venta)` concentra cupones + débito de puntos +
-- cashback, y es idempotente. La usan las dos vías:
--   · registrar_compra_turista(), cuando el pago es con tarjeta
--   · confirmar_venta_transferencia(), cuando el superadmin verifica el pago
-- Así la confirmación no duplica nada de la lógica de la compra.
--
-- Ver las definiciones vigentes con:
--   select pg_get_functiondef('public.emitir_cupones_de_venta(uuid)'::regprocedure);
--   select pg_get_functiondef('public.registrar_compra_turista(jsonb,text,boolean)'::regprocedure);
--   select pg_get_functiondef('public.confirmar_venta_transferencia(uuid)'::regprocedure);
--   select pg_get_functiondef('public.anular_venta_pendiente(uuid)'::regprocedure);
--
-- Policies: el superadmin lee ventas y venta_items; el turista, sólo las suyas.
