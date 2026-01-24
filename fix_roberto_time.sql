
-- Update the specific appointment to match the user's screenshot
UPDATE appointments
SET date = '2026-01-21',
    time = '15:00:00',
    end_time = '17:00:00',
    status = 'completed',
    payment_status = 'paid',
    payment_amount = 30 -- Assuming $15/hr for 2 hours
WHERE id = 'b85b4890-2af6-4ef8-90f8-b1186a2aba86';
