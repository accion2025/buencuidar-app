-- Diagnostic Query: Find caregivers without details or with incomplete data
SELECT 
    p.id, 
    p.email, 
    p.full_name, 
    p.role, 
    p.created_at,
    cd.id as details_id,
    cd.caregiver_code,
    cd.specialization
FROM profiles p
LEFT JOIN caregiver_details cd ON p.id = cd.id
WHERE p.role = 'caregiver'
ORDER BY p.created_at DESC
LIMIT 10;

-- Check if there are any profiles missing entirely for auth users
-- (This requires access to auth schema which might be restricted, but let's check profile volume)
SELECT role, count(*) 
FROM profiles 
GROUP BY role;
