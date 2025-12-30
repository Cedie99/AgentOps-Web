import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function enableSurveysRLS() {
  const client = await pool.connect()

  try {
    console.log('Enabling RLS on surveys table...\n')

    // Enable RLS on surveys table
    await client.query('ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;')
    console.log('✓ RLS enabled on surveys table')

    // Drop existing policies if any
    await client.query('DROP POLICY IF EXISTS "Allow surveyor to insert" ON public.surveys;')
    await client.query('DROP POLICY IF EXISTS "Allow admin and super_admin to view" ON public.surveys;')
    await client.query('DROP POLICY IF EXISTS "Allow authenticated surveyors to insert" ON public.surveys;')
    console.log('✓ Dropped existing policies')

    // Policy 1: Allow authenticated users (surveyors) to INSERT their own surveys
    await client.query(`
      CREATE POLICY "Allow authenticated surveyors to insert"
        ON public.surveys
        FOR INSERT
        TO authenticated
        WITH CHECK (true);
    `)
    console.log('✓ Created policy for surveyors to insert')

    // Policy 2: Allow ADMIN and SUPER_ADMIN to SELECT all surveys
    // This uses a custom function to check user role from users table
    await client.query(`
      CREATE OR REPLACE FUNCTION public.user_has_admin_role()
      RETURNS BOOLEAN AS $$
      DECLARE
        user_role TEXT;
        user_email TEXT;
      BEGIN
        -- Get the email from the current session
        user_email := current_setting('request.jwt.claims', true)::json->>'email';

        IF user_email IS NULL THEN
          RETURN FALSE;
        END IF;

        SELECT role::TEXT INTO user_role
        FROM public.users
        WHERE email = user_email;

        RETURN user_role IN ('ADMIN', 'SUPER_ADMIN');
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `)
    console.log('✓ Created function to check admin role')

    await client.query(`
      CREATE POLICY "Allow admin and super_admin to view"
        ON public.surveys
        FOR SELECT
        TO authenticated
        USING (public.user_has_admin_role());
    `)
    console.log('✓ Created policy for admin/super_admin to view surveys')

    // Grant permissions
    await client.query('GRANT USAGE ON SCHEMA public TO authenticated;')
    await client.query('GRANT INSERT ON public.surveys TO authenticated;')
    await client.query('GRANT SELECT ON public.surveys TO authenticated;')
    console.log('✓ Granted permissions')

    console.log('\n✅ RLS setup complete! Only ADMIN and SUPER_ADMIN can view surveys.')

  } catch (error) {
    console.error('Error enabling RLS:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

enableSurveysRLS()
