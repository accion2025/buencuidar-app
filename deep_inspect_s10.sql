-- 1. Buscar citas del Servicio 10
SELECT id, title, service_group_id, care_agenda, details, status, date
FROM appointments 
WHERE title ILIKE '%Servicio 10%'
ORDER BY date DESC
LIMIT 5;

-- 2. Buscar logs recientes para esas citas
SELECT cl.action, cl.detail, cl.created_at, a.title
FROM care_logs cl
JOIN appointments a ON cl.appointment_id = a.id
WHERE a.title ILIKE '%Servicio 10%'
ORDER BY cl.created_at DESC
LIMIT 10;
