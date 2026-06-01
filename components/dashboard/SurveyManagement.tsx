'use client'

import React, { useState, useEffect } from 'react'
import {
  Search,
  MapPin,
  Phone,
  Building2,
  User,
  Calendar,
  Eye,
  Image as ImageIcon,
  Award,
  FileText,
  UserPlus,
  MoreVertical,
  CheckCircle2,
} from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table'
import { createClient } from '@/lib/supabase/client'

// shadcn components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
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
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Survey {
  id: number
  store_name: string
  owner_name: string | null
  contact_number: string
  contact_person: string | null
  current_supplier: string | null
  address: string
  address_line1: string
  address_line2: string
  address_line3: string | null
  city: string
  province: string
  landmark: string | null
  remarks: string | null
  gps_latitude: number
  gps_longitude: number
  store_photo_url: string | null
  is_platinum_client: boolean
  surveyor_id: number
  surveyor_name: string
  captured_at: string
  created_at: string
  updated_at: string
  assigned_to_id: number | null
  assigned_to_name: string | null
  assigned_at: string | null
  surveyor?: {
    id: number
    name: string
    email: string
    role: string
  }
  assigned_to?: {
    id: number
    name: string
    email: string
    role: string
  } | null
}

interface SalesUser {
  id: number
  name: string
  email: string
}

