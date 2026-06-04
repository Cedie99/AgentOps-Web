'use client'

import { useState, useEffect, useCallback } from 'react'
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
  List,
  LayoutGrid,
  Image as ImageIcon,
  X,
  Filter,
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
import { formatPHDateTime, formatPHRelativeDate } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface ActivityRecord {
  id: number
  activity_type: string
  activity_date: string
  proof_image_url: string | null
  notes: string | null
  gps_latitude: number | null
  gps_longitude: number | null
  client_name: string | null
  client_contact: string | null
  agent: { id: number; name: string; email: string } | null
  store: { id: number; store_name: string; city: string | null; address: string | null } | null
}

interface SalesAgent {
  id: number
  name: string
  email: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ACTIVITY_LABELS: Record<string, string> = {
  COLD_CALL: 'Cold Call',
  COLD_EMAIL: 'Cold Email',
  QUOTATION_PREP: 'Quotation Prep',
  CLIENT_FOLLOWUP: 'Client Follow-up',
  REVIVE_DORMANT: 'Revive Dormant',
  SOCIAL_PROSPECTING: 'Social Prospecting',
  EMAIL_INQUIRY_REPLY: 'Email Reply',
  CALL_INQUIRY_REPLY: 'Call Reply',
  WEEKLY_TODO_PREP: 'Weekly Todo Prep',
  VEHICLE_RESERVATION: 'Vehicle Reservation',
  SAMPLE_REQUEST: 'Sample Request',
  MARKETING_MATERIAL_REQUEST: 'Marketing Material',
  DESIGN_REQUEST: 'Design Request',
  INTERNAL_PO: 'Internal PO',
  SALES_MEETING: 'Sales Meeting',
  WALKIN_CLIENT: 'Walk-in Client',
  CLIENT_ISSUE: 'Client Issue',
  DELIVERY_FOLLOWUP: 'Delivery Follow-up',
  SAMPLE_FOLLOWUP: 'Sample Follow-up',
  PRICING_REQUEST: 'Pricing Request',
  STORE_VISIT: 'Store Visit',
  OTHER: 'Other',
}

const ACTIVITY_TYPES = Object.keys(ACTIVITY_LABELS)

const TYPE_COLORS: Record<string, string> = {
  COLD_CALL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  COLD_EMAIL: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  CLIENT_FOLLOWUP: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  STORE_VISIT: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  SALES_MEETING: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  WALKIN_CLIENT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  CLIENT_ISSUE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const statusColors = {
  PROSPECT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  NEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  EXISTING: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SalesActivitiesPage() {
  const router = useRouter()

  // tab
  const [activeTab, setActiveTab] = useState<'stores' | 'feed'>('stores')

  // ── By Store tab state ─────────────────────────────────────────────────────
  const [stores, setStores] = useState<StoreWithStats[]>([])
  const [loadingStores, setLoadingStores] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [globalFilter, setGlobalFilter] = useState('')

  // ── All Activities tab state ───────────────────────────────────────────────
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [loadingFeed, setLoadingFeed] = useState(false)
  const [feedPage, setFeedPage] = useState(1)
  const [feedTotal, setFeedTotal] = useState(0)
  const [feedTotalPages, setFeedTotalPages] = useState(1)
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([])
  const [filterAgent, setFilterAgent] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  // ── Fetchers ───────────────────────────────────────────────────────────────

  useEffect(() => { fetchStores() }, [])

  useEffect(() => {
    if (activeTab === 'feed') {
      fetchAgents()
      fetchFeed(1)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const fetchStores = async () => {
    try {
      setLoadingStores(true)
      const res = await fetch('/api/sales-activities/stores')
      if (res.ok) {
        const data = await res.json()
        setStores(data.stores || [])
      }
    } finally {
      setLoadingStores(false)
    }
  }

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/users?roles=SALES')
      if (res.ok) {
        const data = await res.json()
        setSalesAgents(data.users || [])
      }
    } catch {}
  }

  const fetchFeed = useCallback(async (page: number) => {
    setLoadingFeed(true)
    try {
      const p = new URLSearchParams({ page: String(page) })
      if (filterAgent && filterAgent !== 'all') p.set('agent_id', filterAgent)
      if (filterDateFrom) p.set('date_from', filterDateFrom)
      if (filterDateTo) p.set('date_to', filterDateTo)
      if (filterType && filterType !== 'all') p.set('activity_type', filterType)
      if (filterSearch) p.set('search', filterSearch)
      const res = await fetch(`/api/sales-activities/feed?${p}`)
      if (res.ok) {
        const data = await res.json()
        setActivities(data.activities || [])
        setFeedTotal(data.total || 0)
        setFeedTotalPages(data.totalPages || 1)
        setFeedPage(page)
      }
    } finally {
      setLoadingFeed(false)
    }
  }, [filterAgent, filterDateFrom, filterDateTo, filterType, filterSearch])

  const handleFeedFilter = () => fetchFeed(1)

  const formatDate = (dateString: string | null) =>
    dateString ? formatPHRelativeDate(dateString) : 'Never'

  // ── Store table columns ────────────────────────────────────────────────────

  const columns: ColumnDef<StoreWithStats>[] = [
    {
      accessorKey: 'store_name',
      header: 'Store',
      cell: ({ row }) => {
        const store = row.original
        return (
          <div className="flex items-start gap-3">
            <div className="mt-1"><Building2 className="h-4 w-4 text-muted-foreground" /></div>
            <div className="flex flex-col gap-1">
              <p className="font-semibold text-foreground">{store.store_name}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /><span>{store.address}</span>
              </div>
              {store.contact_number && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" /><span>{store.contact_number}</span>
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
            {agents.length > 0 ? agents.map((agent) => (
              <div key={agent.id} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                  <User className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">{agent.name}</p>
                  <p className="text-[10px] text-muted-foreground">{agent.email}</p>
                </div>
              </div>
            )) : <p className="text-xs text-muted-foreground italic">No agent assigned</p>}
          </div>
        )
      },
      filterFn: (row, _id, value) => {
        return row.original.assigned_agents.some(a =>
          a.name.toLowerCase().includes(value.toLowerCase()) ||
          a.email.toLowerCase().includes(value.toLowerCase())
        )
      },
    },
    {
      accessorKey: 'customer_status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('customer_status') as string
        return (
          <Badge variant="secondary"
            className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
            {status}
          </Badge>
        )
      },
      filterFn: (row, id, value) => value === 'all' ? true : row.getValue(id) === value,
    },
    {
      accessorKey: 'total_activities',
      header: 'Activities',
      cell: ({ row }) => {
        const count = row.getValue('total_activities') as number
        return (
          <div className="flex items-center justify-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              count > 0 ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-400'
            }`}>{count}</div>
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
      cell: ({ row }) => (
        <Button size="sm" variant="outline"
          onClick={() => router.push(`/dashboard/sales-activities/timeline/${row.original.id}`)}
          className="hover:bg-emerald-50 dark:hover:bg-emerald-950 hover:text-emerald-700 hover:border-emerald-300">
          <Eye className="w-4 h-4 mr-1" />View Timeline
        </Button>
      ),
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
    state: { sorting, columnFilters, columnVisibility, rowSelection, globalFilter },
  })

  const totalStores = stores.length
  const prospectStores = stores.filter(s => s.customer_status === 'PROSPECT').length
  const newStores = stores.filter(s => s.customer_status === 'NEW').length
  const existingStores = stores.filter(s => s.customer_status === 'EXISTING').length

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Sales Activities</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track all sales agent activities across assigned stores
          </p>
        </div>
        {/* Tab toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={activeTab === 'stores' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('stores')}
            className="gap-2"
          >
            <LayoutGrid className="h-4 w-4" /> By Store
          </Button>
          <Button
            variant={activeTab === 'feed' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('feed')}
            className="gap-2"
          >
            <List className="h-4 w-4" /> All Activities
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-[#1a1a1a] border-green-500/50">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-400 mb-2">Total Stores</p>
              <p className="text-3xl font-bold text-green-500">{totalStores}</p></div>
            <Store className="h-5 w-5 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 bg-[#1a1a1a] border-yellow-500/50">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-400 mb-2">Prospect</p>
              <p className="text-3xl font-bold text-yellow-500">{prospectStores}</p></div>
            <TrendingUp className="h-5 w-5 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4 bg-[#1a1a1a] border-blue-500/50">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-400 mb-2">New</p>
              <p className="text-3xl font-bold text-blue-500">{newStores}</p></div>
            <UserPlus className="h-5 w-5 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4 bg-[#1a1a1a] border-purple-500/50">
          <div className="flex items-center justify-between">
            <div><p className="text-xs text-gray-400 mb-2">Existing</p>
              <p className="text-3xl font-bold text-purple-500">{existingStores}</p></div>
            <Users className="h-5 w-5 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* ── By Store Tab ───────────────────────────────────────────────────── */}
      {activeTab === 'stores' && (
        <>
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input placeholder="Search stores, agents, or addresses..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="max-w-sm" />
              </div>
              <Select
                value={(table.getColumn('customer_status')?.getFilterValue() as string) ?? 'all'}
                onValueChange={(value) =>
                  table.getColumn('customer_status')?.setFilterValue(value === 'all' ? '' : value)
                }
              >
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="PROSPECT">Prospect ({prospectStores})</SelectItem>
                  <SelectItem value="NEW">New ({newStores})</SelectItem>
                  <SelectItem value="EXISTING">Existing ({existingStores})</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((hg) => (
                      <TableRow key={hg.id}>
                        {hg.headers.map((h) => (
                          <TableHead key={h.id}>
                            {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {loadingStores ? (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
                            <p className="text-sm text-muted-foreground">Loading stores...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-sm font-medium text-foreground">No stores found</p>
                          <p className="text-xs text-muted-foreground">Try adjusting your search or filters</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  {table.getFilteredRowModel().rows.length} store(s) total
                </div>
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <Select
                      value={`${table.getState().pagination.pageSize}`}
                      onValueChange={(v) => table.setPageSize(Number(v))}
                    >
                      <SelectTrigger className="h-8 w-[70px]">
                        <SelectValue placeholder={table.getState().pagination.pageSize} />
                      </SelectTrigger>
                      <SelectContent side="top">
                        {[10, 20, 30, 40, 50].map((s) => (
                          <SelectItem key={s} value={`${s}`}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm font-medium">
                      Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}><ChevronsLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}><ChevronLeft className="h-4 w-4" /></Button>
                      <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}><ChevronRight className="h-4 w-4" /></Button>
                      <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}><ChevronsRight className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* ── All Activities Tab ─────────────────────────────────────────────── */}
      {activeTab === 'feed' && (
        <>
          {/* Filters */}
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Filters</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* Agent */}
              <Select value={filterAgent} onValueChange={setFilterAgent}>
                <SelectTrigger><SelectValue placeholder="All Agents" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {salesAgents.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Activity type */}
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger><SelectValue placeholder="All Types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {ACTIVITY_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{ACTIVITY_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Date from */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="pl-9" placeholder="From date" />
              </div>
              {/* Date to */}
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)}
                  className="pl-9" placeholder="To date" />
              </div>
              {/* Search + Apply */}
              <div className="flex gap-2">
                <Input placeholder="Search client or notes..." value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFeedFilter()} />
                <Button onClick={handleFeedFilter} size="sm" className="shrink-0">Apply</Button>
              </div>
            </div>
          </Card>

          {/* Feed count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{feedTotal} activit{feedTotal === 1 ? 'y' : 'ies'} found</p>
          </div>

          {/* Activity cards */}
          {loadingFeed ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600" />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Activity className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No activities found</p>
              <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-2">
              {activities.map((act) => (
                <Card key={act.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  {/* Proof image */}
                  {act.proof_image_url ? (
                    <button
                      onClick={() => setLightboxUrl(act.proof_image_url!)}
                      className="w-full h-36 bg-muted overflow-hidden block"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={act.proof_image_url} alt="Proof" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                    </button>
                  ) : (
                    <div className="w-full h-36 bg-muted flex items-center justify-center">
                      <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                  )}

                  <CardContent className="p-3 space-y-2">
                    {/* Type badge + date */}
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="secondary"
                        className={TYPE_COLORS[act.activity_type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}>
                        {ACTIVITY_LABELS[act.activity_type] || act.activity_type}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatPHDateTime(act.activity_date)}
                      </span>
                    </div>

                    {/* Store */}
                    {act.store && (
                      <div className="flex items-center gap-1.5 text-xs text-foreground">
                        <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">{act.store.store_name}</span>
                        {act.store.city && <span className="text-muted-foreground shrink-0">· {act.store.city}</span>}
                      </div>
                    )}

                    {/* Agent */}
                    {act.agent && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="h-3 w-3 shrink-0" />
                        <span className="truncate">{act.agent.name}</span>
                      </div>
                    )}

                    {/* Client */}
                    {act.client_name && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3 shrink-0" />
                        <span className="truncate">{act.client_name}{act.client_contact ? ` · ${act.client_contact}` : ''}</span>
                      </div>
                    )}

                    {/* Notes */}
                    {act.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {act.notes}
                      </p>
                    )}

                    {/* GPS */}
                    {act.gps_latitude && act.gps_longitude && (
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span>{act.gps_latitude.toFixed(4)}, {act.gps_longitude.toFixed(4)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {feedTotalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => fetchFeed(1)} disabled={feedPage === 1}>
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => fetchFeed(feedPage - 1)} disabled={feedPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                Page {feedPage} of {feedTotalPages}
              </span>
              <Button variant="outline" size="sm" onClick={() => fetchFeed(feedPage + 1)} disabled={feedPage >= feedTotalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => fetchFeed(feedTotalPages)} disabled={feedPage >= feedTotalPages}>
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="h-6 w-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxUrl}
            alt="Proof"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
