'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

export default function CollectionManagement() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [collectorUsers, setCollectorUsers] = useState<any[]>([])
  const [selectedCollector, setSelectedCollector] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchCollectors()
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
    </div>
  )
}
