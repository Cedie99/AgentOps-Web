import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params
    const orderId = parseInt(id)

    // Fetch order with all details including survey
    const order = await prisma.transaction.findUnique({
      where: { id: orderId },
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
            id: true,
            store_name: true,
            owner_name: true,
            contact_number: true,
            contact_person: true,
            address: true,
            address_line1: true,
            address_line2: true,
            address_line3: true,
            city: true,
            province: true,
            landmark: true,
            gps_latitude: true,
            gps_longitude: true,
            customer_status: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({ order })

  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}
