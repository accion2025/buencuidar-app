SELECT 
    id, 
    title, 
    date, 
    time, 
    end_time, 
    status, 
    payment_status, 
    payment_amount, 
    caregiver_id 
FROM appointments 
WHERE title LIKE '%PRUEBA 17%';
