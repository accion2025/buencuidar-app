-- 20260206211500_fix_notification_trigger_column.sql
-- Goal: Fix missing notifications for families by correcting the column name in the trigger.

-- 1. Correct the function logic
CREATE OR REPLACE FUNCTION notify_client_on_task_completion()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    caregiver_name TEXT;
BEGIN
    -- We trigger for all categories except specific system ones
    -- 'Plan de Cuidado' is the category used by the AddCareLogModal.jsx
    IF NEW.category NOT IN ('Alerta', 'Wellness', 'Emergencia') THEN
        
        -- FIX: The column in 'appointments' is 'client_id', not 'user_id'
        SELECT client_id INTO target_client_id FROM appointments WHERE id = NEW.appointment_id;
        
        -- Get Caregiver Name (Full Name from Profiles)
        SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.caregiver_id;

        IF target_client_id IS NOT NULL THEN
            -- Insert into notifications
            -- The 'notifications' table uses 'user_id' for the recipient
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                target_client_id,
                'success',
                '✅ Tarea Completada',
                COALESCE(caregiver_name, 'El cuidador') || ' completó: ' || NEW.action,
                jsonb_build_object(
                    'log_id', NEW.id, 
                    'appointment_id', NEW.appointment_id, 
                    'is_priority', true
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Re-create the trigger to ensure it's using the updated function
DROP TRIGGER IF EXISTS tr_notify_task_completion ON care_logs;
CREATE TRIGGER tr_notify_task_completion
    AFTER INSERT ON care_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_task_completion();

-- Helper check
-- SELECT * FROM appointments LIMIT 1; -- Verify columns if needed
