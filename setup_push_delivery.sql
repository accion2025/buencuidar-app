-- setup_push_delivery.sql
-- Goal: Automate the bridge between DB notifications and OneSignal Push Delivery.

-- 1. Enable pg_net extension to allow HTTP calls from SQL
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Create the function that invokes the Edge Function
CREATE OR REPLACE FUNCTION public.push_notification_to_onesignal()
RETURNS TRIGGER AS $$
DECLARE
    notif_priority TEXT := 'normal';
    -- Reemplaza con tu URL real si es diferente
    edge_url TEXT := 'https://ntxxknufezprbibzpftf.supabase.co/functions/v1/send-push-notification';
BEGIN
    -- Determinar prioridad basada en el tipo o metadata
    IF NEW.type = 'alert' OR (NEW.metadata->>'is_priority')::boolean = true THEN
        notif_priority := 'high';
    END IF;

    -- Llamar a la Edge Function de forma asíncrona
    PERFORM net.http_post(
        url := edge_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json'
            -- Si la Edge Function requiere auth, añadir aquí:
            -- 'Authorization', 'Bearer YOUR_ANON_KEY'
        ),
        body := jsonb_build_object(
            'user_id', NEW.user_id,
            'title', NEW.title,
            'message', NEW.message,
            'priority', notif_priority
        )
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger on the notifications table
DROP TRIGGER IF EXISTS tr_push_notification_on_insert ON public.notifications;
CREATE TRIGGER tr_push_notification_on_insert
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.push_notification_to_onesignal();

-- Helper to verify
COMMENT ON FUNCTION public.push_notification_to_onesignal IS 'Dispara la entrega push a OneSignal cada vez que se crea una notificación en la base de datos.';
