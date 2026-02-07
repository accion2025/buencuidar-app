: Automatically notify Ivan (or any client) when a task is completed in the care agenda.

-- 1. Function to handle routine task completion notifications
CREATE OR REPLACE FUNCTION notify_client_on_task_completion()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    caregiver_name TEXT;
    task_name TEXT;
BEGIN
    -- Only trigger for routine tasks (category can be 'Tarea', 'Alimentación', 'Higiene', etc.)
    -- Exclusion of 'Alerta' and 'Wellness' which are handled elsewhere or differently.
    IF NEW.category NOT IN ('Alerta', 'Wellness', 'Emergencia') THEN
        -- setup_task_notifications.sql
-- Goal
        -- Get the Client ID (client_id who owns the appointment)
        SELECT client_id INTO target_client_id
        FROM appointments
        WHERE id = NEW.appointment_id;

        -- Get Caregiver Name
        SELECT full_name INTO caregiver_name
        FROM profiles
        WHERE id = NEW.caregiver_id;

        task_name := NEW.action;

        IF target_client_id IS NOT NULL THEN
            -- Insert into notifications with 'priority' flag in metadata to signal OneSignal later
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                target_client_id,
                'success',
                '✅ Tarea Completada',
                COALESCE(caregiver_name, 'El cuidador') || ' completó: ' || task_name,
                jsonb_build_object(
                    'log_id', NEW.id, 
                    'appointment_id', NEW.appointment_id,
                    'is_priority', true, -- Signal for audible push
                    'action_required', false
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS tr_notify_task_completion ON care_logs;
CREATE TRIGGER tr_notify_task_completion
    AFTER INSERT ON care_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_task_completion();

-- 3. (Optional) Setup for Próxima Tarea (Caregivers)
-- This usually requires a cron job. Ivan can set this up in Supabase Dashboard (Cron).
-- Example Logic for the Cron Function:
/*
CREATE OR REPLACE FUNCTION notify_upcoming_tasks()
RETURNS void AS $$
BEGIN
    -- Find tasks in the next 15 minutes that haven't been notified
    -- This requires a more complex join with the JSONB care_agenda.
    -- To be implemented once Ivan agrees on the 'Upcoming' notification frequency.
END;
$$ LANGUAGE plpgsql;
*/
