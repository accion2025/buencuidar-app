-- 20260206211500_unified_care_logs_notifications.sql
-- Goal: Unify all notification logic into a single, robust trigger to prevent crashes and ensure audible alerts for families.

-- 1. Drop all legacy triggers to avoid conflicts
DROP TRIGGER IF EXISTS tr_notify_task_completion ON care_logs;
DROP TRIGGER IF EXISTS tr_notify_on_alert ON care_logs;
DROP TRIGGER IF EXISTS tr_notify_task_completion_v2 ON care_logs;

-- 2. Consolidated Function
CREATE OR REPLACE FUNCTION notify_client_on_care_log_insert()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    caregiver_name TEXT;
    is_priority_alert BOOLEAN := false;
    notif_title TEXT;
    notif_message TEXT;
    notif_type TEXT := 'success';
BEGIN
    -- A. Get Data
    -- We use 'client_id' as verified in the 'appointments' schema
    SELECT client_id INTO target_client_id FROM appointments WHERE id = NEW.appointment_id;
    SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.caregiver_id;

    IF target_client_id IS NULL THEN
        RETURN NEW; -- Cannot notify without a recipient
    END IF;

    -- B. Determine Notification Type and Content
    
    -- Case 1: Urgent Alert or Emergency
    IF NEW.category IN ('Alerta', 'Emergencia') OR NEW.action IN ('Reporte Incidencia', 'Emergencia') THEN
        notif_type := 'alert';
        notif_title := '⚠️ Alerta de Cuidado';
        notif_message := 'El cuidador ' || COALESCE(caregiver_name, 'Asignado') || ' ha reportado: ' || NEW.action || ' - ' || COALESCE(NEW.detail, 'Sin detalles');
        is_priority_alert := true; -- Audible!

    -- Case 2: Wellness Report
    ELSIF NEW.category = 'Wellness' THEN
        notif_type := 'info';
        notif_title := '🧘 Reporte de Bienestar';
        notif_message := COALESCE(caregiver_name, 'El cuidador') || ' ha registrado el estado de bienestar.';
        is_priority_alert := false;

    -- Case 3: Routine Task Completion
    ELSE
        notif_type := 'success';
        notif_title := '✅ Tarea Completada';
        notif_message := COALESCE(caregiver_name, 'El cuidador') || ' completó: ' || NEW.action;
        is_priority_alert := true; -- Audible!
    END IF;

    -- C. Insert Notification
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
        target_client_id,
        notif_type,
        notif_title,
        notif_message,
        jsonb_build_object(
            'log_id', NEW.id, 
            'appointment_id', NEW.appointment_id, 
            'is_priority', is_priority_alert,
            'category', NEW.category
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Enable the single unified trigger
CREATE TRIGGER tr_unified_care_logs_notify
    AFTER INSERT ON care_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_care_log_insert();
