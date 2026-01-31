
-- Add address column to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS address TEXT;

-- Verify it exists (optional check)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'address') THEN
        RAISE EXCEPTION 'Column address was not created';
    END IF;
END $$;
