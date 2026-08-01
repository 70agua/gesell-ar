-- ============================================================
--  Fase 6 — Mi Pase   ·   Aplicado a producción el 2026-08-01
--
--  El backend del Pase estaba entero desde el 2026-07-17, pero todo el medio
--  del recorrido sólo existía en PaseDebugView. Esto lo saca a producción.
-- ============================================================

-- ─── 1) Activación programada ────────────────────────────────
--  `CheckoutPaseView` promete "elegí cuándo arranca" y no existía en el
--  modelo de datos: sólo se podía activar en el momento.
--
--  Es PREREQUISITO DE LA FASE 5b: sin esto, para pedir una fecha el turista
--  tiene que activar el pase, y quema días de vigencia esperando que el socio
--  le conteste. Con la activación programada compra, pide fechas y recién
--  arranca el día que viaja.
alter table public.usuario_pases add column if not exists activacion_programada date;

create index if not exists usuario_pases_programados_idx
  on public.usuario_pases (activacion_programada)
  where estado = 'pendiente' and activacion_programada is not null;

-- Funciones (ver definición vigente con pg_get_functiondef):
--   programar_activacion_pase(uuid, date) → valida fecha futura y dentro de la
--     ventana de 12 meses desde la compra. `null` desprograma.
--   activar_pase(uuid)                    → activación inmediata, server-side:
--     la vigencia no puede depender del reloj del cliente. Si pasaron los 12
--     meses, vence y devuelve el importe en puntos.
--   activar_pases_programados()           → cron diario, activa los que llegaron.

select cron.unschedule(jobid) from cron.job where jobname = 'activar-pases-programados';
select cron.schedule('activar-pases-programados', '30 3 * * *',
                     $$select public.activar_pases_programados()$$);

-- ─── 2) Los slots premium se OCUPAN, no se consumen (§4.3) ───
--  Había `elegir_premium_pase` pero NO forma de soltar una elección, así que
--  en la práctica el slot se consumía al elegir. `quitar_premium_pase` lo
--  devuelve, salvo que ya se haya canjeado — ahí queda congelado.
--   quitar_premium_pase(uuid, uuid)

-- ─── 3) Vencimiento de cupones comprados ─────────────────────
--  `cupones_usuario.estado` nunca pasaba a 'vencido' solo. No había agujero
--  funcional (la fecha se mira al leer y al canjear) pero el estado mentía.
--   expirar_cupones_vencidos()
select cron.unschedule(jobid) from cron.job where jobname = 'expirar-cupones-vencidos';
select cron.schedule('expirar-cupones-vencidos', '15 3 * * *',
                     $$select public.expirar_cupones_vencidos()$$);

-- ─── 4) UN SOLO CÓDIGO ───────────────────────────────────────
--  Había dos: el del cupón (8, el que el turista tipea si no puede escanear)
--  y el del comprobante (6, el que ve el socio). En el mostrador eso se
--  rompe: el turista muestra uno y el socio busca el otro.
--
--  Ahora, cuando el canje viene de un cupón, el comprobante ES el código del
--  cupón. El unique pasa a ser PARCIAL sobre los confirmados, para que un
--  cupón anulado y recanjeado pueda reusar su código.
alter table public.canjes drop constraint if exists canjes_comprobante_key;
create unique index if not exists canjes_comprobante_confirmado
  on public.canjes (comprobante) where estado = 'confirmado';

-- ─── 5) Datos: cupo premium ──────────────────────────────────
--  Las 73 ofertas que califican como premium por ahorro tenían
--  `cupo_mensual_premium` en 0, con lo cual getOfertasPremium() devolvía
--  VACÍO y la capa premium del Pase no existía en la práctica.
update promociones set cupo_mensual_premium = 10
 where activa and aprobada and coalesce(ahorro_estimado,0) > 15000
   and coalesce(cupo_mensual_premium,0) = 0;
