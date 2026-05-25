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
      select: { role: true }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can view live tracking' },
        { status: 403 }
      )
    }

    // Get today's date in Philippine time (sessions are stored with PH timezone dates)
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

    // Helper function to format Philippine time timestamps
    const formatPhilippineTime = (timestamp: Date) => {
      // Database stores timestamps WITHOUT timezone, but they represent Philippine local time
      // Use UTC methods to extract the raw values which represent Philippine time
      const year = timestamp.getUTCFullYear()
      const month = String(timestamp.getUTCMonth() + 1).padStart(2, '0')
      const day = String(timestamp.getUTCDate()).padStart(2, '0')
      const hours = String(timestamp.getUTCHours()).padStart(2, '0')
      const minutes = String(timestamp.getUTCMinutes()).padStart(2, '0')
      const seconds = String(timestamp.getUTCSeconds()).padStart(2, '0')
      const ms = String(timestamp.getUTCMilliseconds()).padStart(3, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}+08:00`
    }

    // Get all shifts for today (both active and completed) from attendance_sessions table
    const todayShifts = await prisma.attendanceSession.findMany({
      where: {
        work_date: today,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true,
            agent_status: true,
          }
        },
        gps_points: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 15 * 60 * 1000)  // Last 15 minutes
            }
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 1  // Latest position only
        }
      }
    })

    // Format response with latest GPS coordinates and timezone-aware timestamps
    const allShiftAgents = todayShifts.map(shift => {
      const latestGps = shift.gps_points[0]
      const isActive = !shift.clock_out_time

      // Serialize timestamps with Philippine timezone
      const clockInTime = formatPhilippineTime(shift.clock_in_time)
      const clockOutTime = shift.clock_out_time ? formatPhilippineTime(shift.clock_out_time) : null
      const lastUpdate = latestGps?.timestamp ? latestGps.timestamp.toISOString() : clockInTime

      return {
        id: shift.user.id,
        name: shift.user.name,
        email: shift.user.email,
        role: shift.user.role,
        avatar: shift.user.avatar,
        agent_status: shift.user.agent_status,
        attendance_id: shift.id,
        work_date: shift.work_date,
        clock_in_time: clockInTime,
        clock_in_lat: shift.clock_in_lat,
        clock_in_long: shift.clock_in_long,
        clock_out_time: clockOutTime,
        clock_out_lat: shift.clock_out_lat,
        clock_out_long: shift.clock_out_long,
        current_lat: latestGps?.latitude || shift.clock_in_lat,
        current_lng: latestGps?.longitude || shift.clock_in_long,
        last_update: lastUpdate,
        total_distance: shift.total_distance,
        working_duration: isActive
          ? calculateDuration(clockInTime)
          : calculateCompletedDuration(clockInTime, clockOutTime!),
        is_active: isActive,
      }
    })

    // Deduplicate by user ID — a user may have multiple sessions today (clock-in/out/in again).
    // Keep the active session; if all are completed, keep the most recent one.
    const seenUsers = new Map<number, typeof allShiftAgents[0]>();
    for (const agent of allShiftAgents) {
      const existing = seenUsers.get(agent.id);
      if (!existing || agent.is_active || (!existing.is_active && agent.attendance_id > existing.attendance_id)) {
        seenUsers.set(agent.id, agent);
      }
    }
    const allAgents = Array.from(seenUsers.values());

    // Get statistics
    const liveAgents = allAgents.filter(a => a.is_active)
    const stats = {
      total_today: allAgents.length,
      total_active: liveAgents.length,
      total_clocked_out: allAgents.filter(a => !a.is_active).length,
      by_role: allAgents.reduce((acc, agent) => {
        acc[agent.role] = (acc[agent.role] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      total_distance: allAgents.reduce((sum, agent) => sum + (agent.total_distance || 0), 0),
    }

    return NextResponse.json({
      agents: allAgents,
      stats,
      updated_at: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Error fetching live tracking data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch live tracking data', details: error.message },
      { status: 500 }
    )
  }
}

// Helper function to calculate duration (ongoing)
function calculateDuration(startTime: string): string {
  const now = new Date()
  const start = new Date(startTime)
  const diffMs = now.getTime() - start.getTime()

  if (diffMs < 0) {
    // If negative, show as negative
    const absDiffMs = Math.abs(diffMs)
    const hours = Math.floor(absDiffMs / (1000 * 60 * 60))
    const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `-${hours}h ${minutes}m`
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours}h ${minutes}m`
}

// Helper function to calculate completed duration
function calculateCompletedDuration(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end.getTime() - start.getTime()

  if (diffMs < 0) {
    // If negative, show as negative
    const absDiffMs = Math.abs(diffMs)
    const hours = Math.floor(absDiffMs / (1000 * 60 * 60))
    const minutes = Math.floor((absDiffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `-${hours}h ${minutes}m`
  }

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours}h ${minutes}m`
}
