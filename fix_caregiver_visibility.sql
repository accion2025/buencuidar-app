-- FIX CAREGIVER VISIBILITY
-- The app cannot see caregivers because RLS is blocking public access.

-- 1. Profiles: Allow everyone to see profiles that are 'caregiver'
DROP POLICY IF EXISTS "Public can view caregivers" ON profiles;
CREATE POLICY "Public can view caregivers"
ON profiles FOR SELECT
USING (
    role = 'caregiver' OR auth.uid() = id
);

-- 2. Caregiver Details: Allow everyone to see details (since only caregivers have them)
DROP POLICY IF EXISTS "Public can view caregiver details" ON caregiver_details;
CREATE POLICY "Public can view caregiver details"
ON caregiver_details FOR SELECT
USING ( true );

-- 3. Verify it's enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE caregiver_details ENABLE ROW LEVEL SECURITY;
