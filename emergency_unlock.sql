-- EMERGENCY UNLOCK
-- We are simplifying the rules to the maximum to IDENTIFY if the problem is the strict logic or the user session.

-- 1. UNLOCK TABLE (Allow any logged-in user to insert)
DROP POLICY IF EXISTS "Caregivers can upload their own documents" ON caregiver_documents;
CREATE POLICY "Caregivers can upload their own documents"
ON caregiver_documents FOR INSERT
TO authenticated
WITH CHECK (true); 

-- 2. UNLOCK STORAGE (Allow any logged-in user to upload to 'documents' bucket)
DROP POLICY IF EXISTS "Allow authenticated to upload documents" ON storage.objects;
CREATE POLICY "Allow authenticated to upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- 3. UNLOCK STORAGE SELECT (Allow view)
DROP POLICY IF EXISTS "Allow users to view own documents" ON storage.objects;
CREATE POLICY "Allow users to view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents');
