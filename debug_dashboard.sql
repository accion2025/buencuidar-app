
DO $$
DECLARE
    v_caregiver_id uuid;
BEGIN
    SELECT id INTO v_caregiver_id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%' LIMIT 1;
    RAISE NOTICE 'Caregiver ID: %', v_caregiver_id;

    -- Show Caregiver Details
    RAISE NOTICE 'Caregiver Details:';
    PERFORM * FROM caregiver_details WHERE id = v_caregiver_id;
    
    -- Show Appointments
    RAISE NOTICE 'Recent Appointments:';
    PERFORM id, date, time, end_time, status, payment_status, payment_amount, offered_rate FROM appointments WHERE caregiver_id = v_caregiver_id ORDER BY date DESC LIMIT 5;

    -- Show Reviews
    RAISE NOTICE 'Reviews:';
    PERFORM * FROM reviews WHERE caregiver_id = v_caregiver_id;
END $$;

-- Actually, just select them for output visibility
SELECT p.id, p.full_name, cd.rating, cd.reviews_count 
FROM profiles p 
JOIN caregiver_details cd ON p.id = cd.id 
WHERE p.full_name ILIKE '%Roberto Garcia%';

SELECT id, date, time, end_time, status, payment_status, payment_amount, offered_rate 
FROM appointments 
WHERE caregiver_id = (SELECT id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%' LIMIT 1)
ORDER BY date DESC LIMIT 5;

SELECT * FROM reviews 
WHERE caregiver_id = (SELECT id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%' LIMIT 1);
