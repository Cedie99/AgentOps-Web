'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useTheme } from 'next-themes'
import { Calendar, User, MapPin, CheckCircle, XCircle, Camera, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import Image from 'next/image'

// Dynamically import Leaflet components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
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

interface SalesAgent {
  id: number
  name: string
  email: string
}

interface SalesVisit {
  id: number
  store_id: number
  user_id: number
  user_name: string
  timestamp: string
  outcome: string
  location_verified: boolean
  visit_lat: number | null
  visit_lng: number | null
  distance_from_store: number | null
  photo_url: string | null
  notes: string | null
  store: {
    id: number
    name: string
    address: string
    lat: number
    lng: number
    status: string
    customer_type: string
  }
  user: {
    id: number
    name: string
    email: string
    avatar: string | null
  }
}

interface Stats {
  total_visits: number
  verified_visits: number
  unverified_visits: number
  unique_agents: number
  unique_stores: number
  average_distance: number
}

export default function SalesVisitsPage() {
  const { theme } = useTheme()
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null)
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([])
  const [visits, setVisits] = useState<SalesVisit[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [leafletLoaded, setLeafletLoaded] = useState(false)
  const [storeIcon, setStoreIcon] = useState<any>(null)
  const [visitIconVerified, setVisitIconVerified] = useState<any>(null)
  const [visitIconUnverified, setVisitIconUnverified] = useState<any>(null)
  const [selectedVisit, setSelectedVisit] = useState<SalesVisit | null>(null)

  // Inject dark mode CSS for Leaflet popups
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const styleId = 'leaflet-popup-dark-mode'
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style')
        style.id = styleId
        style.textContent = `
          .leaflet-popup-content-wrapper {
            background: #f1f5f9 !important;
            color: #0f172a !important;
            border-radius: 0.5rem !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
          }
          .leaflet-popup-tip {
            background: #f1f5f9 !important;
          }
          .dark .leaflet-popup-content-wrapper {
            background: #1e293b !important;
            color: #f8fafc !important;
            border-radius: 0.5rem !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5) !important;
          }
          .dark .leaflet-popup-tip {
            background: #1e293b !important;
          }
          .leaflet-popup-content {
            margin: 12px !important;
          }
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
        document.head.appendChild(style)
      }
    }
  }, [])

  // Initialize Leaflet icons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        setLeafletLoaded(true)

        // Store marker (gray)
        const storeMarker = L.divIcon({
          className: 'custom-store-icon',
          html: `<div class="w-8 h-8 bg-slate-400 rounded-lg border-3 border-white shadow-md flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                 </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        })

        // Visit marker - Verified (BLUE)
        const visitMarkerVerified = L.divIcon({
          className: 'custom-visit-verified-icon',
          html: `<div class="w-10 h-10 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                 </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })

        // Visit marker - Unverified (ORANGE)
        const visitMarkerUnverified = L.divIcon({
          className: 'custom-visit-unverified-icon',
          html: `<div class="w-10 h-10 bg-orange-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line><circle cx="12" cy="12" r="10"></circle></svg>
                 </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        })

        setStoreIcon(storeMarker)
        setVisitIconVerified(visitMarkerVerified)
        setVisitIconUnverified(visitMarkerUnverified)
      })
    }
  }, [])

  // Fetch sales agents
  useEffect(() => {
    fetchSalesAgents()
  }, [])

  // Fetch visits when date or agent changes
  useEffect(() => {
    if (selectedDate) {
      fetchVisits()
    }
  }, [selectedDate, selectedAgent])

  const fetchSalesAgents = async () => {
    try {
      const response = await fetch('/api/users?roles=SALES')
      if (response.ok) {
        const data = await response.json()
        setSalesAgents(data.users || [])
      }
    } catch (error) {
      console.error('Error fetching sales agents:', error)
    }
  }

  const fetchVisits = async () => {
    try {
      setLoading(true)
      const url = `/api/sales/visits?date=${selectedDate}${selectedAgent ? `&sales_agent_id=${selectedAgent}` : ''}`
      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setVisits(data.visits || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error('Error fetching visits:', error)
    } finally {
      setLoading(false)
    }
  }

  const mapCenter: [number, number] = useMemo(() => {
    if (visits.length > 0 && visits[0].visit_lat && visits[0].visit_lng) {
      return [visits[0].visit_lat, visits[0].visit_lng]
    }
    return [14.5995, 120.9842] // Default Manila
  }, [visits])

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Sales Store Visits</h1>
          <p className="text-muted-foreground text-sm">Track which stores sales agents visited with proof</p>
        </div>
      </div>

      {/* Filters & Stats */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Picker */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Select Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Filter by Agent</label>
              <Select
                value={selectedAgent?.toString() || 'all'}
                onValueChange={(value) => setSelectedAgent(value === 'all' ? null : parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Sales Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sales Agents</SelectItem>
                  {salesAgents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Total Visits */}
            {stats && (
              <Card className="bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Total Visits</p>
                    <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{stats.total_visits}</p>
                  </div>
                  <MapPin className="h-8 w-8 text-emerald-500" />
                </div>
              </Card>
            )}
          </div>
        </Card>
      </div>

      {/* Map and Details */}
      <div className="flex-1 relative bg-card border border-border rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* Map */}
        <div className="flex-1 relative bg-muted">
          {leafletLoaded && storeIcon && visitIconVerified && visitIconUnverified ? (
            <MapContainer
              center={mapCenter}
              zoom={13}
              scrollWheelZoom={true}
              className="h-full w-full z-0 bg-muted"
              style={{ background: 'var(--color-muted)' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url={
                  theme === 'dark'
                    ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
                    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                }
              />

              {/* Render Visit Markers (BLUE for verified, ORANGE for unverified) */}
              {visits.map((visit) => {
                if (!visit.visit_lat || !visit.visit_lng) return null

                const icon = visit.location_verified ? visitIconVerified : visitIconUnverified

                return (
                  <Marker
                    key={visit.id}
                    position={[visit.visit_lat, visit.visit_lng]}
                    icon={icon}
                    eventHandlers={{
                      click: () => setSelectedVisit(visit)
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-62.5">
                        <h3 className="font-bold text-sm text-blue-700 dark:text-blue-400">
                          {visit.location_verified ? '✓ Visit Verified' : '⚠ Location Unverified'}
                        </h3>
                        <p className="text-xs text-foreground font-semibold mt-1">{visit.store.name}</p>
                        <p className="text-xs text-muted-foreground">{visit.store.address}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xs text-foreground">
                            <strong>Agent:</strong> {visit.user_name}
                          </p>
                          <p className="text-xs text-foreground">
                            <strong>Time:</strong> {new Date(visit.timestamp).toLocaleString()}
                          </p>
                          {visit.distance_from_store !== null && (
                            <p className="text-xs text-foreground">
                              <strong>Distance:</strong> {Math.round(visit.distance_from_store)}m from store
                            </p>
                          )}
                          {visit.notes && (
                            <p className="text-xs text-foreground">
                              <strong>Notes:</strong> {visit.notes}
                            </p>
                          )}
                          {visit.photo_url && (
                            <div className="mt-2">
                              <img
                                src={visit.photo_url}
                                alt="Visit proof"
                                className="w-full h-32 object-cover rounded border"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                )
              })}

              {/* Render Store Markers (Gray for reference) */}
              {visits.map((visit) => (
                <Marker
                  key={`store-${visit.store.id}`}
                  position={[visit.store.lat, visit.store.lng]}
                  icon={storeIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-sm text-foreground">Store Location</h3>
                      <p className="text-xs text-foreground">{visit.store.name}</p>
                      <p className="text-xs text-muted-foreground">{visit.store.address}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Visit List */}
        <div className="w-full md:w-80 border-l border-border bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Today&apos;s Visits</h3>
            <p className="text-xs text-muted-foreground">{visits.length} total visits</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-xs text-muted-foreground mt-2">Loading...</p>
              </div>
            ) : visits.length > 0 ? (
              visits.map((visit) => (
                <button
                  key={visit.id}
                  onClick={() => setSelectedVisit(visit)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedVisit?.id === visit.id
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700'
                      : 'bg-card border-border hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {visit.location_verified ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{visit.store.name}</p>
                      <p className="text-[10px] text-muted-foreground">{visit.user_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(visit.timestamp).toLocaleTimeString()}
                      </p>
                      {visit.photo_url && (
                        <div className="flex items-center gap-1 mt-1">
                          <Camera className="w-3 h-3 text-blue-500" />
                          <span className="text-[9px] text-blue-600">Photo attached</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No visits found</p>
                <p className="text-xs text-muted-foreground">Select a different date or agent</p>
              </div>
            )}
          </div>

          <div className="p-4 bg-muted/50 border-t border-border">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-slate-400 dark:bg-slate-600 rounded"></div>
                <span className="text-muted-foreground">Store Location</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
