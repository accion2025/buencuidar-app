SELECT
    a.id as appointment_id,
    a.title,
    a.type,
    a.status as appt_status,
    a.client_id,
    p.full_name as client_name,
    ja.id as application_id,
    ja.status as app_status,
    ja.caregiver_id,
    c.full_name as caregiver_name
FROM appointments a
JOIN profiles p ON a.client_id = p.id
LEFT JOIN job_applications ja ON a.id = ja.appointment_id
LEFT JOIN profiles c ON ja.caregiver_id = c.id
WHERE a.type ILIKE '%Cuidado%'
ORDER BY a.created_at DESC;
