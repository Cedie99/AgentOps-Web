'use client'

import SalesTracking from '@/components/dashboard/SalesTracking'
import OrderManagement from '@/components/dashboard/OrderManagement'
import StoreVisits from '@/components/dashboard/StoreVisits'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, ShoppingCart, MapPin, Sparkles, Users } from 'lucide-react'
import { motion } from 'framer-motion'

export default function SalesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-orange-50">
      {/* Hero Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 px-6 py-12 rounded-3xl mx-6 mt-6 shadow-2xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white tracking-tight">
                Sales Hub
              </h1>
              <p className="text-white/90 text-sm font-medium mt-1">
                Manage your sales activities, orders, and team performance
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-semibold mb-1">Total Orders</p>
                  <p className="text-3xl font-black text-white">124</p>
                  <p className="text-white/60 text-xs mt-1">+12% from last month</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-semibold mb-1">Active Stores</p>
                  <p className="text-3xl font-black text-white">89</p>
                  <p className="text-white/60 text-xs mt-1">Across all regions</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <MapPin className="w-7 h-7 text-white" />
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs font-semibold mb-1">Sales Team</p>
                  <p className="text-3xl font-black text-white">15</p>
                  <p className="text-white/60 text-xs mt-1">Active representatives</p>
                </div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Users className="w-7 h-7 text-white" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-white shadow-lg shadow-gray-100 border-0 p-1.5 rounded-2xl">
            <TabsTrigger
              value="orders"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-6 py-2.5 font-semibold transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger
              value="tracking"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-6 py-2.5 font-semibold transition-all"
            >
              <TrendingUp className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger
              value="visits"
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-500 data-[state=active]:text-white data-[state=active]:shadow-lg px-6 py-2.5 font-semibold transition-all"
            >
              <MapPin className="h-4 w-4" />
              Visits
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <OrderManagement />
            </motion.div>
          </TabsContent>

          <TabsContent value="tracking" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <SalesTracking />
            </motion.div>
          </TabsContent>

          <TabsContent value="visits" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StoreVisits />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
