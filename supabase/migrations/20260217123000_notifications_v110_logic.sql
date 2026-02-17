-- 20260217123000_notifications_v110_logic.sql
-- Goal: Implement read confirmations for families and automated platform messages in chat.

-- 1. FUNCTION: Notify family when a caregiver acknowledges a critical notification


CREATE OR REPLACE FUNCTION notify_family_on_caregiver_read()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    caregiver_name TEXT;
    appointment_title TEXT;
    notif_type TEXT;
BEGIN
    -- Only when marking as read
    IF OLD.is_read = false AND NEW.is_read = true THEN
        -- Check if it's a critical notification for caregivers
        IF NEW.title IN ('❌ Turno Cancelado', '📅 Turno Reprogramado', '📝 Cambio en Agenda', '✏️ Cita Modificada') THEN
            
            -- Get context from metadata
            SELECT client_id, title INTO target_client_id, appointment_title 
            FROM appointments 
            WHERE id = (NEW.metadata->>'appointment_id')::uuid;

            -- Get caregiver name
            SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.user_id;

            IF target_client_id IS NOT NULL THEN
                INSERT INTO notifications (user_id, type, title, message, metadata)
                VALUES (
                    target_client_id,
                    'success',
                    '✔️ Notificación Vista',
                    'El cuidador ' || COALESCE(caregiver_name, 'Asignado') || ' ha visto el aviso de: "' || NEW.title || '" para la cita "' || COALESCE(appointment_title, 'tu solicitud') || '".',
                    jsonb_build_object(
                        'appointment_id', (NEW.metadata->>'appointment_id')::uuid,
                        'original_notification_id', NEW.id,
                        'target_path', '/dashboard'
                    )
                );
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNCTION: Send automated platform message to chat on critical changes
CREATE OR REPLACE FUNCTION send_platform_chat_on_notification()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    target_caregiver_id UUID;
    target_conv_id UUID;
    appointment_title TEXT;
    system_msg TEXT;
BEGIN
    -- Only for critical caregiver notifications (Cancel, Reprogram, Agenda)
    IF NEW.title IN ('❌ Turno Cancelado', '📅 Turno Reprogramado', '📝 Cambio en Agenda', '✏️ Cita Modificada') THEN
        
        -- Get context
        SELECT client_id, caregiver_id, title 
        INTO target_client_id, target_caregiver_id, appointment_title
        FROM appointments 
        WHERE id = (NEW.metadata->>'appointment_id')::uuid;

        IF target_client_id IS NOT NULL AND target_caregiver_id IS NOT NULL THEN
            -- Find or create conversation
            SELECT id INTO target_conv_id FROM conversations 
            WHERE (participant1_id = target_client_id AND participant2_id = target_caregiver_id)
               OR (participant1_id = target_caregiver_id AND participant2_id = target_client_id)
            LIMIT 1;

            -- If no conversation exists, we don't force create it here to avoid empty chats
            -- But if it exists, we insert the system message
            IF target_conv_id IS NOT NULL THEN
                system_msg := '[BuenCuidar Informa]: Se ha enviado una notificación automática al cuidador sobre: "' || NEW.title || '" en la cita "' || COALESCE(appointment_title, 'solicitada') || '".';

                INSERT INTO messages (conversation_id, sender_id, content)
                VALUES (target_conv_id, NULL, system_msg);

                -- Update conversation last message
                UPDATE conversations 
                SET last_message = system_msg, 
                    last_message_at = NOW(),
                    updated_at = NOW()
                WHERE id = target_conv_id;
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGERS
DROP TRIGGER IF EXISTS tr_notify_family_on_read ON notifications;
CREATE TRIGGER tr_notify_family_on_read
    AFTER UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION notify_family_on_caregiver_read();

DROP TRIGGER IF EXISTS tr_platform_chat_on_notification ON notifications;
CREATE TRIGGER tr_platform_chat_on_notification
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION send_platform_chat_on_notification();
