-- FIX: Remove constraint that prevents overnight shifts (where end_time < start_time)
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_check_time_order;

ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_time_check;

-- Re-apply RLS just in case (Safe to run)
DROP POLICY IF EXISTS "Caregivers can update their appointments" ON appointments;

CREATE POLICY "Caregivers can update their appointments"
ON appointments
FOR UPDATE
USING (auth.uid() = caregiver_id);
