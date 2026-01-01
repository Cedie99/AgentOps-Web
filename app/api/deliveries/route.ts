import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all delivery orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const assigned_to = searchParams.get('assigned_to');
    const date_from = searchParams.get('date_from');
    const date_to = searchParams.get('date_to');

    const where: any = {};

    if (status) where.status = status;
    if (assigned_to) where.assigned_to = parseInt(assigned_to);
    if (date_from || date_to) {
      where.delivery_date = {};
      if (date_from) where.delivery_date.gte = new Date(date_from);
      if (date_to) where.delivery_date.lte = new Date(date_to);
    }

    const deliveries = await prisma.deliveryOrder.findMany({
      where,
      include: {
        assigned_user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        created_by_user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { completed_at: 'desc' },
        { delivery_date: 'asc' },
        { created_at: 'desc' },
      ],
    });

    // Transform the response to match the expected interface
    const transformedDeliveries = deliveries.map((delivery: any) => ({
      ...delivery,
      assignee: delivery.assigned_user ? {
        id: delivery.assigned_user.id,
        name: delivery.assigned_user.name,
      } : undefined,
    }));

    return NextResponse.json({ deliveries: transformedDeliveries }, { status: 200 });
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deliveries' },
      { status: 500 }
    );
  }
}

// PATCH - Update delivery status or assign delivery
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status, assigned_to, delivery_notes, failure_reason } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Delivery ID is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (status) updateData.status = status;
    if (assigned_to !== undefined) {
      updateData.assigned_to = assigned_to;
      if (assigned_to) updateData.assigned_at = new Date();
    }
    if (delivery_notes) updateData.delivery_notes = delivery_notes;
    if (failure_reason) updateData.failure_reason = failure_reason;

    const delivery = await prisma.deliveryOrder.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        assigned_user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({ delivery }, { status: 200 });
  } catch (error) {
    console.error('Error updating delivery:', error);
    return NextResponse.json(
      { error: 'Failed to update delivery' },
      { status: 500 }
    );
  }
}
