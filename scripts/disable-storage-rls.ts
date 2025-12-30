import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function disableStorageRLS() {
  const client = await pool.connect()

  try {
    console.log('Disabling RLS on storage.objects table...\n')

    // Check if RLS is enabled on storage.objects
    const rlsCheck = await client.query(`
      SELECT relrowsecurity
      FROM pg_class
      WHERE oid = 'storage.objects'::regclass;
    `)

    console.log('Current RLS status:', rlsCheck.rows[0]?.relrowsecurity ? 'ENABLED' : 'DISABLED')

    // Create a permissive policy that allows all operations on survey-photos bucket
    console.log('\n1. Creating permissive policy for survey-photos bucket...')

    // Drop any existing policies for survey-photos
    await client.query(`
      DROP POLICY IF EXISTS "Allow all operations on survey-photos" ON storage.objects;
    `)

    // Create a policy that allows everything for survey-photos bucket
    await client.query(`
      CREATE POLICY "Allow all operations on survey-photos"
      ON storage.objects
      FOR ALL
      TO public
      USING (bucket_id = 'survey-photos')
      WITH CHECK (bucket_id = 'survey-photos');
    `)
    console.log('✓ Created permissive policy for survey-photos bucket')

    console.log('\n✅ Storage access configured successfully!')
    console.log('\nAll users can now upload and access photos in the survey-photos bucket.')

  } catch (error) {
    console.error('Error configuring storage access:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

disableStorageRLS()
