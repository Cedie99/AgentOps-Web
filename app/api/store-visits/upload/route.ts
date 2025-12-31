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

    const formData = await request.formData()
    const photo = formData.get('photo') as File
    const assignmentId = formData.get('assignment_id') as string
    const salesAgentId = formData.get('sales_agent_id') as string
    const surveyId = formData.get('survey_id') as string
    const newContactName = formData.get('new_contact_name') as string | null
    const newContactNumber = formData.get('new_contact_number') as string | null
    const newContactPosition = formData.get('new_contact_position') as string | null
    const notes = formData.get('notes') as string | null
    const visitLatitude = parseFloat(formData.get('visit_latitude') as string)
    const visitLongitude = parseFloat(formData.get('visit_longitude') as string)
    const distanceFromStore = formData.get('distance_from_store')
      ? parseFloat(formData.get('distance_from_store') as string)
      : null

    if (!photo || !assignmentId || !salesAgentId || !surveyId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Upload photo to Supabase Storage
    const timestamp = Date.now()
    const fileName = `visit_${assignmentId}_${timestamp}.jpg`

    const photoBuffer = await photo.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('store-visits')
      .upload(fileName, photoBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }

    const { data: { publicUrl } } = supabase.storage
      .from('store-visits')
      .getPublicUrl(fileName)

    // Create visit record
    await prisma.$executeRaw`
      INSERT INTO store_visits (
        assignment_id,
        sales_agent_id,
        survey_id,
        visit_photo_url,
        new_contact_name,
        new_contact_number,
        new_contact_position,
        notes,
        visit_latitude,
        visit_longitude,
        distance_from_store,
        visit_date,
        created_at,
        updated_at
      ) VALUES (
        ${parseInt(assignmentId)},
        ${parseInt(salesAgentId)},
        ${parseInt(surveyId)},
        ${publicUrl},
        ${newContactName || null},
        ${newContactNumber || null},
        ${newContactPosition || null},
        ${notes || null},
        ${visitLatitude},
        ${visitLongitude},
        ${distanceFromStore},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `

    return NextResponse.json({
      success: true,
      message: 'Store visit recorded successfully',
      photoUrl: publicUrl,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error recording store visit:', error)
    return NextResponse.json(
      { error: 'Failed to record store visit', details: error.message },
      { status: 500 }
    )
  }
}
