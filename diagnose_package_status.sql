-- diagnose_package_status.sql
-- Objetivo: Verificar si el paquete 'PRUEBA 43' realmente se actualizó a 'confirmed' y 'accepted'

SELECT 
    a.id as appointment_id,
    a.title,
    a.status as appointment_status,
    a.caregiver_id as assigned_caregiver,
    a.service_group_id,
    ja.status as application_status,
    ja.caregiver_id as applicant_caregiver
FROM appointments a
LEFT JOIN job_applications ja ON ja.appointment_id = a.id
WHERE a.title LIKE '%PRUEBA 43%' OR a.title LIKE '%PACK%';
