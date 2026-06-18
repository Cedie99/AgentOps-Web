import 'dotenv/config'
import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const SQL_DIR = path.join(__dirname, 'sql')
const DATA_DIR = path.join(__dirname, '..', 'prisma', 'seed-data')

async function main() {
  // Step 1: Run Prisma migrations
  console.log('=== Step 1: Applying Prisma migrations ===')
  execSync('npx prisma migrate deploy', { stdio: 'inherit' })

  // Step 2: Run custom SQL scripts
  console.log('\n=== Step 2: Running custom SQL scripts ===')
  const client = await pool.connect()
  try {
    const sqlFiles = fs.readdirSync(SQL_DIR).filter(f => f.endsWith('.sql')).sort()
    for (const file of sqlFiles) {
      console.log(`  Running ${file}...`)
      const sql = fs.readFileSync(path.join(SQL_DIR, file), 'utf8').trim()
      if (sql) {
        await client.query(sql)
        console.log(`  OK`)
      }
    }
  } finally {
    client.release()
  }

  // Step 3: Import data
  console.log('\n=== Step 3: Importing seed data ===')
  const TABLES = [
    'users', 'app_config', 'announcements', 'surveys',
    'survey_assignments', 'visit_logs', 'gps_tracking_points',
    'attendance', 'attendance_sessions', 'attendance_summary',
    'transactions', 'delivery_orders', 'orders', 'sales_activities',
  ]

  const dataClient = await pool.connect()
  try {
    await dataClient.query(`SET session_replication_role = 'replica'`)

    for (const table of TABLES) {
      try { await dataClient.query(`DELETE FROM "${table}"`) } catch {}
    }

    for (const table of TABLES) {
      const filePath = path.join(DATA_DIR, `${table}_rows.sql`)
      if (!fs.existsSync(filePath)) {
        console.log(`  SKIP ${table} (no file)`)
        continue
      }
      const sql = fs.readFileSync(filePath, 'utf8').trim()
      if (!sql) continue

      try {
        await dataClient.query(sql)
        console.log(`  OK ${table}`)
      } catch (e: any) {
        console.log(`  FAIL ${table}: ${e.message}`)
      }
    }

    await dataClient.query(`SET session_replication_role = 'origin'`)

    // Reset sequences
    for (const table of TABLES) {
      try {
        const res = await dataClient.query(`SELECT MAX(id) as max_id FROM "${table}"`)
        const maxId = res.rows[0]?.max_id ?? 0
        await dataClient.query(`SELECT setval('"${table}_id_seq"', ${maxId})`)
      } catch {}
    }
  } finally {
    dataClient.release()
  }

  console.log('\n=== Setup complete! ===')
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1) })
  .finally(() => pool.end())
