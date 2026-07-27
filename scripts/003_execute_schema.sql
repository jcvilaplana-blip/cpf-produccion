-- Este script ejecuta la creación del schema completo
-- Primero limpiamos cualquier dato existente
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Ahora ejecutamos el schema completo desde 001
\i 001_create_complete_schema.sql
