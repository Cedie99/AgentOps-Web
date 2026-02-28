import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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
        { error: 'Forbidden: Only ADMIN and SUPER_ADMIN can view analytics' },
        { status: 403 }
      )
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build date filter
    const dateFilter: any = {}
    if (dateFrom) dateFilter.gte = new Date(dateFrom)
    if (dateTo) dateFilter.lte = new Date(dateTo)

    // 1. Customer Status Distribution (Survey level)
    const customerStats = await prisma.survey.groupBy({
      by: ['customer_status'],
      _count: {
        id: true
      },
      where: dateFilter.gte ? {
        created_at: dateFilter
      } : undefined
    })

    // 2. Order Status Distribution
    const orderStatusStats = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        id: true
      },
      _sum: {
        total_amount: true
      },
      where: dateFilter.gte ? {
        created_at: dateFilter
      } : undefined
    })

    // 3. Sales Agent Performance
    const salesAgentStats = await prisma.order.groupBy({
      by: ['sales_agent_id'],
      _count: {
        id: true
      },
      _sum: {
        total_amount: true,
        amount_paid: true,
        balance: true
      },
      where: dateFilter.gte ? {
        created_at: dateFilter
      } : undefined
    })

    // Get agent names
    const agentIds = salesAgentStats.map(s => s.sales_agent_id)
    const agents = await prisma.user.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, name: true }
    })

    const salesAgentPerformance = salesAgentStats.map(stat => {
      const agent = agents.find(a => a.id === stat.sales_agent_id)
      return {
        agentId: stat.sales_agent_id,
        agentName: agent?.name || 'Unknown',
        orderCount: stat._count.id,
        totalSales: stat._sum.total_amount || 0,
        amountCollected: stat._sum.amount_paid || 0,
        outstandingBalance: stat._sum.balance || 0,
        collectionRate: stat._sum.total_amount
          ? ((Number(stat._sum.amount_paid || 0)) / Number(stat._sum.total_amount) * 100).toFixed(2)
          : 0
      }
    }).sort((a, b) => Number(b.totalSales) - Number(a.totalSales))

    // 4. Revenue Metrics
    const revenueMetrics = await prisma.order.aggregate({
      _sum: {
        total_amount: true,
        amount_paid: true,
        balance: true
      },
      _count: {
        id: true
      },
      where: dateFilter.gte ? {
        created_at: dateFilter
      } : undefined
    })

    // 5. Conversion Funnel
    const totalSurveys = await prisma.survey.count({
      where: dateFilter.gte ? { created_at: dateFilter } : undefined
    })

    const surveysWithOrders = await prisma.survey.count({
      where: {
        orders: {
          some: {}
        },
        ...(dateFilter.gte ? { created_at: dateFilter } : {})
      }
    })

    const newCustomers = await prisma.survey.count({
      where: {
        customer_status: 'NEW',
        ...(dateFilter.gte ? { created_at: dateFilter } : {})
      }
    })

    const existingCustomers = await prisma.survey.count({
      where: {
        customer_status: 'EXISTING',
        ...(dateFilter.gte ? { created_at: dateFilter } : {})
      }
    })

    // 6. Payment Terms Distribution
    const paymentTermsStats = await prisma.order.groupBy({
      by: ['payment_terms'],
      _count: {
        id: true
      },
      _sum: {
        total_amount: true
      },
      where: dateFilter.gte ? {
        created_at: dateFilter
      } : undefined
    })

    // 7. Recent Orders Timeline (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentOrders = await prisma.order.findMany({
      where: {
        created_at: {
          gte: thirtyDaysAgo
        }
      },
      select: {
        created_at: true,
        total_amount: true,
        status: true
      },
      orderBy: {
        created_at: 'asc'
      }
    })

    // Group by date
    const ordersByDate = recentOrders.reduce((acc, order) => {
      const date = order.created_at.toISOString().split('T')[0]
      if (!acc[date]) {
        acc[date] = { count: 0, totalAmount: 0 }
      }
      acc[date].count++
      acc[date].totalAmount += Number(order.total_amount)
      return acc
    }, {} as Record<string, { count: number; totalAmount: number }>)

    // 8. Top Performing Stores
    const topStores = await prisma.order.groupBy({
      by: ['survey_id'],
      _count: {
        id: true
      },
      _sum: {
        total_amount: true
      },
      where: dateFilter.gte ? {
        created_at: dateFilter
      } : undefined,
      orderBy: {
        _sum: {
          total_amount: 'desc'
        }
      },
      take: 10
    })

    const storeIds = topStores.map(s => s.survey_id)
    const stores = await prisma.survey.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, store_name: true, address: true, city: true }
    })

    const topStoresWithNames = topStores.map(stat => {
      const store = stores.find(s => s.id === stat.survey_id)
      return {
        surveyId: stat.survey_id,
        storeName: store?.store_name || 'Unknown',
        city: store?.city || 'N/A',
        orderCount: stat._count.id,
        totalRevenue: stat._sum.total_amount || 0
      }
    })

    // Return comprehensive analytics
    return NextResponse.json({
      summary: {
        totalOrders: revenueMetrics._count.id,
        totalRevenue: revenueMetrics._sum.total_amount || 0,
        amountCollected: revenueMetrics._sum.amount_paid || 0,
        outstandingBalance: revenueMetrics._sum.balance || 0,
        collectionRate: revenueMetrics._sum.total_amount
          ? ((Number(revenueMetrics._sum.amount_paid || 0)) / Number(revenueMetrics._sum.total_amount) * 100).toFixed(2)
          : 0
      },
      customerStats: {
        total: totalSurveys,
        withOrders: surveysWithOrders,
        prospects: totalSurveys - newCustomers - existingCustomers,
        new: newCustomers,
        existing: existingCustomers,
        conversionRate: totalSurveys > 0
          ? ((surveysWithOrders / totalSurveys) * 100).toFixed(2)
          : 0
      },
      orderStatusDistribution: orderStatusStats.map(stat => ({
        status: stat.status,
        count: stat._count.id,
        totalAmount: stat._sum.total_amount || 0
      })),
      salesAgentPerformance,
      paymentTermsDistribution: paymentTermsStats.map(stat => ({
        paymentTerms: stat.payment_terms,
        count: stat._count.id,
        totalAmount: stat._sum.total_amount || 0
      })),
      orderTimeline: Object.entries(ordersByDate).map(([date, data]) => ({
        date,
        orderCount: data.count,
        totalAmount: data.totalAmount
      })),
      topStores: topStoresWithNames
    })
  } catch (error: any) {
    console.error('Error fetching pipeline analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error.message },
      { status: 500 }
    )
  }
}
