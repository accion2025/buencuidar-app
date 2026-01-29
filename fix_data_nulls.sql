-- Set default hourly rate for existing records that have it null
UPDATE caregiver_details 
SET hourly_rate = 150 
WHERE hourly_rate IS NULL;

-- Set default experience for existing records that have it null
UPDATE caregiver_details 
SET experience = 0 
WHERE experience IS NULL;

-- Ensure specialization is also not null for consistency
UPDATE caregiver_details 
SET specialization = 'Cuidador Profesional' 
WHERE specialization IS NULL;
