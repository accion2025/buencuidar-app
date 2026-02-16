-- check_care_logs.sql
-- Check indexes for care_logs table
SELECT
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'care_logs';

-- Check row count
SELECT count(*) FROM care_logs;

-- Analyze a sample query performance
EXPLAIN ANALYZE
SELECT action FROM care_logs WHERE appointment_id = (SELECT id FROM appointments LIMIT 1);
