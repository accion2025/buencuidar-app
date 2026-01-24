ALTER TABLE care_logs ADD COLUMN IF NOT EXISTS category TEXT;

DROP POLICY IF EXISTS "Caregivers can insert logs for their appointments" ON care_logs;
DROP POLICY IF EXISTS "Caregivers can view their own logs" ON care_logs;

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

GRANT ALL ON care_logs TO authenticated;
GRANT ALL ON care_logs TO service_role;
