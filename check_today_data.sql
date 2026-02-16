SELECT id, title, status, date, time, end_time, service_group_id, details 
FROM appointments 
WHERE date = '2026-02-14' AND type = 'Cuidado+'
ORDER BY created_at DESC;
