'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  PackageCheck,
  Wallet,
  Truck,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  UserPlus,
  AlertCircle,
  MoreVertical,
  Activity,
  DollarSign,
  Briefcase,
  ExternalLink,
  Navigation,
  Camera,
  AlertTriangle,
  Calendar,
  Gauge,
  Fuel,
  User,
  FileText,
  Loader2,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

interface Order {
  id: number
  transaction_number: string
  store_name: string
  total_amount: number
  payment_terms: string
  status: string
  requires_delivery: boolean
  delivery_date: string | null
  created_at: string
  sales_agent: {
    id: number
    name: string
    email: string
  }
  items: Array<{
    id: number
    product_name: string
    quantity: number
    unit_price: number
    total_amount: number
  }>
}

interface DeliveryAgent {
  id: number
  name: string
  email: string
  role: string
  agent_status: string | null
  vehicle_id: number | null
  active_tasks_count: number
  current_lat: number | null
  current_lng: number | null
}

interface DeliveryOrder {
  id: number
  order_number: string
  transaction_id: number
  store_name: string
  delivery_address: string | null
  contact_number: string | null
  contact_person: string | null
  assigned_to: number | null
  delivery_date: string
  completed_at: string | null
  recipient_name: string | null
  total_items: number | null
  items_description: string
  status: string
  km_out: number | null
  km_in: number | null
  km_out_photo_url: string | null
  km_in_photo_url: string | null
  delivery_proof_photo_url: string | null
  recipient_signature_url: string | null
  started_at: string | null
  time_out: string | null
  time_in: string | null
  delivery_notes: string | null
  assignee?: {
    id: number
    name: string
  }
}

