import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
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
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can review activities' },
        { status: 403 }
      )
    }

    // Get request body
    const { activityId, action, notes } = await request.json()

    if (!activityId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: activityId, action' },
        { status: 400 }
      )
    }

    if (!['APPROVE', 'REJECT', 'FLAG'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be APPROVE, REJECT, or FLAG' },
        { status: 400 }
      )
    }

    // Update the activity
    const newStatus = action === 'APPROVE' ? 'APPROVED' : action === 'REJECT' ? 'REJECTED' : 'FLAGGED'

    await prisma.$executeRaw`
      UPDATE sales_activities
      SET status = ${newStatus},
          reviewed_by = ${user.id},
          reviewed_at = ${new Date()},
          admin_notes = ${notes || null}
      WHERE id = ${activityId}
    `

    // Fetch updated activity
    const activity = await prisma.$queryRaw`
      SELECT
        sa.*,
        json_build_object(
          'id', agent.id,
          'name', agent.name,
          'email', agent.email
        ) as sales_agent,
        json_build_object(
          'id', reviewer.id,
          'name', reviewer.name
        ) as reviewed_by_user
      FROM sales_activities sa
      LEFT JOIN users agent ON sa.sales_agent_id = agent.id
      LEFT JOIN users reviewer ON sa.reviewed_by = reviewer.id
      WHERE sa.id = ${activityId}
      LIMIT 1
    ` as any[]

    if (!activity || activity.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: `Activity ${action.toLowerCase()}ed successfully`,
      activity: activity[0]
    })
  } catch (error: any) {
    console.error('Error reviewing activity:', error)
    return NextResponse.json(
      { error: 'Failed to review activity', details: error.message },
      { status: 500 }
    )
  }
}
