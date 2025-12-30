import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

async function fixUpdatedAt() {
  const client = await pool.connect()

  try {
    console.log('Fixing updated_at column default value...\n')

    // Add default value to updated_at column
    await client.query(`
      ALTER TABLE public.surveys
      ALTER COLUMN updated_at SET DEFAULT NOW();
    `)
    console.log('✓ Added default value to updated_at column')

    // Update any existing NULL values
    await client.query(`
      UPDATE public.surveys
      SET updated_at = created_at
      WHERE updated_at IS NULL;
    `)
    console.log('✓ Updated any NULL values')

    console.log('\n✅ updated_at column fixed successfully!')

  } catch (error) {
    console.error('Error fixing updated_at:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

fixUpdatedAt()
