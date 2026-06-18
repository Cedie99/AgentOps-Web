import 'dotenv/config'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const TABLES = [
  'users', 'app_config', 'announcements', 'surveys',
  'survey_assignments', 'visit_logs', 'gps_tracking_points',
  'attendance', 'attendance_sessions', 'attendance_summary',
  'transactions', 'delivery_orders', 'orders', 'sales_activities',
]

async function main() {
  const client = await pool.connect()
  try {
    for (const table of TABLES) {
      try {
        const res = await client.query(`SELECT COUNT(*) as count FROM "${table}"`)
        console.log(`${table}: ${res.rows[0].count} rows`)
      } catch (e: any) {
        console.log(`${table}: ERROR - ${e.message}`)
      }
    }
  } finally {
    client.release()
    await pool.end()
  }
}

main()
