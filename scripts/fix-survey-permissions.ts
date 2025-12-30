import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function fixSurveyPermissions() {
  const client = await pool.connect()

  try {
    console.log('Fixing survey permissions and schema issues...\n')

    // Fix 1: Grant permissions on surveys sequence (critical for INSERT)
    console.log('1. Granting permissions on surveys sequence...')
    await client.query('GRANT USAGE, SELECT ON SEQUENCE public.surveys_id_seq TO authenticated;')
    console.log('✓ Granted sequence permissions')

    // Fix 2: Ensure all table permissions are set
    console.log('\n2. Setting table permissions...')
    await client.query('GRANT INSERT ON public.surveys TO authenticated;')
    await client.query('GRANT SELECT ON public.surveys TO authenticated;')
    console.log('✓ Table permissions set')

    // Fix 3: Add missing columns to announcements table if they don't exist
    console.log('\n3. Checking announcements table...')
    const expiresAtCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'announcements'
      AND column_name = 'expires_at'
    `)

    if (expiresAtCheck.rows.length === 0) {
      console.log('Adding expires_at column to announcements...')
      await client.query('ALTER TABLE public.announcements ADD COLUMN expires_at TIMESTAMP;')
      console.log('✓ Added expires_at column')
    } else {
      console.log('✓ expires_at column already exists')
    }

    // Fix 4: Add missing created_by column to stores table if it doesn't exist
    console.log('\n4. Checking stores table...')
    const createdByCheck = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'stores'
      AND column_name = 'created_by'
    `)

    if (createdByCheck.rows.length === 0) {
      console.log('Adding created_by column to stores...')
      await client.query('ALTER TABLE public.stores ADD COLUMN created_by INTEGER REFERENCES public.users(id);')
      console.log('✓ Added created_by column')
    } else {
      console.log('✓ created_by column already exists')
    }

    console.log('\n✅ All fixes applied successfully!')
    console.log('\nNext steps:')
    console.log('1. Create storage bucket for survey photos using Supabase dashboard')
    console.log('2. Update mobile app to reference "attendance" table instead of "daily_attendance"')

  } catch (error) {
    console.error('Error fixing permissions:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

fixSurveyPermissions()
