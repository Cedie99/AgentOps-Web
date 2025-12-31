import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// GET store visits (all or filtered by assignment_id, sales_agent_id, date_from, date_to)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const assignmentId = searchParams.get('assignment_id')
    const salesAgentId = searchParams.get('sales_agent_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    // Build dynamic query
    let query = `
      SELECT
        sv.id,
        sv.assignment_id,
        sv.sales_agent_id,
        sv.survey_id,
        sv.visit_date,
        sv.visit_photo_url,
        sv.new_contact_name,
        sv.new_contact_number,
        sv.new_contact_position,
        sv.notes,
        sv.visit_latitude,
        sv.visit_longitude,
        sv.distance_from_store,
        sv.created_at,
        u.name as sales_agent_name,
        u.email as sales_agent_email,
        s.store_name,
        s.address,
        s.city,
        s.customer_status
      FROM store_visits sv
      LEFT JOIN users u ON sv.sales_agent_id = u.id
      LEFT JOIN surveys s ON sv.survey_id = s.id
      WHERE 1=1
    `

    const params: any[] = []

    if (assignmentId) {
      query += ` AND sv.assignment_id = $${params.length + 1}`
      params.push(parseInt(assignmentId))
    }

    if (salesAgentId) {
      query += ` AND sv.sales_agent_id = $${params.length + 1}`
      params.push(parseInt(salesAgentId))
    }

    if (dateFrom) {
      query += ` AND sv.visit_date >= $${params.length + 1}`
      params.push(new Date(dateFrom))
    }

    if (dateTo) {
      query += ` AND sv.visit_date <= $${params.length + 1}`
      params.push(new Date(dateTo))
    }

    query += ` ORDER BY sv.visit_date DESC`

    const visits = await prisma.$queryRawUnsafe(query, ...params)

    return NextResponse.json({ visits })
  } catch (error: any) {
    console.error('Error fetching store visits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch store visits', details: error.message },
      { status: 500 }
    )
  }
}

// POST create a new store visit
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
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
    } = body

    // Validate required fields
    if (!assignment_id || !sales_agent_id || !survey_id || visit_latitude === undefined || visit_longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create visit record
    const result = await prisma.$executeRaw`
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
        ${assignment_id},
        ${sales_agent_id},
        ${survey_id},
        ${visit_photo_url || null},
        ${new_contact_name || null},
        ${new_contact_number || null},
        ${new_contact_position || null},
        ${notes || null},
        ${visit_latitude},
        ${visit_longitude},
        ${distance_from_store || null},
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      )
    `

    return NextResponse.json({
      success: true,
      message: 'Store visit recorded successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error recording store visit:', error)
    return NextResponse.json(
      { error: 'Failed to record store visit', details: error.message },
      { status: 500 }
    )
  }
}
