/**
 * Manual script to create Supabase Auth users
 *
 * IMPORTANT: You need to get the correct service_role key from Supabase first!
 *
 * Steps:
 * 1. Go to https://supabase.com/dashboard/project/wwmufvcqkpuplsrxpxvo/settings/api
 * 2. Copy the service_role key (it's a long JWT token starting with eyJ...)
 * 3. Update .env file: SUPABASE_SERVICE_ROLE_KEY="paste_the_key_here"
 * 4. Run this script: tsx scripts/create-auth-users.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

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

async function createAuthUsers() {
  const DEFAULT_PASSWORD = 'admin123'

  console.log('Creating Supabase Auth users...\n')

  // Create Super Admin
  const { data: superAdmin, error: superAdminError } = await supabase.auth.admin.createUser({
    email: 'admin@agentops.com',
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: {
      name: 'Super Admin',
      role: 'SUPER_ADMIN'
    }
  })

  if (superAdminError) {
    console.error('❌ Super Admin creation failed:', superAdminError.message)
  } else {
    console.log('✅ Super Admin created: admin@agentops.com / admin123')
  }

  // Create Admin
  const { data: admin, error: adminError } = await supabase.auth.admin.createUser({
    email: 'manager@agentops.com',
    password: DEFAULT_PASSWORD,
    email_confirm: true,
    user_metadata: {
      name: 'Manager User',
      role: 'ADMIN'
    }
  })

  if (adminError) {
    console.error('❌ Admin creation failed:', adminError.message)
  } else {
    console.log('✅ Admin created: manager@agentops.com / admin123')
  }

  console.log('\n=== Done! ===')
  console.log('If you see errors, make sure you have the correct SUPABASE_SERVICE_ROLE_KEY in .env')
}

createAuthUsers()
  .catch(console.error)
  .finally(() => process.exit())
