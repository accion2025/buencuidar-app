-- Add payment tracking columns to appointments table
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled'));

-- Create an index for faster stats calculation
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(caregiver_id, payment_status);
