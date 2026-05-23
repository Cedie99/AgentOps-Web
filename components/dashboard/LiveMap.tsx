'use client'

import React, { useMemo, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Navigation,
  User,
  Info,
  Search,
  CheckCircle2,
  Target,
  ChevronRight,
  Activity
} from 'lucide-react';
import { MOCK_STORES } from '@/lib/constants';
import { MobileRole } from '@/lib/types';
import { useUIStore } from '@/store';
import { Map as MapCN, MapMarker, MarkerContent, MarkerPopup, MapControls, MapLine } from '@/components/ui/map';

interface GpsPoint {
  id: number
  latitude: number
  longitude: number
  timestamp: string
}

interface LiveAgent {
  id: number
  name: string
  email: string
  role: string
  avatar: string | null
  agent_status: string | null
  attendance_id: number
  work_date: string
  clock_in_time: string
  clock_in_lat: number | null
  clock_in_long: number | null
  clock_out_time: string | null
  clock_out_lat: number | null
  clock_out_long: number | null
  current_lat: number | null
  current_lng: number | null
  last_update: string
  total_distance: number | null
  working_duration: string
  is_active: boolean
}

const LiveMap: React.FC = () => {
  // Zustand stores
  const { setMapView, selectedMapAgent, setSelectedMapAgent } = useUIStore();
  const { theme } = useTheme();

  // Local state
  const [gpsRoutes, setGpsRoutes] = React.useState<Record<number, GpsPoint[]>>({});
  const [showRoutes] = React.useState(true);
  const [selectedRole, setSelectedRole] = React.useState<MobileRole | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [liveAgents, setLiveAgents] = React.useState<LiveAgent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showStatus, setShowStatus] = React.useState<'all' | 'active' | 'clocked_out'>('active');
  const mapRef = React.useRef<any>(null);

  // Get selected agent from store
  const selectedAgent = useMemo(() => {
    if (!selectedMapAgent) return null;
    return liveAgents.find(agent => agent.id === selectedMapAgent) || null;
  }, [selectedMapAgent, liveAgents]);

  // Filter agents by role and status
  const filteredAgents = useMemo(() => {
    let agents = liveAgents;

    // Filter by status
    if (showStatus === 'active') {
      agents = agents.filter(agent => agent.is_active);
    } else if (showStatus === 'clocked_out') {
      agents = agents.filter(agent => !agent.is_active);
    }

    // Filter by role (DB stores uppercase e.g. 'SURVEYOR', enum is title-case 'Surveyor')
    if (selectedRole !== 'ALL') {
      agents = agents.filter(agent =>
        agent.role.toUpperCase() === selectedRole.toUpperCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      agents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return agents;
  }, [selectedRole, searchQuery, liveAgents, showStatus]);

  // Find stores related to the selected agent (surveyed, visited, delivered, collected)
  const relatedStores = useMemo(() => {
    if (!selectedAgent) return [];
    return MOCK_STORES.filter(store =>
      store.timeline.some(event => event.agentName === selectedAgent.name)
    );
  }, [selectedAgent]);

  // Fetch live agents on mount and refresh every 10 seconds for real-time updates
  useEffect(() => {
    fetchLiveAgents();
    const interval = setInterval(fetchLiveAgents, 10000); // Refresh every 10s for real-time
    return () => clearInterval(interval);
  }, []);

  // Fetch GPS routes when an agent is selected and refresh every 10 seconds
  useEffect(() => {
    if (selectedMapAgent) {
      fetchGpsRoute(selectedMapAgent);
      const interval = setInterval(() => fetchGpsRoute(selectedMapAgent), 10000); // Refresh route every 10s
      return () => clearInterval(interval);
    }
  }, [selectedMapAgent]);

  const fetchLiveAgents = async () => {
    try {
      const response = await fetch('/api/tracking/live');
      if (response.ok) {
        const data = await response.json();
        setLiveAgents(data.agents || []);
      } else {
        console.error('Failed to fetch live agents:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching live agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGpsRoute = async (userId: number) => {
    try {
      // Fetch today's GPS tracking points for the selected user
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/tracking/gps?user_id=${userId}&from=${today}T00:00:00Z&to=${today}T23:59:59Z`);
      if (response.ok) {
        const data = await response.json();
        setGpsRoutes(prev => ({
          ...prev,
          [userId]: data.gpsPoints || []
        }));
      }
    } catch (error) {
      console.error('Error fetching GPS route:', error);
    }
  };

  const handleSelectAgent = (agent: LiveAgent) => {
    if (selectedAgent?.id === agent.id) {
      setSelectedMapAgent(null);
    } else {
      setSelectedMapAgent(agent.id);
      setMapView('agents');

      // Fly to agent's location
      if (mapRef.current && agent.current_lat && agent.current_lng) {
        mapRef.current.flyTo({
          center: [agent.current_lng, agent.current_lat],
          zoom: 14,
          duration: 1500
        });
      }
    }
  };

  // Default center (Manila, Philippines)
  const defaultCenter: [number, number] = [120.9842, 14.5995];

  // Map center based on selected agent or default
  const mapCenter: [number, number] = useMemo(() => {
    if (selectedAgent?.current_lng && selectedAgent?.current_lat) {
      return [selectedAgent.current_lng, selectedAgent.current_lat];
    }
    return defaultCenter;
  }, [selectedAgent]);

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Live Operations Map</h1>
          <p className="text-muted-foreground text-sm">Real-time GPS tracking and field output visualization.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="relative">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></div>
            </div>
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Live - Auto-refresh every 10s</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-card border border-border rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* Map Display */}
        <div className="flex-1 relative overflow-hidden">
          <MapCN
            ref={mapRef}
            center={mapCenter}
            zoom={13}
            theme={theme as 'light' | 'dark'}
            className="h-full w-full"
          >
            <MapControls showZoom showLocate showCompass />

            {/* Render Agent Markers */}
            {filteredAgents.map((agent) => {
              if (!agent.current_lat || !agent.current_lng) return null;

              return (
                <MapMarker
                  key={agent.id}
                  longitude={agent.current_lng}
                  latitude={agent.current_lat}
                  onClick={() => handleSelectAgent(agent)}
                >
                  <MarkerContent>
                    <div className="relative">
                      <div className="absolute inset-0 w-10 h-10 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                      <div className="relative w-10 h-10 bg-emerald-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                    </div>
                  </MarkerContent>
                  <MarkerPopup closeButton>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-sm">{agent.name}</h3>
                      <p className="text-xs text-muted-foreground">{agent.role}</p>
                      <p className="text-xs text-muted-foreground mt-1">Duration: {agent.working_duration}</p>
                      <p className="text-xs text-muted-foreground">Last update: {new Date(agent.last_update).toLocaleTimeString()}</p>
                      {agent.total_distance && (
                        <p className="text-xs text-muted-foreground">Distance: {agent.total_distance.toFixed(2)} km</p>
                      )}
                    </div>
                  </MarkerPopup>
                </MapMarker>
              );
            })}

            {/* Render Clock In/Out Markers for Selected Agent */}
            {selectedAgent && (
              <>
                {/* Clock In Marker */}
                {selectedAgent.clock_in_lat && selectedAgent.clock_in_long && (
                  <MapMarker
                    longitude={selectedAgent.clock_in_long}
                    latitude={selectedAgent.clock_in_lat}
                  >
                    <MarkerContent>
                      <div className="w-8 h-8 bg-green-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14" stroke="green" fill="none"/>
                        </svg>
                      </div>
                    </MarkerContent>
                    <MarkerPopup>
                      <div className="p-2">
                        <h3 className="font-bold text-sm text-green-700">Clock In</h3>
                        <p className="text-xs text-muted-foreground">{selectedAgent.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(selectedAgent.clock_in_time).toLocaleString()}
                        </p>
                      </div>
                    </MarkerPopup>
                  </MapMarker>
                )}

                {/* Clock Out Marker */}
                {selectedAgent.clock_out_lat && selectedAgent.clock_out_long && (
                  <MapMarker
                    longitude={selectedAgent.clock_out_long}
                    latitude={selectedAgent.clock_out_lat}
                  >
                    <MarkerContent>
                      <div className="w-8 h-8 bg-red-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14" stroke="red" fill="none"/>
                        </svg>
                      </div>
                    </MarkerContent>
                    <MarkerPopup>
                      <div className="p-2">
                        <h3 className="font-bold text-sm text-red-700">Clock Out</h3>
                        <p className="text-xs text-muted-foreground">{selectedAgent.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(selectedAgent.clock_out_time!).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Total: {selectedAgent.working_duration}
                        </p>
                      </div>
                    </MarkerPopup>
                  </MapMarker>
                )}
              </>
            )}

            {/* Render GPS Routes */}
            {showRoutes && selectedMapAgent && gpsRoutes[selectedMapAgent]?.length > 1 && (
              <MapLine
                coordinates={gpsRoutes[selectedMapAgent].map(point => [point.longitude, point.latitude])}
                color="#10b981"
                width={6}
                opacity={0.9}
              />
            )}
          </MapCN>
        </div>

        {/* Sidebar Panel */}
        <div className="w-full md:w-80 border-l border-border bg-card flex flex-col overflow-hidden">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Tracking & Output</h3>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>

            {/* Status Filter */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg mb-3">
              <button
                onClick={() => setShowStatus('all')}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  showStatus === 'all' ? 'bg-card text-emerald-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All Today
              </button>
              <button
                onClick={() => setShowStatus('active')}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  showStatus === 'active' ? 'bg-card text-green-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setShowStatus('clocked_out')}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  showStatus === 'clocked_out' ? 'bg-card text-red-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Clocked Out
              </button>
            </div>

            {/* Role Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg mb-4">
              <button
                onClick={() => setSelectedRole('ALL')}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  selectedRole === 'ALL' ? 'bg-card text-emerald-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedRole(MobileRole.SURVEYOR)}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  selectedRole === MobileRole.SURVEYOR ? 'bg-card text-emerald-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Survey
              </button>
              <button
                onClick={() => setSelectedRole(MobileRole.SALES)}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  selectedRole === MobileRole.SALES ? 'bg-card text-emerald-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sales
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg mb-4">
              <button
                onClick={() => setSelectedRole(MobileRole.DELIVERY)}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  selectedRole === MobileRole.DELIVERY ? 'bg-card text-emerald-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Delivery
              </button>
              <button
                onClick={() => setSelectedRole(MobileRole.COLLECTOR)}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  selectedRole === MobileRole.COLLECTOR ? 'bg-card text-emerald-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Collect
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Find field agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Agent Tracking Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {selectedRole === 'ALL' ? 'All Agents' : selectedRole} Tracking
                </p>
                <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                  {filteredAgents.length} {filteredAgents.length === 1 ? 'Agent' : 'Agents'}
                </span>
              </div>
              <div className="space-y-2">
                {loading ? (
                  <div className="p-5 bg-muted rounded-2xl text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">Loading agents...</p>
                  </div>
                ) : filteredAgents.length > 0 ? (
                  filteredAgents.map(agent => {
                    const getRoleColor = (role: string) => {
                      switch (role) {
                        case 'SURVEYOR': return 'bg-indigo-100 text-indigo-700';
                        case 'SALES': return 'bg-purple-100 text-purple-700';
                        case 'DELIVERY': return 'bg-blue-100 text-blue-700';
                        case 'COLLECTOR': return 'bg-emerald-100 text-emerald-700';
                        default: return 'bg-slate-100 text-slate-700';
                      }
                    };

                    return (
                      <button
                        key={agent.id}
                        onClick={() => handleSelectAgent(agent)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all group ${
                          selectedAgent?.id === agent.id
                            ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20'
                            : 'bg-card border-border hover:border-emerald-200 dark:hover:border-emerald-800 hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${selectedAgent?.id === agent.id ? 'bg-white/20 text-white' : getRoleColor(agent.role)}`}>
                              {agent.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className={`text-xs font-bold leading-none ${selectedAgent?.id === agent.id ? 'text-white' : 'text-foreground'}`}>
                                  {agent.name}
                                </p>
                                <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                                  agent.is_active
                                    ? 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400'
                                    : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400'
                                }`}>
                                  {agent.is_active ? 'ACTIVE' : 'OUT'}
                                </span>
                              </div>
                              <p className={`text-[9px] font-medium mt-1 ${selectedAgent?.id === agent.id ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                                {agent.role} • {agent.working_duration}
                              </p>
                            </div>
                          </div>
                          {selectedAgent?.id === agent.id ? (
                            <Target className="w-4 h-4 text-white animate-pulse" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-400" />
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-5 bg-muted rounded-2xl border border-dashed border-border text-center">
                    <User className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-[10px] text-muted-foreground font-bold uppercase">No active agents</p>
                    <p className="text-[9px] text-muted-foreground mt-1">Agents will appear when they clock in</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Agent Details */}
            {selectedAgent ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest">
                    {selectedAgent.role === 'SURVEYOR' ? 'Survey Tracking' :
                     selectedAgent.role === 'SALES' ? 'Sales Tracking' :
                     selectedAgent.role === 'DELIVERY' ? 'Delivery Tracking' :
                     'Collection Tracking'}
                  </p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <h4 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{selectedAgent.working_duration}</h4>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-tight">Working Duration</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">GPS Tracked</p>
                    <p className="text-[9px] text-emerald-500 dark:text-emerald-400">Live route</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-100 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold text-green-600 dark:text-green-400 uppercase">Clock In</p>
                    <span className="text-xs text-green-700 dark:text-green-300">{new Date(selectedAgent.clock_in_time).toLocaleTimeString()}</span>
                  </div>
                  {selectedAgent.clock_out_time && (
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase">Clock Out</p>
                      <span className="text-xs text-red-700 dark:text-red-300">{new Date(selectedAgent.clock_out_time).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {selectedAgent.total_distance && (
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Distance Traveled</p>
                      <span className="text-xs text-emerald-700 dark:text-emerald-300">{selectedAgent.total_distance.toFixed(2)} km</span>
                    </div>
                  )}
                  {relatedStores.length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Stores Visited</p>
                      <span className="text-xs text-emerald-700 dark:text-emerald-300">{relatedStores.length}</span>
                    </div>
                  )}
                </div>

                {/* Quick Navigation to Clock In/Out */}
                {(selectedAgent.clock_in_lat && selectedAgent.clock_in_long) || (selectedAgent.clock_out_lat && selectedAgent.clock_out_long) ? (
                  <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-800 space-y-2">
                    <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-2">Quick Navigation</p>
                    {selectedAgent.clock_in_lat && selectedAgent.clock_in_long && (
                      <button
                        onClick={() => {
                          if (mapRef.current) {
                            mapRef.current.flyTo({
                              center: [selectedAgent.clock_in_long!, selectedAgent.clock_in_lat!],
                              zoom: 16,
                              duration: 1500
                            });
                          }
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-950 hover:bg-green-100 dark:hover:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-[10px] font-bold text-green-700 dark:text-green-300">Go to Clock In</span>
                        </div>
                        <Navigation className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </button>
                    )}
                    {selectedAgent.clock_out_lat && selectedAgent.clock_out_long && (
                      <button
                        onClick={() => {
                          if (mapRef.current) {
                            mapRef.current.flyTo({
                              center: [selectedAgent.clock_out_long!, selectedAgent.clock_out_lat!],
                              zoom: 16,
                              duration: 1500
                            });
                          }
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-[10px] font-bold text-red-700 dark:text-red-300">Go to Clock Out</span>
                        </div>
                        <Navigation className="w-3 h-3 text-red-600 dark:text-red-400" />
                      </button>
                    )}
                  </div>
                ) : null}
                {gpsRoutes[selectedMapAgent!]?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-800">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">GPS Points Today</p>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{gpsRoutes[selectedMapAgent!].length}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 bg-muted rounded-2xl border border-dashed border-border text-center">
                <Target className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-[10px] text-muted-foreground font-bold uppercase leading-tight">Select Agent to View Route & Output</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-muted border-t border-border">
             <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-emerald-500" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Map Legend</p>
             </div>
             <div className="flex flex-wrap gap-4">
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                  <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></div> Field Agent
               </div>
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div> Clock In
               </div>
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div> Clock Out
               </div>
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                  <div className="w-2.5 h-2.5 bg-card border border-border rounded"></div> Store
               </div>
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></div> GPS Route
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
