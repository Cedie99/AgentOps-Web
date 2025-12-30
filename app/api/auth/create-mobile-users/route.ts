import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from '@/lib/prisma'

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

const DEFAULT_PASSWORD = 'admin123'

const mobileUsers = [
  { email: 'surveyor@agentops.com', name: 'Field Surveyor', role: 'surveyor' },
  { email: 'sales@agentops.com', name: 'Sales Agent', role: 'sales' },
  { email: 'delivery@agentops.com', name: 'Delivery Driver', role: 'delivery' },
  { email: 'collector@agentops.com', name: 'Payment Collector', role: 'collector' },
  { email: 'admin@agentops.com', name: 'Admin User', role: 'admin' },
]

export async function POST() {
  const results = []

  for (const user of mobileUsers) {
    try {
      // Check if user exists in database
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email }
      })

      if (!dbUser) {
        results.push({
          email: user.email,
          status: 'error',
          message: 'User not found in database. Run seed first.'
        })
        continue
      }

      // Try to create Supabase auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          role: user.role
        }
      })

      if (authError) {
        if (authError.message.includes('already')) {
          results.push({
            email: user.email,
            status: 'exists',
            message: 'Auth user already exists'
          })
        } else {
          results.push({
            email: user.email,
            status: 'error',
            message: authError.message
          })
        }
      } else {
        // Try to create profile
        try {
          const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
              id: authData.user.id,
              email: user.email,
              full_name: user.name,
              role: user.role
            })

          if (profileError && !profileError.message.includes('duplicate')) {
            results.push({
              email: user.email,
              status: 'warning',
              message: `Auth created but profile error: ${profileError.message}`
            })
          } else {
            results.push({
              email: user.email,
              status: 'success',
              message: 'Auth user and profile created successfully'
            })
          }
        } catch (err: any) {
          results.push({
            email: user.email,
            status: 'warning',
            message: `Auth created but profile error: ${err.message}`
          })
        }
      }
    } catch (error: any) {
      results.push({
        email: user.email,
        status: 'error',
        message: error.message
      })
    }
  }

  return NextResponse.json({
    success: true,
    results,
    note: 'Default password for all users: admin123'
  })
}

export async function GET() {
  return NextResponse.json({
    message: 'Use POST to create mobile auth users',
    users: mobileUsers.map(u => u.email),
    password: 'admin123'
  })
}
