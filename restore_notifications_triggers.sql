-- restore_notifications_triggers.sql
-- EXECUTAR ESTO EN EL EDITOR SQL DE SUPABASE
-- Este script asegura que CADA evento importante genere una notificación real.

-- 1. NOTIFICAR NUEVOS MENSAJES (Para ambos roles)
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id UUID;
    sender_name TEXT;
BEGIN
    SELECT 
        CASE WHEN participant1_id = NEW.sender_id THEN participant2_id ELSE participant1_id END INTO recipient_id
    FROM conversations WHERE id = NEW.conversation_id;

    SELECT full_name INTO sender_name FROM profiles WHERE id = NEW.sender_id;

    IF recipient_id IS NOT NULL THEN
        -- Agrupar notificaciones: Si ya existe una sin leer, actualizar la fecha y el mensaje
        UPDATE notifications 
        SET 
            created_at = NOW(),
            message = COALESCE(sender_name, 'Alguien') || ' te ha enviado un mensaje.'
        WHERE user_id = recipient_id 
        AND is_read = false 
        AND (metadata->>'conversation_id')::uuid = NEW.conversation_id;

        -- Si no se actualizó ninguna (no existía una previa sin leer), insertar nueva
        IF NOT FOUND THEN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                recipient_id,
                'info',
                '💬 Nuevo Mensaje',
                COALESCE(sender_name, 'Alguien') || ' te ha enviado un mensaje.',
                jsonb_build_object(
                    'conversation_id', NEW.conversation_id,
                    'sender_id', NEW.sender_id,
                    'is_chat', true,
                    'target_path', '/messages'
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_new_message ON messages;
CREATE TRIGGER tr_notify_new_message AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION notify_on_new_message();


-- 2. NOTIFICAR NUEVAS POSTULACIONES (A la Familia)
CREATE OR REPLACE FUNCTION notify_on_new_application()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    caregiver_name TEXT;
    job_title TEXT;
BEGIN
    SELECT client_id, title INTO target_client_id, job_title FROM appointments WHERE id = NEW.appointment_id;
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
                'target_path', '/dashboard'
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_new_application ON job_applications;
CREATE TRIGGER tr_notify_new_application AFTER INSERT ON job_applications FOR EACH ROW EXECUTE FUNCTION notify_on_new_application();


-- 3. NOTIFICAR CAMBIOS EN EL ESTADO DE CITAS (Cancelaciones, Confirmaciones, etc.)
-- 3. NOTIFICAR CAMBIOS EN EL ESTADO DE CITAS (Confirmaciones, Cancelaciones, Denegaciones)
CREATE OR REPLACE FUNCTION notify_on_appointment_status_change()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id UUID;
    caregiver_name TEXT;
    notif_msg TEXT;
    notif_title TEXT;
    notif_type TEXT := 'info';
    target_path TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- CASO 1: Solicitud ACEPTADA por Cuidador (Notificar a la Familia solo si era solicitud directa)
        IF NEW.status = 'confirmed' AND OLD.caregiver_id IS NOT NULL THEN
            recipient_id := NEW.client_id;
            SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.caregiver_id;
            
            notif_title := '✅ Solicitud Aceptada';
            notif_msg := COALESCE(caregiver_name, 'El cuidador') || ' ha aceptado tu solicitud de servicio.';
            notif_type := 'success';
            target_path := '/dashboard/calendar';
 
        -- CASO 2: Solicitud DENEGADA o CANCELADA por Cuidador (Notificar a la Familia solo si era solicitud directa)
        ELSIF NEW.status IN ('cancelled', 'denied', 'rejected') AND OLD.status = 'pending' AND OLD.caregiver_id IS NOT NULL THEN
            recipient_id := NEW.client_id;
            SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.caregiver_id;
            
            notif_title := '❌ Solicitud Denegada';
            notif_msg := COALESCE(caregiver_name, 'El cuidador') || ' no puede aceptar tu solicitud.';
            notif_type := 'alert';
            target_path := '/search';

        -- CASO 3: Turno Confirmado es CANCELADO (Notificar al Cuidador - Logica original simplificada)
        ELSIF NEW.status = 'cancelled' AND OLD.status = 'confirmed' THEN
            recipient_id := NEW.caregiver_id;
            notif_title := '📅 Turno Cancelado';
            notif_msg := 'El turno "' || NEW.title || '" ha sido cancelado.';
            notif_type := 'alert';
            target_path := '/caregiver/shifts';
        END IF;

        IF recipient_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                recipient_id,
                notif_type,
                notif_title,
                notif_msg,
                jsonb_build_object(
                    'appointment_id', NEW.id,
                    'status', NEW.status,
                    'target_path', target_path
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_appointment_status ON appointments;
CREATE TRIGGER tr_notify_appointment_status AFTER UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION notify_on_appointment_status_change();


-- 4. NOTIFICAR MODIFICACIONES (Cambio de hora/fecha por parte del cliente)
CREATE OR REPLACE FUNCTION notify_on_appointment_modification()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el cliente cambia la fecha o la hora y ya hay un cuidador asignado
    IF NEW.caregiver_id IS NOT NULL AND 
       (OLD.date <> NEW.date OR OLD.time <> NEW.time OR OLD.details <> NEW.details) THEN
       
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            NEW.caregiver_id,
            'warning',
            '✏️ Cita Modificada',
            'Se han realizado cambios en los detalles de tu turno: "' || NEW.title || '". Por favor revísalos.',
            jsonb_build_object(
                'appointment_id', NEW.id,
                'is_modification', true,
                'target_path', '/caregiver/shifts'
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_appointment_mod ON appointments;
CREATE TRIGGER tr_notify_appointment_mod AFTER UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION notify_on_appointment_modification();


-- 5. NOTIFICAR ACTIVIDAD EN BITÁCORA (RUTINAS)
CREATE OR REPLACE FUNCTION notify_on_care_log_insert()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    caregiver_name TEXT;
    notif_title TEXT := '✅ Informe de Rutinas';
    notif_message TEXT;
BEGIN
    SELECT client_id INTO target_client_id FROM appointments WHERE id = NEW.appointment_id;
    SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.caregiver_id;

    IF target_client_id IS NOT NULL THEN
        notif_message := COALESCE(caregiver_name, 'El cuidador') || ' completó: ' || NEW.action;
        
        -- Si es una alerta o emergencia, cambiar el título y tipo
        IF NEW.category IN ('Alerta', 'Emergencia') THEN
            notif_title := '⚠️ Alerta de Cuidado';
        END IF;

        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            target_client_id,
            CASE WHEN NEW.category IN ('Alerta', 'Emergencia') THEN 'alert' ELSE 'success' END,
            notif_title,
            notif_message,
            jsonb_build_object(
                'log_id', NEW.id,
                'appointment_id', NEW.appointment_id,
                'is_priority', (NEW.category IN ('Alerta', 'Emergencia')),
                'target_path', '/dashboard/pulso'
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_care_log ON care_logs;
CREATE TRIGGER tr_notify_care_log AFTER INSERT ON care_logs FOR EACH ROW EXECUTE FUNCTION notify_on_care_log_insert();

-- 5. ASEGURAR QUE REALTIME ESTÁ ACTIVO
-- Nota: Esto solo se puede asegurar desde el dashboard de Supabase usualmente, 
-- pero añadimos la tabla al set de publicaciones por si acaso.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE tablename = 'notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'No se pudo añadir a la publicación (esto es normal si no eres superuser)';
END $$;

-- 6. NOTIFICAR NUEVAS SOLICITUDES (Al Cuidador)
CREATE OR REPLACE FUNCTION notify_on_new_request_insert()
RETURNS TRIGGER AS $$
DECLARE
    client_name TEXT;
BEGIN
    -- Solo si el estado inicial es 'pending' (Solicitud)
    IF NEW.status = 'pending' THEN
        SELECT full_name INTO client_name FROM profiles WHERE id = NEW.client_id;
        
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            NEW.caregiver_id,
            'info',
            '🆕 Nueva Solicitud',
            COALESCE(client_name, 'Un usuario') || ' te ha enviado una solicitud de servicio: ' || NEW.title,
            jsonb_build_object(
                'appointment_id', NEW.id,
                'type', 'request_received',
                'target_path', '/caregiver' 
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
 
DROP TRIGGER IF EXISTS tr_notify_new_request ON appointments;
CREATE TRIGGER tr_notify_new_request AFTER INSERT ON appointments FOR EACH ROW EXECUTE FUNCTION notify_on_new_request_insert();
 
 
-- 7. NOTIFICAR RESULTADO DE POSTULACIÓN (Al Cuidador)
CREATE OR REPLACE FUNCTION notify_on_application_status_update()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        SELECT title INTO job_title FROM appointments WHERE id = NEW.appointment_id;
 
        IF NEW.status = 'approved' THEN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                NEW.caregiver_id,
                'success',
                '✅ Postulación Aceptada',
                '¡Felicidades! Tu postulación para "' || COALESCE(job_title, 'un servicio') || '" ha sido aceptada.',
                jsonb_build_object(
                    'appointment_id', NEW.appointment_id,
                    'type', 'application_approved',
                    'target_path', '/caregiver/shifts'
                )
            );
        ELSIF NEW.status = 'rejected' THEN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                NEW.caregiver_id,
                'info',
                '💼 Postulación Finalizada',
                'La oferta para "' || COALESCE(job_title, 'un servicio') || '" ya no está disponible o tu postulación ha sido declinada.',
                jsonb_build_object(
                    'appointment_id', NEW.appointment_id,
                    'type', 'application_rejected',
                    'target_path', '/search'
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
 
DROP TRIGGER IF EXISTS tr_notify_application_status ON job_applications;
CREATE TRIGGER tr_notify_application_status AFTER UPDATE ON job_applications FOR EACH ROW EXECUTE FUNCTION notify_on_application_status_update();
