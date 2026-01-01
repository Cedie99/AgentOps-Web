import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch single delivery by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid delivery ID' },
        { status: 400 }
      );
    }

    const delivery = await prisma.deliveryOrder.findUnique({
      where: { id },
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
    });

    if (!delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Transform the response to match the expected interface
    const transformedDelivery = {
      ...delivery,
      assignee: delivery.assigned_user ? {
        id: delivery.assigned_user.id,
        name: delivery.assigned_user.name,
      } : undefined,
    };

    return NextResponse.json({ delivery: transformedDelivery }, { status: 200 });
  } catch (error) {
    console.error('Error fetching delivery:', error);
    return NextResponse.json(
      { error: 'Failed to fetch delivery' },
      { status: 500 }
    );
  }
}
