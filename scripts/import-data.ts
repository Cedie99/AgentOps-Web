import 'dotenv/config'
import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const IMPORT_DIR = path.join(__dirname, '..', 'prisma', 'seed-data')

const TABLES = [
  'users',
  'app_config',
  'announcements',
  'surveys',
  'survey_assignments',
  'visit_logs',
  'gps_tracking_points',
  'attendance',
  'attendance_sessions',
  'attendance_summary',
  'transactions',
  'delivery_orders',
  'orders',
  'sales_activities',
]

async function main() {
  const client = await pool.connect()
  try {
    await client.query(`SET session_replication_role = 'replica'`)

    console.log('Clearing existing data...')
    for (const table of TABLES) {
      try { await client.query(`DELETE FROM "${table}"`) } catch {}
    }

    console.log('Importing data...')
    for (const table of TABLES) {
      const filePath = path.join(IMPORT_DIR, `${table}_rows.sql`)
      if (!fs.existsSync(filePath)) continue
      const sql = fs.readFileSync(filePath, 'utf8').trim()
      if (!sql) continue
      try {
        await client.query(sql)
        console.log(`OK: ${table}`)
      } catch (e: any) {
        console.log(`RETRY: ${table} - ${e.message}`)
        const lines = sql.split('\n').filter((l: string) => l.trim())
        let success = 0
        for (const line of lines) {
          try { await client.query(line); success++ } catch {}
        }
        console.log(`  Imported ${success}/${lines.length} rows`)
      }
    }

    await client.query(`SET session_replication_role = 'origin'`)

    console.log('Resetting sequences...')
    for (const table of TABLES) {
      try {
        const res = await client.query(`SELECT MAX(id) as max_id FROM "${table}"`)
        const maxId = res.rows[0]?.max_id ?? 0
        await client.query(`SELECT setval('"${table}_id_seq"', ${maxId})`)
        console.log(`  ${table}: ${maxId}`)
      } catch {}
    }
  } finally {
    client.release()
    await pool.end()
  }

  console.log('\nDone!')
}

main().catch((e) => { console.error('FAILED:', e); process.exit(1) })
