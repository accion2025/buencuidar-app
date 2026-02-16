-- 20260215100000_optimize_wellness_trigger.sql
-- Goal: Optimize the care_logs trigger to reduce latency and prevent duplicate notifications for wellness reports.

CREATE OR REPLACE FUNCTION notify_client_on_care_log_insert()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    caregiver_name TEXT;
    is_priority_alert BOOLEAN := false;
    notif_title TEXT;
    notif_message TEXT;
    notif_type TEXT := 'info';
    last_wellness_notif_at TIMESTAMPTZ;
BEGIN
    -- 1. Optimized Data Fetch: Single join query to get client and caregiver info
    SELECT 
        a.client_id, 
        p.full_name 
    INTO 
        target_client_id, 
        caregiver_name
    FROM appointments a
    JOIN profiles p ON p.id = NEW.caregiver_id
    WHERE a.id = NEW.appointment_id;

    IF target_client_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- 2. Logic for Wellness Reports (Debouncing)
    IF NEW.category = 'Wellness' THEN
        -- Check if we already sent a wellness notification for this appointment in the last 10 seconds
        SELECT created_at INTO last_wellness_notif_at
        FROM notifications
        WHERE user_id = target_client_id
          AND metadata->>'appointment_id' = NEW.appointment_id::text
          AND metadata->>'category' = 'Wellness'
        ORDER BY created_at DESC
        LIMIT 1;

        -- If a notification was sent recently, skip this one to avoid spam (since we save 3 logs at once)
        IF last_wellness_notif_at IS NOT NULL AND last_wellness_notif_at > (now() - interval '10 seconds') THEN
            RETURN NEW;
        END IF;

        notif_type := 'info';
        notif_title := '🧘 Reporte de Bienestar';
        notif_message := COALESCE(caregiver_name, 'El cuidador') || ' ha registrado el estado de bienestar.';
        is_priority_alert := false;

    -- 3. Case for Urgent Alert or Emergency
    ELSIF NEW.category IN ('Alerta', 'Emergencia') OR NEW.action IN ('Reporte Incidencia', 'Emergencia') THEN
        notif_type := 'alert';
        notif_title := '⚠️ Alerta de Cuidado';
        notif_message := 'El cuidador ' || COALESCE(caregiver_name, 'Asignado') || ' ha reportado: ' || NEW.action || ' - ' || COALESCE(NEW.detail, 'Sin detalles');
        is_priority_alert := true;

    -- 4. Routine Task Completion
    ELSE
        notif_type := 'success';
        is_priority_alert := true;

        IF NEW.action LIKE '% - INICIO' THEN
            notif_title := '🚀 Actividad Iniciada';
            notif_message := COALESCE(caregiver_name, 'El cuidador') || ' inició ' || REPLACE(NEW.action, ' - INICIO', '');
        ELSIF NEW.action LIKE '% - FIN' THEN
            notif_title := '✅ Actividad Completada';
            notif_message := COALESCE(caregiver_name, 'El cuidador') || ' completó ' || REPLACE(NEW.action, ' - FIN', '');
        ELSE
            notif_title := '✅ Tarea Completada';
            notif_message := COALESCE(caregiver_name, 'El cuidador') || ' completó: ' || NEW.action;
        END IF;
    END IF;

    -- 5. Insert Notification
    INSERT INTO notifications (user_id, type, title, message, metadata)
    VALUES (
        target_client_id,
        notif_type,
        notif_title,
        notif_message,
        jsonb_build_object(
            'log_id', NEW.id, 
            'appointment_id', NEW.appointment_id, 
            'is_priority', is_priority_alert,
            'category', NEW.category
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
