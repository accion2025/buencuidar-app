
-- 1. Buscar las citas (appointments) por título exacto o parcial
--    Queremos ver: ID, type, service_group_id, status, client_id
SELECT 
  id, 
  title, 
  type, 
  service_group_id, 
  status, 
  client_id, 
  caregiver_id,
  created_at
FROM appointments
WHERE title ILIKE '%PRUEBA 43%' 
   OR title ILIKE '%PRUEBA 44%' 
   OR title ILIKE '%PRUEBA 45%';

-- 2. Buscar postulaciones (job_applications) vinculadas a esas citas
--    Queremos ver: ID, status, caregiver_id, appointment_id
SELECT 
  ja.id, 
  ja.status as application_status, 
  ja.caregiver_id, 
  ja.appointment_id,
  a.title as appointment_title
FROM job_applications ja
JOIN appointments a ON ja.appointment_id = a.id
WHERE a.title ILIKE '%PRUEBA 43%' 
   OR a.title ILIKE '%PRUEBA 44%' 
   OR a.title ILIKE '%PRUEBA 45%';

-- 3. VERIFICAR SI HAY POSTULACIONES HUERFANAS (Sin appointment_id válido o con ID incorrecto)
--    A veces pasa que se borra la cita y se vuelve a crear, pero la postulación queda apuntando al ID viejo.
--    No podemos filtrar por appointment title aquí facilmente si no existe el appointment.
