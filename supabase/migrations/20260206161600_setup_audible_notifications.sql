-- 20260206161600_setup_audible_notifications.sql
-- Consolidated triggers for Task Completion (Client) and Upcoming Tasks (Caregiver)

-- 1. NOTIFY CLIENT ON TASK COMPLETION
CREATE OR REPLACE FUNCTION notify_client_on_task_completion()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    caregiver_name TEXT;
BEGIN
    IF NEW.category NOT IN ('Alerta', 'Wellness', 'Emergencia') THEN
        SELECT user_id INTO target_client_id FROM appointments WHERE id = NEW.appointment_id;
        SELECT full_name INTO caregiver_name FROM profiles WHERE id = NEW.caregiver_id;

        IF target_client_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                target_client_id,
                'success',
                '✅ Tarea Completada',
                COALESCE(caregiver_name, 'El cuidador') || ' completó: ' || NEW.action,
                jsonb_build_object('log_id', NEW.id, 'appointment_id', NEW.appointment_id, 'is_priority', true)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_task_completion ON care_logs;
CREATE TRIGGER tr_notify_task_completion
    AFTER INSERT ON care_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_client_on_task_completion();

-- 2. CHECK AND NOTIFY UPCOMING TASKS (Every 5 min)
CREATE OR REPLACE FUNCTION check_and_notify_upcoming_tasks()
RETURNS TABLE (notifications_sent INTEGER) AS $$
DECLARE
    task_record RECORD;
    sent_count INTEGER := 0;
BEGIN
    FOR task_record IN (
        SELECT 
            a.id as app_id,
            a.caregiver_id,
            t.activity_item->>'activity' as task_name,
            t.activity_item->>'time' as task_time
        FROM appointments a,
        LATERAL jsonb_array_elements(a.care_agenda) AS t(activity_item)
        WHERE a.date = CURRENT_DATE
        AND a.status IN ('confirmed', 'in_progress')
        AND a.caregiver_id IS NOT NULL
        AND (t.activity_item->>'time')::time BETWEEN CURRENT_TIME AND (CURRENT_TIME + interval '5 minutes')
    ) LOOP
        IF NOT EXISTS (
            SELECT 1 FROM notifications 
            WHERE user_id = task_record.caregiver_id 
            AND title = '⏰ Tarea Próxima'
            AND message LIKE '%' || task_record.task_name || '%'
            AND created_at > (now() - interval '2 hours')
        ) THEN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                task_record.caregiver_id,
                'alert',
                '⏰ Tarea Próxima',
                'Recuerda: En unos minutos inicia la tarea: ' || task_record.task_name || ' (' || task_record.task_time || ')',
                jsonb_build_object('appointment_id', task_record.app_id, 'is_priority', true)
            );
            sent_count := sent_count + 1;
        END IF;
    END LOOP;
    RETURN QUERY SELECT sent_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
