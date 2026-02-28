import { Card } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-9 w-48 bg-muted animate-pulse rounded mb-2" />
          <div className="h-4 w-96 bg-muted animate-pulse rounded" />
        </div>
        <div className="h-10 w-40 bg-muted animate-pulse rounded" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
            </div>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 h-10 bg-muted animate-pulse rounded" />
          <div className="w-[180px] h-10 bg-muted animate-pulse rounded" />
          <div className="w-[180px] h-10 bg-muted animate-pulse rounded" />
        </div>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <div className="p-4 border-b">
          <div className="h-6 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="p-4">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-8 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
