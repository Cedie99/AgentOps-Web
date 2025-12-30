import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function setupGpsTrackingRLS() {
  const client = await pool.connect()

  try {
    console.log('Setting up RLS policies for gps_tracking_points table...\n')

    // Enable RLS on gps_tracking_points table
    console.log('1. Enabling RLS on gps_tracking_points table...')
    await client.query(`
      ALTER TABLE gps_tracking_points ENABLE ROW LEVEL SECURITY;
    `)
    console.log('✓ RLS enabled on gps_tracking_points table')

    // Drop existing policies if any
    console.log('\n2. Dropping existing policies...')
    await client.query(`
      DROP POLICY IF EXISTS "Users can view their own GPS points" ON gps_tracking_points;
      DROP POLICY IF EXISTS "Users can insert their own GPS points" ON gps_tracking_points;
      DROP POLICY IF EXISTS "Admins can view all GPS points" ON gps_tracking_points;
      DROP POLICY IF EXISTS "Service role can do anything" ON gps_tracking_points;
    `)
    console.log('✓ Existing policies dropped')

    // Policy 1: Users can view their own GPS points
    console.log('\n3. Creating policy: Users can view their own GPS points...')
    await client.query(`
      CREATE POLICY "Users can view their own GPS points"
      ON gps_tracking_points
      FOR SELECT
      TO authenticated
      USING (
        user_id IN (
          SELECT id FROM users WHERE email = auth.email()
        )
      );
    `)
    console.log('✓ Created SELECT policy for users')

    // Policy 2: Users can insert their own GPS points
    console.log('\n4. Creating policy: Users can insert their own GPS points...')
    await client.query(`
      CREATE POLICY "Users can insert their own GPS points"
      ON gps_tracking_points
      FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id IN (
          SELECT id FROM users WHERE email = auth.email()
        )
      );
    `)
    console.log('✓ Created INSERT policy for users')

    // Policy 3: Admins can view all GPS points
    console.log('\n5. Creating policy: Admins can view all GPS points...')
    await client.query(`
      CREATE POLICY "Admins can view all GPS points"
      ON gps_tracking_points
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users
          WHERE email = auth.email()
          AND role IN ('ADMIN', 'SUPER_ADMIN')
        )
      );
    `)
    console.log('✓ Created admin SELECT policy')

    // Policy 4: Service role can do anything (for API)
    console.log('\n6. Creating policy: Service role can do anything...')
    await client.query(`
      CREATE POLICY "Service role can do anything"
      ON gps_tracking_points
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    `)
    console.log('✓ Created service role policy')

    console.log('\n✅ RLS policies for gps_tracking_points table configured successfully!')
    console.log('\nUsers can now:')
    console.log('  - View their own GPS tracking points')
    console.log('  - Insert GPS points during their shift')
    console.log('  - Admins can view all GPS tracking data')

  } catch (error) {
    console.error('Error setting up GPS tracking RLS:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

setupGpsTrackingRLS()
