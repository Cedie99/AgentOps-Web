import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
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
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can assign collectors' },
        { status: 403 }
      )
    }

    // Get request body
    const { orderId, collectorUserId } = await request.json()

    if (!orderId || !collectorUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, collectorUserId' },
        { status: 400 }
      )
    }

    // Verify the collector user exists and has COLLECTOR role
    const collectorUser = await prisma.user.findUnique({
      where: { id: collectorUserId },
      select: { id: true, name: true, role: true }
    })

    if (!collectorUser) {
      return NextResponse.json({ error: 'Collector user not found' }, { status: 404 })
    }

    if (collectorUser.role !== 'COLLECTOR') {
      return NextResponse.json(
        { error: 'User must have COLLECTOR role' },
        { status: 400 }
      )
    }

    // Get the order
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        { error: `Order must be DELIVERED before assigning collector. Current status: ${order.status}` },
        { status: 400 }
      )
    }

    // Only assign if there's a balance to collect
    if (Number(order.balance) <= 0) {
      return NextResponse.json(
        { error: 'Order has no balance to collect. Amount paid equals total amount.' },
        { status: 400 }
      )
    }

    // Update the order with collector assignment
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        collector_assigned_to: collectorUser.id,
        collector_assigned_at: new Date(),
      },
      include: {
        sales_agent: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        collector_user: {
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
            address: true,
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Collector assigned successfully',
      order: updatedOrder
    })
  } catch (error: any) {
    console.error('Error assigning collector:', error)
    return NextResponse.json(
      { error: 'Failed to assign collector', details: error.message },
      { status: 500 }
    )
  }
}
