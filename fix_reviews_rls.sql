-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 1. Policy: Everyone can read reviews
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
CREATE POLICY "Reviews are viewable by everyone"
ON reviews FOR SELECT
USING (true);

-- 2. Policy: Authenticated users can insert reviews
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON reviews;
CREATE POLICY "Authenticated users can insert reviews"
ON reviews FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- 3. Policy: Users can update their own reviews
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
USING (auth.uid() = reviewer_id);
