SELECT * FROM appointments 
WHERE title ILIKE '%Servicio 10%' 
ORDER BY date DESC, time DESC 
LIMIT 10;
