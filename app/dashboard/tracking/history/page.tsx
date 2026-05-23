'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { Calendar, User, Download, Search, MapPin, Clock, TrendingUp, Map, ArrowLeft, Eye } from 'lucide-react'

// Helper function to parse database timestamp
// The API returns ISO strings with timezone info (e.g., "2026-03-18T21:25:33.383+08:00")
// The browser's Date constructor will correctly parse these
function parseLocalTime(timestamp: string | Date): Date {
  // If already a Date object, return it
  if (timestamp instanceof Date) {
    return timestamp
  }

  // Handle null/undefined
  if (!timestamp) {
    return new Date()
  }

  // Parse ISO string with timezone info
  const date = new Date(timestamp)

  // Check if date is valid
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', timestamp)
    return new Date()
  }

  return date
}
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
import { Map as MapCN, MapMarker, MarkerContent, MarkerPopup, MapControls } from '@/components/ui/map'

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
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table')
  const [agents, setAgents] = useState<Agent[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [gpsRoute, setGpsRoute] = useState<GPSPoint[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)

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

  const selectedAttendance = attendanceRecords.find(r => r.user_id === selectedAgent)
  const selectedAgentData = agents.find(a => a.id === selectedAgent)

  // Filter agents by role
  const filteredAgents = selectedRole === 'ALL'
    ? agents
    : agents.filter(a => a.role === selectedRole)

  const mapCenter: [number, number] = useMemo(() => {
    if (gpsRoute.length > 0) {
      return [gpsRoute[0].longitude, gpsRoute[0].latitude]
    }
    return [120.9842, 14.5995] // Default Manila [lng, lat]
  }, [gpsRoute])

  const getDuration = () => {
    if (!selectedAttendance) return '0h 0m'
    const start = parseLocalTime(selectedAttendance.clock_in_time)
    const end = selectedAttendance.clock_out_time
      ? parseLocalTime(selectedAttendance.clock_out_time)
      : new Date()
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const handleExportReport = () => {
    if (!selectedAgentData || !selectedAttendance) return

    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const agentName = selectedAgentData.name
    const role = selectedAgentData.role
    const clockIn = parseLocalTime(selectedAttendance.clock_in_time).toLocaleTimeString()
    const clockOut = selectedAttendance.clock_out_time
      ? parseLocalTime(selectedAttendance.clock_out_time).toLocaleTimeString()
      : 'Not clocked out'
    const duration = getDuration()
    const distance = selectedAttendance.total_distance != null
      ? `${selectedAttendance.total_distance.toFixed(2)} km`
      : 'N/A'
    const gpsPoints = gpsRoute.length

    const rows: string[][] = []

    // Summary header
    rows.push(['FIELD AGENT DAILY REPORT'])
    rows.push([])
    rows.push(['Agent Name', agentName])
    rows.push(['Role', role])
    rows.push(['Date', dateStr])
    rows.push(['Clock In', clockIn])
    rows.push(['Clock Out', clockOut])
    rows.push(['Total Hours', duration])
    rows.push(['Total Distance', distance])
    rows.push(['GPS Points Tracked', String(gpsPoints)])
    rows.push([])

    // Activities
    rows.push(['ACTIVITY LOG'])
    rows.push(['#', 'Type', 'Time', 'Title', 'Description', 'Status', 'City', 'Owner / Contact', 'Notes'])

    activities.forEach((act, i) => {
      const time = parseLocalTime(act.timestamp).toLocaleTimeString()
      const ownerContact = [act.owner_name, act.contact_number].filter(Boolean).join(' | ')
      rows.push([
        String(i + 1),
        act.type.toUpperCase(),
        time,
        act.title,
        act.description,
        act.status || '',
        act.city || '',
        ownerContact,
        act.notes || '',
      ])
    })

    if (activities.length === 0) {
      rows.push(['', 'No activities recorded for this date.'])
    }

    // Build CSV string
    const csv = rows.map(row =>
      row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
    ).join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `report_${agentName.replace(/\s+/g, '_')}_${dateStr}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleViewMap = async (agentId: number) => {
    setSelectedAgent(agentId)
    setViewMode('map')
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
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Activity History</h1>
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
                  <>
                    {[1, 2, 3, 4, 5].map((i) => (
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
                          <div className="h-8 w-24 bg-muted animate-pulse rounded" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
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
                    const start = parseLocalTime(attendance.clock_in_time)
                    const end = attendance.clock_out_time ? parseLocalTime(attendance.clock_out_time) : new Date()
                    const diff = end.getTime() - start.getTime()
                    const hours = Math.floor(diff / (1000 * 60 * 60))
                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                    const duration = `${hours}h ${minutes}m`

                    return (
                      <TableRow key={attendance.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.role}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {attendance.clock_out_time
                            ? parseLocalTime(attendance.clock_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
              {selectedAgentData?.name} - Activity Details
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
                  {parseLocalTime(selectedAttendance.clock_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                    ? parseLocalTime(selectedAttendance.clock_out_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
        <div className="flex-1 relative">
          <MapCN
            center={mapCenter}
            zoom={13}
            theme={theme as 'light' | 'dark'}
            className="h-full w-full"
          >
            <MapControls showZoom showLocate showCompass />

            {/* Start Marker */}
            {gpsRoute.length > 0 && (
              <MapMarker
                longitude={gpsRoute[0].longitude}
                latitude={gpsRoute[0].latitude}
              >
                <MarkerContent>
                  <div className="w-10 h-10 bg-green-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                </MarkerContent>
                <MarkerPopup>
                  <div className="p-2">
                    <h3 className="font-bold text-sm mb-1">
                      {gpsRoute.length === 1 ? 'Location (No Movement)' : 'Start Point'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(gpsRoute[0].timestamp).toLocaleTimeString()}
                    </p>
                    {gpsRoute.length === 1 && (
                      <p className="text-xs text-amber-600 mt-1">
                        User stayed at this location during shift
                      </p>
                    )}
                  </div>
                </MarkerPopup>
              </MapMarker>
            )}

            {/* End Marker */}
            {selectedAttendance?.clock_out_time && gpsRoute.length > 1 && (
              <MapMarker
                longitude={gpsRoute[gpsRoute.length - 1].longitude}
                latitude={gpsRoute[gpsRoute.length - 1].latitude}
              >
                <MarkerContent>
                  <div className="w-10 h-10 bg-red-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                    <span className="text-white text-xl">✓</span>
                  </div>
                </MarkerContent>
                <MarkerPopup>
                  <div className="p-2">
                    <h3 className="font-bold text-sm mb-1">End Point (Clock Out)</h3>
                    <p className="text-xs text-muted-foreground">
                      {parseLocalTime(selectedAttendance.clock_out_time).toLocaleTimeString()}
                    </p>
                  </div>
                </MarkerPopup>
              </MapMarker>
            )}

            {/* Activity Markers */}
            {activities.map((activity, index) => {
              if (!activity.latitude || !activity.longitude) return null

              return (
                <MapMarker
                  key={activity.id}
                  longitude={activity.longitude}
                  latitude={activity.latitude}
                >
                  <MarkerContent>
                    <div className="w-10 h-10 bg-emerald-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{index + 1}</span>
                    </div>
                  </MarkerContent>
                  <MarkerPopup closeButton>
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
                  </MarkerPopup>
                </MapMarker>
              )
            })}
          </MapCN>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 border-l border-border bg-card flex flex-col">
          <div className="p-6 border-b border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Activity Details</h3>

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
                      {parseLocalTime(selectedAttendance.clock_in_time).toLocaleTimeString()}
                    </span>
                  </div>

                  {selectedAttendance.clock_out_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Clock Out</span>
                      <span className="font-semibold text-sm text-foreground">
                        {parseLocalTime(selectedAttendance.clock_out_time).toLocaleTimeString()}
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
              <Button className="w-full" variant="outline" onClick={handleExportReport}>
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
