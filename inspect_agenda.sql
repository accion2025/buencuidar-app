SELECT id, title, details 
FROM appointments 
WHERE type = 'Cuidado+' 
AND details IS NOT NULL 
LIMIT 1;
