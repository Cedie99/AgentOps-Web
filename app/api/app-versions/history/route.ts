import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Fetch version change history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where = platform ? { platform } : {}

    const history = await prisma.appVersionHistory.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
    })

    return NextResponse.json(history)
  } catch (error) {
    console.error('Error fetching version history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch version history' },
      { status: 500 }
    )
  }
}
