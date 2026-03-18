'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import {
  DollarSign,
  Package,
  User,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Wallet,
  MapPin,
  Camera,
} from 'lucide-react'

interface Order {
  id: number
  order_number: string
  store_name: string
  total_amount: number
  amount_paid: number
  balance: number
  status: string
  payment_terms: string
  created_at: string
  collector_assigned_to: number | null
  collector_assigned_at: string | null
  sales_agent: {
    id: number
    name: string
    email: string
  }
  collector_user?: {
    id: number
    name: string
    email: string
  }
  survey: {
    store_name: string
    address: string
  }
}

interface DailyCollection {
  id: number
  collector_id: string
  store_name: string
  amount_collected: number
  payment_method: string
  receipt_photo_url: string | null
  collection_notes: string | null
  gps_latitude: number | null
  gps_longitude: number | null
  collected_at: string
  created_at: string
  collector?: {
    id: number
    name: string
    email: string
  }
}

export default function CollectionManagement() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [dailyCollections, setDailyCollections] = useState<DailyCollection[]>([])
  const [loading, setLoading] = useState(true)
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [collectorUsers, setCollectorUsers] = useState<any[]>([])
  const [selectedCollector, setSelectedCollector] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchCollectors()
    fetchDailyCollections()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders?status=DELIVERED')
      const data = await response.json()

      if (response.ok) {
        // Filter orders with balance > 0
        const ordersWithBalance = data.orders.filter((o: Order) => o.balance > 0)
        setOrders(ordersWithBalance)
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to fetch orders',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch orders',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCollectors = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()

      if (response.ok && Array.isArray(data)) {
        setCollectorUsers(data.filter((u: any) => u.role === 'COLLECTOR'))
      }
    } catch (error) {
      console.error('Failed to fetch collectors:', error)
    }
  }

  const fetchDailyCollections = async () => {
    try {
      setCollectionsLoading(true)
      const response = await fetch('/api/collections/daily')
      const data = await response.json()

      if (response.ok) {
        setDailyCollections(data.collections || [])
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to fetch daily collections',
        })
      }
    } catch (error) {
      console.error('Failed to fetch daily collections:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch daily collections',
      })
    } finally {
      setCollectionsLoading(false)
    }
  }

  const handleAssignCollector = async () => {
    if (!selectedOrder || !selectedCollector) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/orders/assign-collector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          collectorUserId: parseInt(selectedCollector)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Collector assigned successfully',
        })
        setShowAssignDialog(false)
        setSelectedCollector('')
        fetchOrders()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to assign collector',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to assign collector',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const stats = {
    totalOrders: orders.length,
    totalBalance: orders.reduce((sum, o) => sum + Number(o.balance), 0),
    assigned: orders.filter(o => o.collector_assigned_to).length,
    unassigned: orders.filter(o => !o.collector_assigned_to).length,
  }

  const collectionStats = {
    totalCollections: dailyCollections.length,
    totalCashCollected: dailyCollections.reduce((sum, c) => sum + Number(c.amount_collected), 0),
    todayCollections: dailyCollections.filter(c => {
      const collectedDate = new Date(c.collected_at).toDateString()
      const today = new Date().toDateString()
      return collectedDate === today
    }).length,
    todayCash: dailyCollections
      .filter(c => {
        const collectedDate = new Date(c.collected_at).toDateString()
        const today = new Date().toDateString()
        return collectedDate === today
      })
      .reduce((sum, c) => sum + Number(c.amount_collected), 0),
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Statistics Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-36 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-56 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-96 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <div className="p-4">
                {/* Table header skeleton */}
                <div className="flex gap-4 mb-4 pb-3 border-b">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
                {/* Table rows skeleton */}
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4 items-center py-2">
                      <div className="h-10 w-full bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Order Assignments
          </TabsTrigger>
          <TabsTrigger value="daily-cash" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Daily Cash Collections
          </TabsTrigger>
        </TabsList>

        {/* ORDER ASSIGNMENTS TAB */}
        <TabsContent value="assignments" className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">With outstanding balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">To be collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.assigned}</div>
            <p className="text-xs text-muted-foreground">To collectors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unassigned}</div>
            <p className="text-xs text-muted-foreground">Pending assignment</p>
          </CardContent>
        </Card>
      </div>

      {/* Collections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Collections Management</CardTitle>
          <CardDescription>Assign collectors to delivered orders with outstanding balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Sales Agent</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Collector</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-lg font-medium">No orders pending collection</p>
                      <p className="text-sm">Orders with outstanding balance will appear here</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.store_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {order.sales_agent.name}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {formatCurrency(order.amount_paid)}
                      </TableCell>
                      <TableCell className="text-orange-600 font-bold">
                        {formatCurrency(order.balance)}
                      </TableCell>
                      <TableCell>
                        {order.collector_user ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            {order.collector_user.name}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Assigned</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {!order.collector_assigned_to && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedOrder(order)
                              setShowAssignDialog(true)
                            }}
                          >
                            Assign
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Collector Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Collector - {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Select a collector to assign this order for payment collection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Store:</span>
                  <p className="font-medium">{selectedOrder?.store_name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Balance:</span>
                  <p className="font-bold text-orange-600">
                    {selectedOrder && formatCurrency(selectedOrder.balance)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Select Collector</label>
              <Select value={selectedCollector} onValueChange={setSelectedCollector}>
                <SelectTrigger>
                  <SelectValue placeholder="Select collector" />
                </SelectTrigger>
                <SelectContent>
                  {collectorUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignCollector}
              disabled={actionLoading || !selectedCollector}
            >
              {actionLoading ? 'Assigning...' : 'Assign Collector'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>

        {/* DAILY CASH COLLECTIONS TAB */}
        <TabsContent value="daily-cash" className="space-y-6">
          {/* Daily Collection Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Collections</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{collectionStats.totalCollections}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cash Collected</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(collectionStats.totalCashCollected)}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today&apos;s Collections</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{collectionStats.todayCollections}</div>
                <p className="text-xs text-muted-foreground">Collection entries</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today&apos;s Cash</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(collectionStats.todayCash)}
                </div>
                <p className="text-xs text-muted-foreground">Collected today</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Collections Table */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Cash Collections</CardTitle>
              <CardDescription>
                View all cash collections recorded by collectors from the mobile app
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Collector</TableHead>
                      <TableHead>Store Name</TableHead>
                      <TableHead>Cash Collected</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>GPS</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collectionsLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            <span className="text-muted-foreground">Loading collections...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : dailyCollections.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                          <p className="text-lg font-medium">No collections recorded yet</p>
                          <p className="text-sm">Daily cash collections will appear here</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyCollections.map((collection) => (
                        <TableRow key={collection.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {new Date(collection.collected_at).toLocaleDateString('en-PH', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(collection.collected_at).toLocaleTimeString('en-PH', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span>{collection.collector?.name || 'Unknown'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{collection.store_name}</TableCell>
                          <TableCell>
                            <span className="text-green-600 font-bold text-lg">
                              {formatCurrency(collection.amount_collected)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {collection.receipt_photo_url ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                                onClick={() => window.open(collection.receipt_photo_url!, '_blank')}
                              >
                                <Camera className="h-3 w-3" />
                                View
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">No photo</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {collection.gps_latitude && collection.gps_longitude ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-xs"
                                onClick={() => {
                                  window.open(
                                    `https://www.google.com/maps?q=${collection.gps_latitude},${collection.gps_longitude}`,
                                    '_blank'
                                  )
                                }}
                              >
                                <MapPin className="h-3 w-3" />
                                View
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {collection.collection_notes ? (
                              <span className="text-sm">{collection.collection_notes}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
