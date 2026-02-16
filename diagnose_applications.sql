
-- 1. Ver si hay postulaciones pendientes en general
SELECT count(*) as total_pending_applications FROM job_applications WHERE status = 'pending';

-- 2. Ver si hay postulaciones para citas de tipo 'Cuidado+'
SELECT 
    ja.id, 
    ja.status as app_status,
    ja.caregiver_id,
    a.id as appointment_id,
    a.title,
    a.type,
    a.status as appt_status,
    a.client_id
FROM job_applications ja
JOIN appointments a ON ja.appointment_id = a.id
WHERE a.type = 'Cuidado+' OR a.title ILIKE '%Cuidado%' OR a.title ILIKE '%Pack%';

-- 3. Revisar políticas RLS (simulado consultando pg_policies)
SELECT tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'job_applications';

-- 4. Revisar si hay un problema con la columna 'status' (ha pasado que se usa 'sent' en lugar de 'pending' o viceversa?)
SELECT DISTINCT status FROM job_applications;
