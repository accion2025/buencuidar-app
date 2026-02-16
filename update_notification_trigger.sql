-- update_notification_trigger.sql
-- Objetivo: Unificar notificaciones de postulaciones a paquetes y mejorar detección por metadatos.

CREATE OR REPLACE FUNCTION notify_on_new_application()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    caregiver_name TEXT;
    job_title TEXT;
    v_service_group_id UUID;
    v_group_title TEXT;
BEGIN
    -- 1. Obtener datos de la cita y el cliente
    SELECT client_id, title, service_group_id INTO target_client_id, job_title, v_service_group_id
    FROM appointments 
    WHERE id = NEW.appointment_id;

    -- 2. Lógica de Deduplicación para Paquetes (Cuidado+)
    IF v_service_group_id IS NOT NULL THEN
        -- Si ya existe una notificación reciente (5 min) para este grupo y cuidador, NO crear otra.
        -- Esto agrupa visualmente las múltiples postulaciones de un paquete en una sola alerta inicial.
        IF EXISTS (
            SELECT 1 FROM notifications 
            WHERE user_id = target_client_id
            AND metadata->>'service_group_id' = v_service_group_id::text
            AND metadata->>'caregiver_id' = NEW.caregiver_id::text
            AND created_at > NOW() - INTERVAL '5 minutes'
        ) THEN
            RETURN NEW; -- Salir silenciosamente
        END IF;

        -- Obtener título del grupo para mensaje más amigable
        SELECT title INTO v_group_title FROM service_groups WHERE id = v_service_group_id;
        job_title := COALESCE(v_group_title, job_title); -- Usar título del paquete si existe
    END IF;

    -- 3. Obtener nombre del cuidador
    SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.caregiver_id;

    -- 4. Insertar Notificación con Metadatos Robustos
    IF target_client_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            target_client_id,
            'info',
            '💼 Nueva Postulación', -- Mantenemos el título para consistencia visual
            COALESCE(caregiver_name, 'Un cuidador') || ' se ha postulado a: ' || COALESCE(job_title, 'tu oferta'),
            jsonb_build_object(
                'notif_category', 'application', -- FLAG PRINCIPAL DE DETECCIÓN
                'appointment_id', NEW.appointment_id,
                'caregiver_id', NEW.caregiver_id,
                'service_group_id', v_service_group_id, -- Útil para redirección futura
                'status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
