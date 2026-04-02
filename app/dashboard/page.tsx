import { prisma } from '@/lib/prisma'
import Dashboard from '@/components/dashboard/Dashboard'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

async function getDashboardStats() {
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(now.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

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
    prisma.survey.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'ASSIGNED_DELIVERY' } }),
    prisma.collection.count(),
    prisma.user.count({ where: { agent_status: 'ON_FIELD' } }),
    prisma.user.count({
      where: { status: 'ACTIVE', role: { notIn: ['SUPER_ADMIN', 'ADMIN'] } },
    }),
    prisma.user.findMany({
      where: { role: { notIn: ['SUPER_ADMIN', 'ADMIN'] }, status: 'ACTIVE' },
      select: { name: true, role: true, active_tasks_count: true },
      orderBy: { active_tasks_count: 'desc' },
      take: 5,
    }),
    prisma.survey.findMany({
      where: { captured_at: { gte: sevenDaysAgo } },
      select: { captured_at: true },
    }),
    prisma.order.findMany({
      where: { created_at: { gte: sevenDaysAgo } },
      select: { created_at: true },
    }),
    prisma.order.findMany({
      where: { status: 'DELIVERED', delivery_completed_at: { gte: sevenDaysAgo } },
      select: { delivery_completed_at: true },
    }),
  ])

  // Build 7-day trend buckets
  const trend: Record<string, { surveys: number; orders: number; deliveries: number }> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    trend[d.toDateString()] = { surveys: 0, orders: 0, deliveries: 0 }
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

  return {
    kpis: {
      surveyed_stores: surveyedStores,
      pending_sales: pendingSales,
      pending_deliveries: pendingDeliveries,
      collections: collectionsCount,
    },
    active_agents: { on_field: onFieldAgents, total: totalActiveAgents },
    activity_trends,
    top_performers: topPerformers.map((u) => ({
      name: u.name,
      role: u.role,
      count: u.active_tasks_count ?? 0,
    })),
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  return <Dashboard stats={stats} />
}
