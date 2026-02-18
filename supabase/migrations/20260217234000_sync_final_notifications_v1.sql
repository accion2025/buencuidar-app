-- sync_final_notifications_v1.sql
-- Goal: Synchronize RLS policies, family notifications on response, and wellness deduplication.

-- 1. ROW LEVEL SECURITY (RLS) FOR NOTIFICATIONS
-- Allows users to receive real-time events for their own notifications.
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 2. NOTIFY FAMILY ON APPLICATION RESPONSE (DIRECT REQUESTS)
-- Triggers when a caregiver accepts or rejects an application (status change).
CREATE OR REPLACE FUNCTION notify_family_on_application_response()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    appointment_title TEXT;
    caregiver_name TEXT;
BEGIN
    -- Only trigger on 'approved' (accepted) or 'rejected' (denied)
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected') THEN
        
        -- Get context
        SELECT client_id, title INTO target_client_id, appointment_title 
        FROM appointments 
        WHERE id = NEW.appointment_id;

        SELECT full_name INTO caregiver_name 
        FROM profiles 
        WHERE id = NEW.caregiver_id;

        IF target_client_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                target_client_id,
                CASE WHEN NEW.status = 'approved' THEN 'success' ELSE 'error' END,
                CASE WHEN NEW.status = 'approved' THEN '✅ Solicitud Aceptada' ELSE '🚫 Solicitud Rechazada' END,
                CASE 
                    WHEN NEW.status = 'approved' THEN caregiver_name || ' ha aceptado tu solicitud para "' || appointment_title || '".'
                    ELSE caregiver_name || ' no puede cubrir tu solicitud para "' || appointment_title || '" en este momento.'
                END,
                jsonb_build_object(
                    'appointment_id', NEW.appointment_id,
                    'application_id', NEW.id,
                    'status', NEW.status,
                    'target_path', '/dashboard'
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_family_on_response ON job_applications;
CREATE TRIGGER tr_notify_family_on_response
    AFTER UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_family_on_application_response();

-- 3. CONSOLIDATED WELLNESS DEDUPLICATION (10 SECONDS)
-- Re-applying the logic from fix_notifications_unified matches the 10s window.
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
    SELECT client_id INTO target_client_id FROM appointments WHERE id = NEW.appointment_id;
    SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.caregiver_id;

    IF target_client_id IS NULL THEN RETURN NEW; END IF;

    -- URGENT ALERT
    IF NEW.category IN ('Alerta', 'Emergencia') OR NEW.action IN ('Reporte Incidencia', 'Emergencia') THEN
        notif_type := 'alert';
        notif_title := '⚠️ Alerta de Cuidado';
        notif_message := 'El cuidador ' || COALESCE(caregiver_name, 'Asignado') || ' ha reportado: ' || NEW.action || ' - ' || COALESCE(NEW.detail, 'Sin detalles');
        is_priority_alert := true;

    -- WELLNESS (10s Deduplication)
    ELSIF NEW.category = 'Wellness' THEN
        SELECT count(*) INTO recent_count FROM notifications 
        WHERE user_id = target_client_id AND title = '🧘 Reporte de Bienestar'
        AND (metadata->>'appointment_id')::uuid = NEW.appointment_id
        AND created_at > NOW() - INTERVAL '10 seconds';

        IF recent_count > 0 THEN RETURN NEW; END IF;

        notif_type := 'info';
        notif_title := '🧘 Reporte de Bienestar';
        notif_message := COALESCE(caregiver_name, 'El cuidador') || ' ha registrado el estado de bienestar.';
        
    -- TASK COMPLETION
    ELSE
        notif_type := 'success';
        notif_title := '✅ Tarea Completada';
        notif_message := COALESCE(caregiver_name, 'El cuidador') || ' completó: ' || NEW.action;
    END IF;

    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
        target_client_id,
        notif_type,
        notif_title,
        notif_message,
        jsonb_build_object(
            'appointment_id', NEW.appointment_id,
            'log_id', NEW.id,
            'is_priority', is_priority_alert,
            'target_path', '/dashboard/monitoring'
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
