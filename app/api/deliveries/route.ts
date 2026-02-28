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

    // Get user with ID and role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only DELIVERY role can access this endpoint
    if (user.role !== 'DELIVERY') {
      return NextResponse.json(
        { error: 'Forbidden: Only DELIVERY users can access this endpoint' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const assigned_to = searchParams.get('assigned_to')

    // Build where clause
    const whereClause: any = {
      assigned_to: assigned_to ? parseInt(assigned_to) : user.id
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status
    }

    // Check if we should use new Order system or old DeliveryOrder system
    // Try to fetch from Order table first (new system)
    const orders = await prisma.order.findMany({
      where: {
        delivery_assigned_to: whereClause.assigned_to,
        ...(status ? { status } : {})
      },
      include: {
        sales_agent: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        survey: {
          select: {
            id: true,
            store_name: true,
            contact_number: true,
            contact_person: true,
            address: true,
            city: true,
            province: true,
            landmark: true,
            gps_latitude: true,
            gps_longitude: true,
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    // If we have orders from new system, return them
    if (orders.length > 0) {
      return NextResponse.json({ deliveries: orders })
    }

    // Otherwise, fall back to old DeliveryOrder table with survey relation
    const deliveryOrders = await prisma.deliveryOrder.findMany({
      where: whereClause,
      include: {
        assigned_user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        created_by_user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        transaction: {
          select: {
            id: true,
            transaction_number: true,
            total_amount: true,
          }
        }
      },
      orderBy: [
        { completed_at: 'desc' },
        { delivery_date: 'asc' },
        { created_at: 'desc' },
      ],
    })

    // Transform to match expected interface
    const transformedDeliveries = deliveryOrders.map((delivery: any) => ({
      ...delivery,
      assignee: delivery.assigned_user ? {
        id: delivery.assigned_user.id,
        name: delivery.assigned_user.name,
      } : undefined,
    }))

    return NextResponse.json({ deliveries: transformedDeliveries })
  } catch (error: any) {
    console.error('Error fetching deliveries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deliveries', details: error.message },
      { status: 500 }
    )
  }
}
