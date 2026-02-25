import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single store
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const store = await prisma.store.findUnique({
      where: { id: parseInt(id) },
      include: {
        visit_history: {
          orderBy: { timestamp: 'desc' },
        },
        current_user: true,
      },
    })

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 })
    }

    return NextResponse.json(store)
  } catch (error) {
    console.error('Error fetching store:', error)
    return NextResponse.json({ error: 'Failed to fetch store' }, { status: 500 })
  }
}

// PATCH update store
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const store = await prisma.store.update({
      where: { id: parseInt(id) },
      data: {
        ...body,
        lastUpdated: new Date(),
      },
    })

    return NextResponse.json(store)
  } catch (error) {
    console.error('Error updating store:', error)
    return NextResponse.json({ error: 'Failed to update store' }, { status: 500 })
  }
}

// DELETE store
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.store.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: 'Store deleted successfully' })
  } catch (error) {
    console.error('Error deleting store:', error)
    return NextResponse.json({ error: 'Failed to delete store' }, { status: 500 })
  }
}
