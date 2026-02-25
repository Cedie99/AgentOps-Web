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

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Get all shifts for today (both active and completed)
    const todayShifts = await prisma.attendance.findMany({
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

    // Format response with latest GPS coordinates
    const allAgents = todayShifts.map(shift => {
      const latestGps = shift.gps_points[0]
      const isActive = !shift.clock_out_time

      return {
        id: shift.user.id,
        name: shift.user.name,
        email: shift.user.email,
        role: shift.user.role,
        avatar: shift.user.avatar,
        agent_status: shift.user.agent_status,
        attendance_id: shift.id,
        work_date: shift.work_date,
        clock_in_time: shift.clock_in_time,
        clock_in_lat: shift.clock_in_lat,
        clock_in_long: shift.clock_in_long,
        clock_out_time: shift.clock_out_time,
        clock_out_lat: shift.clock_out_lat,
        clock_out_long: shift.clock_out_long,
        current_lat: latestGps?.latitude || shift.clock_in_lat,
        current_lng: latestGps?.longitude || shift.clock_in_long,
        last_update: latestGps?.timestamp || shift.clock_in_time,
        total_distance: shift.total_distance,
        working_duration: isActive
          ? calculateDuration(shift.clock_in_time)
          : calculateCompletedDuration(shift.clock_in_time, shift.clock_out_time!),
        is_active: isActive,
      }
    })

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
function calculateDuration(startTime: Date): string {
  const now = new Date()
  const start = new Date(startTime)
  const diffMs = now.getTime() - start.getTime()

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours}h ${minutes}m`
}

// Helper function to calculate completed duration
function calculateCompletedDuration(startTime: Date, endTime: Date): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const diffMs = end.getTime() - start.getTime()

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours}h ${minutes}m`
}
