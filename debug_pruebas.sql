
-- Buscar las citas por título similar
SELECT id, title, status, client_id, caregiver_id 
FROM appointments 
WHERE title ILIKE '%PRUEBA 43%' 
   OR title ILIKE '%PRUEBA 44%' 
   OR title ILIKE '%prueba 45%';

-- Buscar postulaciones asociadas a esas citas (si se encuentran IDs arriba, pegarlos o usar subquery)
SELECT ja.id, ja.status, ja.appointment_id, a.title 
FROM job_applications ja
JOIN appointments a ON ja.appointment_id = a.id
WHERE a.title ILIKE '%PRUEBA 43%' 
   OR a.title ILIKE '%PRUEBA 44%' 
   OR a.title ILIKE '%prueba 45%';
