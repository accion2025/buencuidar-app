-- Consultar citas y guardar en formato legible
SELECT '--- APPOINTMENT START ---';
SELECT id, title, date, time, status, service_group_id, care_agenda::text as agenda_text
FROM appointments 
WHERE title ILIKE '%Servicio 10%'
AND date IN ('2026-02-13', '2026-02-14')
ORDER BY date DESC, time DESC;
SELECT '--- APPOINTMENT END ---';
