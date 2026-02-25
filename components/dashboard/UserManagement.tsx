'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  UserPlus,
  Search,
  Mail,
  Edit2,
  MoreVertical,
  CheckCircle2,
  Eye,
  Filter,
} from 'lucide-react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type ColumnDef,
} from '@tanstack/react-table'

// shadcn components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'

// All user roles (unified)
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'SURVEYOR' | 'SALES' | 'DELIVERY' | 'COLLECTOR'

interface User {
  id: number
  name: string
  email: string
  role: UserRole
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  created_at: string
}

const getRoleBadgeColor = (role: UserRole) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900'
    case 'ADMIN':
      return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900'
    case 'SALES':
      return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900'
    case 'SURVEYOR':
      return 'bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900'
    case 'DELIVERY':
      return 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900'
    case 'COLLECTOR':
      return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900'
    default:
      return ''
  }
}

const UserManagement: React.FC = () => {
  // Local state
  const [users, setUsers] = useState<User[]>([])
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [filterBy, setFilterBy] = useState<'all' | 'name' | 'email' | 'role'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES' as UserRole,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  })

  // Fetch current user role and users on component mount
  useEffect(() => {
    fetchCurrentUserRole()
    fetchUsers()
  }, [])

  const fetchCurrentUserRole = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user?.email) {
        console.error('No session or email found')
        return
      }

      console.log('Fetching role for email:', session.user.email)

      const response = await fetch('/api/users/me')
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Failed to fetch current user:', errorData)
        throw new Error('Failed to fetch current user')
      }
      const data = await response.json()
      console.log('Current user data:', data)
      setCurrentUserRole(data.role)
    } catch (err) {
      console.error('Error fetching current user role:', err)
    }
  }

  const fetchUsers = async () => {
    try {
      // First, get current user's role from session
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      const fetchedUsers = data.users || data
      setUsers(fetchedUsers)

      // Find current user in the list and set their role
      if (session?.user?.email) {
        const currentUser = fetchedUsers.find(
          (u: User) => u.email.toLowerCase() === session.user.email!.toLowerCase()
        )
        if (currentUser) {
          console.log('Found current user in list:', currentUser)
          setCurrentUserRole(currentUser.role)
        }
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Failed to load users')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user')
      }

      // Reset form and close modal
      setFormData({ name: '', email: '', password: '', role: 'SALES', status: 'ACTIVE' })
      setIsCreateDialogOpen(false)

      // Refresh users list
      await fetchUsers()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          role: formData.role,
          status: formData.status,
          ...(formData.password && { password: formData.password })
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user')
      }

      // Reset form and close modal
      setFormData({ name: '', email: '', password: '', role: 'SALES', status: 'ACTIVE' })
      setIsEditDialogOpen(false)
      setEditingUser(null)

      // Refresh users list
      await fetchUsers()

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      status: user.status
    })
    setIsEditDialogOpen(true)
  }

  // Define columns using TanStack Table
  const columnHelper = createColumnHelper<User>()

  const columns = [
    columnHelper.accessor('name', {
      header: 'User',
      cell: (info) => {
        const user = info.row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </div>
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor('role', {
      header: 'Role',
      cell: (info) => (
        <Badge className={getRoleBadgeColor(info.getValue())}>
          {info.getValue()}
        </Badge>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue()
        const isActive = status === 'ACTIVE'
        return (
          <div className={`inline-flex items-center gap-2 text-sm font-medium ${isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            <div className={`h-2 w-2 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span>{status}</span>
          </div>
        )
      },
    }),
    columnHelper.accessor('created_at', {
      header: 'Created',
      cell: (info) => (
        <div className="text-sm">
          {new Date(info.getValue()).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => {
        const user = info.row.original

        // Only show actions for SUPER_ADMIN
        if (currentUserRole !== 'SUPER_ADMIN') {
          return null
        }

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
                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit User
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    }),
  ]

  // Custom filter function
  const customGlobalFilterFn = (row: any, columnId: string, filterValue: string) => {
    const search = filterValue.toLowerCase()

    if (filterBy === 'all') {
      // Search across name, email, and role
      return (
        row.original.name.toLowerCase().includes(search) ||
        row.original.email.toLowerCase().includes(search) ||
        row.original.role.toLowerCase().includes(search)
      )
    } else {
      // Search specific field
      return row.original[filterBy]?.toLowerCase().includes(search) || false
    }
  }

  // Initialize TanStack Table
  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: customGlobalFilterFn,
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage administrative access and system roles
          </p>
        </div>
        {currentUserRole === 'SUPER_ADMIN' && (
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            size="lg"
            className="bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-800 text-white"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Create New User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={
                  filterBy === 'all'
                    ? 'Search by name, email, or role...'
                    : `Search by ${filterBy}...`
                }
                className="pl-9"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
            <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="role">Role</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
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
                      No users found
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
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <UserPlus className="h-5 w-5 text-primary-foreground" />
              </div>
              Create New User
            </DialogTitle>
            <DialogDescription>
              Add a new user to the system with their role and credentials
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser}>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@agentops.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALES">Sales (Mobile)</SelectItem>
                    <SelectItem value="SURVEYOR">Surveyor (Mobile)</SelectItem>
                    <SelectItem value="DELIVERY">Delivery (Mobile)</SelectItem>
                    <SelectItem value="COLLECTOR">Collector (Mobile)</SelectItem>
                    <SelectItem value="ADMIN">Admin (Web Only)</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin (Web Only)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Mobile roles can access the mobile app
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setError('')
                  setFormData({ name: '', email: '', password: '', role: 'SALES', status: 'ACTIVE' })
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  'Creating...'
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Create Account
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-primary rounded-lg">
                <Edit2 className="h-5 w-5 text-primary-foreground" />
              </div>
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user information and role
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditUser}>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Email Address</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="john.doe@agentops.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">New Password (Optional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as UserRole })}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SALES">Sales (Mobile)</SelectItem>
                    <SelectItem value="SURVEYOR">Surveyor (Mobile)</SelectItem>
                    <SelectItem value="DELIVERY">Delivery (Mobile)</SelectItem>
                    <SelectItem value="COLLECTOR">Collector (Mobile)</SelectItem>
                    <SelectItem value="ADMIN">Admin (Web Only)</SelectItem>
                    <SelectItem value="SUPER_ADMIN">Super Admin (Web Only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="edit-status">Account Status</Label>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-0.5">
                    <div className="font-medium text-sm">
                      {formData.status === 'ACTIVE' ? 'Active Account' : 'Inactive Account'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formData.status === 'ACTIVE'
                        ? 'User can log in and access the system'
                        : 'User cannot log in to their account'}
                    </div>
                  </div>
                  <Switch
                    id="edit-status"
                    checked={formData.status === 'ACTIVE'}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, status: checked ? 'ACTIVE' : 'INACTIVE' })
                    }
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setError('')
                  setEditingUser(null)
                  setFormData({ name: '', email: '', password: '', role: 'SALES', status: 'ACTIVE' })
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  'Updating...'
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserManagement
