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

// PATCH update existing user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    const body = await request.json()
    const { name, email, password, role } = body

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, and role are required' },
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if email is being changed and if it's already in use by another user
    if (email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email }
      })

      if (emailInUse && emailInUse.id !== userId) {
        return NextResponse.json(
          { error: 'Email is already in use by another user' },
          { status: 409 }
        )
      }
    }

    // Determine if this is a field agent role
    const isFieldAgent = ['SURVEYOR', 'SALES', 'DELIVERY', 'COLLECTOR'].includes(role)

    // Update user in database
    const updateData: any = {
      name,
      email,
      role,
    }

    // If role changed to field agent, add agent_status
    if (isFieldAgent && !existingUser.agent_status) {
      updateData.agent_status = 'AVAILABLE'
      updateData.active_tasks_count = 0
    }

    // If role changed from field agent to non-field agent, remove agent fields
    if (!isFieldAgent && existingUser.agent_status) {
      updateData.agent_status = null
      updateData.vehicle_id = null
      updateData.current_lat = null
      updateData.current_lng = null
      updateData.last_seen = null
      updateData.active_tasks_count = 0
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })

    // Update Supabase auth user if email or password changed
    try {
      // Find the Supabase auth user by email
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

      if (!listError && authUsers) {
        const authUser = authUsers.users.find(u => u.email === existingUser.email)

        if (authUser) {
          const updateAuthData: any = {}

          if (email !== existingUser.email) {
            updateAuthData.email = email
          }

          if (password) {
            updateAuthData.password = password
          }

          if (Object.keys(updateAuthData).length > 0) {
            updateAuthData.user_metadata = { name, role }

            const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
              authUser.id,
              updateAuthData
            )

            if (updateError) {
              console.warn('Supabase auth update warning:', updateError)
            }
          }
        }
      }
    } catch (authErr) {
      console.warn('Supabase auth update error:', authErr)
      // Continue even if Supabase update fails
    }

    return NextResponse.json({
      success: true,
      user
    }, { status: 200 })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

// GET single user
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vehicle: true,
        attendance_records: {
          orderBy: { work_date: 'desc' },
          take: 5,
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

// DELETE user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete user from database
    await prisma.user.delete({
      where: { id: userId }
    })

    // Try to delete from Supabase auth
    try {
      const { data: authUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers()

      if (!listError && authUsers) {
        const authUser = authUsers.users.find(u => u.email === existingUser.email)

        if (authUser) {
          await supabaseAdmin.auth.admin.deleteUser(authUser.id)
        }
      }
    } catch (authErr) {
      console.warn('Supabase auth delete error:', authErr)
      // Continue even if Supabase delete fails
    }

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}
