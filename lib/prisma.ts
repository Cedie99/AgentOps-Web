import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Create a connection pool with SSL and connection limits
// Using Supabase Transaction pooler (port 6543) for better concurrency
const pool = globalForPrisma.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Supabase
  },
  // Optimized for Supabase Transaction pooler + serverless/Vercel deployment
  max: 10, // Transaction pooler can handle more concurrent connections
  min: 0, // Don't maintain idle connections
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds (faster cleanup)
  connectionTimeoutMillis: 10000, // Return error after 10 seconds if unable to connect
  allowExitOnIdle: true, // Allow pool to close when all clients are idle (important for serverless)
})
if (process.env.NODE_ENV !== 'production') globalForPrisma.pool = pool

// Create Prisma adapter
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