const SurveyManagement: React.FC = () => {
  const { toast } = useToast()

  // Local state
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [salesUsers, setSalesUsers] = useState<SalesUser[]>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [surveyToAssign, setSurveyToAssign] = useState<Survey | null>(null)
  const [selectedSalesUser, setSelectedSalesUser] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  // Fetch surveys on mount + subscribe to real-time changes
  useEffect(() => {
    fetchSurveys()
    fetchSalesUsers()

    const supabase = createClient()
    const channel = supabase
      .channel('surveys-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'surveys' },
        () => { fetchSurveys(true) }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const fetchSurveys = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const response = await fetch('/api/surveys')
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch surveys')
      }
      const data = await response.json()
      setSurveys(data.surveys)
    } catch (err: any) {
      console.error('Error fetching surveys:', err)
      if (!silent) setError(err.message || 'Failed to load surveys')
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  const fetchSalesUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      // Filter only SALES role users
      const sales = (data.users || []).filter((u: any) => u.role === 'SALES')
      setSalesUsers(sales)
    } catch (err) {
      console.error('Error fetching sales users:', err)
    }
  }

  const openDetailDialog = (survey: Survey) => {
    setSelectedSurvey(survey)
    setIsDetailDialogOpen(true)
  }

  const openAssignDialog = (survey: Survey) => {
    setSurveyToAssign(survey)
    setSelectedSalesUser(survey.assigned_to_id?.toString() || '')
    setIsAssignDialogOpen(true)
  }

  const handleAssignSurvey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!surveyToAssign || !selectedSalesUser) return

    setIsAssigning(true)
    setError('')

    try {
      console.log('Assigning survey:', {
        surveyId: surveyToAssign.id,
        salesUserId: parseInt(selectedSalesUser)
      })

      const response = await fetch('/api/surveys/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: surveyToAssign.id,
          salesUserId: parseInt(selectedSalesUser)
        })
      })

      const data = await response.json()
      console.log('Assignment response:', { status: response.status, data })

      if (!response.ok) {
        const errorMessage = data.details || data.error || 'Failed to assign survey'
        throw new Error(errorMessage)
      }

      // Get the assigned user name for the toast message
      const assignedUser = salesUsers.find(u => u.id === parseInt(selectedSalesUser))

      // Update local state directly — no full re-fetch needed
      setSurveys(prev => prev.map(s =>
        s.id === surveyToAssign.id
          ? {
              ...s,
              assigned_to_id: parseInt(selectedSalesUser),
              assigned_to_name: assignedUser?.name || null,
              assigned_at: new Date().toISOString(),
              assigned_to: assignedUser
                ? { id: assignedUser.id, name: assignedUser.name, email: assignedUser.email, role: 'SALES' }
                : null,
            }
          : s
      ))

      // Show success toast
      toast({
        title: "Survey Assigned Successfully",
        description: `${surveyToAssign.store_name} has been assigned to ${assignedUser?.name || 'sales agent'}.`,
        variant: "default",
      })

      // Close dialog
      setIsAssignDialogOpen(false)
      setSurveyToAssign(null)
      setSelectedSalesUser('')

    } catch (err: any) {
      console.error('Assignment error:', err)
      setError(err.message || 'Failed to assign survey')

      // Show error toast
      toast({
        title: "Assignment Failed",
        description: err.message || 'Failed to assign survey. Please try again.',
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  // Define columns using TanStack Table
  const columnHelper = createColumnHelper<Survey>()

  const columns = [
    columnHelper.accessor('store_name', {
      header: 'Store',
      cell: (info) => {
        const survey = info.row.original
        return (
          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground mt-1" />
            <div>
              <div className="font-medium">{survey.store_name}</div>
              {survey.owner_name && (
                <div className="text-sm text-muted-foreground">
                  Owner: {survey.owner_name}
                </div>
              )}
              <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Phone className="h-3 w-3" />
                {survey.contact_number}
              </div>
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor('city', {
      header: 'Location',
      cell: (info) => {
        const survey = info.row.original
        return (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">{survey.city}</div>
              <div className="text-muted-foreground">{survey.province}</div>
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor('surveyor_name', {
      header: 'Surveyor',
      cell: (info) => {
        const survey = info.row.original
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div className="font-medium">{survey.surveyor?.name || survey.surveyor_name}</div>
              {survey.surveyor && (
                <div className="text-xs text-muted-foreground">
                  {survey.surveyor.role}
                </div>
              )}
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor('assigned_to_name', {
      header: 'Assigned',
      cell: (info) => {
        const survey = info.row.original
        return survey.assigned_to ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {survey.assigned_to.name}
            </Badge>
          </div>
        ) : (
          <Badge variant="outline">Not Assigned</Badge>
        )
      },
    }),
    columnHelper.accessor('is_platinum_client', {
      header: 'Status',
      cell: (info) => (
        <div>
          {info.getValue() ? (
            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
              <Award className="h-3 w-3 mr-1" />
              Platinum
            </Badge>
          ) : (
            <Badge variant="outline">Standard</Badge>
          )}
        </div>
      ),
    }),
    columnHelper.accessor('captured_at', {
      header: 'Captured',
      cell: (info) => (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <div>
            {new Date(info.getValue()).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              timeZone: 'Asia/Manila',
            })}
          </div>
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const survey = info.row.original
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => openDetailDialog(survey)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openAssignDialog(survey)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  {survey.assigned_to ? 'Reassign' : 'Assign to Sales'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    }),
  ]

  // Initialize TanStack Table
  const table = useReactTable({
    data: surveys,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="h-9 w-64 bg-muted animate-pulse rounded mb-2" />
            <div className="h-4 w-80 bg-muted animate-pulse rounded" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Search and Table Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <div className="h-10 bg-muted animate-pulse rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableHead>
                    <TableHead>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableHead>
                    <TableHead>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableHead>
                    <TableHead>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableHead>
                    <TableHead>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableHead>
                    <TableHead>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableHead>
                    <TableHead>
                      <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <div className="h-4 w-4 bg-muted animate-pulse rounded mt-1" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-28 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                          <div className="space-y-2">
                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                          <div className="space-y-2">
                            <div className="h-4 w-28 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="h-6 w-24 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 bg-muted animate-pulse rounded" />
                          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Skeleton */}
            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="h-9 w-20 bg-muted animate-pulse rounded" />
              <div className="h-9 w-16 bg-muted animate-pulse rounded" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Survey Management</h1>
          <p className="text-muted-foreground">
            View and manage field survey submissions
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span className="font-medium">{surveys.length}</span> total surveys
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by store name, location, or surveyor..."
                className="pl-9"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
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
                          No surveys found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-end space-x-2 py-4">
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
            </>
        </CardContent>
      </Card>

      {/* Assign Survey Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <UserPlus className="h-5 w-5 text-primary-foreground" />
              </div>
              Assign Survey to Sales
            </DialogTitle>
            <DialogDescription>
              {surveyToAssign?.assigned_to
                ? 'Reassign this survey to a different sales user'
                : 'Assign this survey to a sales user for follow-up'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignSurvey}>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {surveyToAssign && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Survey Store</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="font-medium">{surveyToAssign.store_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {surveyToAssign.city}, {surveyToAssign.province}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="sales-user">Assign to Sales User</Label>
                <Select
                  value={selectedSalesUser}
                  onValueChange={setSelectedSalesUser}
                >
                  <SelectTrigger id="sales-user">
                    <SelectValue placeholder="Select a sales user" />
                  </SelectTrigger>
                  <SelectContent>
                    {salesUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {salesUsers.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No sales users available. Create a user with SALES role first.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAssignDialogOpen(false)
                  setError('')
                  setSurveyToAssign(null)
                  setSelectedSalesUser('')
                }}
                disabled={isAssigning}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isAssigning || !selectedSalesUser}>
                {isAssigning ? (
                  'Assigning...'
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Assign Survey
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Survey Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              Survey Details
            </DialogTitle>
            <DialogDescription>
              Complete information from field survey
            </DialogDescription>
          </DialogHeader>

          {selectedSurvey && (
            <div className="space-y-6 py-4 overflow-y-auto">
              {/* Store Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Store Information
                </h3>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Store Name</p>
                    <p className="font-medium">{selectedSurvey.store_name}</p>
                  </div>
                  {selectedSurvey.owner_name && (
                    <div>
                      <p className="text-sm text-muted-foreground">Owner Name</p>
                      <p className="font-medium">{selectedSurvey.owner_name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Number</p>
                    <p className="font-medium">{selectedSurvey.contact_number}</p>
                  </div>
                  {selectedSurvey.contact_person && (
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Person</p>
                      <p className="font-medium">{selectedSurvey.contact_person}</p>
                    </div>
                  )}
                  {selectedSurvey.current_supplier && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Current Supplier</p>
                      <p className="font-medium">{selectedSurvey.current_supplier}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Client Type</p>
                    {selectedSurvey.is_platinum_client ? (
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <Award className="h-3 w-3 mr-1" />
                        Platinum Client
                      </Badge>
                    ) : (
                      <Badge variant="outline">Standard Client</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Address
                </h3>
                <div className="grid gap-3 pl-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Street Address</p>
                    <p className="font-medium">{selectedSurvey.address_line1}</p>
                    <p className="font-medium">{selectedSurvey.address_line2}</p>
                    {selectedSurvey.address_line3 && (
                      <p className="font-medium">{selectedSurvey.address_line3}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">City</p>
                      <p className="font-medium">{selectedSurvey.city}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Province</p>
                      <p className="font-medium">{selectedSurvey.province}</p>
                    </div>
                  </div>
                  {selectedSurvey.landmark && (
                    <div>
                      <p className="text-sm text-muted-foreground">Landmark</p>
                      <p className="font-medium">{selectedSurvey.landmark}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">GPS Coordinates</p>
                    <p className="font-medium font-mono text-sm">
                      {selectedSurvey.gps_latitude.toFixed(6)}, {selectedSurvey.gps_longitude.toFixed(6)}
                    </p>
                    <a
                      href={`https://www.google.com/maps?q=${selectedSurvey.gps_latitude},${selectedSurvey.gps_longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      View on Google Maps
                      <MapPin className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Assignment Information */}
              {selectedSurvey.assigned_to && (
                <>
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Assignment
                    </h3>
                    <div className="grid grid-cols-2 gap-4 pl-6">
                      <div>
                        <p className="text-sm text-muted-foreground">Assigned To</p>
                        <p className="font-medium">{selectedSurvey.assigned_to.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedSurvey.assigned_to.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <Badge variant="outline">{selectedSurvey.assigned_to.role}</Badge>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Assigned Date</p>
                        <p className="font-medium">
                          {selectedSurvey.assigned_at && new Date(selectedSurvey.assigned_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Manila',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Surveyor Information */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Surveyor Information
                </h3>
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedSurvey.surveyor_name}</p>
                  </div>
                  {selectedSurvey.surveyor && (
                    <>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedSurvey.surveyor.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Role</p>
                        <Badge variant="outline">{selectedSurvey.surveyor.role}</Badge>
                      </div>
                    </>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Captured Date</p>
                    <p className="font-medium">
                      {new Date(selectedSurvey.captured_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        timeZone: 'Asia/Manila',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Store Photo */}
              {selectedSurvey.store_photo_url && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Store Photo
                    </h3>
                    <div className="pl-6">
                      <img
                        src={selectedSurvey.store_photo_url}
                        alt={`${selectedSurvey.store_name} store photo`}
                        className="w-full rounded-lg border"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Remarks */}
              {selectedSurvey.remarks && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Remarks
                    </h3>
                    <div className="pl-6">
                      <p className="text-sm whitespace-pre-wrap">{selectedSurvey.remarks}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SurveyManagement
