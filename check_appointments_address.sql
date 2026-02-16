-- Check address for Cuidado+ appointments
SELECT id, title, date, address, type, created_at
FROM appointments
WHERE type = 'Cuidado+'
ORDER BY created_at DESC
LIMIT 20;
