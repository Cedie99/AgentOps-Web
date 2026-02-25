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
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can view sales activities' },
        { status: 403 }
      )
    }

    // Fetch all surveys (stores) with their assigned agents and activity stats
    const surveys = await prisma.survey.findMany({
      include: {
        assigned_to: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        store_name: 'asc'
      }
    })

    // Fetch all activities to map to surveys
    const allActivities = await prisma.salesActivity.findMany({
      where: {
        survey_id: { not: null }
      },
      select: {
        id: true,
        survey_id: true,
        activity_type: true,
        activity_date: true,
        sales_agent: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        activity_date: 'desc'
      }
    })

    // Transform data to include activity stats
    const storesWithStats = surveys.map(survey => {
      // Get activities for this survey
      const surveyActivities = allActivities.filter(a => a.survey_id === survey.id)

      // Get unique agents who have recorded activities
      const agentActivityMap = new Map<number, { agent: any, count: number }>()

      surveyActivities.forEach(activity => {
        const agentId = activity.sales_agent.id
        if (agentActivityMap.has(agentId)) {
          agentActivityMap.get(agentId)!.count++
        } else {
          agentActivityMap.set(agentId, {
            agent: activity.sales_agent,
            count: 1
          })
        }
      })

      // Get most recent activity date
      const lastActivityDate = surveyActivities.length > 0
        ? surveyActivities[0].activity_date
        : null

      // Determine status based on last activity (inactive if no activity in last 7 days)
      const isActive = lastActivityDate
        ? (Date.now() - new Date(lastActivityDate).getTime()) < (7 * 24 * 60 * 60 * 1000)
        : false

      // Build assigned agents list (combine assigned_to + agents with activities)
      const assignedAgents = []

      // Add the officially assigned agent
      if (survey.assigned_to) {
        const activityData = agentActivityMap.get(survey.assigned_to.id)
        assignedAgents.push({
          id: survey.assigned_to.id,
          name: survey.assigned_to.name,
          email: survey.assigned_to.email,
          assigned_at: survey.assigned_at?.toISOString() || new Date().toISOString(),
          activity_count: activityData?.count || 0
        })
        agentActivityMap.delete(survey.assigned_to.id) // Remove from map to avoid duplicates
      }

      // Add any other agents who have activities but aren't officially assigned
      agentActivityMap.forEach((data, agentId) => {
        assignedAgents.push({
          id: data.agent.id,
          name: data.agent.name,
          email: data.agent.email,
          assigned_at: new Date().toISOString(), // Default to now since they're not officially assigned
          activity_count: data.count
        })
      })

      return {
        id: survey.id,
        store_name: survey.store_name,
        address: survey.address,
        contact_number: survey.contact_number,
        customer_status: survey.customer_status,
        gps_latitude: survey.gps_latitude,
        gps_longitude: survey.gps_longitude,
        assigned_agents: assignedAgents,
        total_activities: surveyActivities.length,
        last_activity_date: lastActivityDate?.toISOString() || null,
      }
    })

    return NextResponse.json({ stores: storesWithStats })
  } catch (error: any) {
    console.error('Error fetching stores with activity stats:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: 'Failed to fetch stores', details: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}
