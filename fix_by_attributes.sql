
-- Find appointment by attributes and link to Roberto
DO $$
DECLARE
    v_roberto_id uuid;
    v_target_app_id uuid;
BEGIN
    SELECT id INTO v_roberto_id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%' LIMIT 1;
    
    -- Find the appointment that matches the description
    SELECT id INTO v_target_app_id 
    FROM appointments 
    WHERE date = '2026-01-21' 
      AND time = '15:00:00' 
      AND end_time = '17:00:00';
      
    IF v_target_app_id IS NOT NULL THEN
        RAISE NOTICE 'Found appointment % matching date/time. Updating caregiver to Roberto (%)', v_target_app_id, v_roberto_id;
        
        UPDATE appointments
        SET caregiver_id = v_roberto_id,
            status = 'completed',
            payment_status = 'paid',
            payment_amount = 30
        WHERE id = v_target_app_id;
    ELSE
        RAISE NOTICE 'No appointment found matching 2026-01-21 15:00-17:00. Creating one...';
        
        -- Fallback: Create it if it doesn''t exist
        INSERT INTO appointments (
            caregiver_id, 
            client_id, -- We need a client ID... let's grab one
            date, 
            time, 
            end_time, 
            status, 
            payment_status, 
            payment_amount,
            title
        ) VALUES (
            v_roberto_id,
            (SELECT id FROM profiles WHERE role = 'client' LIMIT 1),
            '2026-01-21',
            '15:00:00',
            '17:00:00',
            'completed',
            'paid',
            30,
            'Acompañamiento'
        ) RETURNING id INTO v_target_app_id;
        
        RAISE NOTICE 'Created new appointment %', v_target_app_id;
    END IF;
END $$;
