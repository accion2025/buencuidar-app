
-- Insert sample data for Roberto Garcia (Caregiver)
-- Ensure Roberto is Premium first (id based on script output)
UPDATE profiles 
SET plan_type = 'premium' 
WHERE full_name ILIKE '%Roberto%' AND role = 'caregiver';

-- Get Roberto's ID dynamically
DO $$
DECLARE
    v_caregiver_id UUID;
    v_client_id UUID;
BEGIN
    -- Find Roberto
    SELECT id INTO v_caregiver_id FROM profiles WHERE full_name ILIKE '%Roberto%' AND role = 'caregiver' LIMIT 1;
    
    -- Find ANY client to associate with
    SELECT id INTO v_client_id FROM profiles WHERE role = 'family' LIMIT 1;

    IF v_caregiver_id IS NOT NULL AND v_client_id IS NOT NULL THEN
        
        -- Insert 1: Completed Job (Yesterday) - $120
        INSERT INTO appointments (
            caregiver_id, client_id, date, time, end_time, status, payment_status, payment_amount, offered_rate, title, details
        ) VALUES (
            v_caregiver_id, 
            v_client_id, 
            CURRENT_DATE - INTERVAL '1 day', 
            '09:00:00', 
            '17:00:00', 
            'paid', 
            'paid', 
            120.00, 
            15.00,
            'Cuidado Diario',
            'Asistencia completa durante el día.'
        );

        -- Insert 2: Completed Job (Last Week) - $60
        INSERT INTO appointments (
            caregiver_id, client_id, date, time, end_time, status, payment_status, payment_amount, offered_rate, title, details
        ) VALUES (
            v_caregiver_id, 
            v_client_id, 
            CURRENT_DATE - INTERVAL '5 days', 
            '14:00:00', 
            '18:00:00', 
            'completed', 
            'pending', 
            60.00, 
            15.00,
            'Acompañamiento Médico',
            'Visita al doctor.'
        );

        -- Insert 3: Upcoming Job (Tomorrow)
        INSERT INTO appointments (
            caregiver_id, client_id, date, time, end_time, status, payment_status, payment_amount, offered_rate, title, details
        ) VALUES (
            v_caregiver_id, 
            v_client_id, 
            CURRENT_DATE + INTERVAL '1 day', 
            '10:00:00', 
            '14:00:00', 
            'confirmed', 
            'pending', 
            null, 
            15.00,
            'Paseo Matutino',
            'Caminata por el parque.'
        );

    END IF;
END $$;
