-- ============================================================
--  Pase / Cuponera Gesell — Brief 1 (backend + lógica de negocio)
--  Naming GENÉRICO: producto = `pases` (multi-destino).
--  "gesell" nunca se hardcodea en tablas ni lógica; vive solo
--  como `destino_slug` de una fila de datos.
--
--  Migración puramente aditiva: 6 tablas nuevas + 1 columna
--  nueva y nullable en `promociones`. No altera nada existente.
-- ============================================================

-- ─── 1. Catálogo de pases (una fila por destino/producto) ────
create table if not exists public.pases (
  id                      uuid primary key default gen_random_uuid(),
  destino_slug            text    not null,
  nombre_comercial        text    not null,
  precio_final            numeric not null,
  precio_sin_iva          numeric,
  duracion_dias           int     not null default 7,
  elecciones_premium      int     not null default 2,
  precio_upgrade_final    numeric,
  precio_upgrade_sin_iva  numeric,
  activo                  boolean not null default true,
  creado_en               timestamptz not null default now()
);

-- ─── 2. Instancias de pase por usuario ───────────────────────
create table if not exists public.usuario_pases (
  id                uuid primary key default gen_random_uuid(),
  pase_id           uuid not null references public.pases(id),
  user_id           uuid not null references auth.users(id) on delete cascade,
  tipo              text not null check (tipo in ('comprado','regalo')),
  upgrade_aplicado  boolean not null default false,
  estado            text not null default 'pendiente'
                      check (estado in ('pendiente','activo','vencido')),
  fecha_compra      timestamptz not null default now(),
  fecha_activacion  timestamptz,
  vence_el          timestamptz,
  origen_negocio_id uuid references public.negocios(id),
  pago_ref_pase     text,
  pago_ref_upgrade  text,
  creado_en         timestamptz not null default now()
);
create index if not exists idx_usuario_pases_user   on public.usuario_pases (user_id);
create index if not exists idx_usuario_pases_origen on public.usuario_pases (origen_negocio_id);

-- ─── 3. Elecciones premium (máx = pases.elecciones_premium) ──
create table if not exists public.pase_elecciones (
  id              uuid primary key default gen_random_uuid(),
  usuario_pase_id uuid not null references public.usuario_pases(id) on delete cascade,
  promocion_id    uuid not null references public.promociones(id),
  elegida_el      timestamptz not null default now(),
  unique (usuario_pase_id, promocion_id)
);
create index if not exists idx_pase_elecciones_promo on public.pase_elecciones (promocion_id);

-- ─── 4. Canjes (1 por comercio por pase → unique) ────────────
create table if not exists public.pase_canjes (
  id              uuid primary key default gen_random_uuid(),
  usuario_pase_id uuid not null references public.usuario_pases(id) on delete cascade,
  promocion_id    uuid not null references public.promociones(id),
  negocio_id      uuid not null references public.negocios(id),
  canjeado_el     timestamptz not null default now(),
  ahorro_monto    numeric not null default 0,   -- snapshot; NO recalcular
  unique (usuario_pase_id, negocio_id)
);
create index if not exists idx_pase_canjes_negocio on public.pase_canjes (negocio_id);

-- ─── 5. Control mensual de pases-regalo (Free = 10/mes) ──────
create table if not exists public.pase_cupos_regalo (
  id         uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id),
  mes        text not null,                     -- 'YYYY-MM'
  usados     int  not null default 0,
  unique (negocio_id, mes)
);

-- ─── 6. Saldo mayorista de upgrades (hoteles Plus) ───────────
create table if not exists public.negocio_upgrade_packs (
  id         uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) unique,
  comprados  int  not null default 0,
  usados     int  not null default 0,
  pago_ref   text,
  creado_en  timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── 7. Cupo mensual premium por promoción (lo define el socio)
alter table public.promociones
  add column if not exists cupo_mensual_premium int;

-- ============================================================
--  RLS — mismo patrón que las tablas existentes:
--  lectura pública de lo activo · cada quien gestiona lo suyo
--  por auth.uid() · superadmin gestiona todo.
-- ============================================================
alter table public.pases                 enable row level security;
alter table public.usuario_pases         enable row level security;
alter table public.pase_elecciones       enable row level security;
alter table public.pase_canjes           enable row level security;
alter table public.pase_cupos_regalo     enable row level security;
alter table public.negocio_upgrade_packs enable row level security;

-- pases: catálogo público (activos); superadmin gestiona
create policy "Ver pases activos" on public.pases
  for select using (activo = true);
create policy "Superadmin gestiona pases" on public.pases
  for all using (exists (select 1 from perfiles
    where perfiles.id = auth.uid() and perfiles.es_superadmin = true));

