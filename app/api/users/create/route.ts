import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Admin Client (with service role key)
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

// POST create new user with Supabase auth
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role } = body

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, password, and role are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'SURVEYOR', 'SALES', 'DELIVERY', 'COLLECTOR']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Create Supabase auth user first
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name,
        role
      }
    })

    if (authError) {
      console.error('Supabase auth error:', authError)
      return NextResponse.json(
        { error: `Failed to create auth user: ${authError.message}` },
        { status: 500 }
      )
    }

    // Determine if this is a field agent role
    const isFieldAgent = ['SURVEYOR', 'SALES', 'DELIVERY', 'COLLECTOR'].includes(role)

    // Create user in database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        status: 'ACTIVE',
        // Set agent_status for field agents
        ...(isFieldAgent && {
          agent_status: 'AVAILABLE',
          active_tasks_count: 0
        })
      }
    })

    // Create profile in Supabase (if you have a profiles table)
    try {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: name,
          role: role.toLowerCase()
        })

      if (profileError) {
        console.warn('Profile creation warning:', profileError)
        // Don't fail the request if profile creation fails
      }
    } catch (profileErr) {
      console.warn('Profile creation error:', profileErr)
      // Continue even if profile creation fails
    }

    return NextResponse.json({
      success: true,
      user,
      authUser: {
        id: authData.user.id,
        email: authData.user.email
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
