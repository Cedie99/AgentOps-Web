'use client'

import React, { useState, useMemo } from 'react'
import { MOCK_STORES } from '@/lib/constants'
import { MobileRole, StoreStatus } from '@/lib/types'
import {
  ShieldCheck,
  Camera,
  Wallet,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight,
  TrendingDown,
  X,
  Navigation,
  Download,
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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeliveryProof {
  storeName: string
  address: string
  agentName: string
  timestamp: string
  photoUrl: string
  storeId: string
}

interface CollectionLog {
  storeName: string
  agentName: string
  timestamp: string
  paymentStatus: string
  amountCollected?: number
  totalOrderAmount?: number
  note?: string
  storeId: string
}

const AuditHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proofs' | 'ledger'>('proofs')
  const [isProofModalOpen, setIsProofModalOpen] = useState(false)
  const [selectedProof, setSelectedProof] = useState<{
    url: string
    store: string
    agent: string
    address: string
    time: string
  } | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')

  // Extract all delivery proof events from stores
  const deliveryProofs = useMemo(() => {
    const proofs: DeliveryProof[] = []
    MOCK_STORES.forEach((store) => {
      store.timeline.forEach((event) => {
        if (event.role === MobileRole.DELIVERY && event.photoUrl) {
          proofs.push({
            storeName: store.name,
            address: store.address,
            agentName: event.agentName,
            timestamp: event.timestamp,
            photoUrl: event.photoUrl,
            storeId: store.id,
          })
        }
      })
    })
    return proofs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [])

  // Extract all collection events from stores
  const collectionLedger = useMemo(() => {
    const logs: CollectionLog[] = []
    MOCK_STORES.forEach((store) => {
      store.timeline.forEach((event) => {
        if (event.role === MobileRole.COLLECTOR && event.paymentStatus) {
          logs.push({
            storeName: store.name,
            agentName: event.agentName,
            timestamp: event.timestamp,
            paymentStatus: event.paymentStatus,
            amountCollected: event.amountCollected,
            totalOrderAmount: event.totalOrderAmount,
            note: event.note,
            storeId: store.id,
          })
        }
      })
    })
    return logs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [])

  const totalCollected = collectionLedger.reduce(
    (acc, curr) => acc + (curr.amountCollected || 0),
    0
  )
  const pendingBalance = collectionLedger.reduce(
    (acc, curr) =>
      acc + ((curr.totalOrderAmount || 0) - (curr.amountCollected || 0)),
    0
  )

  const openProof = (proof: DeliveryProof) => {
    setSelectedProof({
      url: proof.photoUrl,
      store: proof.storeName,
      agent: proof.agentName,
      address: proof.address,
      time: proof.timestamp,
    })
    setIsProofModalOpen(true)
  }

  // Define columns for Delivery Proofs
  const proofColumnHelper = createColumnHelper<DeliveryProof>()
  const proofColumns = [
    proofColumnHelper.accessor('storeName', {
      header: 'Store & Time',
      cell: (info) => {
        const proof = info.row.original
        return (
          <div>
            <p className="text-sm font-semibold text-foreground">{info.getValue()}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{proof.timestamp}</span>
            </div>
          </div>
        )
      },
    }),
    proofColumnHelper.accessor('address', {
      header: 'Location Info',
      cell: (info) => (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <span>{info.getValue()}</span>
        </div>
      ),
    }),
    proofColumnHelper.accessor('agentName', {
      header: 'Delivery Agent',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              {info.getValue().charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{info.getValue()}</span>
        </div>
      ),
    }),
    proofColumnHelper.display({
      id: 'verification',
      header: () => <div className="text-center">Verification</div>,
      cell: () => (
        <div className="flex justify-center">
          <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 border-emerald-200 dark:border-emerald-700">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        </div>
      ),
    }),
    proofColumnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Action</div>,
      cell: (info) => (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openProof(info.row.original)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Proof
          </Button>
        </div>
      ),
    }),
  ]

  // Define columns for Collection Ledger
  const ledgerColumnHelper = createColumnHelper<CollectionLog>()
  const ledgerColumns = [
    ledgerColumnHelper.accessor('storeName', {
      header: 'Store / Time',
      cell: (info) => {
        const log = info.row.original
        return (
          <div>
            <p className="text-sm font-semibold text-foreground">{info.getValue()}</p>
            <p className="text-xs text-muted-foreground mt-1">{log.timestamp}</p>
          </div>
        )
      },
    }),
    ledgerColumnHelper.accessor('agentName', {
      header: 'Collector',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
              {info.getValue().charAt(0)}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{info.getValue()}</span>
        </div>
      ),
    }),
    ledgerColumnHelper.accessor('paymentStatus', {
      header: () => <div className="text-center">Payment Status</div>,
      cell: (info) => (
        <div className="flex justify-center">
          <Badge
            className={
              info.getValue() === 'Full'
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 border-emerald-200 dark:border-emerald-700'
                : 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900 border-amber-200 dark:border-amber-700'
            }
          >
            {info.getValue()}
          </Badge>
        </div>
      ),
    }),
    ledgerColumnHelper.display({
      id: 'amounts',
      header: () => <div className="text-right">Collected / Total</div>,
      cell: (info) => {
        const log = info.row.original
        return (
          <div className="text-right">
            <p className="text-sm font-bold text-foreground">
              ₱{(log.amountCollected || 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              of ₱{(log.totalOrderAmount || 0).toLocaleString()}
            </p>
          </div>
        )
      },
    }),
    ledgerColumnHelper.display({
      id: 'variance',
      header: () => <div className="text-right">Variance</div>,
      cell: (info) => {
        const log = info.row.original
        const variance =
          (log.totalOrderAmount || 0) - (log.amountCollected || 0)
        return (
          <div className="text-right">
            <span
              className={`text-sm font-bold ${
                variance > 0 ? 'text-amber-600' : 'text-emerald-600'
              }`}
            >
              {variance > 0 ? `-₱${variance.toLocaleString()}` : 'Cleared'}
            </span>
          </div>
        )
      },
    }),
    ledgerColumnHelper.display({
      id: 'action',
      cell: () => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon">
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      ),
    }),
  ]

  // Initialize TanStack Tables
  const proofsTable = useReactTable({
    data: deliveryProofs,
    columns: proofColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const ledgerTable = useReactTable({
    data: collectionLedger,
    columns: ledgerColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  const activeTable = activeTab === 'proofs' ? proofsTable : ledgerTable

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Audit & Verification Hub
          </h1>
          <p className="text-muted-foreground">
            Monitor field proof-of-delivery and financial collections ledger.
          </p>
        </div>
        <div className="flex bg-muted p-1.5 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('proofs')}
            className={`gap-2 ${
              activeTab === 'proofs'
                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-muted-foreground/10'
                : 'hover:bg-muted-foreground/10'
            }`}
          >
            <Camera className="w-4 h-4" />
            Delivery Proofs ({deliveryProofs.length})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab('ledger')}
            className={`gap-2 ${
              activeTab === 'ledger'
                ? 'text-emerald-600 dark:text-emerald-400 hover:bg-muted-foreground/10'
                : 'hover:bg-muted-foreground/10'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Collection Ledger ({collectionLedger.length})
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-emerald-600 dark:text-emerald-400 rotate-180" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Total Collected Today
                </p>
                <h2 className="text-2xl font-bold">
                  ₱{totalCollected.toLocaleString()}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Outstanding Balance
                </p>
                <h2 className="text-2xl font-bold text-amber-600">
                  ₱{pendingBalance.toLocaleString()}
                </h2>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Verification Rate
                </p>
                <h2 className="text-2xl font-bold text-emerald-600">98.4%</h2>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder={`Search ${
                  activeTab === 'proofs' ? 'delivery proofs' : 'collections'
                }...`}
                className="pl-9"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {activeTable.getHeaderGroups().map((headerGroup) => (
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
                {activeTable.getRowModel().rows?.length ? (
                  activeTable.getRowModel().rows.map((row) => (
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
                      colSpan={
                        activeTab === 'proofs'
                          ? proofColumns.length
                          : ledgerColumns.length
                      }
                      className="h-24 text-center"
                    >
                      <div className="flex flex-col items-center gap-2">
                        {activeTab === 'proofs' ? (
                          <Camera className="w-12 h-12 text-muted-foreground/20" />
                        ) : (
                          <Wallet className="w-12 h-12 text-muted-foreground/20" />
                        )}
                        <p className="text-sm text-muted-foreground">
                          No {activeTab === 'proofs' ? 'delivery proofs' : 'collections'}{' '}
                          available yet.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {activeTable.getState().pagination.pageIndex * activeTable.getState().pagination.pageSize + 1} to{' '}
              {Math.min(
                (activeTable.getState().pagination.pageIndex + 1) * activeTable.getState().pagination.pageSize,
                activeTable.getFilteredRowModel().rows.length
              )}{' '}
              of {activeTable.getFilteredRowModel().rows.length} entries
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => activeTable.previousPage()}
                disabled={!activeTable.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => activeTable.nextPage()}
                disabled={!activeTable.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Proof Lightbox Modal */}
      <Dialog open={isProofModalOpen} onOpenChange={setIsProofModalOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Delivery Proof</DialogTitle>
          </DialogHeader>
          {selectedProof && (
            <div className="space-y-6">
              <div className="relative overflow-hidden rounded-lg border bg-muted">
                <img
                  src={selectedProof.url}
                  alt="Proof"
                  className="w-full h-auto object-contain max-h-[60vh]"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                        <Navigation className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">
                          Destination Verified
                        </p>
                        <p className="text-lg font-bold">{selectedProof.store}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedProof.address}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">
                          Delivery Handler
                        </p>
                        <p className="text-lg font-bold">{selectedProof.agent}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedProof.time}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download Original
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AuditHub