-- usuario_pases: dueño (turista) + socio que lo regaló pueden verlo
create policy "Usuario ve sus pases" on public.usuario_pases
  for select using (
    user_id = auth.uid()
    or origen_negocio_id in (select negocio_id from perfiles where perfiles.id = auth.uid())
  );
create policy "Usuario crea sus pases" on public.usuario_pases
  for insert with check (user_id = auth.uid());
create policy "Usuario/socio actualiza pase" on public.usuario_pases
  for update using (
    user_id = auth.uid()
    or origen_negocio_id in (select negocio_id from perfiles where perfiles.id = auth.uid())
  );
create policy "Superadmin gestiona usuario_pases" on public.usuario_pases
  for all using (exists (select 1 from perfiles
    where perfiles.id = auth.uid() and perfiles.es_superadmin = true));

-- pase_elecciones: por dueño del usuario_pase
create policy "Usuario ve sus elecciones" on public.pase_elecciones
  for select using (exists (select 1 from usuario_pases up
    where up.id = usuario_pase_id and up.user_id = auth.uid()));
create policy "Usuario crea sus elecciones" on public.pase_elecciones
  for insert with check (exists (select 1 from usuario_pases up
    where up.id = usuario_pase_id and up.user_id = auth.uid()));
create policy "Usuario borra sus elecciones" on public.pase_elecciones
  for delete using (exists (select 1 from usuario_pases up
    where up.id = usuario_pase_id and up.user_id = auth.uid()));
create policy "Superadmin gestiona elecciones" on public.pase_elecciones
  for all using (exists (select 1 from perfiles
    where perfiles.id = auth.uid() and perfiles.es_superadmin = true));

-- pase_canjes: dueño del pase + socio del comercio
create policy "Ver canjes propios" on public.pase_canjes
  for select using (
    exists (select 1 from usuario_pases up where up.id = usuario_pase_id and up.user_id = auth.uid())
    or negocio_id in (select negocio_id from perfiles where perfiles.id = auth.uid())
  );
create policy "Usuario registra canje" on public.pase_canjes
  for insert with check (exists (select 1 from usuario_pases up
    where up.id = usuario_pase_id and up.user_id = auth.uid()));
create policy "Superadmin gestiona canjes" on public.pase_canjes
  for all using (exists (select 1 from perfiles
    where perfiles.id = auth.uid() and perfiles.es_superadmin = true));

-- pase_cupos_regalo: socio gestiona lo suyo
create policy "Socio gestiona sus cupos" on public.pase_cupos_regalo
  for all using (negocio_id in (select negocio_id from perfiles where perfiles.id = auth.uid()))
  with check (negocio_id in (select negocio_id from perfiles where perfiles.id = auth.uid()));
create policy "Superadmin gestiona cupos" on public.pase_cupos_regalo
  for all using (exists (select 1 from perfiles
    where perfiles.id = auth.uid() and perfiles.es_superadmin = true));

-- negocio_upgrade_packs: socio gestiona lo suyo
create policy "Socio gestiona sus packs" on public.negocio_upgrade_packs
  for all using (negocio_id in (select negocio_id from perfiles where perfiles.id = auth.uid()))
  with check (negocio_id in (select negocio_id from perfiles where perfiles.id = auth.uid()));
create policy "Superadmin gestiona packs" on public.negocio_upgrade_packs
  for all using (exists (select 1 from perfiles
    where perfiles.id = auth.uid() and perfiles.es_superadmin = true));

