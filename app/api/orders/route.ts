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
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can view orders' },
        { status: 403 }
      )
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get('status')
    const deliveryAssigned = searchParams.get('delivery_assigned')

    // Build where clause
    const where: any = {}

    if (statusFilter) {
      where.status = statusFilter
    }

    if (deliveryAssigned === 'true') {
      where.delivery_assigned_to = { not: null }
    } else if (deliveryAssigned === 'false') {
      where.delivery_assigned_to = null
    }

    // Fetch orders with filters
    const orders = await prisma.order.findMany({
      where,
      include: {
        sales_agent: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        survey: {
          select: {
            id: true,
            store_name: true,
            contact_number: true,
            address: true,
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
        },
        delivery_user: {
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
        collections: true,
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user (must be SALES role)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role !== 'SALES') {
      return NextResponse.json(
        { error: 'Forbidden: Only SALES agents can create orders' },
        { status: 403 }
      )
    }

    // Get request body
    const {
      surveyId,
      products,
      totalAmount,
      paymentTerms,
      amountPaid,
      deliveryAddress,
      contactPerson,
      contactNumber,
      proofImageUrl,
      gpsLatitude,
      gpsLongitude,
    } = await request.json()

    // Validate required fields
    if (!surveyId || !products || !totalAmount || !paymentTerms || !deliveryAddress || !proofImageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify survey exists and is assigned to this agent
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId },
      select: {
        id: true,
        store_name: true,
        assigned_to_id: true,
        customer_status: true,
        first_purchase_date: true,
      }
    })

    if (!survey) {
      return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
    }

    if (survey.assigned_to_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Survey not assigned to you' },
        { status: 403 }
      )
    }

    // Generate order number
    const orderCount = await prisma.order.count()
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`

    // Calculate balance
    const paid = parseFloat(amountPaid || '0')
    const total = parseFloat(totalAmount)
    const balance = total - paid

    // Create order
    const order = await prisma.order.create({
      data: {
        order_number: orderNumber,
        survey_id: surveyId,
        sales_agent_id: user.id,
        store_name: survey.store_name,
        contact_person: contactPerson,
        contact_number: contactNumber,
        delivery_address: deliveryAddress,
        products: products,
        total_amount: total,
        payment_terms: paymentTerms,
        amount_paid: paid,
        balance: balance,
        proof_image_url: proofImageUrl,
        gps_latitude: gpsLatitude,
        gps_longitude: gpsLongitude,
        status: 'PENDING',
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
          }
        }
      }
    })

    // Update survey status to NEW if this is first purchase from PROSPECT
    if (survey.customer_status === 'PROSPECT' && !survey.first_purchase_date) {
      await prisma.survey.update({
        where: { id: surveyId },
        data: {
          customer_status: 'NEW',
          first_purchase_date: new Date(),
        }
      })
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order', details: error.message },
      { status: 500 }
    )
  }
}
