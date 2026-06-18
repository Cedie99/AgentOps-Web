-- Add check_out_time column to visit_logs
-- Allows recording when a sales agent leaves a store after a visit

ALTER TABLE visit_logs ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMP;

-- Allow authenticated users (sales agents) to update their own visit records (e.g. record check-out)
GRANT UPDATE ON visit_logs TO authenticated;
