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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only SALES role can access this endpoint
    if (user.role !== 'SALES') {
      return NextResponse.json(
        { error: 'Only sales agents can access assigned stores' },
        { status: 403 }
      )
    }

    // Get stores assigned to this sales agent
    const assignedStores = await prisma.store.findMany({
      where: {
        current_user_id: user.id,
        current_role: 'SALES',
        status: 'SURVEYED', // Only show surveyed stores
      },
      include: {
        visit_history: {
          where: {
            user_id: user.id,
            user_role: 'SALES',
          },
          orderBy: {
            timestamp: 'desc'
          },
          take: 1, // Get most recent visit
        },
      },
      orderBy: {
        assigned_at: 'desc'
      }
    })

    // Transform data for mobile app
    const stores = assignedStores.map(store => ({
      id: store.id,
      name: store.name,
      address: store.address,
      lat: store.lat,
      lng: store.lng,
      status: store.status,
      customer_type: store.customer_type,
      assigned_at: store.assigned_at,
      last_visit: store.visit_history[0] ? {
        id: store.visit_history[0].id,
        timestamp: store.visit_history[0].timestamp,
        outcome: store.visit_history[0].outcome,
        location_verified: store.visit_history[0].location_verified,
        visit_lat: store.visit_history[0].visit_lat,
        visit_lng: store.visit_history[0].visit_lng,
        distance_from_store: store.visit_history[0].distance_from_store,
      } : null,
    }))

    return NextResponse.json({
      stores,
      total: stores.length,
    })
  } catch (error: any) {
    console.error('Error fetching assigned stores:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assigned stores', details: error.message },
      { status: 500 }
    )
  }
}
