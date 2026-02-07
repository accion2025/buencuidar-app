-- 20260206214500_fix_agenda_and_logs_rls.sql
-- Goal: Ensure clients can update agendas and view logs, and caregivers can delete logs.

-- 1. Appointments: Allow Clients (Family) to update their own appointments (for agenda configuration)
DROP POLICY IF EXISTS "Clients can update their own appointments" ON appointments;
CREATE POLICY "Clients can update their own appointments"
ON appointments FOR UPDATE
TO authenticated
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

-- 2. Care Logs: Allow Clients (Family) to VIEW logs (for Monitoring Center)
DROP POLICY IF EXISTS "Clients can view logs of their appointments" ON care_logs;
CREATE POLICY "Clients can view logs of their appointments"
ON care_logs FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM appointments
        WHERE appointments.id = care_logs.appointment_id
        AND appointments.client_id = auth.uid()
    )
);

-- 3. Care Logs: Allow Caregivers to DELETE logs (needed for unchecking items)
DROP POLICY IF EXISTS "Caregivers can delete their own logs" ON care_logs;
CREATE POLICY "Caregivers can delete their own logs"
ON care_logs FOR DELETE
TO authenticated
USING (auth.uid() = caregiver_id);

-- 4. Ensure Caregivers have full UPDATE/SELECT too (already should have, but let's confirm/refine)
-- Selection is usually: USING (auth.uid() = caregiver_id)
-- Insertion is: WITH CHECK (auth.uid() = caregiver_id)

-- 5. Grant permissions (just in case)
GRANT ALL ON care_logs TO authenticated;
GRANT ALL ON appointments TO authenticated;
