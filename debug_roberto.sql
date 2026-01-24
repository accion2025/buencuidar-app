-- Find Roberto
DO $$
DECLARE
    target_id UUID;
    app_count INT;
    rev_count INT;
BEGIN
    SELECT id INTO target_id FROM profiles WHERE full_name = 'Roberto Garcia' LIMIT 1;
    
    RAISE NOTICE 'Roberto ID: %', target_id;

    -- Count Appointments
    SELECT COUNT(*) INTO app_count FROM appointments WHERE caregiver_id = target_id;
    RAISE NOTICE 'Appointments Count: %', app_count;

    -- Count Reviews
    SELECT COUNT(*) INTO rev_count FROM reviews WHERE caregiver_id = target_id;
    RAISE NOTICE 'Reviews Count: %', rev_count;
    
    -- List Appointments Status just to be sure
    -- PERFORM id, status, date FROM appointments WHERE caregiver_id = target_id;
END $$;
