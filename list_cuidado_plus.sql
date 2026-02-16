SELECT DISTINCT service_group_id, title 
FROM appointments 
WHERE type = 'Cuidado+' 
LIMIT 20;
