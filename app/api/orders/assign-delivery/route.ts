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
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can assign deliveries' },
        { status: 403 }
      )
    }

    // Get request body
    const { orderId, deliveryUserId } = await request.json()

    if (!orderId || !deliveryUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, deliveryUserId' },
        { status: 400 }
      )
    }

    // Verify the delivery user exists and has DELIVERY role
    const deliveryUser = await prisma.user.findUnique({
      where: { id: deliveryUserId },
      select: { id: true, name: true, role: true }
    })

    if (!deliveryUser) {
      return NextResponse.json({ error: 'Delivery user not found' }, { status: 404 })
    }

    if (deliveryUser.role !== 'DELIVERY') {
      return NextResponse.json(
        { error: 'User must have DELIVERY role' },
        { status: 400 }
      )
    }

    // Get the order with full details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        survey: {
          select: {
            store_name: true,
            address: true,
            contact_person: true,
            contact_number: true,
            gps_latitude: true,
            gps_longitude: true,
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'APPROVED') {
      return NextResponse.json(
        { error: `Order must be APPROVED before assigning delivery. Current status: ${order.status}` },
        { status: 400 }
      )
    }

    // Generate delivery order number
    const deliveryCount = await prisma.$executeRaw`SELECT COUNT(*) FROM delivery_orders`
    const deliveryNumber = `DEL-${new Date().getFullYear()}-${String(Number(deliveryCount) + 1).padStart(6, '0')}`

    // Get today's date for delivery_date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Create delivery_orders record for mobile app (using raw SQL to avoid schema conflicts)
    await prisma.$executeRaw`
      INSERT INTO delivery_orders (
        order_number,
        transaction_id,
        status,
        delivery_date,
        items_description,
        store_name,
        delivery_address,
        contact_person,
        contact_number,
        gps_latitude,
        gps_longitude,
        assigned_to,
        assigned_at,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        ${deliveryNumber},
        ${order.id},
        'PENDING',
        ${today},
        ${order.products},
        ${order.store_name},
        ${order.delivery_address},
        ${order.contact_person},
        ${order.contact_number},
        ${order.gps_latitude},
        ${order.gps_longitude},
        ${deliveryUser.id},
        CURRENT_TIMESTAMP,
        ${user.id},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `

    // Update the order with delivery assignment
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'ASSIGNED_DELIVERY',
        delivery_assigned_to: deliveryUser.id,
        delivery_assigned_at: new Date(),
      },
      include: {
        sales_agent: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        delivery_user: {
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
      message: 'Delivery assigned successfully',
      order: updatedOrder,
      deliveryNumber
    })
  } catch (error: any) {
    console.error('Error assigning delivery:', error)
    return NextResponse.json(
      { error: 'Failed to assign delivery', details: error.message },
      { status: 500 }
    )
  }
}
