-- setup_upcoming_task_alerts.sql
-- Goal: Proactively notify caregivers (BC PRO) when a task in the agenda is 15-30 mins away.

-- 1. Helper Function to notify upcoming tasks
-- This should be called by a CRON job every 15 minutes.
CREATE OR REPLACE FUNCTION check_and_notify_upcoming_tasks()
RETURNS TABLE (notifications_sent INTEGER) AS $$
DECLARE
    task_record RECORD;
    sent_count INTEGER := 0;
BEGIN
    -- Logic:
    -- 1. Look for 'confirmed' or 'in_progress' appointments for today
    -- 2. Unnest the 'care_agenda' JSONB
    -- 3. Match tasks where current_time is near 'time' in agenda
    
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
        -- Extract hour from task_time (format 'HH:MM') and compare with now
        AND (t.activity_item->>'time')::time BETWEEN CURRENT_TIME AND (CURRENT_TIME + interval '5 minutes')
    ) LOOP
        -- Insert a system notification if a similar one wasn't sent in the last 2 hours (to avoid spam)
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

-- To test: SELECT * FROM check_and_notify_upcoming_tasks();
-- To automate: Add a Cron in Supabase looking like: select check_and_notify_upcoming_tasks();
-- EXPLICACIÓN:
-- 1. Este script crea una "alarma" (Trigger) que vigila la tabla 'care_logs'.
-- 2. Cuando un cuidador marca una tarea como terminada, el disparador se activa.
-- 3. Inmediatamente inserta un mensaje en la tabla 'notifications' para el Familiar (Cliente).
-- 4. El mensaje incluye el ID de OneSignal para que suene en el celular.
explica esos