-- Fix ghost notifications on shift completion
-- Hardens the trigger to ignore updates that only change the status to 'completed' or 'cancelled'
-- and use robust comparison (IS DISTINCT FROM)

CREATE OR REPLACE FUNCTION notify_on_appointment_modification()
RETURNS TRIGGER AS $$
DECLARE
    existing_notif_id UUID;
    day_str TEXT;
BEGIN
    -- Solo si hay un cuidador asignado y algo relevante cambió (Fecha, Hora, Detalles o Título)
    -- Usamos IS DISTINCT FROM para robustez ante nulos y evitar falsos positivos
    IF NEW.caregiver_id IS NOT NULL AND (
       OLD.date IS DISTINCT FROM NEW.date OR 
       OLD.time IS DISTINCT FROM NEW.time OR 
       OLD.details IS DISTINCT FROM NEW.details OR 
       OLD.title IS DISTINCT FROM NEW.title
    ) THEN

        -- Guardia de estado: Si el estado cambia a finalizado o cancelado, ignorar modificación
        IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('completed', 'cancelled') THEN
            RETURN NEW;
        END IF;

        day_str := to_char(NEW.date, 'DD/MM/YYYY');

        -- Lógica de Consolidación para Paquetes (Cuidado+)
        IF NEW.service_group_id IS NOT NULL THEN
            -- Buscar una notificación de modificación reciente (últimos 10 segundos) para este grupo
            SELECT id INTO existing_notif_id
            FROM notifications
            WHERE user_id = NEW.caregiver_id
            AND (metadata->>'service_group_id')::uuid = NEW.service_group_id
            AND title IN ('✏️ Cita Modificada', '📦 Paquete Modificado')
            AND created_at > NOW() - INTERVAL '10 seconds'
            LIMIT 1;

            IF existing_notif_id IS NOT NULL THEN
                -- Si se encuentra, actualizamos a notificación de "Paquete Modificado"
                UPDATE notifications 
                SET 
                    title = '📦 Paquete Modificado',
                    message = 'Se han realizado cambios en tu paquete de servicios: "' || NEW.title || '". Por favor revísalos.',
                    created_at = NOW(),
                    is_read = false
                WHERE id = existing_notif_id;
                
                RETURN NEW; -- No insertamos una nueva, ya actualizamos la existente
            END IF;
        END IF;

        -- Si es un cambio único o el primero de una ráfaga, insertar notificación nueva
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            NEW.caregiver_id,
            'warning',
            '✏️ Cita Modificada',
            CASE 
                WHEN NEW.service_group_id IS NOT NULL THEN 'Se ha modificado tu turno del día ' || day_str || ' en el paquete: "' || NEW.title || '".'
                ELSE 'Se han realizado cambios en los detalles de tu turno: "' || NEW.title || '".'
            END,
            jsonb_build_object(
                'appointment_id', NEW.id,
                'service_group_id', NEW.service_group_id,
                'is_modification', true,
                'target_path', '/caregiver/shifts'
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
