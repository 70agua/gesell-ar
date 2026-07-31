-- ============================================================
--  Fase 1 — Borrados
--  (ver 1-reset-conceptual.md §3.1 y §3.2)
--
--  1. Cuponera regalo del socio. Había DOS mecanismos de regalo del hotelero
--     al huésped haciendo lo mismo; se conserva el pase-regalo (alias de 6
--     dígitos, RPCs atómicas, cupo validado, ya integrado al checkout
--     hotelero) y se elimina éste. Con él muere la traba de aprobación del
--     comprobante de transferencia.
--
--  2. Cobro por canje al alojamiento. Cobrarle al socio por el huésped que se
--     le deriva no escala y genera conflicto de interés con el orden del
--     listado. Nunca estuvo cableado; se borra antes de construir el canje
--     para no cablearlo por inercia.
--
--  Las tres tablas de cuponera regalo estaban VACÍAS (0 filas) y
--  `ordenes_cobro` tenía 1 fila de prueba.
--
--  Del lado del código se eliminaron:
--    src/lib/cuponerasRegalo.js       (entero)
--    src/lib/packs.js                 (código muerto; tenía el otro insert
--                                      a ordenes_cobro, del pack descartado)
--    src/components/OfertaEditor.jsx  (código muerto)
--    TabCuponeras + su entrada de nav (AdminNegocioView)
--    paso 4 del onboarding            (LoginView)
--    aprobación de comprobantes       (SuperAdminView)
--    onCanjeAlojamiento / generarOrdenCanje / getOrdenesPendientes (cobros.js)
--
--  Aplicado a producción el 2026-07-31.
-- ============================================================

-- ─── 1) Cuponera regalo ──────────────────────────────────────
drop table if exists public.cuponeras_activaciones cascade;
drop table if exists public.cuponeras_regalo_cupones cascade;
drop table if exists public.cuponeras_regalo cascade;

-- El gate que bloqueaba al socio hasta aprobarle el comprobante.
alter table public.negocios drop column if exists puede_compartir_cuponeras;

-- ─── 2) Cobro por canje ──────────────────────────────────────
drop table if exists public.ordenes_cobro cascade;

-- ============================================================
--  Fase 1b — Cerrar el modelo de plan (sólo código, sin DDL)
--
--  Se eliminó `debeUsarTokens()` y su cobro `descontarToken()`: un alojamiento
--  sin plan pagaba créditos publicitarios para publicar. Contradecía el
--  principio de que ningún socio paga por publicar, y castigaba al canal de
--  distribución del pase-regalo.
--
--  Hallazgo: el cobro ya estaba muerto. Su último llamador vivía en
--  OfertaEditor.jsx, borrado más arriba en esta misma fase.
--
--  Único débito de créditos que queda: el impulso voluntario de una oferta
--  (`impulso.js` → descontarCreditos). En base, la única función que toca
--  socio_tokens es `reponer_creditos_mensuales`, que acredita.
--
--  PRINCIPIO FIJADO: el plan compra visibilidad, no funcionalidad básica.
-- ============================================================
