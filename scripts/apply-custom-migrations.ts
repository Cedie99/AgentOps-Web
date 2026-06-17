import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
})

const sqlFiles = [
  'add_check_out_time_to_visit_logs.sql',
  'add_collector_daily_collections.sql',
  '20251230093029_enable_users_rls/migration.sql',
  'collection-sync-trigger/migration.sql',
  'delivery-order-sync-trigger/migration.sql',
  'orders-rls-policies/migration.sql',
  'storage-buckets/migration.sql',
]

async function main() {
  for (const file of sqlFiles) {
    const filePath = path.join('prisma', 'migrations-backup', file)
    if (fs.existsSync(filePath)) {
      const sql = fs.readFileSync(filePath, 'utf8')
      try {
        await pool.query(sql)
        console.log('OK: ' + file)
      } catch (e: any) {
        console.log('FAIL: ' + file + ' - ' + e.message)
      }
    } else {
      console.log('SKIP: ' + file + ' - not found')
    }
  }
  await pool.end()
}

main().catch((e) => {
  console.log('Error:', e.message)
  process.exit(1)
})
