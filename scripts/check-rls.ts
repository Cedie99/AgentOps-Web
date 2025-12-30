import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function checkRLS() {
  const client = await pool.connect()

  try {
    console.log('Checking RLS configuration...\n')

    // Check if RLS is enabled on users table
    const { rows: rlsCheck } = await client.query(`
      SELECT schemaname, tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'users';
    `)
    console.log('Users table RLS status:', rlsCheck)

    // Check existing policies on users table
    const { rows: policies } = await client.query(`
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'users';
    `)
    console.log('\nExisting policies on users table:')
    console.log(policies)

    // Check grants on users table
    const { rows: grants } = await client.query(`
      SELECT grantee, privilege_type
      FROM information_schema.table_privileges
      WHERE table_schema = 'public' AND table_name = 'users';
    `)
    console.log('\nGrants on users table:')
    console.log(grants)

    // Check schema privileges
    const { rows: schemaGrants } = await client.query(`
      SELECT grantee, privilege_type
      FROM information_schema.schema_privileges
      WHERE schema_name = 'public';
    `)
    console.log('\nSchema privileges:')
    console.log(schemaGrants)

  } catch (error) {
    console.error('Error checking RLS:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

checkRLS()
