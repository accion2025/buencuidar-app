
-- Force fix the appointment associated with the review to belong to Roberto and be completed
DO $$
DECLARE
    v_caregiver_id uuid;
    v_review_app_id uuid;
BEGIN
    SELECT id INTO v_caregiver_id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%' LIMIT 1;
    v_review_app_id := 'b85b4890-2af6-4ef8-90f8-b1186a2aba86'; -- Recovered from previous log

    UPDATE appointments
    SET caregiver_id = v_caregiver_id,
        status = 'completed',
        date = CURRENT_DATE - 1, -- Set to yesterday
        time = '10:00:00',
        end_time = '12:00:00',
        payment_status = 'paid',
        payment_amount = 30 -- Example amount
    WHERE id = v_review_app_id;
    
    RAISE NOTICE 'Updated appointment % to belong to caregiver %', v_review_app_id, v_caregiver_id;
END $$;
