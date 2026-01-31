-- Allow caregivers to delete their own applications (Cancel)
CREATE POLICY "Caregivers can cancel own applications"
ON "public"."job_applications"
FOR DELETE
USING (auth.uid() = caregiver_id);
