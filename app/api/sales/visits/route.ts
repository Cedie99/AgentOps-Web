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

    // Query visit_logs. NOTE: visit_logs.store_id has no FK to surveys, so we
    // cannot use a PostgREST embed — we join to surveys manually below.
    let query = supabase
      .from('visit_logs')
      .select(`
        id,
        store_id,
        user_id,
        user_name,
        user_role,
        timestamp,
        outcome,
        location_verified,
        visit_lat,
        visit_lng,
        distance_from_store,
        photo_url,
        notes,
        check_out_time,
        check_out_photo_url,
        check_out_lat,
        check_out_lng,
        check_out_notes
      `)
      .eq('user_role', 'SALES')
      .gte('timestamp', `${date}T00:00:00Z`)
      .lte('timestamp', `${date}T23:59:59Z`)
      .order('timestamp', { ascending: true })

    if (salesAgentId) {
      query = query.eq('user_id', parseInt(salesAgentId))
    }

    const { data: rows, error } = await query

    if (error) throw new Error(error.message)

    // Manual join to surveys (store_id → surveys.id)
    const storeIds = [...new Set((rows ?? []).map((r: any) => r.store_id).filter(Boolean))]
    let storeMap: Record<number, any> = {}
    if (storeIds.length) {
      const { data: stores } = await supabase
        .from('surveys')
        .select('id, store_name, address, city, gps_latitude, gps_longitude, customer_status')
        .in('id', storeIds)
      storeMap = Object.fromEntries((stores ?? []).map((s: any) => [s.id, s]))
    }

    // Normalise store shape to match what the page expects
    const visits = (rows || []).map((v: any) => {
      const s = storeMap[v.store_id]
      return {
        ...v,
        store: s
          ? {
              id: s.id,
              name: s.store_name,
              address: s.address,
              lat: s.gps_latitude,
              lng: s.gps_longitude,
              status: s.customer_status,
              customer_type: s.customer_status,
            }
          : null,
      }
    })

    // Statistics
    const stats = {
      total_visits: visits.length,
      verified_visits: visits.filter((v: any) => v.location_verified).length,
      unverified_visits: visits.filter((v: any) => !v.location_verified).length,
      unique_agents: new Set(visits.map((v: any) => v.user_id)).size,
      unique_stores: new Set(visits.map((v: any) => v.store_id)).size,
      average_distance: visits.length > 0
        ? visits.reduce((sum: number, v: any) => sum + (v.distance_from_store || 0), 0) / visits.length
        : 0,
    }

    return NextResponse.json({ visits, stats, date })
  } catch (error: any) {
    console.error('Error fetching sales visits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales visits', details: error.message },
      { status: 500 }
    )
  }
}
