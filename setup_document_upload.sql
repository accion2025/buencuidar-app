-- 1. SETUP DATABASE TABLE
-- Create enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('pending', 'in_review', 'verified', 'rejected');
    END IF;
END $$;

-- Update profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create caregiver_documents table
CREATE TABLE IF NOT EXISTS caregiver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    status verification_status DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on the new table
ALTER TABLE caregiver_documents ENABLE ROW LEVEL SECURITY;

-- 2. SETUP DATA POLICIES (Who can see/write rows)
DROP POLICY IF EXISTS "Caregivers can view their own documents" ON caregiver_documents;
CREATE POLICY "Caregivers can view their own documents"
ON caregiver_documents FOR SELECT
TO authenticated
USING (auth.uid() = caregiver_id);

DROP POLICY IF EXISTS "Caregivers can upload their own documents" ON caregiver_documents;
CREATE POLICY "Caregivers can upload their own documents"
ON caregiver_documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = caregiver_id);

-- 3. SETUP STORAGE POLICIES (Who can upload files to 'documents' bucket)
-- NOTE: You must have created the 'documents' bucket manually first!

DROP POLICY IF EXISTS "Allow authenticated to upload documents" ON storage.objects;
CREATE POLICY "Allow authenticated to upload documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Allow users to view own documents" ON storage.objects;
CREATE POLICY "Allow users to view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Allow admins to view all documents" ON storage.objects;
CREATE POLICY "Allow admins to view all documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
