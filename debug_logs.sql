-- debug_logs.sql
SELECT 
    id, 
    appointment_id, 
    action, 
    category, 
    created_at 
FROM 
    care_logs 
ORDER BY 
    created_at DESC 
LIMIT 20;
