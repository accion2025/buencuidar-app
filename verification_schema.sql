-- Add verification status to profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
        CREATE TYPE verification_status AS ENUM ('pending', 'in_review', 'verified', 'rejected');
    END IF;
END $$;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create caregiver_documents table
CREATE TABLE IF NOT EXISTS caregiver_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caregiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'id_card', 'criminal_record', 'professional_license', etc.
    file_path TEXT NOT NULL,
    status verification_status DEFAULT 'pending',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE caregiver_documents ENABLE ROW LEVEL SECURITY;

-- Policies for caregiver_documents
CREATE POLICY "Caregivers can view their own documents"
ON caregiver_documents FOR SELECT
TO authenticated
USING (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can upload their own documents"
ON caregiver_documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can update their pending documents"
ON caregiver_documents FOR UPDATE
TO authenticated
USING (auth.uid() = caregiver_id AND status = 'pending');

-- Admin policies (assuming role based)
CREATE POLICY "Admins can view all documents"
ON caregiver_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update document status"
ON caregiver_documents FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
