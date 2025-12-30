import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function removeStorageRLS() {
  const client = await pool.connect()

  try {
    console.log('Removing storage RLS policies from survey-photos bucket...\n')

    // Drop the policies we created
    console.log('1. Dropping INSERT policy...')
    await client.query(`
      DROP POLICY IF EXISTS "Allow authenticated users to upload survey photos" ON storage.objects;
    `)
    console.log('✓ INSERT policy removed')

    console.log('\n2. Dropping SELECT policy...')
    await client.query(`
      DROP POLICY IF EXISTS "Allow authenticated users to view survey photos" ON storage.objects;
    `)
    console.log('✓ SELECT policy removed')

    console.log('\n✅ Storage RLS policies removed successfully!')
    console.log('\nThe bucket will now use default storage access rules.')

  } catch (error: any) {
    console.error('Error removing storage RLS:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

removeStorageRLS()
