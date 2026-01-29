-- Add hourly_rate column to caregiver_details
ALTER TABLE caregiver_details 
ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC DEFAULT 150;

-- Ensure other used columns exist (safety check)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caregiver_details' AND column_name = 'specialization') THEN
        ALTER TABLE caregiver_details ADD COLUMN specialization TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caregiver_details' AND column_name = 'experience') THEN
        ALTER TABLE caregiver_details ADD COLUMN experience INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caregiver_details' AND column_name = 'bio') THEN
        ALTER TABLE caregiver_details ADD COLUMN bio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caregiver_details' AND column_name = 'location') THEN
        ALTER TABLE caregiver_details ADD COLUMN location TEXT;
    END IF;
END $$;
