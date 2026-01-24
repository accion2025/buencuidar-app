
-- Add preferences columns to caregiver_details if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caregiver_details' AND column_name = 'urgent_calls') THEN
        ALTER TABLE caregiver_details ADD COLUMN urgent_calls BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'caregiver_details' AND column_name = 'work_radius') THEN
        ALTER TABLE caregiver_details ADD COLUMN work_radius INTEGER DEFAULT 10;
    END IF;
END $$;
