-- V1.0.112: Unificación de Notificaciones de Modificación de Citas
-- Objetivo: Eliminar la duplicidad de disparadores y asegurar una única fuente de verdad para alertas de agenda.

BEGIN;

-- 1. LIMPIEZA DE DISPARADORES REDUNDANTES
-- Eliminamos disparadores que intentaban hacer lo mismo en diferentes versiones/archivos
DROP TRIGGER IF EXISTS tr_notify_on_appointment_update ON public.appointments;
DROP TRIGGER IF EXISTS tr_notify_appointment_mod ON public.appointments;
DROP TRIGGER IF EXISTS tr_notify_on_appointment_agenda ON public.appointments;

-- 2. FUNCIÓN DE NOTIFICACIÓN UNIFICADA
CREATE OR REPLACE FUNCTION public.notify_unified_appointment_modification()
RETURNS TRIGGER AS $$
DECLARE
    existing_notif_id UUID;
    day_str TEXT;
    has_relevant_change BOOLEAN;
    has_agenda_changed BOOLEAN;
BEGIN
    -- Solo actuar para citas con cuidador asignado
    IF NEW.caregiver_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Solo para estados activos (no completado ni cancelado)
    IF NEW.status IN ('completed', 'cancelled') THEN
        RETURN NEW;
    END IF;

    -- A) Detectar cambios relevantes en metadatos básicos
    has_relevant_change := (
        OLD.date IS DISTINCT FROM NEW.date OR 
        OLD.time IS DISTINCT FROM NEW.time OR 
        OLD.details IS DISTINCT FROM NEW.details OR 
        OLD.title IS DISTINCT FROM NEW.title
    );

    -- B) Detectar cambios en la agenda de cuidados (comparación JSONB)
    has_agenda_changed := (OLD.care_agenda IS DISTINCT FROM NEW.care_agenda);

    -- Si no hay cambios relevantes, salir
    IF NOT (has_relevant_change OR has_agenda_changed) THEN
        RETURN NEW;
    END IF;

    -- C) ACTIVAR BANDERA DE MODIFICACIÓN EN LA CITA
    -- Esto asegura que el cuidador vea el badge rosa/alerta en su vista de turnos
    NEW.modification_seen_by_caregiver := false;

    day_str := COALESCE(to_char(NEW.date, 'DD/MM/YYYY'), 'pendiente');

    -- D) LÓGICA DE CONSOLIDACIÓN PARA CUIDADO+ (Paquetes)
    IF NEW.service_group_id IS NOT NULL THEN
        -- Buscar una notificación de modificación muy reciente (últimos 10 segundos) para este paquete
        SELECT id INTO existing_notif_id
        FROM public.notifications
        WHERE user_id = NEW.caregiver_id
        AND (metadata->>'service_group_id')::uuid = NEW.service_group_id
        AND title IN ('✏️ Cita Modificada', '📦 Paquete Modificado', '📝 Cambio en Agenda')
        AND created_at > NOW() - INTERVAL '10 seconds'
        LIMIT 1;

        IF existing_notif_id IS NOT NULL THEN
            -- Actualizar la existente para marcar como no leída y refrescar tiempo
            UPDATE public.notifications 
            SET 
                title = '📦 Paquete Modificado',
                message = 'Se han realizado cambios en tu paquete de servicios: "' || COALESCE(NEW.title, 'Servicio') || '". Por favor revísalos.',
                created_at = NOW(),
                is_read = false
            WHERE id = existing_notif_id;
            
            RETURN NEW; 
        END IF;
    END IF;

    -- E) INSERTAR NOTIFICACIÓN ÚNICA
    INSERT INTO public.notifications (user_id, type, title, message, metadata)
    VALUES (
        NEW.caregiver_id,
        'warning',
        CASE WHEN has_agenda_changed AND NOT has_relevant_change THEN '📝 Cambio en Agenda' ELSE '✏️ Cita Modificada' END,
        CASE 
            WHEN NEW.service_group_id IS NOT NULL THEN 
                'Se ha modificado tu turno del día ' || day_str || ' en el paquete: "' || COALESCE(NEW.title, 'Servicio') || '".'
            ELSE 
                'Se han realizado cambios en los detalles de tu turno: "' || COALESCE(NEW.title, 'Servicio') || '".'
        END,
        jsonb_build_object(
            'appointment_id', NEW.id,
            'service_group_id', NEW.service_group_id,
            'is_modification', true,
            'notif_category', CASE WHEN has_agenda_changed THEN 'agenda_change' ELSE 'reprogramming' END,
            'target_path', '/caregiver/shifts'
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CREAR DISPARADOR ÚNICO
CREATE TRIGGER tr_unified_appointment_modification
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_unified_appointment_modification();

COMMIT;
