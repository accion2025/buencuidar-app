-- Add real-time tracking columns to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;

-- Comment on columns
COMMENT ON COLUMN public.appointments.started_at IS 'Timestamp when the caregiver actually started the shift';
COMMENT ON COLUMN public.appointments.ended_at IS 'Timestamp when the caregiver actually finished the shift';
