
DO $$
DECLARE
    v_roberto_id uuid;
    v_target_app_id uuid := 'b85b4890-2af6-4ef8-90f8-b1186a2aba86';
    v_app_caregiver_id uuid;
BEGIN
    SELECT id INTO v_roberto_id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%' LIMIT 1;
    RAISE NOTICE 'Roberto ID: %', v_roberto_id;
    
    SELECT caregiver_id INTO v_app_caregiver_id FROM appointments WHERE id = v_target_app_id;
    RAISE NOTICE 'Target App Caregiver ID: %', v_app_caregiver_id;

    IF v_roberto_id = v_app_caregiver_id THEN
        RAISE NOTICE 'MATCH: The appointment belongs to Roberto.';
    ELSE
        RAISE NOTICE 'MISMATCH: The appointment belongs to % (Expected: %)', v_app_caregiver_id, v_roberto_id;
    END IF;
END $$;

-- details
SELECT * FROM appointments WHERE id = 'b85b4890-2af6-4ef8-90f8-b1186a2aba86';
