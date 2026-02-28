'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  LayoutDashboard,
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
  ShoppingBag,
  PackageCheck,
  LogOut,
  User,
  FileText,
  History,
  Package,
  Smartphone,
  MapPin,
  Sun,
  Moon,
  Activity,
  ShoppingCart,
  TrendingUp,
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
import { Button } from '@/components/ui/button'

type NavItem = {
  id: string
  label: string
  icon: typeof LayoutDashboard
  href: string
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'map', label: 'Live Map', icon: MapIcon, href: '/dashboard/map' },
  { id: 'history', label: 'Activity History', icon: History, href: '/dashboard/tracking/history' },
  { id: 'surveys', label: 'Surveys', icon: FileText, href: '/dashboard/surveys' },
  { id: 'orders', label: 'Orders', icon: ShoppingCart, href: '/dashboard/orders' },
  { id: 'collections', label: 'Collections', icon: Package, href: '/dashboard/collections' },
  { id: 'sales-pipeline', label: 'Sales Overview', icon: TrendingUp, href: '/dashboard/sales-pipeline' },
  { id: 'sales-visits', label: 'Sales Visits', icon: MapPin, href: '/dashboard/sales-visits' },
  { id: 'sales-activities', label: 'Sales Activities', icon: Activity, href: '/dashboard/sales-activities' },
  { id: 'attendance', label: 'Attendance', icon: Clock, href: '/dashboard/attendance' },
  { id: 'announcements', label: 'Broadcasts', icon: Megaphone, href: '/dashboard/announcements' },
  { id: 'app-versions', label: 'App Versions', icon: Smartphone, href: '/dashboard/app-versions' },
  { id: 'users', label: 'User Management', icon: UserCog, href: '/dashboard/users' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()

  // Fetch current user on mount
  React.useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const data = await response.json()
          setCurrentUser(data)
        }
      } catch (error) {
        console.error('Error fetching current user:', error)
      }
    }
    fetchCurrentUser()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      router.push('/login')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  // Get user initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Format role for display
  const formatRole = (role: string) => {
    return role
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ')
  }

  return (
    <div className="min-h-screen bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Oracle Petroleum Corporation"
                width={56}
                height={56}
                className="rounded-lg flex-shrink-0"
              />
              <div className="flex flex-col min-w-0">
                <h1 className="text-base font-bold text-foreground tracking-tight leading-tight">
                  Oracle Petroleum
                </h1>
                <p className="text-base font-bold text-emerald-600 tracking-tight leading-tight">
                  Corporation
                </p>
              </div>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground flex-shrink-0"
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
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 mt-auto border-t border-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full p-4 bg-muted rounded-2xl hover:bg-muted/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
                      {currentUser ? getUserInitials(currentUser.name) : 'U'}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">
                        {currentUser?.name || 'Loading...'}
                      </p>
                      <p className="text-xs text-muted-foreground font-medium">
                        {currentUser ? formatRole(currentUser.role) : 'Loading...'}
                      </p>
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
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
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
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-muted-foreground"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="relative"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            <button className="relative p-2 text-muted-foreground hover:text-emerald-600 transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 border-2 border-card dark:border-card rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-border hidden sm:block"></div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-bold text-foreground">Operational Hub</span>
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
