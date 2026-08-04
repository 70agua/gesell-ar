-- ============================================================
--  Condiciones de canje obligatorias para PUBLICAR
--
--  Decisión de producto, no dato de prueba faltante. En el canje el comercio es
--  PASIVO —no valida, no escanea, sólo recibe el comprobante— así que las
--  condiciones son lo único que fija la expectativa antes de que el turista
--  llegue al mostrador. Sin ellas cada canje es una discusión potencial, y el
--  reclamo cae sobre Cuponear, que no estuvo en esa conversación.
--
--  Mismo patrón que promociones_premium_definido: el BORRADOR se puede dejar a
--  medias, lo publicado no. El check se cuelga de (activa and aprobada), no de
--  la columna, para no romper el guardado incremental del editor.
--
--  Formato: una condición por renglón (ver src/lib/condiciones.js). La columna
--  sigue siendo text y no un array porque todos los lectores ya parten por
--  renglón; migrar el esquema no compraría nada.
-- ============================================================

alter table public.promociones drop constraint if exists promociones_condiciones_publicada;
alter table public.promociones add constraint promociones_condiciones_publicada
  check (
    not (activa and aprobada)
    or coalesce(btrim(condiciones), '') <> ''
  ) not valid;
alter table public.promociones validate constraint promociones_condiciones_publicada;