-- ============================================================
--  RPC: elección premium (SECURITY DEFINER)
--  Necesario porque el cupo mensual del socio se cuenta cruzando
--  usuarios; con RLS el turista no ve elecciones ajenas.
--  Valida ownership, régimen premium, tope de elecciones,
--  elegibilidad de la oferta y cupo mensual — de forma atómica.
-- ============================================================
create or replace function public.elegir_premium_pase(
  p_usuario_pase uuid,
  p_promocion    uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid          uuid := auth.uid();
  v_pase         public.usuario_pases;
  v_def          public.pases;
  v_promo        public.promociones;
  v_negocio_tipo text;
  v_usadas       int;
  v_cupo         int;
  v_mes          text := to_char(now(), 'YYYY-MM');
  v_aloj         text[] := array['alojamiento','Hotel','Cabaña','Departamento',
                                 'Domo','Dormi','Carpa','Casa','Hostel','Glamping'];
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'no_auth');
  end if;

  select * into v_pase from public.usuario_pases where id = p_usuario_pase;
  if not found or v_pase.user_id <> v_uid then
    return jsonb_build_object('ok', false, 'error', 'pase_no_encontrado');
  end if;
  if v_pase.estado <> 'activo' then
    return jsonb_build_object('ok', false, 'error', 'pase_no_activo');
  end if;
  -- régimen premium: comprado, o regalo con upgrade aplicado
  if v_pase.tipo = 'regalo' and v_pase.upgrade_aplicado is not true then
    return jsonb_build_object('ok', false, 'error', 'sin_premium');
  end if;

  select * into v_def from public.pases where id = v_pase.pase_id;

  select count(*) into v_usadas
    from public.pase_elecciones where usuario_pase_id = p_usuario_pase;
  if v_usadas >= coalesce(v_def.elecciones_premium, 2) then
    return jsonb_build_object('ok', false, 'error', 'max_elecciones');
  end if;

  select * into v_promo from public.promociones where id = p_promocion;
  if not found or v_promo.activa is not true then
    return jsonb_build_object('ok', false, 'error', 'promo_no_disponible');
  end if;
  -- premium = tramos 15/10/7 → ahorro declarado > 15.000
  if coalesce(v_promo.ahorro_estimado, 0) <= 15000 then
    return jsonb_build_object('ok', false, 'error', 'no_es_premium');
  end if;
  select tipo into v_negocio_tipo from public.negocios where id = v_promo.negocio_id;
  if v_negocio_tipo = any(v_aloj) then
    return jsonb_build_object('ok', false, 'error', 'categoria_excluida');
  end if;

  -- cupo mensual del socio para esta oferta
  v_cupo := v_promo.cupo_mensual_premium;
  if v_cupo is null or v_cupo <= 0 then
    return jsonb_build_object('ok', false, 'error', 'sin_cupo');
  end if;
  select count(*) into v_usadas from public.pase_elecciones e
    where e.promocion_id = p_promocion
      and to_char(e.elegida_el, 'YYYY-MM') = v_mes;
  if v_usadas >= v_cupo then
    return jsonb_build_object('ok', false, 'error', 'cupo_agotado');
  end if;

  insert into public.pase_elecciones (usuario_pase_id, promocion_id)
    values (p_usuario_pase, p_promocion);
  return jsonb_build_object('ok', true);

exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'ya_elegida');
end;
$$;

grant execute on function public.elegir_premium_pase(uuid, uuid) to anon, authenticated;

-- ============================================================
--  RPC: activación de pase-regalo (SECURITY DEFINER)
--  El turista debe incrementar el contador mensual del socio
--  (tabla que por RLS no puede escribir) con el tope Free=10/mes
--  de forma atómica. Plus: ilimitado.
-- ============================================================
create or replace function public.activar_regalo_pase(
  p_destino        text,
  p_origen_negocio uuid
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_def   public.pases;
  v_plan  text;
  v_mes   text := to_char(now(), 'YYYY-MM');
  v_id    uuid;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'no_auth');
  end if;

  select * into v_def from public.pases
    where destino_slug = p_destino and activo = true limit 1;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'pase_inexistente');
  end if;

  select plan into v_plan from public.negocios where id = p_origen_negocio;
  if v_plan is null then
    return jsonb_build_object('ok', false, 'error', 'negocio_inexistente');
  end if;

  if v_plan <> 'plus' then
    insert into public.pase_cupos_regalo (negocio_id, mes, usados)
      values (p_origen_negocio, v_mes, 0)
      on conflict (negocio_id, mes) do nothing;
    update public.pase_cupos_regalo
      set usados = usados + 1
      where negocio_id = p_origen_negocio and mes = v_mes and usados < 10;
    if not found then
      return jsonb_build_object('ok', false, 'error', 'cupo_agotado');
    end if;
  end if;

  insert into public.usuario_pases
    (pase_id, user_id, tipo, estado, fecha_activacion, vence_el, origen_negocio_id)
    values (v_def.id, v_uid, 'regalo', 'activo', now(),
            now() + (v_def.duracion_dias || ' days')::interval, p_origen_negocio)
    returning id into v_id;

  return jsonb_build_object('ok', true, 'usuario_pase_id', v_id);
end;
$$;
grant execute on function public.activar_regalo_pase(text, uuid) to anon, authenticated;

-- ============================================================
--  RPC: usos premium del mes por oferta (agregado, sin PII)
--  Para calcular cupo disponible al listar la capa premium.
-- ============================================================
create or replace function public.pase_premium_usos_mes()
returns table(promocion_id uuid, usados bigint)
language sql security definer set search_path = public stable
as $$
  select promocion_id, count(*)::bigint
  from public.pase_elecciones
  where to_char(elegida_el, 'YYYY-MM') = to_char(now(), 'YYYY-MM')
  group by promocion_id;
$$;
grant execute on function public.pase_premium_usos_mes() to anon, authenticated;
