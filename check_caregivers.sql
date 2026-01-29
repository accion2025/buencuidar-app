SELECT 
    p.full_name, 
    cd.hourly_rate, 
    cd.experience, 
    cd.specialization,
    p.role
FROM profiles p
JOIN caregiver_details cd ON p.id = cd.caregiver_id;
