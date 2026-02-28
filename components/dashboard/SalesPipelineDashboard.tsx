'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPaymentTerms } from '@/lib/format-payment-terms'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Trophy,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle
} from 'lucide-react'

interface PipelineData {
  summary: {
    totalOrders: number
    totalRevenue: number
    amountCollected: number
    outstandingBalance: number
    collectionRate: string
  }
  customerStats: {
    total: number
    withOrders: number
    prospects: number
    new: number
    existing: number
    conversionRate: string
  }
  orderStatusDistribution: Array<{
    status: string
    count: number
    totalAmount: number
  }>
  salesAgentPerformance: Array<{
    agentId: number
    agentName: string
    orderCount: number
    totalSales: number
    amountCollected: number
    outstandingBalance: number
    collectionRate: string
  }>
  paymentTermsDistribution: Array<{
    paymentTerms: string
    count: number
    totalAmount: number
  }>
  topStores: Array<{
    surveyId: number
    storeName: string
    city: string
    orderCount: number
    totalRevenue: number
  }>
}

export default function SalesPipelineDashboard() {
  const [data, setData] = useState<PipelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [monthOptions, setMonthOptions] = useState<Array<{ value: string; label: string }>>([])

  // Initialize month options and selected month on client side only
  useEffect(() => {
    const options = []
    const now = new Date()
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      options.push({ value, label })
    }
    setMonthOptions(options)
    setSelectedMonth(options[0].value)
  }, [])

  useEffect(() => {
    if (selectedMonth) {
      fetchAnalytics()
    }
  }, [selectedMonth])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      // Parse selected month to get date range
      const [year, month] = selectedMonth.split('-')
      const dateFrom = new Date(parseInt(year), parseInt(month) - 1, 1)
      const dateTo = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

      const params = new URLSearchParams({
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString()
      })

      const response = await fetch(`/api/analytics/pipeline?${params}`)
      const result = await response.json()
      if (response.ok) {
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div>
          <div className="h-9 w-64 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>

        {/* Key Metrics Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-32 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Customer Lifecycle Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-80 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-2 w-full bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Additional Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 w-40 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-64 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-muted-foreground">No data available</div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Overview</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From {data.summary.totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Amount Collected</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.amountCollected)}</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.collectionRate}% collection rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
            <Package className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.summary.outstandingBalance)}</div>
            <p className="text-xs text-muted-foreground">
              To be collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.customerStats.conversionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {data.customerStats.withOrders} of {data.customerStats.total} prospects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Lifecycle</CardTitle>
          <CardDescription>Customer progression through sales funnel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Prospects */}
            <div className="relative p-5 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/50 via-white to-blue-50/30 dark:from-blue-950/20 dark:via-gray-900 dark:to-blue-900/10 dark:border-blue-900/30 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/50">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Prospects</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {data.customerStats.prospects}
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${(data.customerStats.prospects / data.customerStats.total) * 100}%`
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {((data.customerStats.prospects / data.customerStats.total) * 100).toFixed(1)}% of total
              </p>
            </div>

            {/* New Customers */}
            <div className="relative p-5 rounded-xl border border-green-100 bg-gradient-to-br from-green-50/50 via-white to-green-50/30 dark:from-green-950/20 dark:via-gray-900 dark:to-green-900/10 dark:border-green-900/30 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-200 dark:shadow-green-900/50">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">New Customers</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {data.customerStats.new}
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${(data.customerStats.new / data.customerStats.total) * 100}%`
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {((data.customerStats.new / data.customerStats.total) * 100).toFixed(1)}% of total
              </p>
            </div>

            {/* Existing Customers */}
            <div className="relative p-5 rounded-xl border border-purple-100 bg-gradient-to-br from-purple-50/50 via-white to-purple-50/30 dark:from-purple-950/20 dark:via-gray-900 dark:to-purple-900/10 dark:border-purple-900/30 hover:shadow-lg transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-purple-900/50">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Existing Customers</span>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {data.customerStats.existing}
                </div>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-purple-400 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{
                    width: `${(data.customerStats.existing / data.customerStats.total) * 100}%`
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2 font-medium">
                {((data.customerStats.existing / data.customerStats.total) * 100).toFixed(1)}% of total
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Status & Payment Terms */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Current state of all orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.orderStatusDistribution.map((status) => (
                <div key={status.status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{status.status}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {status.count} orders
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(status.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Terms</CardTitle>
            <CardDescription>Distribution by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.paymentTermsDistribution.map((term) => (
                <div key={term.paymentTerms} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{formatPaymentTerms(term.paymentTerms)}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {term.count} orders
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {formatCurrency(term.totalAmount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Status Breakdown</CardTitle>
            <CardDescription>Quick overview of all orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.orderStatusDistribution.map((status) => {
                const getStatusIcon = (statusName: string) => {
                  switch (statusName.toUpperCase()) {
                    case 'PENDING':
                      return <Clock className="h-5 w-5 text-yellow-500" />
                    case 'APPROVED':
                      return <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    case 'CONFIRMED':
                      return <CheckCircle2 className="h-5 w-5 text-green-500" />
                    case 'DELIVERED':
                      return <Package className="h-5 w-5 text-emerald-500" />
                    case 'CANCELLED':
                      return <XCircle className="h-5 w-5 text-red-500" />
                    default:
                      return <AlertCircle className="h-5 w-5 text-gray-500" />
                  }
                }

                const getStatusColor = (statusName: string) => {
                  switch (statusName.toUpperCase()) {
                    case 'PENDING':
                      return 'bg-yellow-100 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
                    case 'APPROVED':
                      return 'bg-blue-100 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                    case 'CONFIRMED':
                      return 'bg-green-100 border-green-200 dark:bg-green-950 dark:border-green-800'
                    case 'DELIVERED':
                      return 'bg-emerald-100 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
                    case 'CANCELLED':
                      return 'bg-red-100 border-red-200 dark:bg-red-950 dark:border-red-800'
                    default:
                      return 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                  }
                }

                return (
                  <div
                    key={status.status}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${getStatusColor(status.status)} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-gray-900">
                        {getStatusIcon(status.status)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{status.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(status.totalAmount)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">{status.count}</div>
                      <div className="text-xs text-muted-foreground">
                        {((status.count / data.summary.totalOrders) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total Orders</span>
              <span className="text-xl font-bold text-foreground">{data.summary.totalOrders}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Top 5 Sales Agents
            </CardTitle>
            <CardDescription>Best performing agents for {monthOptions.find(m => m.value === selectedMonth)?.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.salesAgentPerformance.slice(0, 5).map((agent, index) => (
                <div key={agent.agentId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{agent.agentName}</div>
                      <div className="text-xs text-muted-foreground">
                        {agent.orderCount} orders • {agent.collectionRate}% collected
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(agent.totalSales)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              Top 5 Stores
            </CardTitle>
            <CardDescription>Highest revenue generating stores for {monthOptions.find(m => m.value === selectedMonth)?.label}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topStores.slice(0, 5).map((store, index) => (
                <div key={store.surveyId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{store.storeName}</div>
                      <div className="text-xs text-muted-foreground">
                        {store.city} • {store.orderCount} orders
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(store.totalRevenue)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
