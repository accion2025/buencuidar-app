-- SECURITY HARDENING SCRIPT
-- Purpose: Replace loose "emergency" policies with strict Row Level Security (RLS).
-- Scope: 'caregiver_documents' table and 'documents' storage bucket.
-- Verification: Frontend 'VerificationModal.jsx' complies with these path rules ({uid}/{filename}).

-- 1. SECURE DATABASE TABLE (caregiver_documents)
ALTER TABLE caregiver_documents ENABLE ROW LEVEL SECURITY;

-- Reset policies to avoid conflicts
DROP POLICY IF EXISTS "Caregivers can view their own documents" ON caregiver_documents;
DROP POLICY IF EXISTS "Caregivers can upload their own documents" ON caregiver_documents;
DROP POLICY IF EXISTS "Caregivers can update their pending documents" ON caregiver_documents;
DROP POLICY IF EXISTS "Caregivers can update their own documents" ON caregiver_documents;
DROP POLICY IF EXISTS "Debug Insert" ON caregiver_documents;

-- Policy: VIEW (Owner only)
CREATE POLICY "Caregivers can view their own documents"
ON caregiver_documents FOR SELECT
TO authenticated
USING (auth.uid() = caregiver_id);

-- Policy: INSERT (Owner only)
CREATE POLICY "Caregivers can upload their own documents"
ON caregiver_documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = caregiver_id);

-- Policy: UPDATE (Owner only, typically for status or re-upload)
CREATE POLICY "Caregivers can update their own documents"
ON caregiver_documents FOR UPDATE
TO authenticated
USING (auth.uid() = caregiver_id);

-- Grant permissions
GRANT ALL ON caregiver_documents TO authenticated;
GRANT ALL ON caregiver_documents TO service_role;


-- 2. SECURE STORAGE BUCKET (documents)
-- Requirement: Files must be uploaded to folder: "userId/filename"

DROP POLICY IF EXISTS "Allow authenticated to upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to view all documents" ON storage.objects;

-- Policy: INSERT (Strict path ownership)
-- User ID must match the root folder name.
CREATE POLICY "Allow authenticated to upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy: SELECT (Owner view)
CREATE POLICY "Allow users to view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy: SELECT (Admin view)
-- Allows admins to verify documents for any user.
CREATE POLICY "Allow admins to view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents' 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 3. CLEANUP
-- Recommendation: You can now archive/delete 'emergency_unlock.sql'.
