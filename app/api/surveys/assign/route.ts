import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has ADMIN or SUPER_ADMIN role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    })

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can assign surveys' },
        { status: 403 }
      )
    }

    // Get request body
    const { surveyId, salesUserId } = await request.json()

    if (!surveyId || !salesUserId) {
      return NextResponse.json(
        { error: 'Missing required fields: surveyId, salesUserId' },
        { status: 400 }
      )
    }

    // Verify the sales user exists and has SALES role
    const salesUser = await prisma.user.findUnique({
      where: { id: salesUserId },
      select: { id: true, name: true, role: true }
    })

    if (!salesUser) {
      return NextResponse.json({ error: 'Sales user not found' }, { status: 404 })
    }

    if (salesUser.role !== 'SALES') {
      return NextResponse.json(
        { error: 'User must have SALES role' },
        { status: 400 }
      )
    }

    // Get admin user ID
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    })

    // Update the survey with assignment
    const updatedSurvey = await prisma.survey.update({
      where: { id: surveyId },
      data: {
        assigned_to_id: salesUser.id,
        assigned_to_name: salesUser.name,
        assigned_at: new Date(),
      },
      include: {
        surveyor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        },
        assigned_to: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          }
        }
      }
    })

    // Create survey_assignment record for mobile app tracking
    await prisma.$executeRaw`
      INSERT INTO survey_assignments (survey_id, sales_agent_id, assigned_by, status)
      VALUES (${surveyId}, ${salesUser.id}, ${adminUser?.id}, 'ACTIVE')
      ON CONFLICT (survey_id, sales_agent_id) DO UPDATE
      SET assigned_at = CURRENT_TIMESTAMP, status = 'ACTIVE'
    `

    return NextResponse.json({ survey: updatedSurvey })
  } catch (error: any) {
    console.error('Error assigning survey:', error)
    return NextResponse.json(
      { error: 'Failed to assign survey', details: error.message },
      { status: 500 }
    )
  }
}
