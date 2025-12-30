import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function setupStorageRLS() {
  const client = await pool.connect()

  try {
    console.log('Setting up storage RLS policies for survey-photos bucket...\n')

    // Policy 1: Allow authenticated users to INSERT (upload) images
    console.log('1. Creating INSERT policy...')
    await client.query(`
      CREATE POLICY "Allow authenticated users to upload survey photos"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'survey-photos');
    `)
    console.log('✓ INSERT policy created')

    // Policy 2: Allow authenticated users to SELECT (view) images
    console.log('\n2. Creating SELECT policy...')
    await client.query(`
      CREATE POLICY "Allow authenticated users to view survey photos"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'survey-photos');
    `)
    console.log('✓ SELECT policy created')

    console.log('\n✅ Storage RLS policies created successfully!')
    console.log('\nPolicies:')
    console.log('- Authenticated users can upload photos to survey-photos bucket')
    console.log('- Authenticated users can view photos from survey-photos bucket')

  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('✓ Policies already exist')
    } else {
      console.error('Error setting up storage RLS:', error)
      throw error
    }
  } finally {
    client.release()
    await pool.end()
  }
}

setupStorageRLS()
