
-- Listar las últimas 10 citas creadas para ver qué títulos tienen y si coinciden con la UI
SELECT id, title, status, type, created_at, client_id
FROM appointments 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver si hay aplicaciones recientes
SELECT id, status, appointment_id, created_at
FROM job_applications
ORDER BY created_at DESC
LIMIT 10;
