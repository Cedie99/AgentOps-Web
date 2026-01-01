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
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can approve orders' },
        { status: 403 }
      )
    }

    // Get request body
    const { orderId, action, notes } = await request.json()

    if (!orderId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, action' },
        { status: 400 }
      )
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be APPROVE or REJECT' },
        { status: 400 }
      )
    }

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: orderId }
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (transaction.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Order cannot be ${action.toLowerCase()}ed. Current status: ${transaction.status}` },
        { status: 400 }
      )
    }

    // Update the transaction
    const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
    const updatedTransaction = await prisma.transaction.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        reviewed_by: user.id,
        admin_notes: notes || null,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        survey: {
          select: {
            id: true,
            store_name: true,
            address: true,
            customer_status: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: `Order ${action.toLowerCase()}ed successfully`,
      transaction: updatedTransaction
    })
  } catch (error: any) {
    console.error('Error approving order:', error)
    return NextResponse.json(
      { error: 'Failed to process order approval', details: error.message },
      { status: 500 }
    )
  }
}
