import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export async function GET() {
  try {
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(now.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    // Run all queries in parallel
    const [
      surveyedStores,
      pendingSales,
      pendingDeliveries,
      collectionsCount,
      onFieldAgents,
      totalActiveAgents,
      topPerformers,
      recentSurveys,
      recentOrders,
      recentDeliveries,
    ] = await Promise.all([
      // KPIs
      prisma.survey.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { status: 'ASSIGNED_DELIVERY' } }),
      prisma.collection.count(),

      // Active agents
      prisma.user.count({
        where: { agent_status: 'ON_FIELD' },
      }),
      prisma.user.count({
        where: {
          status: 'ACTIVE',
          role: { notIn: ['SUPER_ADMIN', 'ADMIN'] },
        },
      }),

      // Top performers by active_tasks_count
      prisma.user.findMany({
        where: {
          role: { notIn: ['SUPER_ADMIN', 'ADMIN'] },
          status: 'ACTIVE',
        },
        select: { name: true, role: true, active_tasks_count: true },
        orderBy: { active_tasks_count: 'desc' },
        take: 5,
      }),

      // Activity trends — surveys created in last 7 days
      prisma.survey.findMany({
        where: { captured_at: { gte: sevenDaysAgo } },
        select: { captured_at: true },
      }),

      // Orders created in last 7 days
      prisma.order.findMany({
        where: { created_at: { gte: sevenDaysAgo } },
        select: { created_at: true },
      }),

      // Deliveries completed in last 7 days
      prisma.order.findMany({
        where: {
          status: 'DELIVERED',
          delivery_completed_at: { gte: sevenDaysAgo },
        },
        select: { delivery_completed_at: true },
      }),
    ])

    // Build 7-day trend buckets (today and 6 days before)
    const trend: Record<string, { surveys: number; orders: number; deliveries: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toDateString()
      trend[key] = { surveys: 0, orders: 0, deliveries: 0 }
    }

    for (const s of recentSurveys) {
      const key = new Date(s.captured_at).toDateString()
      if (trend[key]) trend[key].surveys++
    }
    for (const o of recentOrders) {
      const key = new Date(o.created_at).toDateString()
      if (trend[key]) trend[key].orders++
    }
    for (const d of recentDeliveries) {
      if (!d.delivery_completed_at) continue
      const key = new Date(d.delivery_completed_at).toDateString()
      if (trend[key]) trend[key].deliveries++
    }

    const activity_trends = Object.entries(trend).map(([dateStr, counts]) => ({
      name: DAY_NAMES[new Date(dateStr).getDay()],
      ...counts,
    }))

    return NextResponse.json({
      kpis: {
        surveyed_stores: surveyedStores,
        pending_sales: pendingSales,
        pending_deliveries: pendingDeliveries,
        collections: collectionsCount,
      },
      active_agents: {
        on_field: onFieldAgents,
        total: totalActiveAgents,
      },
      activity_trends,
      top_performers: topPerformers.map((u) => ({
        name: u.name,
        role: u.role,
        count: u.active_tasks_count ?? 0,
      })),
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
  }
}
