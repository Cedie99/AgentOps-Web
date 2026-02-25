import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET activities (surveys + visit logs) for a user on a specific date
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')
    const date = searchParams.get('date') // YYYY-MM-DD format

    if (!userId || !date) {
      return NextResponse.json({ error: 'Missing user_id or date parameter' }, { status: 400 })
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({
        error: 'Invalid date format',
        details: `Expected YYYY-MM-DD, received: ${date}`
      }, { status: 400 })
    }

    const userIdInt = parseInt(userId)

    // Date range for the entire day
    const startOfDay = new Date(date + 'T00:00:00.000Z')
    const endOfDay = new Date(date + 'T23:59:59.999Z')

    console.log('🔍 Fetching activities for:', {
      userId: userIdInt,
      date,
      startOfDay: startOfDay.toISOString(),
      endOfDay: endOfDay.toISOString()
    })

    // Fetch surveys submitted on this date by this user
    const surveys = await prisma.survey.findMany({
      where: {
        surveyor_id: userIdInt,
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        store_name: true,
        owner_name: true,
        contact_number: true,
        gps_latitude: true,
        gps_longitude: true,
        created_at: true,
        address: true,
        city: true,
        customer_status: true,
        store_photo_url: true,
      },
      orderBy: {
        created_at: 'asc',
      },
    })

    // Fetch visit logs on this date by this user
    const visitLogs = await prisma.visitLog.findMany({
      where: {
        user_id: userIdInt,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        timestamp: true,
        visit_lat: true,
        visit_lng: true,
        outcome: true,
        notes: true,
        user_role: true,
        photo_url: true,
        store: {
          select: {
            name: true,
            address: true,
          },
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    })

    // Combine and sort activities chronologically
    const activities = [
      ...surveys.map(s => ({
        id: `survey-${s.id}`,
        type: 'survey' as const,
        timestamp: s.created_at,
        latitude: s.gps_latitude,
        longitude: s.gps_longitude,
        title: s.store_name,
        description: s.address,
        city: s.city,
        owner_name: s.owner_name,
        contact_number: s.contact_number,
        status: s.customer_status,
        photo_url: s.store_photo_url,
      })),
      ...visitLogs.map(v => ({
        id: `visit-${v.id}`,
        type: 'visit' as const,
        timestamp: v.timestamp,
        latitude: v.visit_lat,
        longitude: v.visit_lng,
        title: v.store?.name || 'Store Visit',
        description: v.outcome,
        notes: v.notes,
        role: v.user_role,
        photo_url: v.photo_url,
      })),
    ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    console.log('✅ Activities found:', {
      surveys: surveys.length,
      visitLogs: visitLogs.length,
      total: activities.length,
      activities: activities.map(a => ({
        type: a.type,
        title: a.title,
        timestamp: a.timestamp
      }))
    })

    return NextResponse.json({
      activities,
      count: activities.length,
    })
  } catch (error: any) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({
      error: 'Failed to fetch activities',
      details: error.message
    }, { status: 500 })
  }
}
