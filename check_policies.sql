-- check_policies.sql
-- Revisar políticas de seguridad para Paquetes y Citas

SELECT tablename, policyname, roles, cmd, qual, permissive 
FROM pg_policies 
WHERE tablename IN ('service_groups', 'appointments');

-- Verificar si RLS está habilitado en las tablas
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('service_groups', 'appointments');
