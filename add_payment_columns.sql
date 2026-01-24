-- Add missing payment columns if they don't exist
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Refresh the schema cache in Supabase logic is automatic, but ensuring the columns exist is key.
