'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Store as StoreIcon,
  Map as MapIcon,
  Users,
  Truck,
  Clock,
  Megaphone,
  Settings,
  Menu,
  X,
  Bell,
  Search,
  UserCog,
  ClipboardCheck,
  ShoppingBag,
  PackageCheck,
  ShieldCheck,
  LogOut,
  User,
  FileText,
  History,
  Package,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type NavItem = {
  id: string
  label: string
  icon: typeof LayoutDashboard
  href: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'stores', label: 'Store Ops', icon: StoreIcon, href: '/dashboard/stores' },
  { id: 'map', label: 'Live Map', icon: MapIcon, href: '/dashboard/map' },
  { id: 'history', label: 'GPS History', icon: History, href: '/dashboard/tracking/history' },
  { id: 'surveyors', label: 'Surveyor Hub', icon: ClipboardCheck, href: '/dashboard/surveyors' },
  { id: 'surveys', label: 'Surveys', icon: FileText, href: '/dashboard/surveys' },
  { id: 'sales', label: 'Sales Hub', icon: ShoppingBag, href: '/dashboard/sales' },
  { id: 'products', label: 'Products', icon: Package, href: '/dashboard/products' },
  { id: 'logistics', label: 'Logistics Hub', icon: PackageCheck, href: '/dashboard/logistics' },
  { id: 'audit', label: 'Audit Hub', icon: ShieldCheck, href: '/dashboard/audit' },
  { id: 'agents', label: 'Fleet Assignment', icon: Users, href: '/dashboard/agents' },
  { id: 'vehicles', label: 'Fuel & Fleet', icon: Truck, href: '/dashboard/vehicles' },
  { id: 'attendance', label: 'Attendance', icon: Clock, href: '/dashboard/attendance' },
  { id: 'announcements', label: 'Broadcasts', icon: Megaphone, href: '/dashboard/announcements' },
  { id: 'users', label: 'User Management', icon: UserCog, href: '/dashboard/users' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Agent<span className="text-emerald-600">Ops</span>
              </h1>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      SA
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-slate-900">Alex Admin</p>
                      <p className="text-xs text-slate-500 font-medium">Super Admin</p>
                    </div>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 mb-2 ml-4">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Global search..."
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-64 lg:w-96 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-500 hover:text-emerald-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-slate-800">Operational Hub</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                System Online
              </span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}
