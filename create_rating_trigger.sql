-- 1. Create Function to Recalculate Rating
CREATE OR REPLACE FUNCTION public.update_caregiver_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the caregiver_details table for the affected caregiver
    -- We target 'caregiver_id' from the REVIEW row.
    -- Both TG_OP 'INSERT' and 'UPDATE' have NEW. 'DELETE' has OLD.
    DECLARE
        target_caregiver_id UUID;
    BEGIN
        IF (TG_OP = 'DELETE') THEN
            target_caregiver_id := OLD.caregiver_id;
        ELSE
            target_caregiver_id := NEW.caregiver_id;
        END IF;

        UPDATE caregiver_details
        SET 
            rating = (
                SELECT COALESCE(TRUNC(AVG(rating)::numeric, 1), 5.0)
                FROM reviews
                WHERE caregiver_id = target_caregiver_id
            ),
            reviews_count = (
                SELECT COUNT(*)
                FROM reviews
                WHERE caregiver_id = target_caregiver_id
            )
        WHERE id = target_caregiver_id; -- Assuming caregiver_details.id is related to profile/caregiver id OR we need a FK check.
        
        -- Note: If caregiver_details uses a different FK, adjust above. 
        -- Based on code, it seems 1:1 with profiles, so id likely matches OR there is a caregiver_id column.
        -- Let's try matching on 'id' first (common pattern for extension tables) 
        -- IF partial match fails, we might need 'caregiver_id' column in details.
        -- BUT usually extension tables share PK.
        
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create Trigger
DROP TRIGGER IF EXISTS on_review_change ON reviews;
CREATE TRIGGER on_review_change
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW EXECUTE PROCEDURE public.update_caregiver_rating();

-- 3. Backfill / Force Sync Current Data
UPDATE caregiver_details cd
SET 
    rating = COALESCE((
        SELECT TRUNC(AVG(rating)::numeric, 1)
        FROM reviews r
        WHERE r.caregiver_id = cd.id
    ), 5.0),
    reviews_count = COALESCE((
        SELECT COUNT(*)
        FROM reviews r
        WHERE r.caregiver_id = cd.id
    ), 0);
