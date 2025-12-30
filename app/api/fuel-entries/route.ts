import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all fuel entries
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vehicleId = searchParams.get('vehicleId')

    const where: any = {}
    if (vehicleId) where.vehicleId = vehicleId

    const fuelEntries = await prisma.fuelEntry.findMany({
      where,
      include: {
        vehicle: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(fuelEntries)
  } catch (error) {
    console.error('Error fetching fuel entries:', error)
    return NextResponse.json({ error: 'Failed to fetch fuel entries' }, { status: 500 })
  }
}

// POST create new fuel entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const fuelEntry = await prisma.fuelEntry.create({
      data: {
        vehicleId: body.vehicleId,
        liters: body.liters,
        cost: body.cost,
        loggedBy: body.loggedBy,
        userId: body.userId,
        date: body.date ? new Date(body.date) : new Date(),
      },
    })

    return NextResponse.json(fuelEntry, { status: 201 })
  } catch (error) {
    console.error('Error creating fuel entry:', error)
    return NextResponse.json({ error: 'Failed to create fuel entry' }, { status: 500 })
  }
}
