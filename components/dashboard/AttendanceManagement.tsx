'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Clock,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Eye,
  Route,
  Download,
  Filter,
  Search,
  Loader2,
  CheckCircle2,
  Clock3,
  X
} from 'lucide-react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { format, parseISO } from 'date-fns'

interface AttendanceRecord {
  id: number
  user_id: number
  work_date: string
  clock_in_time: string
  clock_out_time: string | null
  clock_in_lat: number | null
  clock_in_long: number | null
  clock_out_lat: number | null
  clock_out_long: number | null
  selfie_url: string | null
  duration: string | null
  total_distance: number | null
  user: {
    id: number
    name: string
    email: string
    role: string
    avatar: string | null
  }
  gps_points?: Array<{
    id: number
    latitude: number
    longitude: number
    timestamp: string
    accuracy: number | null
    speed: number | null
    heading: number | null
  }>
}

interface AttendanceStats {
  total: number
  working: number
  completed: number
  totalDistance: number
}

export default function AttendanceManagement() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    total: 0,
    working: 0,
    completed: 0,
    totalDistance: 0,
  })
  const [loading, setLoading] = useState(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0])
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    fetchAttendance()
  }, [dateFilter, roleFilter])

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFilter) params.append('work_date', dateFilter)
      if (roleFilter !== 'all') params.append('role', roleFilter)

      const response = await fetch(`/api/attendance?${params.toString()}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch attendance')
      }
      const data = await response.json()
      setAttendance(data.attendance)
      setStats(data.stats)
    } catch (error: any) {
      console.error('Error fetching attendance:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const openDetailDialog = (record: AttendanceRecord) => {
    setSelectedRecord(record)
    setIsDetailDialogOpen(true)
  }

  const calculateDuration = (clockIn: string, clockOut: string | null): string => {
    const start = new Date(clockIn)
    const end = clockOut ? new Date(clockOut) : new Date()
    const diffMs = end.getTime() - start.getTime()

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${hours}h ${minutes}m`
  }

  const columns = useMemo<ColumnDef<AttendanceRecord>[]>(
    () => [
      {
        accessorKey: 'user.name',
        header: 'User',
        cell: ({ row }) => {
          const user = row.original.user
          return (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <div className="font-medium">{user.name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'user.role',
        header: 'Role',
        cell: ({ row }) => {
          const role = row.original.user.role
          return (
            <Badge variant="outline" className="font-mono">
              {role}
            </Badge>
          )
        },
      },
      {
        accessorKey: 'work_date',
        header: 'Date',
        cell: ({ getValue }) => {
          const date = getValue() as string
          return format(parseISO(date), 'MMM dd, yyyy')
        },
      },
      {
        accessorKey: 'clock_in_time',
        header: 'Clock In',
        cell: ({ getValue }) => {
          const time = getValue() as string
          return format(new Date(time), 'h:mm:ss a')
        },
      },
      {
        accessorKey: 'clock_out_time',
        header: 'Clock Out',
        cell: ({ getValue }) => {
          const time = getValue() as string | null
          return time ? format(new Date(time), 'h:mm:ss a') : (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Clock3 className="h-3 w-3 mr-1" />
              Working
            </Badge>
          )
        },
      },
      {
        id: 'duration',
        header: 'Duration',
        cell: ({ row }) => {
          const record = row.original
          return calculateDuration(record.clock_in_time, record.clock_out_time)
        },
      },
      {
        accessorKey: 'total_distance',
        header: 'Distance',
        cell: ({ getValue }) => {
          const distance = getValue() as number | null
          return distance ? `${distance.toFixed(2)} km` : 'N/A'
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const record = row.original
          return record.clock_out_time ? (
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completed
            </Badge>
          ) : (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <Clock className="h-3 w-3 mr-1" />
              Working
            </Badge>
          )
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const record = row.original
          return (
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openDetailDialog(record)}
              >
                <Eye className="h-4 w-4 mr-1" />
                Details
              </Button>
            </div>
          )
        },
      },
    ],
    []
  )

  const table = useReactTable({
    data: attendance,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">For selected date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Working</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.working}</div>
            <p className="text-xs text-muted-foreground">Active shifts now</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Clocked out</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalDistance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Kilometers traveled</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Records
          </CardTitle>
          <CardDescription>View and manage employee attendance and GPS tracking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="SURVEYOR">Surveyor</SelectItem>
                  <SelectItem value="SALES">Sales</SelectItem>
                  <SelectItem value="DELIVERY">Delivery</SelectItem>
                  <SelectItem value="COLLECTOR">Collector</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchAttendance}>
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
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
                        <TableRow key={row.id}>
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
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{' '}
                  {Math.min(
                    (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                    table.getFilteredRowModel().rows.length
                  )}{' '}
                  of {table.getFilteredRowModel().rows.length} records
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Clock className="h-5 w-5 text-primary-foreground" />
              </div>
              Attendance Details
            </DialogTitle>
            <DialogDescription>
              Complete attendance information and GPS tracking data
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{selectedRecord.user.name}</span>
                  <Badge variant="outline">{selectedRecord.user.role}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{selectedRecord.user.email}</div>
              </div>

              {/* Time Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    Clock In
                  </div>
                  <div className="text-lg font-mono">
                    {format(new Date(selectedRecord.clock_in_time), 'h:mm:ss a')}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {format(new Date(selectedRecord.clock_in_time), 'MMM dd, yyyy')}
                  </div>
                  {selectedRecord.clock_in_lat && selectedRecord.clock_in_long && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedRecord.clock_in_lat.toFixed(6)}, {selectedRecord.clock_in_long.toFixed(6)}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4 text-red-600" />
                    Clock Out
                  </div>
                  {selectedRecord.clock_out_time ? (
                    <>
                      <div className="text-lg font-mono">
                        {format(new Date(selectedRecord.clock_out_time), 'h:mm:ss a')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(selectedRecord.clock_out_time), 'MMM dd, yyyy')}
                      </div>
                      {selectedRecord.clock_out_lat && selectedRecord.clock_out_long && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {selectedRecord.clock_out_lat.toFixed(6)}, {selectedRecord.clock_out_long.toFixed(6)}
                        </div>
                      )}
                    </>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">
                      <Clock3 className="h-3 w-3 mr-1" />
                      Still Working
                    </Badge>
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-muted rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                  <div className="text-lg font-semibold">
                    {calculateDuration(selectedRecord.clock_in_time, selectedRecord.clock_out_time)}
                  </div>
                </div>
              </div>

              {/* GPS Tracking Info */}
              {selectedRecord.gps_points && selectedRecord.gps_points.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    GPS Tracking Points ({selectedRecord.gps_points.length})
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded-lg p-2 text-xs">
                    {selectedRecord.gps_points.map((point) => (
                      <div key={point.id} className="py-1 border-b last:border-0">
                        <span className="font-mono">
                          {format(new Date(point.timestamp), 'HH:mm:ss')}
                        </span>
                        {' - '}
                        <span className="text-muted-foreground">
                          {point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
