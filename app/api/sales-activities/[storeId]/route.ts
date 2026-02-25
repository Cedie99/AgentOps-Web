import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const storeId = parseInt(resolvedParams.storeId)

    if (isNaN(storeId)) {
      return NextResponse.json({ error: 'Invalid store ID' }, { status: 400 })
    }

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

    // Fetch store details
    const store = await prisma.survey.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        store_name: true,
        address: true,
        contact_number: true,
        gps_latitude: true,
        gps_longitude: true,
      }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Fetch all activities for this store
    const activities = await prisma.salesActivity.findMany({
      where: {
        survey_id: storeId
      },
      include: {
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

    return NextResponse.json({
      store,
      activities
    })
  } catch (error: any) {
    console.error('Error fetching store activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities', details: error.message },
      { status: 500 }
    )
  }
}
