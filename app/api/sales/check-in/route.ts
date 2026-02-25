import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// Calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, name: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only SALES role can check in
    if (user.role !== 'SALES') {
      return NextResponse.json(
        { error: 'Only sales agents can check in to stores' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { store_id, visit_lat, visit_lng, photo_url, notes, outcome } = body

    if (!store_id || !visit_lat || !visit_lng) {
      return NextResponse.json(
        { error: 'Missing required fields: store_id, visit_lat, visit_lng' },
        { status: 400 }
      )
    }

    // Get store details
    const store = await prisma.store.findUnique({
      where: { id: parseInt(store_id) }
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    // Verify store is assigned to this user
    if (store.current_user_id !== user.id || store.current_role !== 'SALES') {
      return NextResponse.json(
        { error: 'Store is not assigned to you' },
        { status: 403 }
      )
    }

    // Calculate distance from store
    const distance = calculateDistance(
      visit_lat,
      visit_lng,
      store.lat,
      store.lng
    )

    // Verify location (within 100 meters)
    const location_verified = distance <= 100

    // Create visit log
    const visitLog = await prisma.visitLog.create({
      data: {
        store_id: store.id,
        user_id: user.id,
        user_name: user.name,
        user_role: user.role,
        visit_lat: parseFloat(visit_lat),
        visit_lng: parseFloat(visit_lng),
        distance_from_store: distance,
        location_verified,
        photo_url: photo_url || null,
        notes: notes || null,
        outcome: outcome || 'VISITED',
      }
    })

    // Update store status if this was the first visit
    if (store.status === 'SURVEYED') {
      await prisma.store.update({
        where: { id: store.id },
        data: {
          status: 'SALES_VISITED',
          last_updated: new Date(),
        }
      })
    }

    return NextResponse.json({
      success: true,
      visit: {
        id: visitLog.id,
        timestamp: visitLog.timestamp,
        location_verified,
        distance_from_store: distance,
        message: location_verified
          ? 'Check-in successful! Location verified.'
          : `Check-in recorded but location is ${Math.round(distance)}m from store. Please get closer.`
      }
    })
  } catch (error: any) {
    console.error('Error checking in to store:', error)
    return NextResponse.json(
      { error: 'Failed to check in', details: error.message },
      { status: 500 }
    )
  }
}
