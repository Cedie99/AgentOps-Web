-- Migration Script: Merge Agents table into Users table
-- This script safely migrates data from the agents table into the users table
-- Run this in your Supabase SQL Editor

BEGIN;

-- Step 1: Backup existing data
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS agents_backup AS SELECT * FROM agents;

-- Step 2: Add new columns to users table for field agent data
ALTER TABLE users ADD COLUMN IF NOT EXISTS agent_status TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS vehicle_id INTEGER REFERENCES vehicles(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_lat DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_lng DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_tasks_count INTEGER DEFAULT 0;

-- Step 3: Update UserRole enum to include all roles
-- Note: PostgreSQL doesn't support direct enum modification, so we need to:
-- Option A: Add new values to existing enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SURVEYOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SALES';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'DELIVERY';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'COLLECTOR';

-- Step 4: Create UserStatus enum
DO $$ BEGIN
  CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Step 5: Modify users.status to use UserStatus enum
-- First, update string values to match enum
UPDATE users SET status = 'ACTIVE' WHERE status = 'Active';
UPDATE users SET status = 'INACTIVE' WHERE status = 'Inactive';
UPDATE users SET status = 'SUSPENDED' WHERE status = 'Suspended';

-- Step 6: Migrate agents data into users table
INSERT INTO users (
  email, name, role, status,
  agent_status, vehicle_id, current_lat, current_lng,
  last_seen, active_tasks_count, created_at, updated_at
)
SELECT
  email,
  name,
  role::text::"UserRole", -- Cast MobileRole to UserRole
  'ACTIVE'::"UserStatus",
  status::text, -- agent_status (AVAILABLE, ON_FIELD, OFF_DUTY)
  vehicle_id,
  current_lat,
  current_lng,
  last_seen,
  active_tasks_count,
  created_at,
  updated_at
FROM agents
WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING; -- Skip if email already exists

-- Step 7: Update foreign key references
-- Create a mapping table for old agent_id to new user_id
CREATE TEMP TABLE agent_user_mapping AS
SELECT
  a.id as old_agent_id,
  u.id as new_user_id
FROM agents a
JOIN users u ON u.email = a.email;

-- Update attendance table
ALTER TABLE attendance RENAME COLUMN agent_id TO user_id;

-- Update timeline_events table
ALTER TABLE timeline_events RENAME COLUMN agent_id TO user_id;
ALTER TABLE timeline_events RENAME COLUMN agent_name TO user_name;

-- Update visit_logs table
ALTER TABLE visit_logs RENAME COLUMN agent_id TO user_id;
ALTER TABLE visit_logs RENAME COLUMN agent_name TO user_name;

-- Update stores table
ALTER TABLE stores RENAME COLUMN current_agent_id TO current_user_id;
ALTER TABLE stores RENAME COLUMN current_agent_name TO current_user_name;

-- Step 8: Update ID values in foreign key columns
-- attendance
UPDATE attendance a
SET user_id = m.new_user_id
FROM agent_user_mapping m
WHERE a.user_id = m.old_agent_id;

-- timeline_events
UPDATE timeline_events t
SET user_id = m.new_user_id
FROM agent_user_mapping m
WHERE t.user_id = m.old_agent_id;

-- visit_logs
UPDATE visit_logs v
SET user_id = m.new_user_id
FROM agent_user_mapping m
WHERE v.user_id = m.old_agent_id;

-- stores
UPDATE stores s
SET current_user_id = m.new_user_id
FROM agent_user_mapping m
WHERE s.current_user_id = m.old_agent_id;

-- Step 9: Drop the agents table
DROP TABLE IF EXISTS agents CASCADE;

-- Step 10: Drop MobileRole enum (no longer needed)
DROP TYPE IF EXISTS "MobileRole";
DROP TYPE IF EXISTS "AgentStatus";

-- Step 11: Add indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_vehicle_id ON users(vehicle_id);

COMMIT;

-- Verification queries (run these after the migration)
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT role, COUNT(*) as count FROM users GROUP BY role;
-- SELECT * FROM users WHERE role IN ('SURVEYOR', 'SALES', 'DELIVERY', 'COLLECTOR');
