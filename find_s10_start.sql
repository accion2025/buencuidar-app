-- Buscar la primera cita por fecha para el Servicio 10
SELECT id, date, time, status, care_agenda, details
FROM appointments 
WHERE title ILIKE '%Servicio 10%' 
ORDER BY date ASC, time ASC 
LIMIT 1;
