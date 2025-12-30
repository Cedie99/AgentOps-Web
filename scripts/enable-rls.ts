import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function enableRLS() {
  const client = await pool.connect()

  try {
    console.log('Enabling Row Level Security on users table...')

    // Enable RLS
    await client.query('ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;')
    console.log('✓ RLS enabled on users table')

    // Drop existing policies
    await client.query('DROP POLICY IF EXISTS "Allow authenticated users to read users" ON public.users;')
    await client.query('DROP POLICY IF EXISTS "Users can read own record" ON public.users;')
    console.log('✓ Dropped existing policies')

    // Create policy
    await client.query(`
      CREATE POLICY "Allow authenticated users to read users"
        ON public.users
        FOR SELECT
        TO authenticated
        USING (true);
    `)
    console.log('✓ Created policy for authenticated users')

    // Grant permissions to roles
    await client.query('GRANT USAGE ON SCHEMA public TO authenticated;')
    await client.query('GRANT USAGE ON SCHEMA public TO anon;')
    await client.query('GRANT SELECT ON public.users TO authenticated;')
    await client.query('GRANT SELECT ON public.users TO anon;')
    await client.query('GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;')
    await client.query('GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;')
    console.log('✓ Granted schema and table permissions')

    console.log('\n✅ RLS setup complete! Mobile app should now be able to access users table.')

  } catch (error) {
    console.error('Error enabling RLS:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

enableRLS()
