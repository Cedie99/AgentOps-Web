import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// DELETE announcement by ID
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    // Only ADMIN and SUPER_ADMIN can delete announcements
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Only admins can delete announcements' }, { status: 403 })
    }

    const params = await context.params
    const announcementId = parseInt(params.id)

    // Delete the announcement
    await prisma.announcement.delete({
      where: { id: announcementId }
    })

    return NextResponse.json({ message: 'Announcement deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting announcement:', error)
    return NextResponse.json({ error: 'Failed to delete announcement', details: error.message }, { status: 500 })
  }
}
