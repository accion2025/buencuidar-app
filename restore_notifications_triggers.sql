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
CREATE OR REPLACE FUNCTION notify_on_appointment_status_change()
RETURNS TRIGGER AS $$
DECLARE
    recipient_id UUID;
    job_title TEXT;
    notif_msg TEXT;
    notif_type TEXT := 'info';
BEGIN
    -- Solo actuar si el estado cambió
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        -- Si se confirma, notificar al cuidador
        IF NEW.status = 'confirmed' THEN
            recipient_id := NEW.caregiver_id;
            notif_msg := 'Tu turno para "' || NEW.title || '" ha sido confirmado.';
            notif_type := 'success';
        -- Si se cancela, notificar a la otra parte
        ELSIF NEW.status = 'cancelled' THEN
            -- Si el que canceló fue el cliente (auth.uid() = client_id), notificar al cuidador
            -- Pero para simplificar, notificamos al cuidador si existe.
            recipient_id := NEW.caregiver_id;
            notif_msg := 'El turno "' || NEW.title || '" ha sido cancelado.';
            notif_type := 'alert';
        END IF;

        IF recipient_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                recipient_id,
                notif_type,
                '📅 Actualización de Cita',
                notif_msg,
                jsonb_build_object(
                    'appointment_id', NEW.id,
                    'status', NEW.status,
                    'target_path', CASE WHEN NEW.caregiver_id IS NOT NULL THEN '/caregiver/shifts' ELSE '/dashboard/calendar' END
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
