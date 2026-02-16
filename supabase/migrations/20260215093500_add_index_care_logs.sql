-- 20260215093500_add_index_care_logs.sql
-- Goal: Optimize Care Agenda loading by adding an index on appointment_id

CREATE INDEX IF NOT EXISTS idx_care_logs_appointment_id ON care_logs(appointment_id);
