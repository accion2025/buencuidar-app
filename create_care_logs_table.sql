-- Create care_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS care_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    caregiver_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    category TEXT -- e.g., 'Alimentación', 'Medicación', 'Higiene', 'Recreación', 'Otro'
);

-- Policy: Clients can view logs for their appointments
ALTER TABLE care_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can view logs for their own appointments" ON care_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM appointments a
            WHERE a.id = care_logs.appointment_id
            AND a.client_id = auth.uid()
        )
    );

CREATE POLICY "Caregivers can insert logs for their appointments" ON care_logs
    FOR INSERT
    WITH CHECK (
        auth.uid() = caregiver_id
    );

CREATE POLICY "Caregivers can view their own logs" ON care_logs
    FOR SELECT
    USING (
        auth.uid() = caregiver_id
    );

-- Insert some dummy data for testing (only if table is empty)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM care_logs) THEN
        -- We need a valid appointment ID to insert realistic data. 
        -- Since this is a generic script, we will skip auto-insertion to avoid FK errors.
        -- User can manually insert or we rely on the app to create logs.
        NULL;
    END IF;
END $$;
