SELECT id, title, date, status, details, care_agenda 
FROM appointments 
WHERE title ILIKE '%Servicio 10%' 
AND date = '2026-02-14';
