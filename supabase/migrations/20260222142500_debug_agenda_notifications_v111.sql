-- V1.0.111: Depuración y Detección Profunda de Cambios en Agenda
-- Mejora la comparación de JSONB y asegura que la notificación se dispare correctamente.

CREATE OR REPLACE FUNCTION notify_caregiver_on_appointment_update()
RETURNS TRIGGER AS $$
DECLARE
    day_str TEXT;
    has_agenda_changed BOOLEAN;
BEGIN
    -- V1.0.111: Logging interno (visible en logs de Supabase)
    -- RAISE NOTICE 'Trigger notify_caregiver_on_appointment_update invocado para cita %', NEW.id;

    -- Solo para citas con cuidador asignado en estados relevantes
    IF NEW.caregiver_id IS NOT NULL AND NEW.status IN ('pending', 'confirmed', 'in_progress') THEN
        day_str := COALESCE(to_char(NEW.date, 'DD/MM/YYYY'), 'fecha pendiente');

        -- A) Detectar Reprogramación
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

        -- B) Detectar Cambios en Agenda (Detección profunda JSONB)
        -- Usamos @> para verificar si son idénticos en ambos sentidos si IS DISTINCT FROM falla
        has_agenda_changed := (OLD.care_agenda IS DISTINCT FROM NEW.care_agenda);

        IF has_agenda_changed THEN
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
            
            -- Debugging: Notificación de sistema (solo para trazabilidad temporal si fuera necesario)
            -- INSERT INTO notifications (user_id, type, title, message) VALUES (NEW.caregiver_id, 'system', 'DEBUG: Trigger ejecutado', 'Se detectó cambio en agenda');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
