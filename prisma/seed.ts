import 'dotenv/config'
import { PrismaClient, UserRole, UserStatus, AgentStatus } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { createClient } from '@supabase/supabase-js'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Create Supabase admin client for creating auth users
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function main() {
  console.log('Starting database seed...')
  console.log('='.repeat(50))

  const DEFAULT_PASSWORD = 'admin123'

  // ========================================
  // WEB USERS (can login to dashboard)
  // ========================================

  console.log('\n📋 Creating Web Users...')

  // 1. Super Admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@agentops.com' },
    update: {},
    create: {
      email: 'superadmin@agentops.com',
      name: 'Super Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      avatar: null,
    },
  })
  console.log('✅ Created Super Admin (ID:', superAdmin.id, ')')

  // Create Super Admin auth user
  const { error: superAdminAuthError } = await supabase.auth.admin.createUser({
    email: 'superadmin@agentops.com',
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { name: 'Super Admin', role: 'SUPER_ADMIN' }
  })
  if (superAdminAuthError && !superAdminAuthError.message.includes('already')) {
    console.log('⚠️  Super Admin auth:', superAdminAuthError.message)
  }

  // 2. Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@agentops.com' },
    update: {},
    create: {
      email: 'admin@agentops.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      avatar: null,
    },
  })
  console.log('✅ Created Admin (ID:', admin.id, ')')

  // Create Admin auth user
  const { error: adminAuthError } = await supabase.auth.admin.createUser({
    email: 'admin@agentops.com',
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: { name: 'Admin User', role: 'ADMIN' }
  })
  if (adminAuthError && !adminAuthError.message.includes('already')) {
    console.log('⚠️  Admin auth:', adminAuthError.message)
  }

  // ========================================
  // MOBILE AGENTS (field workers, no web access)
  // ========================================

  console.log('\n📱 Creating Mobile Agents...')

  // 3. Surveyor
  const surveyor = await prisma.user.upsert({
    where: { email: 'surveyor@agentops.com' },
    update: {},
    create: {
      name: 'Field Surveyor',
      email: 'surveyor@agentops.com',
      role: UserRole.SURVEYOR,
      status: UserStatus.ACTIVE,
      agent_status: AgentStatus.AVAILABLE,
    },
  })
  console.log('✅ Created Surveyor (ID:', surveyor.id, ')')

  // 4. Sales Agent
  const sales = await prisma.user.upsert({
    where: { email: 'sales@agentops.com' },
    update: {},
    create: {
      name: 'Sales Agent',
      email: 'sales@agentops.com',
      role: UserRole.SALES,
      status: UserStatus.ACTIVE,
      agent_status: AgentStatus.AVAILABLE,
    },
  })
  console.log('✅ Created Sales Agent (ID:', sales.id, ')')

  // 5. Delivery Agent
  const delivery = await prisma.user.upsert({
    where: { email: 'delivery@agentops.com' },
    update: {},
    create: {
      name: 'Delivery Driver',
      email: 'delivery@agentops.com',
      role: UserRole.DELIVERY,
      status: UserStatus.ACTIVE,
      agent_status: AgentStatus.AVAILABLE,
    },
  })
  console.log('✅ Created Delivery Agent (ID:', delivery.id, ')')

  // 6. Collector Agent
  const collector = await prisma.user.upsert({
    where: { email: 'collector@agentops.com' },
    update: {},
    create: {
      name: 'Payment Collector',
      email: 'collector@agentops.com',
      role: UserRole.COLLECTOR,
      status: UserStatus.ACTIVE,
      agent_status: AgentStatus.AVAILABLE,
    },
  })
  console.log('✅ Created Collector Agent (ID:', collector.id, ')')

  console.log('\n' + '='.repeat(50))
  console.log('🎉 SEED COMPLETED!')
  console.log('='.repeat(50))
  console.log('\n🌐 WEB LOGIN CREDENTIALS:')
  console.log('   1. superadmin@agentops.com / admin123 (SUPER_ADMIN)')
  console.log('   2. admin@agentops.com / admin123 (ADMIN)')
  console.log('\n📱 MOBILE AGENTS (no web access):')
  console.log('   3. surveyor@agentops.com (SURVEYOR)')
  console.log('   4. sales@agentops.com (SALES)')
  console.log('   5. delivery@agentops.com (DELIVERY)')
  console.log('   6. collector@agentops.com (COLLECTOR)')
  console.log('\n⚠️  NOTE: If auth users show errors, create them manually in Supabase Dashboard')
  console.log('='.repeat(50) + '\n')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
