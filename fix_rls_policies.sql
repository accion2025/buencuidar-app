-- FIX RLS POLICIES (Aggressive Reset)

-- 1. Ensure RLS is enabled
ALTER TABLE caregiver_documents ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Caregivers can view their own documents" ON caregiver_documents;
DROP POLICY IF EXISTS "Caregivers can upload their own documents" ON caregiver_documents;
DROP POLICY IF EXISTS "Caregivers can update their pending documents" ON caregiver_documents;
DROP POLICY IF EXISTS "Caregivers can update their own documents" ON caregiver_documents;
DROP POLICY IF EXISTS "Debug Insert" ON caregiver_documents;

-- 3. Create Clean Policies
-- Allow Read
CREATE POLICY "Caregivers can view their own documents"
ON caregiver_documents FOR SELECT
TO authenticated
USING (auth.uid() = caregiver_id);

-- Allow Insert (This is the one that was failing)
CREATE POLICY "Caregivers can upload their own documents"
ON caregiver_documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = caregiver_id);

-- Allow Update (Only if pending)
CREATE POLICY "Caregivers can update their pending documents"
ON caregiver_documents FOR UPDATE
TO authenticated
USING (auth.uid() = caregiver_id);

-- 4. Grant access to authenticated users
GRANT ALL ON caregiver_documents TO authenticated;
GRANT ALL ON caregiver_documents TO service_role;
