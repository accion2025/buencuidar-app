-- Allow Caregivers to update payment details on their own appointments
CREATE POLICY "Caregivers can update payment info for their appointments"
ON appointments
FOR UPDATE
USING (auth.uid() = caregiver_id)
WITH CHECK (auth.uid() = caregiver_id);

-- OR if a policy already exists but is too restrictive, we might need to alter it.
-- Let's check if there is a generic update policy.
-- Usually "Users can update their own appointments" might cover it, but sometimes it is restricted to specific columns.

-- Ensure the columns are updatable:
-- payment_amount, payment_status, time, end_time

-- Let's try to DROP and RECREATE the policy to be sure.
DROP POLICY IF EXISTS "Caregivers can update their appointments" ON appointments;
CREATE POLICY "Caregivers can update their appointments"
ON appointments
FOR UPDATE
USING (auth.uid() = caregiver_id);
