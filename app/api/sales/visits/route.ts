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
        { error: 'Forbidden: Only admins can view all sales visits' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const salesAgentId = searchParams.get('sales_agent_id')

    // Build where clause
    const where: any = {
      user_role: 'SALES',
      timestamp: {
        gte: new Date(`${date}T00:00:00Z`),
        lte: new Date(`${date}T23:59:59Z`),
      }
    }

    if (salesAgentId) {
      where.user_id = parseInt(salesAgentId)
    }

    // Get all sales visits for the date
    const visits = await prisma.visitLog.findMany({
      where,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            address: true,
            lat: true,
            lng: true,
            status: true,
            customer_type: true,
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    // Get statistics
    const stats = {
      total_visits: visits.length,
      verified_visits: visits.filter(v => v.location_verified).length,
      unverified_visits: visits.filter(v => !v.location_verified).length,
      unique_agents: new Set(visits.map(v => v.user_id)).size,
      unique_stores: new Set(visits.map(v => v.store_id)).size,
      average_distance: visits.length > 0
        ? visits.reduce((sum, v) => sum + (v.distance_from_store || 0), 0) / visits.length
        : 0,
    }

    return NextResponse.json({
      visits,
      stats,
      date,
    })
  } catch (error: any) {
    console.error('Error fetching sales visits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales visits', details: error.message },
      { status: 500 }
    )
  }
}
