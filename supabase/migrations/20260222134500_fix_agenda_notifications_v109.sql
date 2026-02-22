-- V1.0.109: Robustez en Notificaciones de Agenda y Ampliación de Estados
-- Corregir fragilidad ante nulos y asegurar que solicitudes directas (pending) también notifiquen agenda.

CREATE OR REPLACE FUNCTION notify_caregiver_on_appointment_update()
RETURNS TRIGGER AS $$
DECLARE
    day_str TEXT;
BEGIN
    -- V1.0.109: Ampliado a 'pending' para cubrir solicitudes directas y mayor robustez ante nulos
    IF NEW.caregiver_id IS NOT NULL AND NEW.status IN ('pending', 'confirmed', 'in_progress') THEN
        -- Usamos COALESCE para evitar que un nulo anule todo el mensaje
        day_str := COALESCE(to_char(NEW.date, 'DD/MM/YYYY'), 'fecha pendiente');

        -- A) Detectar Reprogramación (Solo si fecha o hora cambian)
        IF (OLD.date IS DISTINCT FROM NEW.date OR OLD.time IS DISTINCT FROM NEW.time) THEN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                NEW.caregiver_id,
                'warning',
                '📅 Turno Reprogramado',
                'El turno para "' || COALESCE(NEW.title, 'Servicio') || '" ha cambiado de horario para el ' || day_str || '.',
                jsonb_build_object(
                    'appointment_id', NEW.id,
                    'notif_category', 'reprogramming',
                    'target_path', '/caregiver/shifts'
                )
            );
        END IF;

        -- B) Detectar Cambios en Agenda
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
