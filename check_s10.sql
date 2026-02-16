SELECT id, title, date, time, status, service_group_id 
FROM appointments 
WHERE date IN ('2026-02-14', '2026-02-13') 
ORDER BY date DESC, time DESC;
