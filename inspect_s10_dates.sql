-- Buscar todas las citas del Servicio 10 para hoy y ayer
SELECT id, title, date, time, status, care_agenda, details
FROM appointments 
WHERE title ILIKE '%Servicio 10%'
AND date IN ('2026-02-13', '2026-02-14')
ORDER BY date DESC, time DESC;

-- Buscar los logs de esas citas
SELECT a.date, cl.action, cl.detail, cl.created_at
FROM care_logs cl
JOIN appointments a ON cl.appointment_id = a.id
WHERE a.title ILIKE '%Servicio 10%'
AND a.date IN ('2026-02-13', '2026-02-14')
ORDER BY cl.created_at DESC;
