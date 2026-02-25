import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { role: true }
    })

    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { orderId, items, payment_terms, delivery_date, total_amount } = body

    console.log('Update request data:', { orderId, itemsCount: items?.length, payment_terms, total_amount })
    console.log('Items:', JSON.stringify(items, null, 2))

    if (!orderId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate each item has required fields
    for (const item of items) {
      if (!item.product_name || item.quantity === null || item.quantity === undefined ||
          item.unit_price === null || item.unit_price === undefined ||
          item.total_amount === null || item.total_amount === undefined) {
        console.error('Invalid item:', item)
        return NextResponse.json({
          error: 'Invalid item data - missing required fields',
          details: `Item missing required fields: ${JSON.stringify(item)}`
        }, { status: 400 })
      }
    }

    // Update the transaction
    const updatedOrder = await prisma.transaction.update({
      where: { id: orderId },
      data: {
        total_amount: parseFloat(total_amount),
        payment_terms: payment_terms,
        delivery_date: delivery_date ? new Date(delivery_date) : null,
        updated_at: new Date()
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        survey: {
          select: {
            customer_status: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Order updated successfully',
      order: updatedOrder
    })

  } catch (error: any) {
    console.error('Error updating order:', error)
    console.error('Error details:', error.message)
    return NextResponse.json(
      { error: 'Failed to update order', details: error.message },
      { status: 500 }
    )
  }
}
