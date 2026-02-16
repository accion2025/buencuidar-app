-- Create emergency_alerts table
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    caregiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;

-- Policies
-- Drop existing policies if they exist to avoid errors
DROP POLICY IF EXISTS "Caregivers can insert alerts" ON public.emergency_alerts;
DROP POLICY IF EXISTS "Relevant clients can view alerts" ON public.emergency_alerts;
DROP POLICY IF EXISTS "Relenvant caregivers can view their alerts" ON public.emergency_alerts;
DROP POLICY IF EXISTS "Clients/Caregivers can resolve alerts" ON public.emergency_alerts;

CREATE POLICY "Caregivers can insert alerts" ON public.emergency_alerts
    FOR INSERT WITH CHECK (auth.uid() = caregiver_id);

CREATE POLICY "Relevant clients can view alerts" ON public.emergency_alerts
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Relenvant caregivers can view their alerts" ON public.emergency_alerts
    FOR SELECT USING (auth.uid() = caregiver_id);

CREATE POLICY "Clients/Caregivers can resolve alerts" ON public.emergency_alerts
    FOR UPDATE USING (auth.uid() IN (client_id, caregiver_id));

-- Realtime
-- This might fail if the table is already in the publication, so we use a safe approach
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'emergency_alerts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.emergency_alerts;
    END IF;
END $$;
