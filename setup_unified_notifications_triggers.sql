
-- setup_unified_notifications_triggers.sql
-- Unified Notification System for BuenCuidar

-- 1. NOTIFY ON NEW CHAT MESSAGE
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id UUID;
    sender_name TEXT;
BEGIN
    -- Identificar al destinatario de la conversación
    SELECT 
        CASE 
            WHEN participant1_id = NEW.sender_id THEN participant2_id 
            ELSE participant1_id 
        END INTO recipient_id
    FROM conversations
    WHERE id = NEW.conversation_id;

    -- Obtener nombre del remitente
    SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;

    IF recipient_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            recipient_id,
            'info',
            '💬 Nuevo Mensaje',
            COALESCE(sender_name, 'Alguien') || ' te ha enviado un mensaje.',
            jsonb_build_object(
                'conversation_id', NEW.conversation_id,
                'message_id', NEW.id,
                'sender_id', NEW.sender_id,
                'is_chat', true
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_new_message ON messages;
CREATE TRIGGER tr_notify_new_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_new_message();


-- 2. NOTIFY ON NEW JOB APPLICATION (To Family/Client)
CREATE OR REPLACE FUNCTION notify_on_new_application()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    caregiver_name TEXT;
    job_title TEXT;
BEGIN
    -- Obtener el cliente dueño de la cita
    SELECT client_id, title INTO target_client_id, job_title 
    FROM appointments 
    WHERE id = NEW.appointment_id;

    -- Obtener nombre del cuidador
    SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.caregiver_id;

    IF target_client_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            target_client_id,
            'info',
            '💼 Nueva Postulación',
            COALESCE(caregiver_name, 'Un cuidador') || ' se ha postulado a: ' || COALESCE(job_title, 'tu oferta'),
            jsonb_build_object(
                'appointment_id', NEW.appointment_id,
                'caregiver_id', NEW.caregiver_id,
                'status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_new_application ON job_applications;
CREATE TRIGGER tr_notify_new_application
    AFTER INSERT ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_new_application();


-- 3. NOTIFY ON APPLICATION STATUS CHANGE (To Caregiver)
CREATE OR REPLACE FUNCTION notify_on_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    notif_type TEXT;
    notif_title TEXT;
    notif_msg TEXT;
BEGIN
    -- Solo notificar si el estado cambió
    IF OLD.status <> NEW.status THEN
        SELECT title INTO job_title FROM appointments WHERE id = NEW.appointment_id;

        IF NEW.status = 'approved' THEN
            notif_type := 'success';
            notif_title := '🎉 ¡Postulación Aceptada!';
            notif_msg := 'Tu postulación para "' || COALESCE(job_title, 'la oferta') || '" ha sido ACEPTADA.';
        ELSIF NEW.status = 'rejected' THEN
            notif_type := 'alert';
            notif_title := '🚫 Postulación Denegada';
            notif_msg := 'Lo sentimos, tu postulación para "' || COALESCE(job_title, 'la oferta') || '" fue denegada.';
        ELSE
            notif_type := 'info';
            notif_title := '📋 Cambio en Postulación';
            notif_msg := 'El estado de tu postulación para "' || COALESCE(job_title, 'la oferta') || '" ha cambiado a: ' || NEW.status;
        END IF;

        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            NEW.caregiver_id,
            notif_type,
            notif_title,
            notif_msg,
            jsonb_build_object(
                'appointment_id', NEW.appointment_id,
                'status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_application_status ON job_applications;
CREATE TRIGGER tr_notify_application_status
    AFTER UPDATE ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_application_status_change();
