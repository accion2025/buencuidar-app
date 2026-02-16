-- 1. Consultar exactamente el Servicio 10 con su agenda y logs asociados
WITH s10_appointment AS (
    SELECT id, title, date, time, end_time, status, care_agenda, details
    FROM appointments 
    WHERE title ILIKE '%Servicio 10%'
    ORDER BY date DESC
    LIMIT 1
)
SELECT 
    a.id as app_id,
    a.title,
    a.date,
    a.status,
    a.care_agenda,
    cl.action,
    cl.detail,
    cl.category,
    cl.created_at as log_time
FROM s10_appointment a
LEFT JOIN care_logs cl ON a.id = cl.appointment_id
ORDER BY cl.created_at DESC;
