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

    // Fetch attendance records from NEW attendance_sessions table
    const attendanceSessions = await prisma.attendanceSession.findMany({
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

    // Also fetch summaries for better overview
    const summaryWhere: any = {}
    if (userId) summaryWhere.user_id = parseInt(userId)
    if (workDate) summaryWhere.work_date = workDate
    else if (dateFrom || dateTo) {
      summaryWhere.work_date = {}
      if (dateFrom) summaryWhere.work_date.gte = dateFrom
      if (dateTo) summaryWhere.work_date.lte = dateTo
    }
    if (roleFilter) {
      summaryWhere.user = { role: roleFilter }
    }

    const attendanceSummaries = await prisma.attendanceSummary.findMany({
      where: summaryWhere,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
          }
        }
      },
      orderBy: [
        { work_date: 'desc' },
        { first_clock_in: 'desc' }
      ]
    })

    // Helper function to format Philippine time timestamps
    // Database stores timestamps WITHOUT timezone, but they represent Philippine local time
    const formatPhilippineTime = (timestamp: Date) => {
      // The timestamp from Prisma is a Date object, but represents Philippine local time
      // We need to extract components and add the +08:00 offset
      const timeString = timestamp.toISOString() // This gives us UTC time

      // Parse the UTC time and extract components
      const year = timestamp.getUTCFullYear()
      const month = String(timestamp.getUTCMonth() + 1).padStart(2, '0')
      const day = String(timestamp.getUTCDate()).padStart(2, '0')
      const hours = String(timestamp.getUTCHours()).padStart(2, '0')
      const minutes = String(timestamp.getUTCMinutes()).padStart(2, '0')
      const seconds = String(timestamp.getUTCSeconds()).padStart(2, '0')
      const ms = String(timestamp.getUTCMilliseconds()).padStart(3, '0')

      // Return as Philippine time (the UTC components represent Philippine local time)
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}+08:00`
    }

    // Serialize attendance sessions with proper timezone
    const serializedAttendance = attendanceSessions.map(session => ({
      ...session,
      clock_in_time: formatPhilippineTime(session.clock_in_time),
      clock_out_time: session.clock_out_time ? formatPhilippineTime(session.clock_out_time) : null,
      created_at: session.created_at.toISOString(),
      updated_at: session.updated_at.toISOString(),
    }))

    // Calculate statistics based on sessions
    const stats = {
      total: attendanceSessions.length,
      working: attendanceSessions.filter((a: any) => !a.clock_out_time).length,
      completed: attendanceSessions.filter((a: any) => a.clock_out_time).length,
      totalDistance: attendanceSummaries.reduce((sum: number, s: any) => sum + (s.total_distance ? parseFloat(s.total_distance.toString()) : 0), 0),
      totalSessions: attendanceSessions.length,
      uniqueUsers: new Set(attendanceSessions.map((a: any) => a.user_id)).size,
      totalHours: attendanceSummaries.reduce((sum: number, s: any) => sum + parseFloat(s.total_hours.toString()), 0),
    }

    return NextResponse.json({
      attendance: serializedAttendance,
      summaries: attendanceSummaries,
      stats
    })
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

    // Check if there's ANY session (active or completed) for this user today
    const todaySession = await prisma.attendanceSession.findFirst({
      where: {
        user_id,
        work_date,
      },
      orderBy: {
        clock_in_time: 'desc'
      }
    })

    // CASE 1: User is clocking OUT and there's an active session
    if (clock_out_time && todaySession && !todaySession.clock_out_time) {
      const clockInTime = new Date(todaySession.clock_in_time)
      const clockOutTime = new Date(clock_out_time)
      const sessionDurationMinutes = Math.abs(Math.round((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60)))

      // Add this session's duration to any accumulated duration from previous sessions today
      const previousDuration = todaySession.duration_minutes || 0
      const totalDuration = previousDuration + sessionDurationMinutes

      const updatedSession = await prisma.attendanceSession.update({
        where: { id: todaySession.id },
        data: {
          clock_out_time: clockOutTime,
          clock_out_lat,
          clock_out_long,
          duration_minutes: totalDuration, // Cumulative duration for all sessions today
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

      // Update attendance summary
      // Note: We now only have ONE session per user per day with accumulated duration
      const totalHours = totalDuration / 60

      await prisma.attendanceSummary.upsert({
        where: {
          user_id_work_date: {
            user_id,
            work_date
          }
        },
        create: {
          user_id,
          work_date,
          total_hours: totalHours,
          total_sessions: 1, // Always 1 session per day now
          first_clock_in: updatedSession.clock_in_time,
          last_clock_out: clockOutTime,
        },
        update: {
          total_hours: totalHours,
          last_clock_out: clockOutTime,
        }
      })

      return NextResponse.json({
        attendance: updatedSession,
        message: 'Clock out recorded successfully'
      })
    }

    // CASE 2: User is clocking IN and there's already a session today (either active or completed)
    // Reactivate the existing session instead of creating a new one
    if (!clock_out_time && todaySession) {
      // If the session is already active (no clock_out_time), just return it
      if (!todaySession.clock_out_time) {
        return NextResponse.json({
          attendance: todaySession,
          message: 'Already clocked in for today'
        })
      }

      // If the session was completed (has clock_out_time), reactivate it
      // Update clock_in_time to NOW and keep accumulated duration
      const reactivatedSession = await prisma.attendanceSession.update({
        where: { id: todaySession.id },
        data: {
          clock_in_time: new Date(clock_in_time), // Set new clock-in time
          clock_out_time: null, // Clear clock-out to reactivate
          clock_in_lat,
          clock_in_long,
          clock_out_lat: null,
          clock_out_long: null,
          // duration_minutes is kept - it holds accumulated duration from previous sessions
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
        attendance: reactivatedSession,
        message: 'Clocked in again - continuing today\'s session'
      })
    }

    // CASE 3: Create new attendance session (first clock in of the day)
    const newSession = await prisma.attendanceSession.create({
      data: {
        user_id,
        work_date,
        clock_in_time: new Date(clock_in_time),
        clock_in_lat,
        clock_in_long,
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

    // Create or update summary (first clock-in of the day)
    await prisma.attendanceSummary.upsert({
      where: {
        user_id_work_date: {
          user_id,
          work_date
        }
      },
      create: {
        user_id,
        work_date,
        total_hours: 0,
        total_sessions: 1,
        first_clock_in: new Date(clock_in_time),
      },
      update: {
        total_sessions: {
          increment: 1
        }
      }
    })

    return NextResponse.json({
      attendance: newSession,
      message: 'Clock in recorded successfully'
    })
  } catch (error: any) {
    console.error('Error recording attendance:', error)
    return NextResponse.json(
      { error: 'Failed to record attendance', details: error.message },
      { status: 500 }
    )
  }
}
