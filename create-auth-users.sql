-- Run this SQL in Supabase SQL Editor to create auth users
-- Go to: https://supabase.com/dashboard/project/wwmufvcqkpuplsrxpxvo/sql/new

-- Create Super Admin auth user
-- Email: admin@agentops.com
-- Password: admin123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@agentops.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Super Admin","role":"SUPER_ADMIN"}',
  FALSE,
  '',
  '',
  '',
  ''
);

-- Create Admin auth user
-- Email: manager@agentops.com
-- Password: admin123
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'manager@agentops.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Manager User","role":"ADMIN"}',
  FALSE,
  '',
  '',
  '',
  ''
);

-- Verify the users were created
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email IN ('admin@agentops.com', 'manager@agentops.com');
