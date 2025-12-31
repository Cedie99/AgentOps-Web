import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { role: true }
    })

    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const surveyId = parseInt(id)
    const body = await request.json()

    const {
      store_name,
      owner_name,
      contact_number,
      contact_person,
      address_line1,
      address_line2,
      address_line3,
      city,
      province,
      landmark,
      customer_status
    } = body

    // Update survey
    const updatedSurvey = await prisma.survey.update({
      where: { id: surveyId },
      data: {
        store_name,
        owner_name: owner_name || null,
        contact_number,
        contact_person: contact_person || null,
        address: `${address_line1}, ${address_line2}${address_line3 ? ', ' + address_line3 : ''}, ${city}, ${province}`,
        address_line1,
        address_line2,
        address_line3: address_line3 || null,
        city,
        province,
        landmark: landmark || null,
        customer_status,
        updated_at: new Date()
      }
    })

    return NextResponse.json({
      message: 'Survey updated successfully',
      survey: updatedSurvey
    })

  } catch (error) {
    console.error('Error updating survey:', error)
    return NextResponse.json(
      { error: 'Failed to update survey' },
      { status: 500 }
    )
  }
}
