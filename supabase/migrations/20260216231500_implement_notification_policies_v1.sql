-- implement_notification_policies_v1.sql (UNIFIED & CORRECTED)
-- Automates notifications for all v1.0 policies: applications, reviews, cancellations, rescheduling, and agenda changes.

-- 1. Notify Family on New Application
CREATE OR REPLACE FUNCTION notify_family_on_new_application()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    appointment_title TEXT;
    is_pulso BOOLEAN;
BEGIN
    SELECT client_id, title, (type = 'Cuidado+') INTO target_client_id, appointment_title, is_pulso
    FROM appointments 
    WHERE id = NEW.appointment_id;

    IF target_client_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            target_client_id,
            'info',
            '📄 Nueva Postulación',
            'Has recibido una nueva postulación para: "' || appointment_title || '"',
            jsonb_build_object(
                'appointment_id', NEW.appointment_id,
                'application_id', NEW.id,
                'notif_category', 'application',
                'target_path', CASE WHEN is_pulso THEN '/dashboard/monitoring' ELSE '/dashboard' END
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_on_new_application ON job_applications;
CREATE TRIGGER tr_notify_on_new_application
    AFTER INSERT ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_family_on_new_application();

-- 2. Notify Caregiver on Application Status Change
CREATE OR REPLACE FUNCTION notify_caregiver_on_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
    appointment_title TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected') THEN
        SELECT title INTO appointment_title FROM appointments WHERE id = NEW.appointment_id;

        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            NEW.caregiver_id,
            CASE WHEN NEW.status = 'approved' THEN 'success' ELSE 'error' END,
            CASE WHEN NEW.status = 'approved' THEN '✅ Postulación Aprobada' ELSE '🚫 Postulación Denegada' END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'Tu postulación para "' || appointment_title || '" ha sido aceptada.'
                ELSE 'Lo sentimos, tu postulación para "' || appointment_title || '" no fue seleccionada.'
            END,
            jsonb_build_object(
                'appointment_id', NEW.appointment_id,
                'status', NEW.status,
                'target_path', CASE WHEN NEW.status = 'approved' THEN '/caregiver/shifts' ELSE '/caregiver/jobs' END
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_on_application_status_change ON job_applications;
CREATE TRIGGER tr_notify_on_application_status_change
    AFTER UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_caregiver_on_application_status_change();

-- 3. Notify Caregiver on New Review
CREATE OR REPLACE FUNCTION notify_caregiver_on_new_review()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
        NEW.caregiver_id,
        'success',
        '⭐ Nueva Calificación',
        'Un cliente ha calificado tu servicio. ¡Revisa tu desempeño!',
        jsonb_build_object(
            'appointment_id', NEW.appointment_id,
            'rating', NEW.rating,
            'target_path', '/caregiver'
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_on_review ON reviews;
CREATE TRIGGER tr_notify_on_review
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION notify_caregiver_on_new_review();

-- 4. Notify Caregiver on Appointment Updates (Rescheduling & Agenda Changes)
CREATE OR REPLACE FUNCTION notify_caregiver_on_appointment_update()
RETURNS TRIGGER AS $$
DECLARE
    day_str TEXT;
BEGIN
    -- Only for confirmed/in_progress appointments with an assigned caregiver
    IF NEW.caregiver_id IS NOT NULL AND NEW.status IN ('confirmed', 'in_progress') THEN
        day_str := to_char(NEW.date, 'DD/MM/YYYY');

        -- A) Detect Rescheduling (Date or Time change)
        IF (OLD.date IS DISTINCT FROM NEW.date OR OLD.time IS DISTINCT FROM NEW.time) THEN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                NEW.caregiver_id,
                'warning',
                '📅 Turno Reprogramado',
                'El turno para "' || NEW.title || '" ha cambiado de horario. Revisa tu nueva agenda.',
                jsonb_build_object(
                    'appointment_id', NEW.id,
                    'notif_category', 'reprogramming',
                    'target_path', '/caregiver/shifts'
                )
            );
        END IF;

        -- B) Detect Agenda Changes (Tasks/Instructions)
        IF (OLD.care_agenda IS DISTINCT FROM NEW.care_agenda) THEN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                NEW.caregiver_id,
                'info',
                '📝 Cambio en Agenda',
                'La familia ha actualizado las tareas para el turno del ' || day_str || '.',
                jsonb_build_object(
                    'appointment_id', NEW.id,
                    'notif_category', 'agenda_change',
                    'target_path', '/caregiver/shifts'
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_on_appointment_update ON appointments;
CREATE TRIGGER tr_notify_on_appointment_update
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION notify_caregiver_on_appointment_update();

-- 5. Notify Caregiver on Appointment Cancellation
CREATE OR REPLACE FUNCTION notify_caregiver_on_appointment_cancel()
RETURNS TRIGGER AS $$
DECLARE
    day_str TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'cancelled' AND NEW.caregiver_id IS NOT NULL THEN
        day_str := to_char(NEW.date, 'DD/MM/YYYY');
        
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            NEW.caregiver_id,
            'error',
            '❌ Turno Cancelado',
            'El cliente ha cancelado el turno del día ' || day_str || ': "' || NEW.title || '".',
            jsonb_build_object(
                'appointment_id', NEW.id,
                'service_group_id', NEW.service_group_id,
                'target_path', '/caregiver/jobs'
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_on_appointment_cancel ON appointments;
CREATE TRIGGER tr_notify_on_appointment_cancel
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION notify_caregiver_on_appointment_cancel();

-- 6. Notify Client on Activity/Wellness (Care Logs)
-- This consolidates and deduplicates reports
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

    -- Case 1: Urgent Alert
    IF NEW.category IN ('Alerta', 'Emergencia') THEN
        notif_type := 'alert';
        notif_title := '⚠️ Alerta de Cuidado';
        notif_message := 'El cuidador ' || COALESCE(caregiver_name, 'Asignado') || ' ha reportado: ' || NEW.action;
        is_priority_alert := true;

    -- Case 2: Wellness Report (Deduplicated)
    ELSIF NEW.category = 'Wellness' THEN
        SELECT count(*) INTO recent_count FROM notifications 
        WHERE user_id = target_client_id AND title = '🧘 Reporte de Bienestar'
        AND (metadata->>'appointment_id')::uuid = NEW.appointment_id
        AND created_at > NOW() - INTERVAL '30 seconds';

        IF recent_count > 0 THEN RETURN NEW; END IF;

        notif_type := 'info';
        notif_title := '🧘 Reporte de Bienestar';
        notif_message := COALESCE(caregiver_name, 'El cuidador') || ' ha registrado el estado de bienestar.';
        
    -- Case 3: Task Completion
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
            'target_path', '/dashboard/monitoring'
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_unified_care_logs_notify ON care_logs;
CREATE TRIGGER tr_unified_care_logs_notify
    AFTER INSERT ON care_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_care_log_insert();bauu
