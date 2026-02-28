import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch orders for collectors (mobile app) or all collections (admin web)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If COLLECTOR role, return stores grouped by survey with aggregated balances
    if (user.role === 'COLLECTOR') {
      const orders = await prisma.order.findMany({
        where: {
          collector_assigned_to: user.id,
          balance: {
            gt: 0 // Only orders with outstanding balance
          }
        },
        include: {
          survey: {
            select: {
              id: true,
              store_name: true,
              address: true,
              contact_number: true,
              contact_person: true,
              city: true,
              gps_latitude: true,
              gps_longitude: true,
            }
          },
          sales_agent: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          collections: {
            where: {
              collector_id: user.id
            },
            orderBy: {
              created_at: 'desc'
            }
          }
        },
        orderBy: {
          collector_assigned_at: 'desc'
        }
      })

      // Group orders by store and calculate totals
      const storeMap = new Map<string, any>()

      orders.forEach(order => {
        const storeKey = order.survey_id?.toString() || order.store_name
        if (!storeMap.has(storeKey)) {
          storeMap.set(storeKey, {
            id: order.survey_id || order.id,
            store_name: order.survey?.store_name || order.store_name,
            address: order.survey?.address || 'N/A',
            contact_person: order.survey?.contact_person || null,
            total_balance: 0,
            last_collection_date: order.collector_assigned_at,
            transaction_count: 0,
            orders: []
          })
        }

        const store = storeMap.get(storeKey)!
        store.total_balance += parseFloat(order.balance.toString())
        store.transaction_count += 1
        store.orders.push(order)
      })

      const stores = Array.from(storeMap.values())
        .filter(store => store.total_balance > 0)
        .sort((a, b) => b.total_balance - a.total_balance)

      return NextResponse.json({ stores })
    }

    // If ADMIN/SUPER_ADMIN, return all collections
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      const collections = await prisma.collection.findMany({
        include: {
          order: {
            include: {
              survey: {
                select: {
                  store_name: true,
                  address: true,
                }
              },
              sales_agent: {
                select: {
                  name: true,
                }
              }
            }
          },
          collector: {
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

      return NextResponse.json({ collections })
    }

    return NextResponse.json(
      { error: 'Forbidden: Invalid role for collections access' },
      { status: 403 }
    )
  } catch (error: any) {
    console.error('Error fetching collections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch collections', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Record a collection (mobile app)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user (must be COLLECTOR role)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role !== 'COLLECTOR') {
      return NextResponse.json(
        { error: 'Forbidden: Only COLLECTOR role can record collections' },
        { status: 403 }
      )
    }

    // Get request body
    const {
      orderId,
      amountCollected,
      paymentMethod,
      receiptImageUrl,
      gpsLatitude,
      gpsLongitude,
      notes
    } = await request.json()

    // Validate required fields
    if (!orderId || !amountCollected || !paymentMethod || !receiptImageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify order exists and is assigned to this collector
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        collector_assigned_to: true,
        balance: true,
        total_amount: true,
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.collector_assigned_to !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden: Order not assigned to you' },
        { status: 403 }
      )
    }

    // Validate amount
    const collected = parseFloat(amountCollected)
    if (collected <= 0) {
      return NextResponse.json(
        { error: 'Amount collected must be greater than 0' },
        { status: 400 }
      )
    }

    if (collected > Number(order.balance)) {
      return NextResponse.json(
        { error: `Amount collected (${collected}) exceeds outstanding balance (${order.balance})` },
        { status: 400 }
      )
    }

    // Create collection record
    const collection = await prisma.collection.create({
      data: {
        order_id: orderId,
        collector_id: user.id,
        amount_collected: collected,
        payment_method: paymentMethod,
        receipt_image_url: receiptImageUrl,
        gps_latitude: gpsLatitude,
        gps_longitude: gpsLongitude,
        notes: notes || null,
      },
      include: {
        order: {
          select: {
            order_number: true,
            balance: true,
          }
        }
      }
    })

    // Note: The trigger will automatically update the order's amount_paid, balance, and status

    return NextResponse.json({
      success: true,
      message: 'Collection recorded successfully',
      collection,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error recording collection:', error)
    return NextResponse.json(
      { error: 'Failed to record collection', details: error.message },
      { status: 500 }
    )
  }
}
