-- check_status_constraint.sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'job_applications'::regclass
AND conname = 'job_applications_status_check';
