-- reload_schema_cache.sql
-- 1. Recargar caché de esquema de PostgREST
NOTIFY pgrst, 'reload config';

-- 2. Asegurar permisos (por si acaso)
GRANT EXECUTE ON FUNCTION approve_service_group(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_service_group(UUID, UUID) TO service_role;

-- 3. Verificar existencia
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'approve_service_group';
