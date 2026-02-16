-- deduplicate_notifications.sql
-- Goal: Update 'notify_on_new_application' to prevent spamming the client when a caregiver applies to a PACKAGE (multiple appointments).

CREATE OR REPLACE FUNCTION notify_on_new_application()
RETURNS TRIGGER AS $$
DECLARE
    target_client_id UUID;
    caregiver_name TEXT;
    job_title TEXT;
    job_service_group_id UUID;
    existing_notification_id UUID;
BEGIN
    -- 1. Get Appointment Details (including service_group_id)
    SELECT client_id, title, service_group_id 
    INTO target_client_id, job_title, job_service_group_id 
    FROM appointments 
    WHERE id = NEW.appointment_id;

    -- 2. Get Caregiver Name
    SELECT full_name INTO caregiver_name 
    FROM profiles 
    WHERE id = NEW.caregiver_id;

    IF target_client_id IS NOT NULL THEN
        
        -- 3. DEDUPLICATION LOGIC (Only if part of a package/group)
        IF job_service_group_id IS NOT NULL THEN
            -- Check if we recently notified this client about this caregiver applying to this group (last 5 minutes)
            SELECT id INTO existing_notification_id
            FROM notifications
            WHERE user_id = target_client_id
            AND type = 'info'
            AND (metadata->>'caregiver_id')::uuid = NEW.caregiver_id
            AND (metadata->>'service_group_id')::uuid = job_service_group_id
            AND created_at > (NOW() - INTERVAL '5 minutes');

            -- If a recent notification exists, DO NOT create a new one.
            IF existing_notification_id IS NOT NULL THEN
                RETURN NEW; 
            END IF;
        END IF;

        -- 4. Create Notification (if not duplicate)
        INSERT INTO notifications (user_id, type, title, message, metadata)
        VALUES (
            target_client_id,
            'info',
            '💼 Nueva Postulación',
            -- Use generic text for package applications to encompass the whole group
            CASE WHEN job_service_group_id IS NOT NULL 
                THEN COALESCE(caregiver_name, 'Un cuidador') || ' se ha postulado a tu paquete de servicios.'
                ELSE COALESCE(caregiver_name, 'Un cuidador') || ' se ha postulado a: ' || COALESCE(job_title, 'tu oferta')
            END,
            jsonb_build_object(
                'appointment_id', NEW.appointment_id,
                'caregiver_id', NEW.caregiver_id,
                'service_group_id', job_service_group_id, -- STORE FOR FUTURE CHECKS
                'target_path', '/dashboard'
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
