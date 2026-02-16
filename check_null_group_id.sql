-- check_null_group_id.sql
SELECT 
    id, 
    title, 
    status, 
    service_group_id 
FROM appointments 
WHERE title LIKE '%PRUEBA 43%';
