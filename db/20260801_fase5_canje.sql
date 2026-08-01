-- ============================================================
--  Fase 5 — Canje
--  Aplicado a producción el 2026-08-01.
--
--  UN SOLO MECANISMO para el cupón comprado y para el Pase. Antes el Pase
--  escribía `pase_canjes` (sólo alcanzable desde PaseDebugView) y el cupón
--  comprado no tenía canje: dos caminos paralelos.
--
--  El QR es ESTÁTICO POR SOCIO (?canjear=<negocioId>). El comercio es
--  PASIVO: no escanea, no valida, no necesita pantalla. El turista escanea,
--  ve lo que puede usar ahí, elige, confirma con la advertencia de que se
--  anula, y muestra el comprobante. Fallback: el código de 8 del cupón.
--
--  `pase_canjes` estaba vacía: no hubo datos que migrar. Queda muerta.
-- ============================================================

-- ─── Libro único ─────────────────────────────────────────────
create table if not exists public.canjes (
  id               uuid primary key default gen_random_uuid(),
  usuario_id       uuid not null references auth.users(id) on delete cascade,
  negocio_id       uuid not null references public.negocios(id) on delete cascade,
  promocion_id     uuid not null references public.promociones(id) on delete cascade,
  origen           text not null check (origen in ('cupon','pase','estadia')),
  cupon_id         uuid references public.cupones_usuario(id) on delete cascade,
  usuario_pase_id  uuid references public.usuario_pases(id) on delete cascade,
  ahorro_monto     numeric not null default 0,
  comprobante      text not null unique,
  estado           text not null default 'confirmado' check (estado in ('confirmado','anulado')),
  canjeado_el      timestamptz not null default now(),
  anulado_el       timestamptz,
  anulado_por      uuid,
  motivo_anulacion text,
  reporte_estado   text check (reporte_estado in ('pendiente','resuelto')),
  reporte_motivo   text,
  reportado_el     timestamptz,
  constraint canjes_origen_coherente check (
    (origen = 'cupon' and cupon_id is not null and usuario_pase_id is null) or
    (origen in ('pase','estadia') and usuario_pase_id is not null and cupon_id is null))
);

-- Los índices parciales son los que hacen que ANULAR devuelva el beneficio:
-- sólo miran los confirmados, así que al pasar a 'anulado' se libera solo.
create unique index if not exists canjes_cupon_unico
  on public.canjes (cupon_id) where estado = 'confirmado' and cupon_id is not null;
create unique index if not exists canjes_pase_por_comercio
  on public.canjes (usuario_pase_id, negocio_id) where estado = 'confirmado' and origen = 'pase';

create index if not exists canjes_negocio_idx on public.canjes (negocio_id, canjeado_el desc);
create index if not exists canjes_usuario_idx on public.canjes (usuario_id, canjeado_el desc);
create index if not exists canjes_reporte_idx on public.canjes (reporte_estado) where reporte_estado = 'pendiente';

alter table public.canjes enable row level security;
create policy "Turista ve sus canjes" on public.canjes for select using (usuario_id = auth.uid());
create policy "Socio ve los canjes de su negocio" on public.canjes for select using (
  negocio_id in (select perfiles.negocio_id from perfiles where perfiles.id = auth.uid()));
create policy "Superadmin gestiona canjes" on public.canjes for all using (
  exists (select 1 from perfiles where perfiles.id = auth.uid() and perfiles.es_superadmin = true));

comment on table public.pase_canjes is
  'OBSOLETA desde la Fase 5 (2026-08-01): el canje del Pase se registra en `canjes`. Estaba vacía. Se conserva un release y después se dropea.';

-- ─── Funciones ───────────────────────────────────────────────
-- Ver las definiciones vigentes con:
--   select pg_get_functiondef('public.beneficios_en_negocio(uuid)'::regprocedure);
--   select pg_get_functiondef('public.canjear_beneficio(text,uuid)'::regprocedure);
--   select pg_get_functiondef('public.reportar_canje_erroneo(uuid,text)'::regprocedure);
--   select pg_get_functiondef('public.anular_canje(uuid,text)'::regprocedure);
--   select pg_get_functiondef('public.descartar_reporte_canje(uuid)'::regprocedure);
--   select pg_get_functiondef('public.generar_comprobante_canje()'::regprocedure);
--
--  · beneficios_en_negocio(negocio) → junta en UNA lista los cupones comprados
--    del turista en ese negocio y los beneficios que le habilita su Pase. El
--    front no distingue caminos.
--  · canjear_beneficio(tipo, ref) → único punto de entrada. Valida server-side:
--    propiedad y vigencia del cupón; para el Pase, elegibilidad base/premium
--    (premium sólo si ya fue elegida), 1 canje por comercio, estadía una sola
--    vez. Acredita los +100 puntos del Pase comprado/upgradeado.
--  · reportar_canje_erroneo() → sólo el socio dueño. NO anula: abre la cola.
--  · anular_canje() → sólo superadmin. Devuelve el cupón a 'activo'.
--  · descartar_reporte_canje() → el canje estaba bien.
--
--  ⚠️ PUNTO DE ENGANCHE PARA LA FASE 5b: cuando exista `solicitudes_fecha`,
--  anular un canje de origen 'pase' con una solicitud ACEPTADA detrás tiene
--  que LIBERAR EL SLOT PREMIUM (§4.4 del reset). Hoy no aplica: los slots no
--  se consumen por solicitud, la elección premium queda intacta y el turista
--  puede volver a canjear — que es el comportamiento correcto mientras tanto.
