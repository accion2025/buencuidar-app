ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS care_agenda JSONB DEFAULT '[]'::jsonb;
