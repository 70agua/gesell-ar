-- ============================================================
--  Fase 5b — Solicitudes de fecha
--  Aplicado a producción el 2026-08-01.
--
--  Prerequisito de todo el premium con reserva (alojamiento, spa,
--  excursiones). Tabla PROPIA y no `consultas`: esto es una máquina de
--  estados con timeouts y bloqueo de slots, no un mensaje.
-- ============================================================

alter table public.promociones
  add column if not exists requiere_fecha boolean not null default false;

create table if not exists public.solicitudes_fecha (
  id              uuid primary key default gen_random_uuid(),
  usuario_pase_id uuid not null references public.usuario_pases(id) on delete cascade,
  usuario_id      uuid not null references auth.users(id) on delete cascade,
  promocion_id    uuid not null references public.promociones(id) on delete cascade,
  socio_id        uuid not null references public.negocios(id) on delete cascade,
  fecha_pedida    date not null,
  personas        integer not null check (personas >= 1),
  estado          text not null default 'enviada'
                  check (estado in ('enviada','aceptada','rechazada','contrapropuesta','cancelada','vencida')),
  fecha_propuesta date,
  origen_id       uuid references public.solicitudes_fecha(id) on delete set null,
  enviada_at      timestamptz not null default now(),
  expira_at       timestamptz not null,
  resuelta_at     timestamptz
);

-- Una sola solicitud viva por (pase, oferta): pedir dos veces lo mismo no
-- debería consumir dos slots.
create unique index if not exists solicitudes_una_viva_por_oferta
  on public.solicitudes_fecha (usuario_pase_id, promocion_id) where estado = 'enviada';

create index if not exists solicitudes_socio_idx   on public.solicitudes_fecha (socio_id, estado, enviada_at desc);
create index if not exists solicitudes_usuario_idx on public.solicitudes_fecha (usuario_id, estado, enviada_at desc);
create index if not exists solicitudes_expira_idx  on public.solicitudes_fecha (expira_at) where estado = 'enviada';

alter table public.solicitudes_fecha enable row level security;
create policy "Turista ve sus solicitudes" on public.solicitudes_fecha
  for select using (usuario_id = auth.uid());
create policy "Socio ve las solicitudes de su negocio" on public.solicitudes_fecha
  for select using (socio_id in (select perfiles.negocio_id from perfiles where perfiles.id = auth.uid()));
create policy "Superadmin gestiona solicitudes" on public.solicitudes_fecha
  for all using (exists (select 1 from perfiles where perfiles.id = auth.uid() and perfiles.es_superadmin = true));

-- ─── CÓMO SE OCUPA UN SLOT PREMIUM ───────────────────────────
--  Ocupado = fila en `pase_elecciones` (elegida directo) O solicitud `enviada`.
--
--    enviada        → EN SUSPENSO   (cuenta como solicitud)
--    aceptada       → CONSUMIDO     (deja de contar como solicitud, pero se
--                                    crea la `pase_eleccion` → sigue ocupado,
--                                    y recién ahí la oferta es canjeable)
--    rechazada / contrapropuesta / cancelada / vencida → LIBERADO
--
--  Así el canje sigue pasando por el mismo camino de siempre
--  (`canjear_beneficio` mira `pase_elecciones`): no hay dos rutas.
--   slots_premium_ocupados(uuid)

-- ─── Funciones (ver definición vigente con pg_get_functiondef) ──
--   enviar_solicitud_fecha(uuid, date, int, uuid)
--     · Se puede pedir con el pase SIN ACTIVAR: el turista planifica antes de
--       viajar y no quema días esperando respuestas.
--     · Tope ATÓMICO: `for update` sobre el pase. En el cliente, dos pedidos
--       simultáneos pasarían el mismo último slot.
--     · Timeout = 72 h, o el vencimiento del pase si llega antes.
--   responder_solicitud_fecha(uuid, text, date)  — sí / no / proponer.
--     · Al ACEPTAR con el pase pendiente devuelve `proponer_activacion: true`:
--       se le PROPONE al turista activar desde esa fecha. No se activa solo.
--     · Al PROPONER valida que la fecha caiga dentro de la vigencia del pase
--       del turista: el socio no la ve, y sin esto podía proponer una fecha
--       que el turista después no iba a poder aceptar.
--   cancelar_solicitud_fecha(uuid)   — del turista. Libera el slot.
--   vencer_solicitudes_fecha()       — cron `vencer-solicitudes-fecha`, cada hora.
--
--  Ajustes a lo que ya existía:
--   · elegir_premium_pase  → el tope cuenta las solicitudes en suspenso; una
--     oferta con `requiere_fecha` NO se elige directo (va por solicitud); y
--     `premium_ilimitado` saltea el cupo mensual.
--   · quitar_premium_pase  → no deja soltar un slot con fecha CONFIRMADA:
--     "aceptada la solicitud, el premium se consumió". Si no, alcanzaría con
--     soltarlo para recuperarlo después de arreglar por afuera.
select cron.unschedule(jobid) from cron.job where jobname = 'vencer-solicitudes-fecha';
select cron.schedule('vencer-solicitudes-fecha', '10 * * * *',
                     $$select public.vencer_solicitudes_fecha()$$);
