-- 20260217113000_unify_caregiver_notifications.sql
-- Goal: Consolidate all notification triggers on job_applications to avoid duplicates and English messages.

-- 1. CLEANUP: Drop all known redundant triggers on job_applications
DROP TRIGGER IF EXISTS tr_notify_on_new_application ON job_applications;
DROP TRIGGER IF EXISTS tr_notify_new_application ON job_applications;
DROP TRIGGER IF EXISTS tr_notify_on_application_status_change ON job_applications;
DROP TRIGGER IF EXISTS tr_notify_application_status ON job_applications;

-- 2. CLEANUP: Drop legacy functions
DROP FUNCTION IF EXISTS notify_family_on_new_application();
DROP FUNCTION IF EXISTS notify_caregiver_on_application_status_change();
DROP FUNCTION IF EXISTS notify_on_new_application();
DROP FUNCTION IF EXISTS notify_on_application_status_change();

-- 3. UNIFIED INSERT FUNCTION: Family Notification
CREATE OR REPLACE FUNCTION notify_family_on_job_application_unified()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    appointment_title TEXT;
    caregiver_name TEXT;
    is_pulso BOOLEAN;
BEGIN
    -- Get Appointment and Client info
    SELECT client_id, title, (type = 'Cuidado+') 
    INTO target_client_id, appointment_title, is_pulso
    FROM appointments 
    WHERE id = NEW.appointment_id;

    -- Get Caregiver info
    SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.caregiver_id;

    IF target_client_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            target_client_id,
            'info',
            '📄 Nueva Postulación',
            COALESCE(caregiver_name, 'Un cuidador') || ' se ha postulado para: "' || COALESCE(appointment_title, 'tu oferta') || '"',
            jsonb_build_object(
                'appointment_id', NEW.appointment_id,
                'application_id', NEW.id,
                'caregiver_id', NEW.caregiver_id,
                'notif_category', 'application',
                'target_path', CASE WHEN is_pulso THEN '/dashboard/cuidado-plus' ELSE '/dashboard' END
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. UNIFIED UPDATE FUNCTION: Caregiver Notification
CREATE OR REPLACE FUNCTION notify_caregiver_on_status_change_unified()
RETURNS TRIGGER AS $$
DECLARE
    appointment_title TEXT;
BEGIN
    -- Only trigger on status change to final states
    IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'rejected') THEN
        SELECT title INTO appointment_title FROM appointments WHERE id = NEW.appointment_id;

        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            NEW.caregiver_id,
            CASE WHEN NEW.status = 'approved' THEN 'success' ELSE 'error' END,
            CASE WHEN NEW.status = 'approved' THEN '✅ Postulación Aprobada' ELSE '🚫 Postulación Denegada' END,
            CASE 
                WHEN NEW.status = 'approved' THEN 'Tu postulación para "' || COALESCE(appointment_title, 'la oferta') || '" ha sido aceptada.'
                ELSE 'Lo sentimos, tu postulación para "' || COALESCE(appointment_title, 'la oferta') || '" no fue seleccionada.'
            END,
            jsonb_build_object(
                'appointment_id', NEW.appointment_id,
                'application_id', NEW.id,
                'status', NEW.status,
                'target_path', CASE WHEN NEW.status = 'approved' THEN '/caregiver/shifts' ELSE '/caregiver/jobs' END
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ENABLE UNIFIED TRIGGERS
CREATE TRIGGER tr_job_application_insert_unified
    AFTER INSERT ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_family_on_job_application_unified();

CREATE TRIGGER tr_job_application_update_unified
    AFTER UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_caregiver_on_status_change_unified();
