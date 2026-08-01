-- ============================================================
--  Cupo premium explícito + Fase 7 (tracking real)
--  Aplicado a producción el 2026-08-01.
-- ============================================================

-- ─── 1) Cupo premium: elección explícita, sin default silencioso ──
--  Antes `cupo_mensual_premium` era un integer nullable y getOfertasPremium()
--  filtraba por `> 0`. Resultado: las 73 ofertas que calificaban como premium
--  quedaban FUERA de la capa premium del Pase sin que nadie lo decidiera — el
--  default silencioso era "no participar".
--
--  Ahora, al publicar con ahorro > $15.000 el socio elige entre cupo mensual N
--  o ILIMITADO. El cupo protege al socio de alto ticket (un spa con capacidad
--  limitada en enero); si quiere ilimitado, es su decisión — no un 0 que
--  significa otra cosa.
alter table public.promociones add column if not exists premium_ilimitado boolean;

update public.promociones set premium_ilimitado = false
 where coalesce(cupo_mensual_premium,0) > 0 and premium_ilimitado is null;

-- La regla vive en la base. Los borradores quedan afuera: el socio la está
-- escribiendo todavía.
alter table public.promociones drop constraint if exists promociones_premium_definido;
alter table public.promociones add constraint promociones_premium_definido check (
  coalesce(borrador, false)
  or coalesce(ahorro_estimado, 0) <= 15000
  or premium_ilimitado is true
  or coalesce(cupo_mensual_premium, 0) >= 1
);

-- ─── 2) Tracking real ────────────────────────────────────────
--  `TabEstadisticas` no era una pantalla rota: era un dato que no se mide.
--  `visitas` y `oferta_stats` existían desde siempre y estaban en CERO.
create unique index if not exists visitas_negocio_fecha on public.visitas (negocio_id, fecha);
create index if not exists oferta_stats_promo_idx
  on public.oferta_stats (promocion_id, evento, creado_en desc);

-- El CHECK de `evento` estaba congelado en el vocabulario viejo
-- ('vista','click_cuponera','click_ampliar'). La tabla estaba vacía.
-- Es el TERCER check que queda desactualizado y bloquea vocabulario nuevo
-- (antes: token_movimientos.tipo y ventas.estado).
alter table public.oferta_stats drop constraint if exists oferta_stats_evento_check;
alter table public.oferta_stats add constraint oferta_stats_evento_check
  check (evento in ('vista_oferta', 'carrito'));

-- Funciones (ver definición vigente con pg_get_functiondef):
--   registrar_evento(text, uuid, uuid)  → SECURITY DEFINER porque el visitante
--     suele ser ANÓNIMO y no puede tener permiso de escritura sobre las
--     métricas de todos los socios. Resuelve el negocio desde la oferta (no lo
--     elige el cliente) y descarta al socio mirando su propia ficha.
--     GRANT a anon y authenticated.
--   stats_negocio(uuid, int)            → todo lo que muestra la pantalla en
--     una llamada, recortado al negocio del socio (o superadmin). Incluye
--     `dias_con_datos` para poder decir "falta historial" en vez de dibujar
--     una curva inventada.
--
--  NO se mide "click a contacto": ese botón se eliminó en la Fase 2b. El
--  contacto pasa a ser el flujo de solicitudes de fecha (5b) y se medirá
--  contra su propia tabla.
