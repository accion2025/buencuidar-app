-- 20260207110000_fix_caregiver_appointment_update.sql
-- Goal: Allow caregivers to update assignments they are responsible for.

-- 1. Allow Caregivers to update their own appointments (status and timestamps)
DROP POLICY IF EXISTS "Caregivers can update their assigned appointments" ON appointments;
CREATE POLICY "Caregivers can update their assigned appointments"
ON appointments FOR UPDATE
TO authenticated
USING (auth.uid() = caregiver_id)
WITH CHECK (auth.uid() = caregiver_id);

-- Note: We keep the Client update policy as well. 
-- Supabase allows multiple policies; if any evaluate to true, the action is permitted.
