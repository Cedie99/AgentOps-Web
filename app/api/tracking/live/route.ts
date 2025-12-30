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

    // Get all currently active shifts (clocked in but not clocked out)
    const activeShifts = await prisma.attendance.findMany({
      where: {
        work_date: today,
        clock_out_time: null,  // Still working
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
    const liveAgents = activeShifts.map(shift => {
      const latestGps = shift.gps_points[0]

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
        current_lat: latestGps?.latitude || shift.clock_in_lat,
        current_lng: latestGps?.longitude || shift.clock_in_long,
        last_update: latestGps?.timestamp || shift.clock_in_time,
        total_distance: shift.total_distance,
        working_duration: calculateDuration(shift.clock_in_time),
      }
    })

    // Get statistics
    const stats = {
      total_active: liveAgents.length,
      by_role: liveAgents.reduce((acc, agent) => {
        acc[agent.role] = (acc[agent.role] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      total_distance: liveAgents.reduce((sum, agent) => sum + (agent.total_distance || 0), 0),
    }

    return NextResponse.json({
      agents: liveAgents,
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

// Helper function to calculate duration
function calculateDuration(startTime: Date): string {
  const now = new Date()
  const start = new Date(startTime)
  const diffMs = now.getTime() - start.getTime()

  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

  return `${hours}h ${minutes}m`
}
