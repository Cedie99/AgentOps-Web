import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all vehicles
export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      include: {
        agents: true,
        fuelEntries: {
          orderBy: { date: 'desc' },
          take: 5,
        },
      },
      orderBy: { model: 'asc' },
    })

    return NextResponse.json(vehicles)
  } catch (error) {
    console.error('Error fetching vehicles:', error)
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 })
  }
}

// POST create new vehicle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const vehicle = await prisma.vehicle.create({
      data: {
        model: body.model,
        plate: body.plate,
        totalKm: body.totalKm || 0,
        fuelRate: body.fuelRate,
        status: body.status || 'AVAILABLE',
        assignedTo: body.assignedTo,
      },
    })

    return NextResponse.json(vehicle, { status: 201 })
  } catch (error) {
    console.error('Error creating vehicle:', error)
    return NextResponse.json({ error: 'Failed to create vehicle' }, { status: 500 })
  }
}
