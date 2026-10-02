-- ATENCION: borra TODAS las tarjetas (con sus botones, sucursales y alias de URL).
-- Úsalo solo para limpiar los datos de ejemplo antes de cargar los nuevos con seed.sql.
-- No toca los usuarios ni la tabla admins. Los archivos subidos a Storage se borran desde Storage > card-assets si los hubiera.
delete from public.cards;
