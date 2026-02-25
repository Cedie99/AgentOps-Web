'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Activity,
  Store,
  User,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AssignedAgent {
  id: number
  name: string
  email: string
  assigned_at: string
  activity_count: number
}

interface StoreWithStats {
  id: number
  store_name: string
  address: string
  contact_number: string | null
  customer_status: string
  assigned_agents: AssignedAgent[]
  total_activities: number
  last_activity_date: string | null
}

const statusColors = {
  PROSPECT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  NEW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  EXISTING: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
}

export default function SalesActivitiesPage() {
  const router = useRouter()
  const [stores, setStores] = useState<StoreWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')

  useEffect(() => {
    fetchStores()
  }, [])

  const fetchStores = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/sales-activities/stores')

      if (response.ok) {
        const data = await response.json()
        setStores(data.stores || [])
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch stores:', errorData)
      }
    } catch (error) {
      console.error('Error fetching stores:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }
  }

  const columns: ColumnDef<StoreWithStats>[] = [
    {
      accessorKey: 'store_name',
      header: 'Store',
      cell: ({ row }) => {
        const store = row.original
        return (
          <div className="flex flex-col">
            <p className="font-semibold text-foreground">{store.store_name}</p>
            <p className="text-xs text-muted-foreground">{store.address}</p>
            {store.contact_number && (
              <p className="text-xs text-muted-foreground">{store.contact_number}</p>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'assigned_agents',
      header: 'Assigned Agent',
      cell: ({ row }) => {
        const agents = row.original.assigned_agents
        return (
          <div className="flex flex-col gap-1">
            {agents.length > 0 ? (
              agents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                    <User className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{agent.name}</p>
                    <p className="text-[10px] text-muted-foreground">{agent.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground italic">No agent assigned</p>
            )}
          </div>
        )
      },
      filterFn: (row, id, value) => {
        const agents = row.original.assigned_agents
        return agents.some(agent =>
          agent.name.toLowerCase().includes(value.toLowerCase()) ||
          agent.email.toLowerCase().includes(value.toLowerCase())
        )
      },
    },
    {
      accessorKey: 'customer_status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('customer_status') as string
        return (
          <Badge
            variant="secondary"
            className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'}
          >
            {status}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        if (value === 'all') return true
        return row.getValue(id) === value
      },
    },
    {
      accessorKey: 'total_activities',
      header: 'Activities',
      cell: ({ row }) => {
        const count = row.getValue('total_activities') as number
        return (
          <Badge variant={count > 0 ? 'default' : 'secondary'} className="font-mono">
            {count}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'last_activity_date',
      header: 'Last Activity',
      cell: ({ row }) => {
        const date = row.getValue('last_activity_date') as string | null
        return (
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{formatDate(date)}</span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const store = row.original
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/dashboard/sales-activities/timeline/${store.id}`)}
            className="hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Timeline
          </Button>
        )
      },
    },
  ]

  const table = useReactTable({
    data: stores,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  })

  // Calculate summary stats
  const totalStores = stores.length
  const prospectStores = stores.filter(s => s.customer_status === 'PROSPECT').length
  const newStores = stores.filter(s => s.customer_status === 'NEW').length
  const existingStores = stores.filter(s => s.customer_status === 'EXISTING').length

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Sales Activities</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track all sales agent activities across assigned stores
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Total Stores</p>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{totalStores}</p>
            </div>
            <Store className="h-10 w-10 text-emerald-600 dark:text-emerald-400 opacity-80" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Prospect</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{prospectStores}</p>
            </div>
            <Activity className="h-10 w-10 text-blue-600 dark:text-blue-400 opacity-80" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-green-700 dark:text-green-300">New</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">{newStores}</p>
            </div>
            <Activity className="h-10 w-10 text-green-600 dark:text-green-400 opacity-80" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">Existing</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">{existingStores}</p>
            </div>
            <Activity className="h-10 w-10 text-purple-600 dark:text-purple-400 opacity-80" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <Input
              placeholder="Search stores, agents, or addresses..."
              value={globalFilter ?? ''}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={(table.getColumn('customer_status')?.getFilterValue() as string) ?? 'all'}
            onValueChange={(value) =>
              table.getColumn('customer_status')?.setFilterValue(value === 'all' ? '' : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PROSPECT">Prospect ({prospectStores})</SelectItem>
              <SelectItem value="NEW">New ({newStores})</SelectItem>
              <SelectItem value="EXISTING">Existing ({existingStores})</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-6">
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
                      <p className="text-sm text-muted-foreground">Loading stores...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground">No stores found</p>
                    <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} store(s) total
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of{' '}
                  {table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
