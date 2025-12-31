import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET /api/activities - List all sales activities with filters
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
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can view all activities' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const salesAgentId = searchParams.get('salesAgentId')
    const activityType = searchParams.get('activityType')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch activities with related data
    const activities = await prisma.$queryRaw`
      SELECT
        sa.*,
        json_build_object(
          'id', agent.id,
          'name', agent.name,
          'email', agent.email,
          'role', agent.role
        ) as sales_agent,
        json_build_object(
          'id', reviewer.id,
          'name', reviewer.name,
          'email', reviewer.email
        ) as reviewed_by_user,
        json_build_object(
          'id', s.id,
          'store_name', s.store_name,
          'customer_status', s.customer_status
        ) as survey
      FROM sales_activities sa
      LEFT JOIN users agent ON sa.sales_agent_id = agent.id
      LEFT JOIN users reviewer ON sa.reviewed_by = reviewer.id
      LEFT JOIN surveys s ON sa.survey_id = s.id
      WHERE
        ${status ? prisma.$queryRaw`sa.status = ${status}` : prisma.$queryRaw`1=1`}
        AND ${salesAgentId ? prisma.$queryRaw`sa.sales_agent_id = ${parseInt(salesAgentId)}` : prisma.$queryRaw`1=1`}
        AND ${activityType ? prisma.$queryRaw`sa.activity_type = ${activityType}` : prisma.$queryRaw`1=1`}
        AND ${dateFrom ? prisma.$queryRaw`sa.activity_date >= ${new Date(dateFrom)}` : prisma.$queryRaw`1=1`}
        AND ${dateTo ? prisma.$queryRaw`sa.activity_date <= ${new Date(dateTo)}` : prisma.$queryRaw`1=1`}
      ORDER BY sa.activity_date DESC, sa.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `

    const totalCount = await prisma.$queryRaw`
      SELECT COUNT(*)::int as count
      FROM sales_activities sa
      WHERE
        ${status ? prisma.$queryRaw`sa.status = ${status}` : prisma.$queryRaw`1=1`}
        AND ${salesAgentId ? prisma.$queryRaw`sa.sales_agent_id = ${parseInt(salesAgentId)}` : prisma.$queryRaw`1=1`}
        AND ${activityType ? prisma.$queryRaw`sa.activity_type = ${activityType}` : prisma.$queryRaw`1=1`}
        AND ${dateFrom ? prisma.$queryRaw`sa.activity_date >= ${new Date(dateFrom)}` : prisma.$queryRaw`1=1`}
        AND ${dateTo ? prisma.$queryRaw`sa.activity_date <= ${new Date(dateTo)}` : prisma.$queryRaw`1=1`}
    ` as any[]

    return NextResponse.json({
      activities,
      pagination: {
        total: totalCount[0]?.count || 0,
        limit,
        offset,
        hasMore: offset + limit < (totalCount[0]?.count || 0)
      }
    })
  } catch (error: any) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities', details: error.message },
      { status: 500 }
    )
  }
}
