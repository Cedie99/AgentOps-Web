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
    const { orderId, assignType, assigneeId, deliveryDate } = await request.json()

    if (!orderId || !assignType || !assigneeId) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, assignType, assigneeId' },
        { status: 400 }
      )
    }

    if (assignType === 'DELIVERY' && !deliveryDate) {
      return NextResponse.json(
        { error: 'Missing required field: deliveryDate for delivery assignment' },
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
      // Update transaction status to PROCESSING
      const updatedTransaction = await prisma.transaction.update({
        where: { id: orderId },
        data: {
          status: 'PROCESSING'
        }
      })

      // Get transaction items for the delivery order (items removed from schema)
      const totalItems = 0
      const itemsDescription = 'Items not tracked'

      // Generate delivery order number
      const year = new Date().getFullYear()
      const lastDelivery = await prisma.deliveryOrder.findFirst({
        where: {
          order_number: {
            startsWith: `DO-${year}-`
          }
        },
        orderBy: { created_at: 'desc' }
      })

      let newSequence = '0001'
      if (lastDelivery) {
        const lastSeq = parseInt(lastDelivery.order_number.split('-')[2])
        newSequence = (lastSeq + 1).toString().padStart(4, '0')
      }
      const orderNumber = `DO-${year}-${newSequence}`

      // Create delivery order using raw SQL since Prisma model might not have all fields
      await prisma.$executeRaw`
        INSERT INTO delivery_orders (
          order_number,
          transaction_id,
          store_name,
          delivery_address,
          contact_number,
          contact_person,
          special_instructions,
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
          ${transaction.store_name},
          ${transaction.survey?.address || transaction.store_name},
          ${transaction.survey?.contact_number || ''},
          ${transaction.survey?.contact_person || ''},
          ${transaction.admin_notes || null},
          ${user.id},
          ${assigneeId},
          ${new Date()},
          ${new Date(deliveryDate)},
          ${totalItems},
          ${itemsDescription},
          'ASSIGNED'
        )
      `

      // Fetch the created delivery order to return
      const deliveryOrder = await prisma.$queryRaw`
        SELECT * FROM delivery_orders WHERE order_number = ${orderNumber}
      ` as any[]

      return NextResponse.json({
        success: true,
        message: 'Order assigned to delivery successfully',
        transaction: updatedTransaction,
        deliveryOrder: deliveryOrder[0]
      })
    } else {
      // Assign to collector - just update the status for now
      const updatedTransaction = await prisma.transaction.update({
        where: { id: orderId },
        data: {
          status: 'PROCESSING'
        }
      })

      // TODO: Create collection order if needed

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
