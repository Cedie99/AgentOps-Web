'use client'

import SalesTracking from '@/components/dashboard/SalesTracking'
import OrderManagement from '@/components/dashboard/OrderManagement'
import StoreVisits from '@/components/dashboard/StoreVisits'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, ShoppingCart, MapPin } from 'lucide-react'

export default function SalesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Hub</h1>
        <p className="text-muted-foreground">Manage sales activities and orders</p>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Order Management
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Sales Tracking
          </TabsTrigger>
          <TabsTrigger value="visits" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Store Visits
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          <OrderManagement />
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <SalesTracking />
        </TabsContent>

        <TabsContent value="visits" className="space-y-4">
          <StoreVisits />
        </TabsContent>
      </Tabs>
    </div>
  )
}
