
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' AND column_name = 'payment_status';

-- Also select one row to be sure
SELECT id, payment_status FROM appointments LIMIT 1;

-- Force schema cache reload (PostgREST specific)
NOTIFY pgrst, 'reload config';
