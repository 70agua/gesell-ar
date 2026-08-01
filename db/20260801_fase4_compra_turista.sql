-- ============================================================
--  Fase 4 — Persistir la compra del turista
--
--  Hasta acá `CheckoutView` simulaba todo: esperaba 1200 ms, vaciaba el
--  carrito y mostraba "listo". No se escribía ninguna venta, no se
--  descontaban los puntos usados y no se acreditaba el cashback prometido.
--
--  Aplicado a producción el 2026-08-01.
-- ============================================================

-- ─── 1) El cupón comprado ────────────────────────────────────
-- `venta_items` es la línea contable. Esto es el ACTIVO que el turista tiene
-- y va a canjear, con ciclo de vida propio. Es contra esta tabla que valida
-- la Fase 5.
create table if not exists public.cupones_usuario (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references auth.users(id) on delete cascade,
  venta_item_id  uuid references public.venta_items(id) on delete set null,
  promocion_id   uuid references public.promociones(id) on delete set null,
  negocio_id     uuid references public.negocios(id) on delete set null,
  codigo         text not null unique,
  estado         text not null default 'activo'
                 check (estado in ('activo','canjeado','vencido')),
  precio_pagado  numeric not null default 0,
  ahorro         numeric not null default 0,
  personas       integer,
  titulo         text,
  vence_el       timestamptz,
  creado_en      timestamptz not null default now(),
  canjeado_en    timestamptz
);

create index if not exists cupones_usuario_usuario_idx on public.cupones_usuario (usuario_id, estado);
create index if not exists cupones_usuario_negocio_idx on public.cupones_usuario (negocio_id, estado);

alter table public.cupones_usuario enable row level security;

create policy "Turista ve sus cupones" on public.cupones_usuario
  for select using (usuario_id = auth.uid());

-- El socio los necesita para validar el canje (Fase 5).
create policy "Socio ve los cupones de su negocio" on public.cupones_usuario
  for select using (
    negocio_id in (select perfiles.negocio_id from perfiles where perfiles.id = auth.uid())
  );

create policy "Superadmin gestiona cupones" on public.cupones_usuario
  for all using (
    exists (select 1 from perfiles where perfiles.id = auth.uid() and perfiles.es_superadmin = true)
  );

-- ─── 2) Precio del lado del servidor ─────────────────────────
-- Espejo de calcularPrecioCupon() de src/lib/cobros.js: comisión MARGINAL por
-- tramo + piso + techo. Existe para que el precio no venga del cliente.
-- MANTENER SINCRONIZADO con el JS.
create or replace function public.precio_cupon(p_ahorro numeric)
returns numeric language sql immutable as $$
  select case when coalesce(p_ahorro,0) <= 0 then 0 else
    least(greatest(
      round((
          0.20 * least(p_ahorro, 15000)
        + 0.15 * greatest(least(p_ahorro,  40000) -  15000, 0)
        + 0.10 * greatest(least(p_ahorro, 100000) -  40000, 0)
        + 0.07 * greatest(p_ahorro - 100000, 0)
      ) * 1.21 / 100) * 100, 2500), 14520)
  end;
$$;

-- ─── 3) Código del cupón ─────────────────────────────────────
-- 8 caracteres sin vocales ni ambiguos (0/O, 1/I/L): se dicta en un mostrador.
create or replace function public.generar_codigo_cupon()
returns text language plpgsql as $$
declare
  alfabeto constant text := '23456789BCDFGHJKMNPQRSTVWXYZ';
  v_codigo text;   -- v_ para no chocar con cupones_usuario.codigo
  i int;
begin
  loop
    v_codigo := '';
    for i in 1..8 loop
      v_codigo := v_codigo || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from cupones_usuario c where c.codigo = v_codigo);
  end loop;
  return v_codigo;
end; $$;

-- ─── 4) Tipos de movimiento de puntos ────────────────────────
-- El CHECK quedó congelado en los 5 valores originales y nunca se amplió.
-- Consecuencia: TODOS los movimientos de puntos del Pase que escribe pases.js
-- desde el 2026-07-17 violaban la restricción y fallaban.
alter table public.token_movimientos drop constraint if exists token_movimientos_tipo_check;
alter table public.token_movimientos add constraint token_movimientos_tipo_check
  check (tipo in (
    'ganado_compartir', 'ganado_registro', 'ganado_primera_compra',
    'gastado_cuponera', 'gasto_compra',
    'cashback_compra',
    'pase_compra', 'pase_upgrade', 'pase_canje', 'pase_devolucion',
    'bonus_admin'
  ));

-- ─── 5) La compra, atómica ───────────────────────────────────
-- Ver la definición vigente con:
--   select pg_get_functiondef('public.registrar_compra_turista(jsonb,text,boolean)'::regprocedure);
--
-- Resumen: valida sesión, recalcula el precio de cada ítem con precio_cupon()
-- (el cliente NO manda precios), aplica los puntos disponibles como parte de
-- pago, inserta venta + venta_items, emite un cupon_usuario por ítem con su
-- código, debita los puntos usados y acredita el 5% de cashback. Todo en una
-- transacción.
--
-- Transferencia: la venta queda `pendiente` y NO se emiten cupones ni se
-- mueven puntos — nadie pagó todavía.
--
-- Único precio que NO valida: el total congelado de un cupón GRUPAL, porque
-- la escalera de tramos de src/lib/grupos.js no está portada a SQL.
