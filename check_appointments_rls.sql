-- check_appointments_rls.sql
SELECT policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'appointments';
