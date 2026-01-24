
-- Find the appointment for the review written for Roberto
DO $$
DECLARE
    v_caregiver_id uuid;
    v_review_app_id uuid;
BEGIN
    SELECT id INTO v_caregiver_id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%' LIMIT 1;
    
    SELECT appointment_id INTO v_review_app_id FROM reviews WHERE caregiver_id = v_caregiver_id LIMIT 1;
    
    RAISE NOTICE 'Caregiver ID: %', v_caregiver_id;
    RAISE NOTICE 'Review Appointment ID: %', v_review_app_id;

    -- Show that appointment
    PERFORM * FROM appointments WHERE id = v_review_app_id;
END $$;

SELECT * FROM appointments 
WHERE id = (SELECT appointment_id FROM reviews WHERE caregiver_id = (SELECT id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%' LIMIT 1) LIMIT 1);
