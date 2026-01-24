
DO $$
BEGIN
    -- Drop the existing constraint if it exists (guessing the name or finding it)
    -- Usually Supabase names them appointments_status_check or similar.
    -- We'll try to add it blindly or use a safe approach.
    
    -- First, let's just try to remove the constraint and add a new one with all values.
    ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
    
    ALTER TABLE appointments 
    ADD CONSTRAINT appointments_status_check 
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'cancelled', 'completed', 'paid', 'in_progress'));
    
END $$;
