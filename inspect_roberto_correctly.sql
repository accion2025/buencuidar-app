
-- Get Roberto's ID and his appointments
DO $$
DECLARE
    v_roberto_id uuid;
BEGIN
    SELECT id INTO v_roberto_id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%' LIMIT 1;
    RAISE NOTICE 'Roberto ID: %', v_roberto_id;

    RAISE NOTICE 'Appointments for Roberto:';
    PERFORM id, date, time, end_time, status, payment_status 
    FROM appointments 
    WHERE caregiver_id = v_roberto_id;
END $$;

SELECT id, full_name FROM profiles WHERE full_name ILIKE '%Roberto Garcia%';

SELECT id, caregiver_id, date, time, end_time, status, payment_status, payment_amount 
FROM appointments 
WHERE caregiver_id = (SELECT id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%' LIMIT 1)
ORDER BY date DESC;
