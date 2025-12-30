import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all stores
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const customerType = searchParams.get('customerType')

    const where: any = {}
    if (status) where.status = status
    if (customerType) where.customer_type = customerType

    const stores = await prisma.store.findMany({
      where,
      include: {
        timeline: {
          orderBy: { timestamp: 'desc' },
        },
        visit_history: {
          orderBy: { timestamp: 'desc' },
        },
        current_user: true,
      },
      orderBy: { last_updated: 'desc' },
    })

    return NextResponse.json(stores)
  } catch (error) {
    console.error('Error fetching stores:', error)
    return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 })
  }
}

// POST create new store
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const store = await prisma.store.create({
      data: {
        name: body.name,
        address: body.address,
        lat: body.lat,
        lng: body.lng,
        status: body.status || 'PENDING',
        customerType: body.customerType || 'PROSPECT',
        orderValue: body.orderValue,
        collectionAmount: body.collectionAmount,
      },
    })

    return NextResponse.json(store, { status: 201 })
  } catch (error) {
    console.error('Error creating store:', error)
    return NextResponse.json({ error: 'Failed to create store' }, { status: 500 })
  }
}