const LogisticsHub: React.FC = () => {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'delivery' | 'collection' | 'completed'>('delivery')
  const [orders, setOrders] = useState<Order[]>([])
  const [deliveredOrders, setDeliveredOrders] = useState<DeliveryOrder[]>([])
  const [agents, setAgents] = useState<DeliveryAgent[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [dispatchSuccess, setDispatchSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [deliveryDate, setDeliveryDate] = useState<string>('')
  const [agentSearchQuery, setAgentSearchQuery] = useState('')

  // Fetch approved orders and agents on mount
  useEffect(() => {
    fetchOrders()
    fetchDeliveredOrders()
    fetchAgents()
  }, [])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/orders?status=APPROVED')
      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/users?role=DELIVERY')
      const data = await response.json()
      setAgents(data.users || [])
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const fetchDeliveredOrders = async () => {
    try {
      const response = await fetch('/api/deliveries?status=DELIVERED')
      const data = await response.json()
      setDeliveredOrders(data.deliveries || [])
    } catch (error) {
      console.error('Error fetching delivered orders:', error)
    }
  }

  const handleDispatchStart = (order: Order) => {
    setSelectedOrder(order)
    setAgentSearchQuery('')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setDeliveryDate(tomorrow.toISOString().split('T')[0])
    setIsAssignModalOpen(true)
  }

  const confirmDispatch = async (agentId: number) => {
    if (!selectedOrder) return
    if (!deliveryDate) {
      alert('Please select a delivery date')
      return
    }

    try {
      const response = await fetch('/api/orders/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          assignType: 'DELIVERY',
          assigneeId: agentId,
          deliveryDate: deliveryDate,
        }),
      })

      if (response.ok) {
        setIsAssignModalOpen(false)
        setDispatchSuccess(true)
        setTimeout(() => setDispatchSuccess(false), 3000)
        fetchOrders() // Refresh the list
      } else {
        const data = await response.json()
        alert(`Failed to assign order: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error assigning order:', error)
      alert('Failed to assign order')
    }
  }

  // Filter available agents
  const availableAgents = agents.filter((a) => a.agent_status !== 'OFF_DUTY')

  // Filter agents by search query
  const filteredAgents = availableAgents.filter((agent) =>
    agent.name.toLowerCase().includes(agentSearchQuery.toLowerCase())
  )

  // Determine what to show based on active tab
  const showOrders = activeTab === 'delivery'
  const showCompleted = activeTab === 'completed'
  const showFleet = activeTab === 'fleet'
  const queue = activeTab === 'delivery' ? orders : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dispatch Command</h1>
          <p className="text-muted-foreground">
            Assign delivery and collection tasks to optimize field logistics.
          </p>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="delivery" className="gap-2">
              <Truck className="w-4 h-4" />
              Delivery Queue ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="collection" className="gap-2">
              <Wallet className="w-4 h-4" />
              Collections (0)
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed ({deliveredOrders.length})
            </TabsTrigger>
            <TabsTrigger value="fleet" className="gap-2">
              <Activity className="w-4 h-4" />
              Fleet Status ({availableAgents.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {dispatchSuccess && (
        <Alert className="bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800 font-medium">
            Task Successfully Dispatched - Personnel has been notified via their mobile
            application.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {!showFleet && (
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {activeTab === 'completed' ? 'Completed Deliveries' : 'Pending Assignments'}
            </h3>
            {activeTab === 'delivery' && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-medium text-muted-foreground">
                    HIGH PRIORITY
                  </span>
                </div>
                <Button variant="link" size="sm" className="h-auto p-0 gap-1">
                  AREA GROUPING <Navigation className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {showFleet ? (
            // Fleet Status View
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Summary Cards */}
              <Card className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-6 text-center">
                  <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                    {availableAgents.filter((a) => a.agent_status === 'AVAILABLE').length}
                  </p>
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase mt-2">
                    Idle
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <CardContent className="p-6 text-center">
                  <p className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                    {availableAgents.filter((a) => a.agent_status === 'ON_FIELD').length}
                  </p>
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400 uppercase mt-2">
                    Busy
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6 text-center">
                  <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                    {availableAgents.length}
                  </p>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase mt-2">
                    Total Agents
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6 text-center">
                  <p className="text-4xl font-bold text-slate-600 dark:text-slate-400">
                    {availableAgents.reduce((acc, a) => acc + (a.active_tasks_count || 0), 0)}
                  </p>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 uppercase mt-2">
                    Active Tasks
                  </p>
                </CardContent>
              </Card>

              {/* Agent Cards */}
              {availableAgents.map((agent) => (
                <Card
                  key={agent.id}
                  className="hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors"
                >
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                            {agent.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-bold">{agent.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {agent.vehicle_id ? `Vehicle #${agent.vehicle_id}` : 'No Vehicle'}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          agent.agent_status === 'AVAILABLE'
                            ? 'bg-emerald-500'
                            : 'bg-amber-500 animate-pulse'
                        }`}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Active Tasks</p>
                        <p className="text-2xl font-bold">{agent.active_tasks_count || 0}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          agent.active_tasks_count && agent.active_tasks_count > 2
                            ? 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
                            : 'border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400'
                        }
                      >
                        {agent.active_tasks_count && agent.active_tasks_count > 2
                          ? 'High Load'
                          : 'Optimal'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {availableAgents.length === 0 && (
                <Card className="col-span-full border-dashed">
                  <CardContent className="py-24 text-center">
                    <Truck className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Agents Available</h3>
                    <p className="text-sm text-muted-foreground">
                      No delivery agents are currently on duty.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
        ) : isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-12 h-12 rounded-xl" />
                        <div className="space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Skeleton className="h-14 rounded-lg" />
                      <Skeleton className="h-14 rounded-lg" />
                      <Skeleton className="h-14 rounded-lg" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                  </CardContent>
                </Card>
              ))}
            </div>
        ) : queue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {queue.map((order) => {
                const createdDate = new Date(order.created_at)
                const hoursSinceCreated = Math.floor(
                  (Date.now() - createdDate.getTime()) / (1000 * 60 * 60)
                )
                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0)

                return (
                  <Card
                    key={order.id}
                    className="hover:border-primary transition-colors cursor-pointer"
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl ${
                              activeTab === 'delivery'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-amber-50 text-amber-600'
                            }`}
                          >
                            {activeTab === 'delivery' ? (
                              <PackageCheck className="w-5 h-5" />
                            ) : (
                              <Wallet className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{order.store_name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {order.transaction_number}
                            </p>
                          </div>
                        </div>
                        {hoursSinceCreated > 24 && (
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        )}
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-muted rounded-lg p-2.5">
                          <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
                          <p className="text-sm font-bold">
                            ₱{Number(order.total_amount).toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-muted rounded-lg p-2.5">
                          <p className="text-xs text-muted-foreground mb-0.5">Items</p>
                          <p className="text-sm font-bold">{totalItems}</p>
                        </div>
                        <div className="bg-muted rounded-lg p-2.5">
                          <p className="text-xs text-muted-foreground mb-0.5">Pending</p>
                          <p className="text-sm font-bold">{hoursSinceCreated}h</p>
                        </div>
                      </div>

                      {/* Payment Badge */}
                      <Badge variant="outline">{order.payment_terms}</Badge>

                      {/* Assign Button */}
                      <Button
                        onClick={() => handleDispatchStart(order)}
                        className="w-full"
                        variant={activeTab === 'delivery' ? 'default' : 'secondary'}
                      >
                        Assign Agent
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
        ) : showCompleted && deliveredOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {deliveredOrders.map((delivery) => {
                const completedDate = delivery.completed_at
                  ? new Date(delivery.completed_at)
                  : null
                const timeOut = delivery.time_out ? new Date(delivery.time_out) : null
                const timeIn = delivery.time_in ? new Date(delivery.time_in) : null

                // Calculate trip distance (handle case where ODO might reset or have errors)
                let kmTraveled = null
                if (delivery.km_in && delivery.km_out) {
                  const kmInVal = Number(delivery.km_in)
                  const kmOutVal = Number(delivery.km_out)
                  const diff = Math.abs(kmInVal - kmOutVal)
                  // Only show if the difference is reasonable (less than 500km for a delivery)
                  if (diff > 0 && diff < 500) {
                    kmTraveled = diff
                  }
                }

                return (
                  <Card
                    key={delivery.id}
                    onClick={() =>
                      router.push(`/dashboard/logistics/delivery/${delivery.id}`)
                    }
                    className="hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="p-3 rounded-xl">
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Delivery #</p>
                          <p className="text-sm font-bold">{delivery.order_number}</p>
                        </div>
                      </div>

                      {/* Store Info */}
                      <div>
                        <h4 className="font-semibold">{delivery.store_name}</h4>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />{' '}
                          {delivery.delivery_address || 'N/A'}
                        </p>
                      </div>

                      {/* Summary Info */}
                      <div
                        className={`grid gap-2 ${kmTraveled ? 'grid-cols-3' : 'grid-cols-2'}`}
                      >
                        {kmTraveled && (
                          <div className="p-3 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase mb-1">
                              Trip
                            </p>
                            <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
                              {kmTraveled.toFixed(1)}{' '}
                              <span className="text-xs">km</span>
                            </p>
                          </div>
                        )}
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                            Items
                          </p>
                          <p className="text-lg font-bold">{delivery.total_items || 0}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                            Date
                          </p>
                          <p className="text-sm font-bold">
                            {completedDate
                              ? completedDate.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : timeIn
                              ? timeIn.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Driver Info */}
                      {delivery.assignee && (
                        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                          <Truck className="w-3.5 h-3.5 text-blue-500" />
                          <p className="text-xs font-medium">
                            Driver:{' '}
                            <span className="font-semibold">
                              {delivery.assignee.name}
                            </span>
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-24 text-center">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {showCompleted ? 'No Completed Deliveries' : 'Operational Queue Clear'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {showCompleted
                  ? 'No deliveries have been completed yet.'
                  : 'All stores processed in the previous stage have been assigned to their respective logistics personnel.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dispatch & Assign Modal - Simple Agent Selection */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Delivery Agent</DialogTitle>
            <DialogDescription>
              Choose an agent for {selectedOrder?.store_name}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Delivery Date */}
              <div className="space-y-2">
                <Label htmlFor="delivery-date">Delivery Date</Label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Agent List */}
              <div className="space-y-2">
                <Label>Available Agents ({filteredAgents.length})</Label>
                <ScrollArea className="h-[300px] rounded-md border p-2">
                  <div className="space-y-2">
                    {filteredAgents.length > 0 ? (
                      filteredAgents.map((agent) => (
                        <Button
                          key={agent.id}
                          variant="outline"
                          className="w-full justify-start h-auto py-3 hover:bg-emerald-50 hover:border-emerald-500"
                          onClick={() => confirmDispatch(agent.id)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                                {agent.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <p className="font-semibold">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {agent.active_tasks_count || 0} active tasks
                              </p>
                            </div>
                            {agent.agent_status === 'AVAILABLE' && (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                Available
                              </Badge>
                            )}
                          </div>
                        </Button>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <AlertCircle className="w-12 h-12 text-muted-foreground/20 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          No agents available
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LogisticsHub
