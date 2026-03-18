import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collectorId = searchParams.get('collectorId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}

    if (collectorId) {
      where.collector_id = collectorId
    }

    if (startDate && endDate) {
      where.collected_at = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Fetch daily collections from database using the view
    let query = `
      SELECT *
      FROM collector_daily_collections
      WHERE 1=1
    `

    const params: any[] = []

    if (collectorId) {
      query += ` AND collector_id = $${params.length + 1}`
      params.push(parseInt(collectorId))
    }

    if (startDate && endDate) {
      query += ` AND collection_date BETWEEN $${params.length + 1} AND $${params.length + 2}`
      params.push(startDate, endDate)
    }

    query += ` ORDER BY collection_date DESC, created_at DESC LIMIT 100`

    const collections = await prisma.$queryRawUnsafe(query, ...params)

    // Transform the data - the view already includes all necessary fields
    const transformedCollections = (collections as any[]).map((c) => ({
      id: c.id,
      order_id: c.order_id,
      collector_id: c.collector_id,
      order_number: c.order_number,
      store_name: c.store_name,
      store_address: c.store_address,
      store_contact: c.store_contact,
      amount_collected: c.amount_collected ? parseFloat(c.amount_collected) : 0,
      order_total: c.order_total ? parseFloat(c.order_total) : 0,
      order_balance: c.order_balance ? parseFloat(c.order_balance) : 0,
      payment_method: c.payment_method,
      receipt_image_url: c.receipt_image_url,
      notes: c.notes,
      gps_latitude: c.gps_latitude ? parseFloat(c.gps_latitude) : null,
      gps_longitude: c.gps_longitude ? parseFloat(c.gps_longitude) : null,
      collection_date: c.collection_date,
      created_at: c.created_at,
      updated_at: c.updated_at,
      collector: c.collector_user_id
        ? {
            id: c.collector_user_id,
            name: c.collector_name,
            email: c.collector_email,
          }
        : null,
    }))

    return NextResponse.json({
      collections: transformedCollections,
      total: transformedCollections.length,
    })
  } catch (error: any) {
    console.error('Error fetching daily collections:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily collections', details: error.message },
      { status: 500 }
    )
  }
}
