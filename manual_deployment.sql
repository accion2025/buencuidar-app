-- manual_deployment.sql
-- ESTE SCRIPT INCLUYE TODAS LAS FUNCIONES NECESARIAS PARA:
-- 1. Notificaciones de nuevas postulaciones (optimizadas).
-- 2. Aprobación de paquetes de servicio (Cuidado+).
-- 3. Notificaciones de estado (Aprobado/Rechazado) unificadas.

-- ==============================================================================
-- PARTE 1: NOTIFICACIONES DE NUEVA POSTULACIÓN (Con Deduplicación)
-- ==============================================================================

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
        -- Como service_groups no existe, usamos el título de la cita base
        -- SELECT title INTO v_group_title FROM service_groups WHERE id = v_service_group_id; 
        v_group_title := job_title;
        job_title := COALESCE(v_group_title, job_title);
    END IF;

    -- 3. Obtener nombre del cuidador
    SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.caregiver_id;

    -- 4. Insertar Notificación con Metadatos Robustos
    IF target_client_id IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            target_client_id,
            'info',
            '💼 Nueva Postulación',
            COALESCE(caregiver_name, 'Un cuidador') || ' se ha postulado a: ' || COALESCE(job_title, 'tu oferta'),
            jsonb_build_object(
                'notif_category', 'application',
                'appointment_id', NEW.appointment_id,
                'caregiver_id', NEW.caregiver_id,
                'service_group_id', v_service_group_id,
                'status', NEW.status
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-crear Trigger
DROP TRIGGER IF EXISTS tr_notify_new_application ON job_applications;
CREATE TRIGGER tr_notify_new_application
    AFTER INSERT ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_new_application();


-- ==============================================================================
-- PARTE 2: FUNCIÓN RPC PARA APROBACIÓN DE PAQUETES (Atómica)
-- ==============================================================================

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
    UPDATE job_applications ja
    SET status = 'approved'
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

-- Permisos para que la App pueda llamar a esta función
GRANT EXECUTE ON FUNCTION approve_service_group(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION approve_service_group(UUID, UUID) TO service_role;


-- ==============================================================================
-- PARTE 3: NOTIFICACIONES DE CAMBIO DE ESTADO (Con Deduplicación)
-- ==============================================================================

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
             -- Si ya se notificó al cuidador sobre este grupo en los últimos 2 min (ej. por otra cita del mismo pack), salir.
             IF EXISTS (
                SELECT 1 FROM notifications 
                WHERE user_id = NEW.caregiver_id
                AND metadata->>'service_group_id' = v_service_group_id::text
                AND metadata->>'status' = NEW.status
                AND created_at > NOW() - INTERVAL '2 minutes'
             ) THEN
                RETURN NEW; 
             END IF;

             -- SELECT title INTO v_group_title FROM service_groups WHERE id = v_service_group_id;
             v_group_title := job_title;
             job_title := COALESCE(v_group_title, job_title) || ' (Paquete)';
        END IF;

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
                'service_group_id', v_service_group_id,
                'status', NEW.status,
                'notif_category', 'application_status'
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-crear Trigger para cambios de estado
DROP TRIGGER IF EXISTS tr_notify_application_status ON job_applications;
CREATE TRIGGER tr_notify_application_status
    AFTER UPDATE OF status ON job_applications
    FOR EACH ROW
    EXECUTE FUNCTION notify_on_application_status_change();

-- Refrescar caché (útil si se corre desde SQL Editor)
NOTIFY pgrst, 'reload config';

