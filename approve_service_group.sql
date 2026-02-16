-- approve_service_group.sql
-- Objetivo: Aprobación atómica de paquetes y gestión unificada de notificaciones.

-- 1. Función RPC para Aprobación en Bloque
CREATE OR REPLACE FUNCTION approve_service_group(
    p_service_group_id UUID,
    p_caregiver_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_updated_count INT;
BEGIN
    -- A. Actualizar Citas del Grupo (Confirmar y Asignar Cuidador)
    UPDATE appointments
    SET 
        status = 'confirmed',
        caregiver_id = p_caregiver_id,
        updated_at = NOW()
    WHERE service_group_id = p_service_group_id;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    -- B. Aprobar postulaciones del cuidador seleccionado para este grupo
    -- Primero obtenemos los IDs de las citas del grupo
    UPDATE job_applications ja
    SET status = 'accepted'
    FROM appointments a
    WHERE ja.appointment_id = a.id
    AND a.service_group_id = p_service_group_id
    AND ja.caregiver_id = p_caregiver_id;

    -- C. Rechazar postulaciones de OTROS cuidadores para este grupo
    UPDATE job_applications ja
    SET status = 'rejected'
    FROM appointments a
    WHERE ja.appointment_id = a.id
    AND a.service_group_id = p_service_group_id
    AND ja.caregiver_id <> p_caregiver_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Paquete aprobado correctamente',
        'updated_appointments', v_updated_count
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Trigger de Notificación con Deduplicación (Debounce)
CREATE OR REPLACE FUNCTION notify_on_application_status_change()
RETURNS TRIGGER AS $$
DECLARE
    job_title TEXT;
    notif_type TEXT;
    notif_title TEXT;
    notif_msg TEXT;
    v_service_group_id UUID;
    v_group_title TEXT;
BEGIN
    -- Solo notificar si el estado cambió
    IF OLD.status <> NEW.status THEN
        -- Obtener info de la cita
        SELECT title, service_group_id INTO job_title, v_service_group_id 
        FROM appointments WHERE id = NEW.appointment_id;

        -- LÓGICA DE DEDUPLICACIÓN PARA PAQUETES
        IF v_service_group_id IS NOT NULL THEN
             -- Si ya se notificó al cuidador sobre este grupo en los últimos 2 min, salir.
             IF EXISTS (
                SELECT 1 FROM notifications 
                WHERE user_id = NEW.caregiver_id
                AND metadata->>'service_group_id' = v_service_group_id::text
                AND metadata->>'status' = NEW.status -- Mismo estado (ej. accepted)
                AND created_at > NOW() - INTERVAL '2 minutes'
             ) THEN
                RETURN NEW; 
             END IF;

             -- Usar título del grupo si es paquete
             SELECT title INTO v_group_title FROM service_groups WHERE id = v_service_group_id;
             job_title := COALESCE(v_group_title, job_title) || ' (Paquete)';
        END IF;

        IF NEW.status = 'accepted' THEN
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
                'service_group_id', v_service_group_id,
                'status', NEW.status,
                'notif_category', 'application_status'
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
