import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');

    // Build where clause — exclude admin roles, only show default mobile roles
    const where: any = {
      role: {
        notIn: ['SUPER_ADMIN', 'ADMIN'],
      },
    };
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        agent_status: true,
        vehicle_id: true,
        active_tasks_count: true,
        current_lat: true,
        current_lng: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
