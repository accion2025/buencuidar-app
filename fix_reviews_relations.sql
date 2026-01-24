-- 1. Ensure 'reviewer_id' exists and references 'profiles'
DO $$
BEGIN
    -- Check if column exists, if not add it (idempotent-ish)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='reviewer_id') THEN
        ALTER TABLE reviews ADD COLUMN reviewer_id UUID REFERENCES profiles(id);
    END IF;

    -- Ensure Foreign Key Constraint exists
    -- We try to drop and re-add to be sure, or just add if missing.
    -- Better: Alter table add constraint if not exists (Postgres doesn't support IF NOT EXISTS for constraints easily in one line without check)
    -- So we will just add it, assuming it might fail if exists (user can ignore error), OR separate it.
    
    -- Dropping potential wrong constraint from client_id
    EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Explicitly add the FK constraint if it might be missing or broken
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;

ALTER TABLE reviews 
ADD CONSTRAINT reviews_reviewer_id_fkey 
FOREIGN KEY (reviewer_id) 
REFERENCES profiles(id)
ON DELETE CASCADE;

-- 2. Ensure RLS is definitely correct
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone"
ON reviews FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
CREATE POLICY "Authenticated users can insert reviews"
ON reviews FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
USING (auth.uid() = reviewer_id);

-- 3. Verify Data: Check if there are reviews without reviewer_id (orphans)
-- If client_id was used before, migrate data to reviewer_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reviews' AND column_name='client_id') THEN
        UPDATE reviews 
        SET reviewer_id = client_id 
        WHERE reviewer_id IS NULL AND client_id IS NOT NULL;
    END IF;
END $$;
