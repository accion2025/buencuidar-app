-- fix_missing_applications_rls.sql
-- Goal: Ensure clients can view job applications for their own appointments.

DO $$
BEGIN
    -- Check if policy exists, if not create it
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'job_applications' 
        AND policyname = 'Clients can view applications for their appointments'
    ) THEN
        CREATE POLICY "Clients can view applications for their appointments" 
        ON job_applications 
        FOR SELECT 
        TO authenticated 
        USING ( 
            EXISTS ( 
                SELECT 1 FROM appointments 
                WHERE appointments.id = job_applications.appointment_id 
                AND appointments.client_id = auth.uid() 
            ) 
        );
    END IF;
END
$$;
