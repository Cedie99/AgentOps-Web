import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Session email:', session.user.email)

    // Get user from database - search case-insensitive
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: session.user.email!,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true
      }
    })

    if (!user) {
      console.log('User not found in database for email:', session.user.email)
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
    }

    console.log('Found user:', user)
    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching current user:', error)
    return NextResponse.json(
      { error: 'Failed to fetch current user' },
      { status: 500 }
    )
  }
}
