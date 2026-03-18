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
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can view attendance history' },
        { status: 403 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json({ error: 'Date parameter required' }, { status: 400 })
    }

    // Fetch attendance records from attendance_sessions table (used by mobile app)
    const records = await prisma.attendanceSession.findMany({
      where: {
        work_date: date
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        clock_in_time: 'asc'
      }
    })

    // Convert dates to ISO strings
    // NOTE: Database timestamps are stored as Philippine time (UTC+8) without timezone info
    // We need to treat them as Manila time, not UTC
    const serializedRecords = records.map(record => {
      // The mobile app stores Philippine local time as timestamp without timezone
      // So when we get "2026-03-18 21:25:33", it's actually 21:25 Manila time
      // We need to create an ISO string that represents this correctly

      const formatPhilippineTime = (timestamp: Date) => {
        // Database stores timestamps WITHOUT timezone, but they represent Philippine local time
        // Use UTC methods to extract the raw values which represent Philippine time
        const year = timestamp.getUTCFullYear()
        const month = String(timestamp.getUTCMonth() + 1).padStart(2, '0')
        const day = String(timestamp.getUTCDate()).padStart(2, '0')
        const hours = String(timestamp.getUTCHours()).padStart(2, '0')
        const minutes = String(timestamp.getUTCMinutes()).padStart(2, '0')
        const seconds = String(timestamp.getUTCSeconds()).padStart(2, '0')
        const ms = String(timestamp.getUTCMilliseconds()).padStart(3, '0')

        // Return ISO string with +08:00 timezone to indicate Philippine time
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}+08:00`
      }

      return {
        ...record,
        clock_in_time: formatPhilippineTime(record.clock_in_time),
        clock_out_time: record.clock_out_time ? formatPhilippineTime(record.clock_out_time) : null,
        created_at: record.created_at.toISOString(),
        updated_at: record.updated_at.toISOString()
      }
    })

    return NextResponse.json({ records: serializedRecords })
  } catch (error: any) {
    console.error('Error fetching attendance records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attendance records', details: error.message },
      { status: 500 }
    )
  }
}
