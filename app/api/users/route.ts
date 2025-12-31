import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all users (with optional role filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const roles = searchParams.get('roles')
    const status = searchParams.get('status')

    const where: any = {}

    // Handle multiple roles (comma-separated)
    if (roles) {
      const roleArray = roles.split(',').map(r => r.trim())
      where.role = { in: roleArray }
    } else if (role) {
      where.role = role
    }

    if (status) where.status = status

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatar: true,
        agent_status: true,
        vehicle_id: true,
        current_lat: true,
        current_lng: true,
        vehicle: true,
        attendance_records: {
          orderBy: { work_date: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const user = await prisma.user.create({
      data: {
        email: body.email,
        name: body.name,
        role: body.role,
        status: body.status || 'ACTIVE',
        avatar: body.avatar,
        // Field agent fields (optional)
        agent_status: body.agent_status,
        vehicle_id: body.vehicle_id,
        current_lat: body.current_lat,
        current_lng: body.current_lng,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
