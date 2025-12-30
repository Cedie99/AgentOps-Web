import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function setupAttendanceRLS() {
  const client = await pool.connect()

  try {
    console.log('Setting up RLS policies for attendance table...\n')

    // Enable RLS on attendance table
    console.log('1. Enabling RLS on attendance table...')
    await client.query(`
      ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
    `)
    console.log('✓ RLS enabled on attendance table')

    // Drop existing policies if any
    console.log('\n2. Dropping existing policies...')
    await client.query(`
      DROP POLICY IF EXISTS "Users can view their own attendance" ON attendance;
      DROP POLICY IF EXISTS "Users can insert their own attendance" ON attendance;
      DROP POLICY IF EXISTS "Users can update their own attendance" ON attendance;
      DROP POLICY IF EXISTS "Admins can view all attendance" ON attendance;
      DROP POLICY IF EXISTS "Service role can do anything" ON attendance;
    `)
    console.log('✓ Existing policies dropped')

    // Policy 1: Users can view their own attendance
    console.log('\n3. Creating policy: Users can view their own attendance...')
    await client.query(`
      CREATE POLICY "Users can view their own attendance"
      ON attendance
      FOR SELECT
      TO authenticated
      USING (
        user_id IN (
          SELECT id FROM users WHERE email = auth.email()
        )
      );
    `)
    console.log('✓ Created SELECT policy for users')

    // Policy 2: Users can insert their own attendance
    console.log('\n4. Creating policy: Users can insert their own attendance...')
    await client.query(`
      CREATE POLICY "Users can insert their own attendance"
      ON attendance
      FOR INSERT
      TO authenticated
      WITH CHECK (
        user_id IN (
          SELECT id FROM users WHERE email = auth.email()
        )
      );
    `)
    console.log('✓ Created INSERT policy for users')

    // Policy 3: Users can update their own attendance (for clock out)
    console.log('\n5. Creating policy: Users can update their own attendance...')
    await client.query(`
      CREATE POLICY "Users can update their own attendance"
      ON attendance
      FOR UPDATE
      TO authenticated
      USING (
        user_id IN (
          SELECT id FROM users WHERE email = auth.email()
        )
      )
      WITH CHECK (
        user_id IN (
          SELECT id FROM users WHERE email = auth.email()
        )
      );
    `)
    console.log('✓ Created UPDATE policy for users')

    // Policy 4: Admins can view all attendance
    console.log('\n6. Creating policy: Admins can view all attendance...')
    await client.query(`
      CREATE POLICY "Admins can view all attendance"
      ON attendance
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

    // Policy 5: Service role can do anything (for API)
    console.log('\n7. Creating policy: Service role can do anything...')
    await client.query(`
      CREATE POLICY "Service role can do anything"
      ON attendance
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
    `)
    console.log('✓ Created service role policy')

    console.log('\n✅ RLS policies for attendance table configured successfully!')
    console.log('\nUsers can now:')
    console.log('  - View their own attendance records')
    console.log('  - Clock in (insert new records)')
    console.log('  - Clock out (update their records)')
    console.log('  - Admins can view all attendance')

  } catch (error) {
    console.error('Error setting up attendance RLS:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

setupAttendanceRLS()
