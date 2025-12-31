'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { Calendar, User, Download, Search, MapPin, Clock, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

// Dynamically import Leaflet components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
)
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

export default function TrackingHistoryPage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [gpsRoute, setGpsRoute] = useState<GPSPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [startIcon, setStartIcon] = useState<any>(null)
  const [endIcon, setEndIcon] = useState<any>(null)

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

  // Fetch GPS route when agent is selected
  useEffect(() => {
    if (selectedAgent && selectedDate) {
      fetchGPSRoute()
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
      const response = await fetch(`/api/tracking/attendance?date=${selectedDate}`)
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
      const response = await fetch(
        `/api/tracking/gps?user_id=${selectedAgent}&from=${selectedDate}T00:00:00Z&to=${selectedDate}T23:59:59Z`
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

  const selectedAttendance = attendanceRecords.find(r => r.user_id === selectedAgent)
  const selectedAgentData = agents.find(a => a.id === selectedAgent)

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

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">GPS Tracking History</h1>
          <p className="text-slate-500 text-sm">Review past routes and itineraries</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Select Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="pl-10"
              />
            </div>
          </div>

          {/* Agent Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Select Agent</label>
            <Select
              value={selectedAgent?.toString() || ''}
              onValueChange={(value) => setSelectedAgent(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an agent..." />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name} - {agent.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stats */}
          {selectedAttendance && (
            <div className="flex items-end">
              <Card className="w-full bg-indigo-50 border-indigo-200 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-indigo-600">Work Duration</p>
                    <p className="text-lg font-bold text-indigo-900">{getDuration()}</p>
                  </div>
                  <Clock className="h-8 w-8 text-indigo-500" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </Card>

      {/* Map and Details */}
      <div className="flex-1 relative bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* Map */}
        <div className="flex-1 relative bg-slate-100">
          {leafletLoaded && startIcon && endIcon ? (
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={true}
              className="h-full w-full z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* GPS Route */}
              {gpsRoute.length > 1 && (
                <Polyline
                  positions={gpsRoute.map(p => [p.latitude, p.longitude])}
                  pathOptions={{
                    color: '#ef4444',
                    weight: 6,
                    opacity: 0.9,
                  }}
                />
              )}

              {/* Start Marker */}
              {gpsRoute.length > 0 && (
                <Marker position={[gpsRoute[0].latitude, gpsRoute[0].longitude]} icon={startIcon}>
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-sm">Start Point</h3>
                      <p className="text-xs text-slate-600">
                        {new Date(gpsRoute[0].timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* End Marker */}
              {gpsRoute.length > 1 && (
                <Marker
                  position={[gpsRoute[gpsRoute.length - 1].latitude, gpsRoute[gpsRoute.length - 1].longitude]}
                  icon={endIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-sm">End Point</h3>
                      <p className="text-xs text-slate-600">
                        {new Date(gpsRoute[gpsRoute.length - 1].timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-80 border-l border-slate-200 bg-white flex flex-col">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Route Details</h3>

            {selectedAgentData && selectedAttendance ? (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Agent</p>
                  <p className="font-semibold text-slate-900">{selectedAgentData.name}</p>
                  <p className="text-xs text-slate-600">{selectedAgentData.role}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">Clock In</span>
                    <span className="font-semibold text-sm">
                      {new Date(selectedAttendance.clock_in_time).toLocaleTimeString()}
                    </span>
                  </div>

                  {selectedAttendance.clock_out_time && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Clock Out</span>
                      <span className="font-semibold text-sm">
                        {new Date(selectedAttendance.clock_out_time).toLocaleTimeString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-600">GPS Points</span>
                    <span className="font-bold text-indigo-600">{gpsRoute.length}</span>
                  </div>

                  {selectedAttendance.total_distance && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600">Distance</span>
                      <span className="font-bold text-indigo-600">
                        {selectedAttendance.total_distance.toFixed(2)} km
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center">
                <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Select a date and agent to view their route</p>
              </div>
            )}
          </div>

          {gpsRoute.length > 0 && (
            <div className="p-6">
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Route
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
