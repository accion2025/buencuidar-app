
-- 1. Fix Roberto's Rating
UPDATE caregiver_details
SET rating = (SELECT AVG(rating) FROM reviews WHERE caregiver_id = caregiver_details.id),
    reviews_count = (SELECT COUNT(*) FROM reviews WHERE caregiver_id = caregiver_details.id)
WHERE id = (SELECT id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%');

-- 2. Inspect the Appointment that should be 'completed'
SELECT id, date, time, end_time, status, payment_status 
FROM appointments 
WHERE caregiver_id = (SELECT id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%')
AND status = 'completed';

-- 3. Check for any other appointments
SELECT id, date, status FROM appointments 
WHERE caregiver_id = (SELECT id FROM profiles WHERE full_name ILIKE '%Roberto Garcia%');
