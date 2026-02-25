'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import { Calendar, User, Download, Search, MapPin, Clock, TrendingUp, Map, ArrowLeft, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { CalendarIcon } from 'lucide-react'

// Custom CSS for dark mode popup
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    /* Light mode popup */
    .leaflet-popup-content-wrapper {
      background: #f1f5f9 !important;
      color: #0f172a !important;
      border-radius: 0.5rem !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
    }
    .leaflet-popup-tip {
      background: #f1f5f9 !important;
    }

    /* Dark mode popup */
    .dark .leaflet-popup-content-wrapper {
      background: #1e293b !important;
      color: #f8fafc !important;
      border-radius: 0.5rem !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
    }
    .dark .leaflet-popup-tip {
      background: #1e293b !important;
    }

    /* Remove default padding */
    .leaflet-popup-content {
      margin: 12px !important;
    }

    /* Close button */
    .leaflet-popup-close-button {
      color: #64748b !important;
      font-size: 20px !important;
      padding: 4px 8px !important;
    }
    .dark .leaflet-popup-close-button {
      color: #94a3b8 !important;
    }
    .leaflet-popup-close-button:hover {
      color: #0f172a !important;
    }
    .dark .leaflet-popup-close-button:hover {
      color: #f8fafc !important;
    }
  `
  if (!document.getElementById('leaflet-popup-dark-mode')) {
    style.id = 'leaflet-popup-dark-mode'
    document.head.appendChild(style)
  }
}

// Dynamically import Leaflet components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
// Removed Polyline - not needed for this map
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

interface Agent {
  id: number
  name: string
  email: string
  role: string
}

interface AttendanceRecord {
  id: number
  user_id: number
  work_date: string
  clock_in_time: string
  clock_out_time: string | null
  total_distance: number | null
}

interface GPSPoint {
  id: number
  latitude: number
  longitude: number
  timestamp: string
  speed: number | null
}

interface Activity {
  id: string
  type: 'survey' | 'visit'
  timestamp: string
  latitude: number | null
  longitude: number | null
  title: string
  description: string
  status?: string
  notes?: string
  role?: string
  photo_url?: string | null
  owner_name?: string | null
  contact_number?: string | null
  city?: string | null
}

export default function TrackingHistoryPage() {
  const { theme } = useTheme()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('ALL')
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table') // New state for view mode
  const [agents, setAgents] = useState<Agent[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [gpsRoute, setGpsRoute] = useState<GPSPoint[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [startIcon, setStartIcon] = useState<any>(null)
  const [endIcon, setEndIcon] = useState<any>(null)
  const [activityIcons, setActivityIcons] = useState<any[]>([])
  const [locationAddresses, setLocationAddresses] = useState<Record<string, string>>({})

  // Initialize Leaflet icons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        setLeafletLoaded(true)

        const startMarker = L.divIcon({
          className: 'custom-start-icon',
          html: `<div class="w-10 h-10 bg-green-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                 </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })

        const endMarker = L.divIcon({
          className: 'custom-end-icon',
          html: `<div class="w-10 h-10 bg-red-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path></svg>
                 </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })

        setStartIcon(startMarker)
        setEndIcon(endMarker)

        // Create numbered activity markers (will be populated based on activities count)
        const maxActivities = 50 // Create up to 50 numbered icons
        const icons = []
        for (let i = 1; i <= maxActivities; i++) {
          const activityIcon = L.divIcon({
            className: `custom-activity-icon-${i}`,
            html: `<div class="w-10 h-10 bg-emerald-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                     <span class="text-white font-bold text-sm">${i}</span>
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
          })
          icons.push(activityIcon)
        }
        setActivityIcons(icons)
      })
    }
  }, [])

  // Fetch agents on mount
  useEffect(() => {
    fetchAgents()
  }, [])

  // Fetch attendance records when date changes
  useEffect(() => {
    if (selectedDate) {
      fetchAttendanceRecords()
    }
  }, [selectedDate])

  // Fetch GPS route and activities when agent is selected
  useEffect(() => {
    if (selectedAgent && selectedDate) {
      fetchGPSRoute()
      fetchActivities()
    } else {
      setActivities([])
    }
  }, [selectedAgent, selectedDate])

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/users?roles=SALES,SURVEYOR,DELIVERY,COLLECTOR')
      if (response.ok) {
        const data = await response.json()
        setAgents(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    }
  }

  const fetchAttendanceRecords = async () => {
    try {
      setLoading(true)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const response = await fetch(`/api/tracking/attendance?date=${dateStr}`)
      if (response.ok) {
        const data = await response.json()
        setAttendanceRecords(data.records || [])
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchGPSRoute = async () => {
    if (!selectedAgent) return

    try {
      setLoading(true)
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const response = await fetch(
        `/api/tracking/gps?user_id=${selectedAgent}&from=${dateStr}T00:00:00Z&to=${dateStr}T23:59:59Z`
      )
      if (response.ok) {
        const data = await response.json()
        setGpsRoute(data.gpsPoints || [])
      }
    } catch (error) {
      console.error('Error fetching GPS route:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    if (!selectedAgent || !selectedDate) return

    try {
      // Convert Date to YYYY-MM-DD format
      const dateStr = format(selectedDate, 'yyyy-MM-dd')

      console.log('📡 Fetching activities for agent:', selectedAgent, 'date:', dateStr)
      const response = await fetch(
        `/api/tracking/activities?user_id=${selectedAgent}&date=${dateStr}`
      )
      if (response.ok) {
        const data = await response.json()
        console.log('📥 Activities received:', data)
        setActivities(data.activities || [])
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to fetch activities:', response.status, errorText)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    }
  }

  // Reverse geocode: convert lat/lng to address
  const getAddressFromCoords = async (lat: number, lng: number): Promise<string> => {
    const cacheKey = `${lat},${lng}`
    if (locationAddresses[cacheKey]) {
      return locationAddresses[cacheKey]
    }

    try {
      // Using OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AgentOpsApp/1.0'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`

        // Cache the address
        setLocationAddresses(prev => ({...prev, [cacheKey]: address}))

        return address
      }
    } catch (error) {
      console.error('Error geocoding:', error)
    }

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }

  const selectedAttendance = attendanceRecords.find(r => r.user_id === selectedAgent)
  const selectedAgentData = agents.find(a => a.id === selectedAgent)

  // Filter agents by role
  const filteredAgents = selectedRole === 'ALL'
    ? agents
    : agents.filter(a => a.role === selectedRole)

  const mapCenter: [number, number] = useMemo(() => {
    if (gpsRoute.length > 0) {
      return [gpsRoute[0].latitude, gpsRoute[0].longitude]
    }
    return [14.5995, 120.9842] // Default Manila
  }, [gpsRoute])

  const getDuration = () => {
    if (!selectedAttendance) return '0h 0m'
    const start = new Date(selectedAttendance.clock_in_time)
    const end = selectedAttendance.clock_out_time
      ? new Date(selectedAttendance.clock_out_time)
      : new Date()
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const handleViewMap = async (agentId: number) => {
    setSelectedAgent(agentId)
    setViewMode('map')
    // Data will be fetched by the useEffect when selectedAgent changes
  }

  const handleBackToTable = () => {
    setViewMode('table')
    setSelectedAgent(null)
    setGpsRoute([])
    setActivities([])
  }

  // Get attendance records for agents filtered by role
  const agentsWithAttendance = useMemo(() => {
    return attendanceRecords
      .map(record => {
        const agent = agents.find(a => a.id === record.user_id)
        if (!agent) return null
        if (selectedRole !== 'ALL' && agent.role !== selectedRole) return null
        return {
          ...agent,
          attendance: record,
        }
      })
      .filter(Boolean)
  }, [attendanceRecords, agents, selectedRole])

  // TABLE VIEW
  if (viewMode === 'table') {
    return (
      <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">GPS Tracking History</h1>
            <p className="text-muted-foreground text-sm">Review agent activities and routes</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Filter by Role</label>
              <Select
                value={selectedRole}
                onValueChange={(value) => setSelectedRole(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="SURVEYOR">Surveyor</SelectItem>
                  <SelectItem value="SALES">Sales</SelectItem>
                  <SelectItem value="DELIVERY">Delivery</SelectItem>
                  <SelectItem value="COLLECTOR">Collector</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Agents Table */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-foreground">
              Active Agents ({agentsWithAttendance.length})
            </h3>
            <p className="text-sm text-muted-foreground">
              Agents who worked on {format(selectedDate, "MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Clock In</TableHead>
                  <TableHead>Clock Out</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
                        <span className="text-muted-foreground">Loading agents...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : agentsWithAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <MapPin className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        No agents worked on this date
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  agentsWithAttendance.map((item: any) => {
                    const attendance = item.attendance
                    const start = new Date(attendance.clock_in_time)
                    const end = attendance.clock_out_time ? new Date(attendance.clock_out_time) : new Date()
                    const diff = end.getTime() - start.getTime()
                    const hours = Math.floor(diff / (1000 * 60 * 60))
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                    const duration = `${hours}h ${minutes}m`

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.role}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {attendance.clock_out_time
                            ? new Date(attendance.clock_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-sm">{duration}</TableCell>
                        <TableCell>
                          {attendance.clock_out_time ? (
                            <Badge className="bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900">
                              Completed
                            </Badge>
                          ) : (
                            <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900">
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-2"
                            onClick={() => handleViewMap(item.id)}
                          >
                            <Map className="h-4 w-4" />
                            View Map
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    )
  }

  // MAP VIEW
  // Location Address Component
  function LocationAddress({ lat, lng, getAddress }: { lat: number | null, lng: number | null, getAddress: (lat: number, lng: number) => Promise<string> }) {
    const [address, setAddress] = useState<string>('Loading...')

    useEffect(() => {
      if (lat && lng) {
        getAddress(lat, lng).then(setAddress)
      } else {
        setAddress('-')
      }
    }, [lat, lng])

    if (!lat || !lng) return <span className="text-muted-foreground">-</span>

    return (
      <div className="text-muted-foreground leading-relaxed break-words">
        {address}
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={handleBackToTable}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              {selectedAgentData?.name} - Route Details
            </h1>
            <p className="text-muted-foreground text-sm">
              {new Date(selectedDate).toLocaleDateString()} • {selectedAgentData?.role}
            </p>
          </div>
        </div>
      </div>

      {/* Shift Summary Stats */}
      {selectedAttendance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Clock In</p>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                  {new Date(selectedAttendance.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <Clock className="h-8 w-8 text-emerald-500" />
            </div>
          </Card>

          <Card className="p-4 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Clock Out</p>
                <p className="text-lg font-bold text-red-900 dark:text-red-100">
                  {selectedAttendance.clock_out_time
                    ? new Date(selectedAttendance.clock_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Active'}
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4 bg-indigo-50 dark:bg-indigo-950 border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase">Duration</p>
                <p className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{getDuration()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-indigo-500" />
            </div>
          </Card>
        </div>
      )}

      {/* Map and Details */}
      <div className="flex-1 relative bg-card border border-border rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* Map */}
        <div className="flex-1 relative bg-muted">
          {leafletLoaded && startIcon && endIcon ? (
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={true}
              className="h-full w-full z-0 bg-muted"
              style={{ background: 'var(--color-muted)' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url={
                  theme === 'dark'
                    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                }
              />

              {/* Start Marker - or Single Point if user didn't move */}
              {gpsRoute.length > 0 && (
                <Marker position={[gpsRoute[0].latitude, gpsRoute[0].longitude]} icon={startIcon}>
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-sm">
                        {gpsRoute.length === 1 ? 'Location (No Movement Detected)' : 'Start Point'}
                      </h3>
                      <p className="text-xs text-slate-600">
                        {new Date(gpsRoute[0].timestamp).toLocaleTimeString()}
                      </p>
                      {gpsRoute.length === 1 && (
                        <p className="text-xs text-amber-600 mt-1">
                          User stayed at this location during their shift
                        </p>
                      )}
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* End Marker - only show if user has actually clocked out */}
              {selectedAttendance?.clock_out_time && gpsRoute.length > 1 && (
                <Marker
                  position={[gpsRoute[gpsRoute.length - 1].latitude, gpsRoute[gpsRoute.length - 1].longitude]}
                  icon={endIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-sm">End Point (Clock Out)</h3>
                      <p className="text-xs text-slate-600">
                        {new Date(selectedAttendance.clock_out_time).toLocaleTimeString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Activity Markers (Surveys & Visits) - Numbered 1, 2, 3... */}
              {activities.map((activity, index) => {
                if (!activity.latitude || !activity.longitude) return null

                const icon = activityIcons[index]
                if (!icon) return null

                return (
                  <Marker
                    key={activity.id}
                    position={[activity.latitude, activity.longitude]}
                    icon={icon}
                  >
                    <Popup maxWidth={240}>
                      <div className="min-w-[220px]">
                        {/* Badge */}
                        <div className="mb-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${
                            activity.type === 'survey'
                              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                              : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                          }`}>
                            {activity.type === 'survey' ? '📋 Survey' : '📍 Visit'}
                          </span>
                        </div>

                        {/* Photo */}
                        {activity.photo_url && (
                          <div className="mb-3 rounded-md overflow-hidden">
                            <img
                              src={activity.photo_url}
                              alt={activity.title}
                              className="w-full h-32 object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        )}

                        {/* Store Name */}
                        <h3 className="font-semibold text-sm text-foreground mb-1">
                          {activity.title}
                        </h3>

                        {/* Address */}
                        <p className="text-xs text-muted-foreground mb-2">
                          {activity.description}
                        </p>

                        {/* Status */}
                        {activity.status && (
                          <div className="mb-2">
                            <span className="text-xs text-muted-foreground">
                              <span className="font-semibold">Status:</span> {activity.status}
                            </span>
                          </div>
                        )}

                        {/* Timestamp */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                          <Clock className="w-3 h-3" />
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}
            </MapContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 border-l border-border bg-card flex flex-col">
          <div className="p-6 border-b border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Route Details</h3>

            {selectedAgentData && selectedAttendance ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Agent</p>
                  <p className="font-semibold text-foreground">{selectedAgentData.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedAgentData.role}</p>
                </div>

                <div className="pt-4 border-t border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Clock In</span>
                    <span className="font-semibold text-sm text-foreground">
                      {new Date(selectedAttendance.clock_in_time).toLocaleTimeString()}
                    </span>
                  </div>

                  {selectedAttendance.clock_out_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Clock Out</span>
                      <span className="font-semibold text-sm text-foreground">
                        {new Date(selectedAttendance.clock_out_time).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Activities</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{activities.length}</span>
                  </div>

                  {activities.length === 0 && (
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded p-2 mt-2">
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        ℹ️ No surveys or visits recorded for this shift
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <MapPin className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Select a date and agent to view their route</p>
              </div>
            )}
          </div>

          {/* Activities List */}
          {activities.length > 0 && (
            <div className="flex-1 overflow-y-auto p-6 border-t border-border">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                Activity Timeline
              </h4>
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div
                    key={activity.id}
                    className="bg-muted/50 rounded-lg p-3 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            activity.type === 'survey'
                              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                              : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                          }`}>
                            {activity.type === 'survey' ? '📋 Survey' : '📍 Visit'}
                          </span>
                        </div>
                        {activity.photo_url && (
                          <div className="mb-2 rounded overflow-hidden">
                            <img
                              src={activity.photo_url}
                              alt={activity.title}
                              className="w-full h-20 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        <h5 className="text-sm font-semibold text-foreground truncate">
                          {activity.title}
                        </h5>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.description}
                        </p>
                        {activity.status && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-semibold">Status:</span> {activity.status}
                          </p>
                        )}
                        {activity.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            {activity.notes}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          🕐 {new Date(activity.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {gpsRoute.length > 0 && (
            <div className="p-6 border-t border-border">
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
