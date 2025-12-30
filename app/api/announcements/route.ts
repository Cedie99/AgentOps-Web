import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all announcements
export async function GET() {
  try {
    const announcements = await prisma.announcement.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error('Error fetching announcements:', error)
    return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
  }
}

// POST create new announcement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const announcement = await prisma.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        target: body.target || 'All',
        priority: body.priority || 'MEDIUM',
        createdBy: body.createdBy,
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
  }
}
