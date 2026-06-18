-- Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read users" ON public.users;
DROP POLICY IF EXISTS "Users can read own record" ON public.users;

-- Allow authenticated users to read all user records (needed for mobile app)
CREATE POLICY "Allow authenticated users to read users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Grant SELECT permission to authenticated role
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;
