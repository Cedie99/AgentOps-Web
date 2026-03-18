'use client'

import { useState, useEffect, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { Calendar, User, MapPin, CheckCircle, XCircle, Camera, FileText, ChevronsUpDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { Map as MapCN, MapMarker, MarkerContent, MarkerPopup, MapControls, MapRoute } from '@/components/ui/map'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'

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
  } | null
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
  const [selectedVisit, setSelectedVisit] = useState<SalesVisit | null>(null)
  const [openAgentCombobox, setOpenAgentCombobox] = useState(false)

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
        // Sort visits by timestamp to get chronological order
        const sortedVisits = (data.visits || []).sort((a: SalesVisit, b: SalesVisit) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )
        setVisits(sortedVisits)
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
      return [visits[0].visit_lng, visits[0].visit_lat]
    }
    return [120.9842, 14.5995] // Default Manila [lng, lat]
  }, [visits])

  // Create route coordinates from visits (chronological order)
  const routeCoordinates: [number, number][] = useMemo(() => {
    return visits
      .filter(visit => visit.visit_lat && visit.visit_lng)
      .map(visit => [visit.visit_lng!, visit.visit_lat!])
  }, [visits])

  // Filter visits by selected agent if needed
  const filteredVisits = useMemo(() => {
    if (!selectedAgent) return visits
    return visits.filter(v => v.user_id === selectedAgent)
  }, [visits, selectedAgent])

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

            {/* Agent Selector with Search */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">Filter by Agent</label>
              <Popover open={openAgentCombobox} onOpenChange={setOpenAgentCombobox}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openAgentCombobox}
                    className="w-full justify-between font-normal"
                  >
                    <span className="truncate">
                      {selectedAgent
                        ? salesAgents.find((agent) => agent.id === selectedAgent)?.name
                        : "All Sales Agents"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search agent..." />
                    <CommandList>
                      <CommandEmpty>No agent found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedAgent(null)
                            setOpenAgentCombobox(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedAgent === null ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All Sales Agents
                        </CommandItem>
                        {salesAgents.map((agent) => (
                          <CommandItem
                            key={agent.id}
                            value={agent.name}
                            onSelect={() => {
                              setSelectedAgent(agent.id)
                              setOpenAgentCombobox(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedAgent === agent.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {agent.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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
        <div className="flex-1 relative">
          <MapCN
            center={mapCenter}
            zoom={13}
            theme={theme as 'light' | 'dark'}
            className="h-full w-full"
          >
            <MapControls showZoom showLocate showCompass />

            {/* Route Line connecting visits in chronological order */}
            {routeCoordinates.length > 1 && (
              <MapRoute
                coordinates={routeCoordinates}
                color="#3b82f6"
                width={3}
                opacity={0.7}
                dashArray={[5, 5]}
              />
            )}

            {/* Render Numbered Visit Markers */}
            {filteredVisits.map((visit, index) => {
              if (!visit.visit_lat || !visit.visit_lng) return null

              return (
                <MapMarker
                  key={visit.id}
                  longitude={visit.visit_lng}
                  latitude={visit.visit_lat}
                  onClick={() => setSelectedVisit(visit)}
                >
                  <MarkerContent>
                    <div className={`w-10 h-10 rounded-full border-4 border-white shadow-lg flex items-center justify-center font-bold text-white ${
                      visit.location_verified
                        ? 'bg-blue-500'
                        : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                  </MarkerContent>
                  <MarkerPopup closeButton>
                    <div className="p-2 min-w-[250px]">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                          visit.location_verified ? 'bg-blue-500' : 'bg-orange-500'
                        }`}>
                          {index + 1}
                        </div>
                        <h3 className="font-bold text-sm text-blue-700 dark:text-blue-400">
                          {visit.location_verified ? '✓ Visit Verified' : '⚠ Location Unverified'}
                        </h3>
                      </div>
                      <p className="text-xs text-foreground font-semibold">{visit.store?.name || 'Unknown Store'}</p>
                      <p className="text-xs text-muted-foreground">{visit.store?.address || 'No address available'}</p>
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
                        {visit.outcome && (
                          <p className="text-xs text-foreground">
                            <strong>Outcome:</strong> {visit.outcome}
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
                  </MarkerPopup>
                </MapMarker>
              )
            })}

            {/* Render Store Markers (Gray for reference) */}
            {filteredVisits.map((visit) => {
              if (!visit.store || !visit.store.lat || !visit.store.lng) return null

              return (
                <MapMarker
                  key={`store-${visit.store.id}`}
                  longitude={visit.store.lng}
                  latitude={visit.store.lat}
                >
                  <MarkerContent>
                    <div className="w-6 h-6 bg-slate-400 rounded-lg border-2 border-white shadow-md flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                      </svg>
                    </div>
                  </MarkerContent>
                  <MarkerPopup>
                    <div className="p-2">
                      <h3 className="font-bold text-sm text-foreground">Store Location</h3>
                      <p className="text-xs text-foreground">{visit.store.name}</p>
                      <p className="text-xs text-muted-foreground">{visit.store.address}</p>
                    </div>
                  </MarkerPopup>
                </MapMarker>
              )
            })}
          </MapCN>
        </div>

        {/* Sidebar - Visit List */}
        <div className="w-full md:w-80 border-l border-border bg-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="text-sm font-bold text-foreground">Visit Route</h3>
            <p className="text-xs text-muted-foreground">{filteredVisits.length} visits in chronological order</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-xs text-muted-foreground mt-2">Loading...</p>
              </div>
            ) : filteredVisits.length > 0 ? (
              filteredVisits.map((visit, index) => (
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
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-white text-xs flex-shrink-0 ${
                      visit.location_verified ? 'bg-blue-500' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{visit.store?.name || 'Unknown Store'}</p>
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
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">Verified Visit</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-muted-foreground">Unverified Visit</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 bg-slate-400 rounded"></div>
                <span className="text-muted-foreground">Store Location</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-blue-500"></div>
                <span className="text-muted-foreground">Visit Route</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
