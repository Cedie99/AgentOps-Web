import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication - first try session from cookies
    let session = (await supabase.auth.getSession()).data.session

    // If no session from cookies, try Authorization header (for mobile app)
    if (!session) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data: { user }, error } = await supabase.auth.getUser(token)
        if (error || !user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        // Create a minimal session object for downstream code
        session = { user } as any
      }
    }

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const { points } = await request.json()

    if (!points || !Array.isArray(points) || points.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: points array required' },
        { status: 400 }
      )
    }

    // Verify the user exists
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Validate and prepare GPS points
    const validatedPoints = points.map((point: any) => {
      if (!point.latitude || !point.longitude || !point.timestamp) {
        throw new Error('Each GPS point must have latitude, longitude, and timestamp')
      }

      return {
        user_id: point.user_id || user.id,
        attendance_id: point.attendance_id || null,
        latitude: parseFloat(point.latitude),
        longitude: parseFloat(point.longitude),
        accuracy: point.accuracy ? parseFloat(point.accuracy) : null,
        timestamp: new Date(point.timestamp),
        speed: point.speed ? parseFloat(point.speed) : null,
        heading: point.heading ? parseFloat(point.heading) : null,
        synced_at: new Date(),
      }
    })

    // Bulk insert GPS tracking points
    const result = await prisma.gpsTrackingPoint.createMany({
      data: validatedPoints,
      skipDuplicates: true,
    })

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `${result.count} GPS points recorded successfully`
    })
  } catch (error: any) {
    console.error('Error recording GPS points:', error)
    return NextResponse.json(
      { error: 'Failed to record GPS points', details: error.message },
      { status: 500 }
    )
  }
}

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
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can view GPS tracking data' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const attendanceId = searchParams.get('attendance_id')
    const fromTime = searchParams.get('from')
    const toTime = searchParams.get('to')
    const limit = searchParams.get('limit')

    // Build query
    const where: any = {}
    if (userId) where.user_id = parseInt(userId)
    if (attendanceId) where.attendance_id = parseInt(attendanceId)
    if (fromTime || toTime) {
      where.timestamp = {}
      if (fromTime) where.timestamp.gte = new Date(fromTime)
      if (toTime) where.timestamp.lte = new Date(toTime)
    }

    // Fetch GPS points
    const gpsPoints = await prisma.gpsTrackingPoint.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      },
      orderBy: {
        timestamp: 'asc'
      },
      take: limit ? parseInt(limit) : undefined,
    })

    return NextResponse.json({ gpsPoints })
  } catch (error: any) {
    console.error('Error fetching GPS points:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GPS points', details: error.message },
      { status: 500 }
    )
  }
}
