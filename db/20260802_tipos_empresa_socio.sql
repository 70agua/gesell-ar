-- ============================================================
--  20260802 — El socio ya no es necesariamente un alojamiento
--
--  El checkout de suscripción dejó de pedir "tipo de alojamiento" y pide
--  "tipo de empresa": Alojamiento, Agencia de turismo, Inmobiliaria,
--  Revendedor, Otros. Los tres del medio no existían en el vocabulario de
--  `negocios.tipo`, y el CHECK viejo los habría rechazado recién en runtime
--  (ver CLAUDE.md → "Los CHECK constraints se desactualizan").
--
--  Alojamiento guarda 'alojamiento' y Otros guarda 'Otro': los dos ya eran
--  válidos. Sólo hay que sumar los tres nuevos.
-- ============================================================

alter table public.negocios drop constraint if exists negocios_tipo_check;

alter table public.negocios add constraint negocios_tipo_check check (
  tipo = any (array[
    -- categorías genéricas
    'alojamiento', 'salidas', 'aventura_relax',
    -- alojamiento
    'Hotel', 'Cabaña', 'Departamento', 'Domo', 'Dormi', 'Carpa', 'Hostel', 'Casa',
    -- salidas
    'Restaurante', 'Bar', 'Café', 'Balneario', 'Pastelería', 'Gourmet', 'Parrilla',
    'Heladería', 'Bodegón', 'Cafés & Dulces', 'Discoteca', 'Cine y Teatro',
    'Show y Recital', 'Centro Cultural', 'Otro',
    -- aventura & relax
    'Experiencia', 'Excursion', 'Actividad', 'Spa',
    -- nuevos: el socio que no es hotelero
    'Agencia de turismo', 'Inmobiliaria', 'Revendedor'
  ])
);
