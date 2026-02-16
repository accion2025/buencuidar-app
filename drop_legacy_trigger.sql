-- drop_legacy_trigger.sql
-- Objetivo: Eliminar el trigger legacy que causa notificaciones duplicadas
-- EJECUTAR EN: Supabase Dashboard > SQL Editor

-- 1. Eliminar el trigger legacy
DROP TRIGGER IF EXISTS tr_notify_task_completion ON care_logs;

-- 2. Eliminar la función legacy (ya no se necesita)
DROP FUNCTION IF EXISTS notify_client_on_task_completion();

-- 3. Verificar que solo queda el trigger unificado
SELECT tgname, tgfoid::regproc 
FROM pg_trigger 
WHERE tgrelid = 'care_logs'::regclass 
AND NOT tgisinternal;
