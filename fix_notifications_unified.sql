-- fix_notifications_unified.sql
-- Goal: Eliminate all notification duplicates and consolidate 'Wellness' reports into a single alert.

-- 1. CLEANUP: Drop all existing related triggers and functions on care_logs
DROP TRIGGER IF EXISTS tr_notify_care_log ON care_logs;
DROP TRIGGER IF EXISTS tr_notify_task_completion ON care_logs;
DROP TRIGGER IF EXISTS tr_unified_care_logs_notify ON care_logs;
DROP FUNCTION IF EXISTS notify_client_on_care_log_insert();
DROP FUNCTION IF EXISTS notify_on_care_log_insert();
DROP FUNCTION IF EXISTS notify_client_on_task_completion();

-- 2. ENHANCED UNIFIED FUNCTION: With Debouncing/Deduplication for Wellness
CREATE OR REPLACE FUNCTION notify_client_on_care_log_insert()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    caregiver_name TEXT;
    is_priority_alert BOOLEAN := false;
    notif_title TEXT;
    notif_message TEXT;
    notif_type TEXT := 'success';
    recent_count INTEGER;
BEGIN
    -- Get Data
    SELECT client_id INTO target_client_id FROM appointments WHERE id = NEW.appointment_id;
    SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.caregiver_id;

    IF target_client_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Case 1: Urgent Alert or Emergency (Prioritize these)
    IF NEW.category IN ('Alerta', 'Emergencia') OR NEW.action IN ('Reporte Incidencia', 'Emergencia') THEN
        notif_type := 'alert';
        notif_title := '⚠️ Alerta de Cuidado';
        notif_message := 'El cuidador ' || COALESCE(caregiver_name, 'Asignado') || ' ha reportado: ' || NEW.action || ' - ' || COALESCE(NEW.detail, 'Sin detalles');
        is_priority_alert := true;

    -- Case 2: Wellness Report (Consolidated)
    ELSIF NEW.category = 'Wellness' THEN
        -- DEDUPLICATION LOGIC: Check if a Wellness notification for this appointment was sent in the last 10 seconds
        SELECT count(*) INTO recent_count 
        FROM notifications 
        WHERE user_id = target_client_id 
        AND title = '🧘 Reporte de Bienestar'
        AND (metadata->>'appointment_id')::uuid = NEW.appointment_id
        AND created_at > NOW() - INTERVAL '10 seconds';

        -- If one already exists, don't send another one
        IF recent_count > 0 THEN
            RETURN NEW;
        END IF;

        notif_type := 'info';
        notif_title := '🧘 Reporte de Bienestar';
        notif_message := COALESCE(caregiver_name, 'El cuidador') || ' ha registrado el estado de bienestar.';
        is_priority_alert := false;

    -- Case 3: Routine Task Completion
    ELSE
        notif_type := 'success';
        notif_title := '✅ Tarea Completada';
        notif_message := COALESCE(caregiver_name, 'El cuidador') || ' completó: ' || NEW.action;
        -- Use audible for Cuidado+ tasks to keep family engaged, or false if preferred
        is_priority_alert := true; 
    END IF;

    -- Insert Notification
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
            'category', NEW.category,
            'target_path', '/dashboard/cuidado-plus' -- Direct access for Cuidado+
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENABLE SINGLE TRIGGER
CREATE TRIGGER tr_unified_care_logs_notify
    AFTER INSERT ON care_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_care_log_insert();
