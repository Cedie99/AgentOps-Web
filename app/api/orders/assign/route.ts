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
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can assign orders' },
        { status: 403 }
      )
    }

    // Get request body
    const { orderId, assignType, assigneeId } = await request.json()

    if (!orderId || !assignType || !assigneeId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, assignType, assigneeId' },
        { status: 400 }
      )
    }

    if (!['DELIVERY', 'COLLECTOR'].includes(assignType)) {
      return NextResponse.json(
        { error: 'assignType must be DELIVERY or COLLECTOR' },
        { status: 400 }
      )
    }

    // Verify assignee exists and has correct role
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId },
      select: { id: true, name: true, role: true }
    })

    if (!assignee) {
      return NextResponse.json({ error: 'Assignee not found' }, { status: 404 })
    }

    const expectedRole = assignType === 'DELIVERY' ? 'DELIVERY' : 'COLLECTOR'
    if (assignee.role !== expectedRole) {
      return NextResponse.json(
        { error: `User must have ${expectedRole} role` },
        { status: 400 }
      )
    }

    // Get the transaction with full details
    const transaction = await prisma.transaction.findUnique({
      where: { id: orderId },
      include: {
        survey: true
      }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (transaction.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only APPROVED orders can be assigned' },
        { status: 400 }
      )
    }

    if (assignType === 'DELIVERY') {
      // Assign to delivery
      const updatedTransaction = await prisma.transaction.update({
        where: { id: orderId },
        data: {
          assigned_to_delivery: assigneeId,
          delivery_assigned_at: new Date(),
          status: 'PROCESSING'
        }
      })

      // Check if delivery order exists, if not create one
      let deliveryOrder = await prisma.$queryRaw`
        SELECT * FROM delivery_orders WHERE transaction_id = ${orderId} LIMIT 1
      ` as any[]

      if (!deliveryOrder || deliveryOrder.length === 0) {
        // Generate delivery order number
        const year = new Date().getFullYear()
        const lastDelivery = await prisma.$queryRaw`
          SELECT order_number FROM delivery_orders
          WHERE order_number LIKE ${`DO-${year}-%`}
          ORDER BY created_at DESC
          LIMIT 1
        ` as any[]

        let newSequence = '0001'
        if (lastDelivery && lastDelivery.length > 0) {
          const lastNumber = lastDelivery[0].order_number
          const lastSeq = parseInt(lastNumber.split('-')[2])
          newSequence = (lastSeq + 1).toString().padStart(4, '0')
        }
        const orderNumber = `DO-${year}-${newSequence}`

        // Create delivery order
        await prisma.$executeRaw`
          INSERT INTO delivery_orders (
            order_number,
            transaction_id,
            survey_id,
            store_name,
            delivery_address,
            contact_number,
            contact_person,
            gps_latitude,
            gps_longitude,
            created_by,
            assigned_to,
            assigned_at,
            delivery_date,
            total_items,
            items_description,
            status
          ) VALUES (
            ${orderNumber},
            ${orderId},
            ${transaction.survey_id},
            ${transaction.store_name},
            ${transaction.survey?.address || ''},
            ${transaction.survey?.contact_number || ''},
            ${transaction.survey?.contact_person || ''},
            ${transaction.survey?.gps_latitude || null},
            ${transaction.survey?.gps_longitude || null},
            ${user.id},
            ${assigneeId},
            ${new Date()},
            ${transaction.delivery_date || new Date()},
            ${transaction.total_items},
            ${transaction.items_description},
            'ASSIGNED'
          )
        `
      } else {
        // Update existing delivery order
        await prisma.$executeRaw`
          UPDATE delivery_orders
          SET assigned_to = ${assigneeId},
              assigned_at = ${new Date()},
              status = 'ASSIGNED'
          WHERE transaction_id = ${orderId}
        `
      }

      return NextResponse.json({
        success: true,
        message: 'Order assigned to delivery successfully',
        transaction: updatedTransaction
      })
    } else {
      // Assign to collector
      const updatedTransaction = await prisma.transaction.update({
        where: { id: orderId },
        data: {
          assigned_to_collector: assigneeId,
          collector_assigned_at: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Order assigned to collector successfully',
        transaction: updatedTransaction
      })
    }
  } catch (error: any) {
    console.error('Error assigning order:', error)
    return NextResponse.json(
      { error: 'Failed to assign order', details: error.message },
      { status: 500 }
    )
  }
}
