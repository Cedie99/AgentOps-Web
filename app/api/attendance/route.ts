import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has ADMIN or SUPER_ADMIN role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true, id: true }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can view attendance' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const workDate = searchParams.get('work_date')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const roleFilter = searchParams.get('role')
    const includeRoutes = searchParams.get('include_routes') === 'true'

    // Build query
    const where: any = {}

    if (userId) {
      where.user_id = parseInt(userId)
    }

    if (workDate) {
      where.work_date = workDate
    } else if (dateFrom || dateTo) {
      where.work_date = {}
      if (dateFrom) where.work_date.gte = dateFrom
      if (dateTo) where.work_date.lte = dateTo
    }

    // If role filter is specified, need to filter by user role
    if (roleFilter) {
      where.user = {
        role: roleFilter
      }
    }

    // Fetch attendance records
    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          }
        },
        gps_points: includeRoutes ? {
          orderBy: {
            timestamp: 'asc'
          }
        } : false,
      },
      orderBy: [
        { work_date: 'desc' },
        { clock_in_time: 'desc' }
      ]
    })

    // Calculate statistics
    const stats = {
      total: attendance.length,
      working: attendance.filter((a: any) => !a.clock_out_time).length,
      completed: attendance.filter((a: any) => a.clock_out_time).length,
      totalDistance: attendance.reduce((sum: number, a: any) => sum + (a.total_distance || 0), 0),
    }

    return NextResponse.json({ attendance, stats })
  } catch (error: any) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const {
      user_id,
      work_date,
      clock_in_time,
      clock_out_time,
      clock_in_lat,
      clock_in_long,
      clock_out_lat,
      clock_out_long,
      selfie_url,
      duration,
      total_distance,
    } = body

    if (!user_id || !work_date || !clock_in_time) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, work_date, clock_in_time' },
        { status: 400 }
      )
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { id: user_id },
      select: { id: true, name: true, email: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if attendance already exists for this date
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        user_id,
        work_date,
      }
    })

    if (existingAttendance && !clock_out_time) {
      return NextResponse.json(
        { error: 'Attendance already exists for this date' },
        { status: 400 }
      )
    }

    // If clock_out_time is provided and attendance exists, update it
    if (clock_out_time && existingAttendance) {
      const updatedAttendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          clock_out_time: new Date(clock_out_time),
          clock_out_lat,
          clock_out_long,
          duration,
          total_distance,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            }
          }
        }
      })

      return NextResponse.json({
        attendance: updatedAttendance,
        message: 'Clock out recorded successfully'
      })
    }

    // Create new attendance record
    const newAttendance = await prisma.attendance.create({
      data: {
        user_id,
        work_date,
        clock_in_time: new Date(clock_in_time),
        clock_out_time: clock_out_time ? new Date(clock_out_time) : null,
        clock_in_lat,
        clock_in_long,
        clock_out_lat,
        clock_out_long,
        selfie_url,
        duration,
        total_distance,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    })

    return NextResponse.json({
      attendance: newAttendance,
      message: 'Attendance recorded successfully'
    })
  } catch (error: any) {
    console.error('Error recording attendance:', error)
    return NextResponse.json(
      { error: 'Failed to record attendance', details: error.message },
      { status: 500 }
    )
  }
}
