import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function Loading() {
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="h-8 w-64 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-80 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="h-3 w-24 bg-muted animate-pulse rounded mb-2" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </div>
          <div>
            <div className="h-3 w-24 bg-muted animate-pulse rounded mb-2" />
            <div className="h-10 w-full bg-muted animate-pulse rounded" />
          </div>
        </div>
      </Card>

      {/* Table Skeleton */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="h-5 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableHead>
                <TableHead><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableHead>
                <TableHead><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableHead>
                <TableHead><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableHead>
                <TableHead><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableHead>
                <TableHead><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableHead>
                <TableHead className="text-right"><div className="h-4 w-16 bg-muted animate-pulse rounded ml-auto" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-16 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 w-24 bg-muted animate-pulse rounded ml-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
