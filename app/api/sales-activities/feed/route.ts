import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true },
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const agentId = searchParams.get('agent_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const activityType = searchParams.get('activity_type')
    const search = searchParams.get('search')

    const offset = (page - 1) * PAGE_SIZE

    // agent embed works (FK exists). sales_activities.survey_id has no FK to
    // surveys, so the store is joined manually below.
    let query = supabase
      .from('sales_activities')
      .select(`
        id,
        survey_id,
        activity_type,
        activity_date,
        proof_image_url,
        notes,
        gps_latitude,
        gps_longitude,
        client_name,
        client_contact,
        updated_at,
        agent:users!sales_agent_id ( id, name, email )
      `, { count: 'exact' })
      .order('activity_date', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    if (agentId) query = query.eq('sales_agent_id', parseInt(agentId))
    if (dateFrom) query = query.gte('activity_date', `${dateFrom}T00:00:00Z`)
    if (dateTo) query = query.lte('activity_date', `${dateTo}T23:59:59Z`)
    if (activityType && activityType !== 'all') query = query.eq('activity_type', activityType)
    if (search) query = query.or(`client_name.ilike.%${search}%,notes.ilike.%${search}%`)

    const { data, error, count } = await query

    if (error) throw new Error(error.message)

    // Manual join to surveys (survey_id → surveys.id)
    const storeIds = [...new Set((data ?? []).map((r: any) => r.survey_id).filter(Boolean))]
    let storeMap: Record<number, any> = {}
    if (storeIds.length) {
      const { data: stores } = await supabase
        .from('surveys')
        .select('id, store_name, city, address')
        .in('id', storeIds)
      storeMap = Object.fromEntries((stores ?? []).map((s: any) => [s.id, s]))
    }

    const activities = (data ?? []).map((a: any) => ({
      ...a,
      store: storeMap[a.survey_id] ?? null,
    }))

    return NextResponse.json({
      activities,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / PAGE_SIZE),
    })
  } catch (error: any) {
    console.error('Error fetching activities feed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
