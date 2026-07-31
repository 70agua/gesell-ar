-- ============================================================
--  Fase 0 — Desbloquear al socio que ya pagó
--  (ver 1-reset-conceptual.md §3.3 y 2-tareas-urgentes.md Fase 0)
--
--  Tres cosas:
--    1. La aprobación previa del negocio deja de existir.
--    2. Job diario que apaga las ofertas vencidas.
--    3. Job mensual que repone los créditos publicitarios del plan PRO.
--
--  Aplicado a producción el 2026-07-31.
-- ============================================================

-- ─── 1) El negocio ya no se aprueba ──────────────────────────
-- `aprobado` no gatea nada más: se conserva la columna para no romper lecturas
-- viejas, pero nace en true. La visibilidad la decide `activo`, que maneja el
-- propio socio desde su panel. La aprobación de OFERTAS (promociones.aprobada)
-- no se toca: es el único control que queda.
alter table public.negocios alter column aprobado set default true;
update public.negocios set aprobado = true where aprobado is distinct from true;

comment on column public.negocios.aprobado is
  'OBSOLETO desde Fase 0 (2026-07-31): la moderación previa del negocio se eliminó. Siempre true. La visibilidad la decide negocios.activo. Se conserva la columna para no romper lecturas legacy.';


-- ─── 2) Expiración de ofertas ────────────────────────────────
-- Antes esto sólo pasaba cuando el superadmin abría su panel
-- (SuperAdminView.cargarTodo). Una oferta vencida seguía publicada
-- indefinidamente si nadie entraba.
create or replace function public.expirar_ofertas_vencidas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  update promociones
     set activa = false,
         motivo_inactiva = 'vencida'
   where activa = true
     and fecha_vencimiento is not null
     and fecha_vencimiento < now();
  get diagnostics n = row_count;
  return n;
end;
$$;

comment on function public.expirar_ofertas_vencidas() is
  'Apaga las promociones cuya fecha_vencimiento ya pasó. Corre por cron todos los días.';


-- ─── 3) Reposición mensual de créditos publicitarios ─────────
-- Libro mayor de las reposiciones: una fila por (negocio, mes). El unique es
-- lo que hace el job idempotente — si se corre dos veces el mismo mes, la
-- segunda no acredita nada.
create table if not exists public.creditos_mensuales (
  id          uuid primary key default gen_random_uuid(),
  negocio_id  uuid not null references public.negocios(id) on delete cascade,
  periodo     date not null,
  creditos    integer not null,
  creado_en   timestamptz not null default now(),
  unique (negocio_id, periodo)
);

comment on table public.creditos_mensuales is
  'Reposiciones mensuales de créditos publicitarios del plan PRO. periodo = primer día del mes acreditado.';

alter table public.creditos_mensuales enable row level security;

drop policy if exists "Sistema gestiona reposiciones" on public.creditos_mensuales;
create policy "Sistema gestiona reposiciones" on public.creditos_mensuales
  for all using (true);

drop policy if exists "Socio ve sus reposiciones" on public.creditos_mensuales;
create policy "Socio ve sus reposiciones" on public.creditos_mensuales
  for select using (
    negocio_id in (select perfiles.negocio_id from perfiles where perfiles.id = auth.uid())
  );

create or replace function public.reponer_creditos_mensuales()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  -- v_ para no chocar con creditos_mensuales.periodo dentro del INSERT
  v_periodo date := date_trunc('month', (now() at time zone 'America/Argentina/Buenos_Aires'))::date;
  n integer;
begin
  with elegibles as (
    -- Se excluye el mes de alta: crearSuscripcionPro() ya acredita el primer
    -- mes más el bono del tramo en el momento del alta.
    select s.negocio_id,
           p.creditos_incluidos as creditos
      from suscripciones_socio s
      join planes p on p.id = s.plan_id
     where s.estado = 'activa'
       and coalesce(p.creditos_incluidos, 0) > 0
       and date_trunc('month', (s.fecha_inicio at time zone 'America/Argentina/Buenos_Aires'))::date < v_periodo
       and (s.fecha_renovacion is null or s.fecha_renovacion > now())
  ),
  otorgados as (
    insert into creditos_mensuales (negocio_id, periodo, creditos)
    select e.negocio_id, v_periodo, e.creditos from elegibles e
    on conflict (negocio_id, periodo) do nothing
    returning negocio_id, creditos
  ),
  acreditados as (
    insert into socio_tokens (negocio_id, saldo, updated_at)
    select o.negocio_id, o.creditos, now() from otorgados o
    on conflict (negocio_id) do update
      set saldo = socio_tokens.saldo + excluded.saldo,
          updated_at = now()
    returning 1
  )
  select count(*) into n from acreditados;
  return n;
end;
$$;

comment on function public.reponer_creditos_mensuales() is
  'Acredita los créditos publicitarios del mes a cada socio con suscripción activa. Idempotente por (negocio_id, periodo).';


-- ─── Cron ────────────────────────────────────────────────────
-- Horarios en UTC. Argentina es UTC-3.
--   ofertas vencidas    → todos los días 03:00 UTC = 00:00 ART
--   reposición créditos → día 1 a las 06:00 UTC   = 03:00 ART
select cron.unschedule(jobid) from cron.job
 where jobname in ('expirar-ofertas-vencidas', 'reponer-creditos-mensuales');

select cron.schedule(
  'expirar-ofertas-vencidas',
  '0 3 * * *',
  $$select public.expirar_ofertas_vencidas()$$
);

select cron.schedule(
  'reponer-creditos-mensuales',
  '0 6 1 * *',
  $$select public.reponer_creditos_mensuales()$$
);
