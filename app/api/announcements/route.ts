import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET all announcements (excluding expired ones)
export async function GET() {
  try {
    const now = new Date()

    const announcements = await prisma.announcement.findMany({
      where: {
        OR: [
          { expires_at: null },           // No expiration
          { expires_at: { gt: now } },    // Not yet expired
        ],
      },
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
    const supabase = await createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, role: true }
    })

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only ADMIN and SUPER_ADMIN can create announcements
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only admins can create announcements' }, { status: 403 })
    }

    const body = await request.json()

    const announcementData: any = {
      title: body.title,
      content: body.content,
      target: body.target || 'All',
      priority: body.priority || 'MEDIUM',
      requires_acknowledgment: body.requires_acknowledgment || false,
      created_by: currentUser.id,
    }

    // Add expiration date if provided
    if (body.expires_at) {
      announcementData.expires_at = new Date(body.expires_at)
    }

    const announcement = await prisma.announcement.create({
      data: announcementData,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(announcement, { status: 201 })
  } catch (error: any) {
    console.error('Error creating announcement:', error)
    return NextResponse.json({ error: 'Failed to create announcement', details: error.message }, { status: 500 })
  }
}
