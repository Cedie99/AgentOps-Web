'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
  Eye,
  Filter,
  Download,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit,
  Plus,
  Minus,
  Trash2,
  Save
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
  transaction_number: string
  store_name: string
  sales_agent: {
    id: number
    name: string
    email: string
  }
  total_amount: number
  payment_terms: string
  status: string
  requires_delivery: boolean
  delivery_date: string | null
  created_at: string
  items: Array<{
    id: number
    product_name: string
    quantity: number
    unit_price: number
    total_amount: number
  }>
  survey: {
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
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED'>('PENDING')
  const [assignType, setAssignType] = useState<'DELIVERY' | 'COLLECTOR'>('DELIVERY')
  const [selectedAssignee, setSelectedAssignee] = useState('')
  const [deliveryUsers, setDeliveryUsers] = useState<any[]>([])
  const [collectorUsers, setCollectorUsers] = useState<any[]>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editedItems, setEditedItems] = useState<Array<{
    id: number
    product_name: string
    quantity: number
    unit_price: number
    total_amount: number
  }>>([])
  const [editedPaymentTerms, setEditedPaymentTerms] = useState('')
  const [editedDeliveryDate, setEditedDeliveryDate] = useState<Date | null>(null)

  useEffect(() => {
    fetchOrders()
    fetchUsers()
  }, [activeTab])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const status = activeTab === 'PENDING' ? 'PENDING' : 'APPROVED'
      const url = `/api/orders?status=${status}`

      const response = await fetch(url)
      const data = await response.json()

      if (response.ok) {
        setOrders(data.orders)
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

  const handleApproveOrder = async (action: 'APPROVE' | 'REJECT') => {
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
  }

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

  const handleEditOrder = () => {
    if (!selectedOrder) return
    router.push(`/dashboard/sales/orders/${selectedOrder.id}/edit`)
  }

  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return

    setEditedItems(items =>
      items.map(item =>
        item.id === itemId
          ? {
              ...item,
              quantity: newQuantity,
              total_amount: newQuantity * parseFloat(item.unit_price.toString())
            }
          : item
      )
    )
  }

  const updateItemPrice = (itemId: number, newPrice: number) => {
    if (newPrice < 0) return

    setEditedItems(items =>
      items.map(item =>
        item.id === itemId
          ? {
              ...item,
              unit_price: newPrice,
              total_amount: item.quantity * newPrice
            }
          : item
      )
    )
  }

  const removeItem = (itemId: number) => {
    setEditedItems(items => items.filter(item => item.id !== itemId))
  }

  const calculateEditedTotal = () => {
    return editedItems.reduce((sum, item) => sum + parseFloat(item.total_amount.toString()), 0)
  }

  const handleSaveOrder = async () => {
    if (!selectedOrder || editedItems.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Order must have at least one item',
      })
      return
    }

    setActionLoading(true)
    try {
      const response = await fetch('/api/orders/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          items: editedItems,
          payment_terms: editedPaymentTerms,
          delivery_date: editedDeliveryDate?.toISOString(),
          total_amount: calculateEditedTotal()
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Order updated successfully',
        })
        setShowEditDialog(false)
        fetchOrders()
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to update order',
        })
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update order',
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
        accessorKey: 'transaction_number',
        header: 'Order #',
        cell: ({ row }) => (
          <div className="font-medium">{row.original.transaction_number}</div>
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
        cell: ({ row }) => <Badge variant="outline">{row.original.payment_terms}</Badge>,
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
    data: orders,
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
        pageSize: 20,
      },
    },
  })

  // Calculate statistics
  const stats = {
    pending: orders.filter(o => o.status === 'PENDING').length,
    approved: orders.filter(o => o.status === 'APPROVED').length,
    processing: orders.filter(o => o.status === 'PROCESSING').length,
    totalValue: orders.reduce((sum, o) => sum + parseFloat(o.total_amount.toString()), 0),
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading orders...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.processing}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
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
                Pending ({orders.filter(o => o.status === 'PENDING').length})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
            <DialogTitle>Order Details - {selectedOrder?.transaction_number}</DialogTitle>
            <DialogDescription>Complete order information and items</DialogDescription>
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
                  <p className="text-sm">{selectedOrder.payment_terms}</p>
                </div>
                {selectedOrder.delivery_date && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Delivery Date</p>
                    <p className="text-sm">{format(new Date(selectedOrder.delivery_date), 'PPP')}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Order Items</p>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Unit Price</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.product_name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₱{parseFloat(item.unit_price.toString()).toFixed(2)}</TableCell>
                          <TableCell className="font-semibold">
                            ₱{parseFloat(item.total_amount.toString()).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-semibold">Total:</TableCell>
                        <TableCell className="font-bold">
                          ₱{parseFloat(selectedOrder.total_amount.toString()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons Footer */}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={handleEditOrder}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Order
            </Button>

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
            <DialogTitle>Approve Order - {selectedOrder?.transaction_number}</DialogTitle>
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
            <DialogTitle>Void Order - {selectedOrder?.transaction_number}</DialogTitle>
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
            <DialogTitle>Assign Order - {selectedOrder?.transaction_number}</DialogTitle>
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

     
      {/* Edit Order Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-[90vw] w-[90vw] max-h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>Edit Order - {selectedOrder?.transaction_number}</DialogTitle>
            <DialogDescription>
              Modify order items, quantities, prices, and payment terms
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(95vh - 180px)' }}>
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Store</p>
                  <p className="text-sm font-semibold">{selectedOrder.store_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sales Agent</p>
                  <p className="text-sm font-semibold">{selectedOrder.sales_agent.name}</p>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Terms</label>
                <Select value={editedPaymentTerms} onValueChange={setEditedPaymentTerms}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="COD">COD</SelectItem>
                    <SelectItem value="7 Days">7 Days</SelectItem>
                    <SelectItem value="CREDIT_7">7 Days Credit</SelectItem>
                    <SelectItem value="15 Days">15 Days</SelectItem>
                    <SelectItem value="CREDIT_15">15 Days Credit</SelectItem>
                    <SelectItem value="30 Days">30 Days</SelectItem>
                    <SelectItem value="CREDIT_30">30 Days Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Order Items */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Order Items</label>
                  <Badge variant="secondary">{editedItems.length} items</Badge>
                </div>

                <div className="space-y-3">
                  {editedItems.map((item, index) => (
                    <div key={item.id} className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                      {/* Product Name Header */}
                      <div className="mb-4 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold text-slate-900 text-lg">{item.product_name}</h4>
                        </div>
                      </div>

                      {/* Controls Grid */}
                      <div className="grid grid-cols-3 gap-6">
                        {/* Quantity */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Quantity</label>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 w-10 p-0 rounded-md border-2 hover:bg-slate-50"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="flex-1 h-10 text-center text-base border-2 border-slate-300 rounded-md px-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                              min="1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 w-10 p-0 rounded-md border-2 hover:bg-slate-50"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Unit Price */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Unit Price</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">₱</span>
                            <input
                              type="text"
                              value={Math.abs(parseFloat(item.unit_price.toString())).toFixed(2)}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.]/g, '')
                                updateItemPrice(item.id, Math.abs(parseFloat(value)) || 0)
                              }}
                              className="w-full h-10 pl-9 pr-4 text-base border-2 border-slate-300 rounded-md font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Total */}
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Total Amount</label>
                          <div className="h-10 flex items-center justify-between bg-green-50 border-2 border-green-200 rounded-md px-4">
                            <span className="font-bold text-green-700 text-lg">
                              ₱{Math.abs(parseFloat(item.total_amount.toString())).toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md -mr-1"
                              onClick={() => removeItem(item.id)}
                              disabled={editedItems.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Order Total */}
                  <div className="border-t-2 pt-3 mt-4">
                    <div className="flex justify-between items-center px-4">
                      <span className="font-bold text-lg">Order Total:</span>
                      <span className="font-bold text-xl">
                        ₱{calculateEditedTotal().toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary of Changes */}
              {calculateEditedTotal() !== parseFloat(selectedOrder.total_amount.toString()) && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">
                      Total changed from ₱{parseFloat(selectedOrder.total_amount.toString()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      {' '}to ₱{calculateEditedTotal().toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 px-6 py-4 border-t bg-background">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveOrder}
              disabled={actionLoading || editedItems.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {actionLoading ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  
    </div>
  )
}
