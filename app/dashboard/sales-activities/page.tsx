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
  TrendingUp,
  UserPlus,
  Users,
  MapPin,
  Phone,
  Building2,
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
  PROSPECT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
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
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-foreground">{store.store_name}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{store.address}</span>
              </div>
              {store.contact_number && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  <span>{store.contact_number}</span>
                </div>
              )}
            </div>
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
          <div className="flex items-center justify-center">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
              ${count > 0
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-700 text-gray-400'
              }
            `}>
              {count}
            </div>
          </div>
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

  if (loading) {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
        {/* Header Skeleton */}
        <div>
          <div className="h-9 w-64 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 w-20 bg-muted animate-pulse rounded mb-2" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-10 w-10 bg-muted animate-pulse rounded" />
              </div>
            </Card>
          ))}
        </div>

        {/* Filters Skeleton */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="h-10 flex-1 max-w-sm bg-muted animate-pulse rounded" />
            <div className="h-10 w-[180px] bg-muted animate-pulse rounded" />
          </div>
        </Card>

        {/* Table Skeleton */}
        <Card className="flex-1">
          <CardContent className="p-6">
            <div className="rounded-md border">
              <div className="p-4">
                {/* Table header skeleton */}
                <div className="flex gap-4 mb-4 pb-3 border-b">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                </div>
                {/* Table rows skeleton */}
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex gap-4 items-center py-2">
                      <div className="h-12 w-full bg-muted animate-pulse rounded" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between px-2">
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 w-8 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

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
        <Card className="p-4 bg-[#1a1a1a] border-green-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-2">Total Stores</p>
              <p className="text-3xl font-bold text-green-500">{totalStores}</p>
            </div>
            <Store className="h-5 w-5 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-[#1a1a1a] border-yellow-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-2">Prospect</p>
              <p className="text-3xl font-bold text-yellow-500">{prospectStores}</p>
            </div>
            <TrendingUp className="h-5 w-5 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 bg-[#1a1a1a] border-blue-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-2">New</p>
              <p className="text-3xl font-bold text-blue-500">{newStores}</p>
            </div>
            <UserPlus className="h-5 w-5 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-[#1a1a1a] border-purple-500/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-2">Existing</p>
              <p className="text-3xl font-bold text-purple-500">{existingStores}</p>
            </div>
            <Users className="h-5 w-5 text-purple-500" />
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
