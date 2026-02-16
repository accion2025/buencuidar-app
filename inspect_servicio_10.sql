SELECT id, title, date, status, details, care_agenda 
FROM appointments 
WHERE title LIKE '%Servicio 10%' 
OR service_group_id = 'servicio-10' -- Just in case
LIMIT 5;
