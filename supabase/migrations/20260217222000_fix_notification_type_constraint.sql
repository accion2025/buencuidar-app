-- fix_notification_type_constraint.sql
-- Goal: Update notifications_type_check to allow 'alert' and 'system' types used in v1.1.0 logic.

-- 1. Drop the existing constraint if it exists
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 2. Add the updated constraint with all required types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('info', 'success', 'warning', 'error', 'alert', 'system', 'promo'));

-- 3. (Optional) Audit existing records to ensure they match (should be fine as error only happened on insert/update)
-- No changes needed to existing data as the error prevented inconsistent data from being saved.
