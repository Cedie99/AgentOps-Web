'use client'

import { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatPaymentTerms } from '@/lib/format-payment-terms'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import {
  ShoppingCart,
  Check,
  X,
  Truck,
  DollarSign,
  User,
  Calendar,
  Package,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react'
import { format } from 'date-fns'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table'

interface Order {
  id: number
  order_number: string
  store_name: string
  sales_agent: {
    id: number
    name: string
    email: string
  }
  total_amount: number
  amount_paid: number
  balance: number
  payment_terms: string
  status: string
  created_at: string
  products: string
  approver?: {
    id: number
    name: string
    email: string
  }
  delivery_user?: {
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
    id: number
    store_name: string
    customer_status: string
  }
}

export default function OrderManagement() {
  const router = useRouter()
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showVoidDialog, setShowVoidDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'DELIVERY'>('PENDING')
  const [assignType, setAssignType] = useState<'DELIVERY' | 'COLLECTOR'>('DELIVERY')
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [deliveryUsers, setDeliveryUsers] = useState<any[]>([])
  const [collectorUsers, setCollectorUsers] = useState<any[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [showEditDialog, setShowEditDialog] = useState(false)

  const [allOrders, setAllOrders] = useState<Order[]>([])

  useEffect(() => {
    fetchOrders()
    fetchUsers()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/orders')
      const data = await response.json()

      if (response.ok) {
        setAllOrders(data.orders)
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

  // Filter orders based on active tab (client-side filtering)
  const filteredOrders = useMemo(() => {
    if (activeTab === 'PENDING') {
      return allOrders.filter(o => o.status === 'PENDING')
    } else if (activeTab === 'APPROVED') {
      return allOrders.filter(o => o.status === 'APPROVED' && !o.delivery_user)
    } else if (activeTab === 'DELIVERY') {
      return allOrders.filter(o => o.status === 'APPROVED' && o.delivery_user)
    }
    return allOrders
  }, [allOrders, activeTab])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      const data = await response.json()

      if (response.ok && Array.isArray(data)) {
        setDeliveryUsers(data.filter((u: any) => u.role === 'DELIVERY'))
        setCollectorUsers(data.filter((u: any) => u.role === 'COLLECTOR'))
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleApproveOrder = useCallback(async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedOrder) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/orders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          action,
          notes: adminNotes
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Order ${action.toLowerCase()}ed successfully`,
        })
        setShowApproveDialog(false)
        setAdminNotes('')
        fetchOrders()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || `Failed to ${action.toLowerCase()} order`,
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to ${action.toLowerCase()} order`,
      })
    } finally {
      setActionLoading(false)
    }
  }, [selectedOrder, adminNotes, toast])

  const handleVoidOrder = async () => {
    if (!selectedOrder) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/orders/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          action: 'REJECT',
          notes: adminNotes
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order voided successfully',
        })
        setShowVoidDialog(false)
        setAdminNotes('')
        fetchOrders()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to void order',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to void order',
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssignOrder = async () => {
    if (!selectedOrder || !selectedAssignee) return

    setActionLoading(true)
    try {
      const response = await fetch('/api/orders/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          assignType,
          assigneeId: parseInt(selectedAssignee)
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Order assigned to ${assignType.toLowerCase()} successfully`,
        })
        setShowAssignDialog(false)
        setSelectedAssignee('')
        fetchOrders()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to assign order',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to assign order',
      })
    } finally {
      setActionLoading(false)
    }
  }


  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      PENDING: { variant: 'secondary', label: 'Pending' },
      APPROVED: { variant: 'default', label: 'Approved' },
      REJECTED: { variant: 'destructive', label: 'Rejected' },
      PROCESSING: { variant: 'default', label: 'Processing' },
      DELIVERED: { variant: 'default', label: 'Delivered' },
      COMPLETED: { variant: 'default', label: 'Completed' },
    }

    const config = variants[status] || { variant: 'secondary', label: status }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getCustomerStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PROSPECT: 'bg-blue-100 text-blue-800',
      NEW: 'bg-green-100 text-green-800',
      EXISTING: 'bg-purple-100 text-purple-800',
    }

    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    )
  }

  // Define table columns
  const columns = useMemo<ColumnDef<Order>[]>(
    () => [
      {
        accessorKey: 'order_number',
        header: 'Order #',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.order_number}</div>
        ),
      },
      {
        accessorKey: 'store_name',
        header: 'Store',
        cell: ({ row }) => <div>{row.original.store_name}</div>,
      },
      {
        accessorKey: 'sales_agent.name',
        header: 'Sales Agent',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {row.original.sales_agent.name}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.original.status),
      },
      {
        accessorKey: 'survey.customer_status',
        header: 'Customer Type',
        cell: ({ row }) => getCustomerStatusBadge(row.original.survey?.customer_status || 'PROSPECT'),
      },
      {
        accessorKey: 'total_amount',
        header: 'Amount',
        cell: ({ row }) => (
          <div className="font-semibold">
            ₱{parseFloat(row.original.total_amount.toString()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </div>
        ),
      },
      {
        accessorKey: 'payment_terms',
        header: 'Payment',
        cell: ({ row }) => <Badge variant="outline">{formatPaymentTerms(row.original.payment_terms)}</Badge>,
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => format(new Date(row.original.created_at), 'MMM d, yyyy'),
      },
    ],
    []
  )

  // Initialize TanStack Table
  const table = useReactTable({
    data: filteredOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  // Calculate statistics
  const stats = useMemo(() => ({
    pending: allOrders.filter(o => o.status === 'PENDING').length,
    approved: allOrders.filter(o => o.status === 'APPROVED' && !o.delivery_user).length,
    delivery: allOrders.filter(o => o.status === 'APPROVED' && o.delivery_user).length,
    totalValue: allOrders.reduce((sum, o) => sum + parseFloat(o.total_amount.toString()), 0),
  }), [allOrders])

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Statistics Cards Skeleton */}
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-64 bg-muted animate-pulse rounded" />
              </div>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded" />
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="h-12 flex-1 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards - Memoized to prevent re-render */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent key={`stats-pending-${stats.pending}`}>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent key={`stats-approved-${stats.approved}`}>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Ready for delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent key={`stats-total-${stats.totalValue}`}>
            <div className="text-2xl font-bold">
              ₱{stats.totalValue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">All orders</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>Review and manage sales orders</CardDescription>
            </div>
            <div className="flex gap-2 border rounded-lg p-1 bg-muted">
              <Button
                variant={activeTab === 'PENDING' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('PENDING')}
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Pending
              </Button>
              <Button
                variant={activeTab === 'APPROVED' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('APPROVED')}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                Approved
              </Button>
              <Button
                variant={activeTab === 'DELIVERY' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('DELIVERY')}
                className="gap-2"
              >
                <Truck className="h-4 w-4" />
                In Delivery
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent key={`table-${activeTab}`}>
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedOrder(row.original)
                          setShowDetailsDialog(true)
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-12">
                        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-lg font-medium">No {activeTab.toLowerCase()} orders found</p>
                        <p className="text-sm">Orders will appear here once created</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {table.getRowModel().rows?.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}{' '}
                  of {table.getFilteredRowModel().rows.length} orders
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm font-medium">
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details - {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>Complete order information</DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Store</p>
                  <p className="text-sm">{selectedOrder.store_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sales Agent</p>
                  <p className="text-sm">{selectedOrder.sales_agent.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
                  <p className="text-sm">{formatPaymentTerms(selectedOrder.payment_terms)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer Type</p>
                  {getCustomerStatusBadge(selectedOrder.survey.customer_status)}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Products</p>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm">{selectedOrder.products}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-md">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold">
                    ₱{parseFloat(selectedOrder.total_amount.toString()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
                  <p className="text-lg font-bold text-green-600">
                    ₱{parseFloat(selectedOrder.amount_paid.toString()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Balance</p>
                  <p className="text-lg font-bold text-orange-600">
                    ₱{parseFloat(selectedOrder.balance.toString()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {selectedOrder.approver && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approved By</p>
                  <p className="text-sm">{selectedOrder.approver.name}</p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons Footer */}
          <DialogFooter className="gap-2 sm:gap-2">
            {activeTab === 'PENDING' ? (
              <>
                <Button
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowDetailsDialog(false)
                    setShowApproveDialog(true)
                  }}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDetailsDialog(false)
                    setShowVoidDialog(true)
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Void
                </Button>
              </>
            ) : (
              <>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setAssignType('DELIVERY')
                    setShowDetailsDialog(false)
                    setShowAssignDialog(true)
                  }}
                >
                  <Truck className="h-4 w-4 mr-2" />
                  Assign Delivery
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={() => {
                    setAssignType('COLLECTOR')
                    setShowDetailsDialog(false)
                    setShowAssignDialog(true)
                  }}
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Assign Collector
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve/Reject Dialog */}
      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Order - {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Approve this order to make it ready for assignment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Admin Notes (Optional)</label>
              <Textarea
                placeholder="Add any notes or comments..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleApproveOrder('APPROVE')}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? 'Approving...' : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Approve Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Dialog */}
      <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Void Order - {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription className="text-destructive">
              This will reject and void this order. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Reason for Voiding (Required)</label>
              <Textarea
                placeholder="Please provide a reason for voiding this order..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="border-destructive"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowVoidDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoidOrder}
              disabled={actionLoading || !adminNotes.trim()}
            >
              {actionLoading ? 'Voiding...' : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Void Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Order - {selectedOrder?.order_number}</DialogTitle>
            <DialogDescription>
              Assign this order to delivery or collector
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Assign To</label>
              <Select value={assignType} onValueChange={(v) => setAssignType(v as 'DELIVERY' | 'COLLECTOR')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DELIVERY">Delivery</SelectItem>
                  <SelectItem value="COLLECTOR">Collector</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">
                Select {assignType === 'DELIVERY' ? 'Delivery Agent' : 'Collector'}
              </label>
              <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${assignType.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {(assignType === 'DELIVERY' ? deliveryUsers : collectorUsers).map((user) => (
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
              onClick={handleAssignOrder}
              disabled={actionLoading || !selectedAssignee}
            >
              <Check className="h-4 w-4 mr-2" />
              Assign Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

     
    </div>
  )
}
