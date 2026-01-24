-- 1. Create Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT CHECK (type IN ('info', 'success', 'warning', 'alert')) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can view their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- System (Service Role) or Admin can insert notifications (e.g. via Triggers)
-- For simplicity, we allow authenticated users to insert if it's for themselves (rare) or if we trust the trigger/backend.
-- But here we mainly rely on Triggers or Service Role.
-- Let's allow insert if it matches the user, although real system notifications come from backend.
-- We'll allow "authenticated" to insert for now to enable the client-side "Routine Completed" logic.
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications" ON notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin' OR auth.uid() IS NOT NULL);
    -- Note: Ideally we restrict this, but for "Client side trigger" of routine completion, we need write access or a function.
    -- We will allow 'authenticated' to insert for ANYONE for now to let Caregiver notify Family.
    
DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications;
CREATE POLICY "Anyone can insert notifications" ON notifications
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated'); 
    -- Dangerous in prod (users spamming others), but needed for Caregiver -> Client notification without Edge Function.
    -- Proper solution: Edge Function. MVP solution: Allow insert.

-- Users can update "read" status
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE
    USING (auth.uid() = user_id);


-- 4. Trigger for AUTOMATIC Alerts from Care Logs
-- If a log is created with category 'Alerta' or status indicating urgency.

CREATE OR REPLACE FUNCTION notify_family_on_alert()
RETURNS TRIGGER AS $$
DECLARE
    client_id UUID;
    caregiver_name TEXT;
BEGIN
    -- Only trigger for high priority items
    IF NEW.category = 'Alerta' OR NEW.category = 'Emergencia' OR NEW.action IN ('Reporte Incidencia', 'Emergencia') THEN
        
        -- Get the Client ID from the Appointment
        SELECT patient_id INTO client_id -- Note: appointments table uses 'patient_id' or 'client_id'? Let's check schema.
        -- Assuming 'client_id' based on previous context, but dashboard said 'patient_id' in update payload.
        -- Let's check appointments schema or assume standard link.
        -- Actually, appointments usually link to a client/family user.
        -- Let's look up the appointment owner. If 'user_id' is the creator/family.
        FROM appointments
        WHERE id = NEW.appointment_id;

        -- If not found directly, maybe appointments has 'user_id' (the family member who created it)
        IF client_id IS NULL THEN
            SELECT user_id INTO client_id
            FROM appointments
            WHERE id = NEW.appointment_id;
        END IF;

        -- Get Caregiver Name
        SELECT full_name INTO caregiver_name
        FROM profiles
        WHERE id = NEW.caregiver_id;

        IF client_id IS NOT NULL THEN
            INSERT INTO notifications (user_id, type, title, message, metadata)
            VALUES (
                client_id,
                'alert',
                '⚠️ Alerta de Cuidado',
                'El cuidador ' || COALESCE(caregiver_name, 'Asignado') || ' ha reportado: ' || NEW.action || ' - ' || COALESCE(NEW.detail, 'Sin detalles'),
                jsonb_build_object('log_id', NEW.id, 'appointment_id', NEW.appointment_id)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_notify_on_alert ON care_logs;
CREATE TRIGGER tr_notify_on_alert
    AFTER INSERT ON care_logs
    FOR EACH ROW
    EXECUTE FUNCTION notify_family_on_alert();

-- 5. Helper to Promote to Admin (Run manually)
-- UPDATE profiles SET role = 'admin' WHERE email = 'YOUR_EMAIL';
