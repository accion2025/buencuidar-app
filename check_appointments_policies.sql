
SELECT 
    policyname, 
    cmd, 
    roles, 
    qual 
FROM pg_policies 
WHERE tablename = 'appointments';
