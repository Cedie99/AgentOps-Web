'use client'

import React, { useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Navigation,
  User,
  Layers,
  Info,
  Search,
  CheckCircle2,
  Target,
  ChevronRight,
  Activity
} from 'lucide-react';
import { MOCK_STORES, MOCK_AGENTS } from '@/lib/constants';
import { MobileRole, StoreStatus, Store, Agent } from '@/lib/types';
import { useUIStore, useAgentsStore, useStoresStore } from '@/store';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);
const Polyline = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polyline),
  { ssr: false }
);

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
  current_lat: number | null
  current_lng: number | null
  last_update: string
  total_distance: number | null
  working_duration: string
}

const LiveMap: React.FC = () => {
  // Zustand stores
  const { mapView, setMapView, selectedMapAgent, setSelectedMapAgent } = useUIStore();

  // Local state for Leaflet (can't be serialized in Zustand)
  const [leafletLoaded, setLeafletLoaded] = React.useState(false);
  const [agentIcon, setAgentIcon] = React.useState<any>(null);
  const [storeIcon, setStoreIcon] = React.useState<any>(null);
  const [highlightedStoreIcon, setHighlightedStoreIcon] = React.useState<any>(null);
  const [gpsRoutes, setGpsRoutes] = React.useState<Record<number, GpsPoint[]>>({});
  const [showRoutes, setShowRoutes] = React.useState(true);
  const [selectedRole, setSelectedRole] = React.useState<MobileRole | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [liveAgents, setLiveAgents] = React.useState<LiveAgent[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Get selected agent from store
  const selectedAgent = useMemo(() => {
    if (!selectedMapAgent) return null;
    return liveAgents.find(agent => agent.id === selectedMapAgent) || null;
  }, [selectedMapAgent, liveAgents]);

  // Filter agents by role
  const filteredAgents = useMemo(() => {
    let agents = liveAgents;

    // Filter by role
    if (selectedRole !== 'ALL') {
      agents = agents.filter(agent => agent.role === selectedRole);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      agents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return agents;
  }, [selectedRole, searchQuery, liveAgents]);

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

  // Initialize Leaflet icons
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        setLeafletLoaded(true);

        // Create custom icons with pulsing animation
        const agentMarker = L.divIcon({
          className: 'custom-agent-icon',
          html: `
            <div class="relative">
              <div class="absolute inset-0 w-10 h-10 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
              <div class="relative w-10 h-10 bg-emerald-600 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
            </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });

        const storeMarker = L.divIcon({
          className: 'custom-store-icon',
          html: `<div class="w-8 h-8 bg-white rounded-lg border-2 border-slate-300 shadow-md flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                 </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
        });

        const highlightedMarker = L.divIcon({
          className: 'custom-highlighted-icon',
          html: `<div class="w-10 h-10 bg-emerald-600 rounded-lg border-4 border-white shadow-xl flex items-center justify-center animate-pulse">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                 </div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 40],
        });

        setAgentIcon(agentMarker);
        setStoreIcon(storeMarker);
        setHighlightedStoreIcon(highlightedMarker);
      });
    }
  }, []);

  const handleSelectAgent = (agent: LiveAgent) => {
    if (selectedAgent?.id === agent.id) {
      setSelectedMapAgent(null);
    } else {
      setSelectedMapAgent(agent.id);
      setMapView('agents');
    }
  };

  // Default center (Manila, Philippines - you can change this)
  const defaultCenter: [number, number] = [14.5995, 120.9842];

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Live Operations Map</h1>
          <p className="text-slate-500 text-sm">Real-time GPS tracking and field output visualization.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="relative">
              <Activity className="w-4 h-4 text-emerald-600" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full"></div>
            </div>
            <span className="text-sm font-semibold text-emerald-700">Live - Auto-refresh every 10s</span>
          </div>
        </div>
      </div>

      <div className="flex-1 relative bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden flex flex-col md:flex-row">
        {/* Map Display */}
        <div className="flex-1 relative bg-slate-100 overflow-hidden">
          {leafletLoaded && agentIcon && storeIcon ? (
            <MapContainer
              center={defaultCenter}
              zoom={13}
              scrollWheelZoom={true}
              className="h-full w-full z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Render Store Markers */}
              {MOCK_STORES.map((store) => {
                const isHighlighted = selectedAgent && relatedStores.some(s => s.id === store.id);

                return (
                  <Marker
                    key={store.id}
                    position={[store.lat, store.lng]}
                    icon={isHighlighted ? highlightedStoreIcon : storeIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-sm">{store.name}</h3>
                        <p className="text-xs text-slate-600">{store.address}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            store.status === StoreStatus.COLLECTED ? 'bg-emerald-100 text-emerald-700' :
                            store.status === StoreStatus.DELIVERED ? 'bg-blue-100 text-blue-700' :
                            store.status === StoreStatus.SALES_VISITED ? 'bg-purple-100 text-purple-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {store.status}
                          </span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Render Agent Markers */}
              {liveAgents.map((agent) => {
                if (!agent.current_lat || !agent.current_lng) return null;

                return (
                  <Marker
                    key={agent.id}
                    position={[agent.current_lat, agent.current_lng]}
                    icon={agentIcon}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-sm">{agent.name}</h3>
                        <p className="text-xs text-slate-600">{agent.role}</p>
                        <p className="text-xs text-slate-500 mt-1">Duration: {agent.working_duration}</p>
                        <p className="text-xs text-slate-500">Last update: {new Date(agent.last_update).toLocaleTimeString()}</p>
                        {agent.total_distance && (
                          <p className="text-xs text-slate-500">Distance: {agent.total_distance.toFixed(2)} km</p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}

              {/* Render GPS Routes */}
              {showRoutes && selectedMapAgent && gpsRoutes[selectedMapAgent]?.length > 1 && (
                <Polyline
                  positions={gpsRoutes[selectedMapAgent].map(point => [point.latitude, point.longitude])}
                  pathOptions={{
                    color: '#ef4444',
                    weight: 6,
                    opacity: 0.9,
                    lineJoin: 'round',
                    lineCap: 'round',
                  }}
                />
              )}
            </MapContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-slate-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading map...</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Panel */}
        <div className="w-full md:w-80 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tracking & Output</h3>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>

            {/* Role Filter Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-lg mb-4">
              <button
                onClick={() => setSelectedRole('ALL')}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  selectedRole === 'ALL' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedRole(MobileRole.SURVEYOR)}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  selectedRole === MobileRole.SURVEYOR ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Survey
              </button>
              <button
                onClick={() => setSelectedRole(MobileRole.SALES)}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  selectedRole === MobileRole.SALES ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sales
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-4">
              <button
                onClick={() => setSelectedRole(MobileRole.DELIVERY)}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  selectedRole === MobileRole.DELIVERY ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Delivery
              </button>
              <button
                onClick={() => setSelectedRole(MobileRole.COLLECTOR)}
                className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wide transition-all ${
                  selectedRole === MobileRole.COLLECTOR ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Collect
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Find field agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Agent Tracking Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {selectedRole === 'ALL' ? 'All Agents' : selectedRole} Tracking
                </p>
                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold uppercase">
                  {filteredAgents.length} {filteredAgents.length === 1 ? 'Agent' : 'Agents'}
                </span>
              </div>
              <div className="space-y-2">
                {loading ? (
                  <div className="p-5 bg-slate-50 rounded-2xl text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Loading agents...</p>
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
                            ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-100'
                            : 'bg-white border-slate-100 hover:border-emerald-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-colors ${selectedAgent?.id === agent.id ? 'bg-white/20 text-white' : getRoleColor(agent.role)}`}>
                              {agent.name.charAt(0)}
                            </div>
                            <div>
                              <p className={`text-xs font-bold leading-none ${selectedAgent?.id === agent.id ? 'text-white' : 'text-slate-800'}`}>
                                {agent.name}
                              </p>
                              <p className={`text-[9px] font-medium mt-1 ${selectedAgent?.id === agent.id ? 'text-emerald-100' : 'text-slate-500'}`}>
                                {agent.role} • {agent.working_duration}
                              </p>
                            </div>
                          </div>
                          {selectedAgent?.id === agent.id ? (
                            <Target className="w-4 h-4 text-white animate-pulse" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-400" />
                          )}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                    <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase">No active agents</p>
                    <p className="text-[9px] text-slate-400 mt-1">Agents will appear when they clock in</p>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Agent Details */}
            {selectedAgent ? (
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">
                    {selectedAgent.role === 'SURVEYOR' ? 'Survey Tracking' :
                     selectedAgent.role === 'SALES' ? 'Sales Tracking' :
                     selectedAgent.role === 'DELIVERY' ? 'Delivery Tracking' :
                     'Collection Tracking'}
                  </p>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <h4 className="text-2xl font-bold text-emerald-900">{selectedAgent.working_duration}</h4>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Working Duration</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-700">GPS Tracked</p>
                    <p className="text-[9px] text-emerald-500">Live route</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-emerald-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] font-bold text-emerald-600 uppercase">Clock In</p>
                    <span className="text-xs text-emerald-700">{new Date(selectedAgent.clock_in_time).toLocaleTimeString()}</span>
                  </div>
                  {selectedAgent.total_distance && (
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase">Distance Traveled</p>
                      <span className="text-xs text-emerald-700">{selectedAgent.total_distance.toFixed(2)} km</span>
                    </div>
                  )}
                  {relatedStores.length > 0 && (
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase">Stores Visited</p>
                      <span className="text-xs text-emerald-700">{relatedStores.length}</span>
                    </div>
                  )}
                </div>
                {gpsRoutes[selectedMapAgent!]?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-emerald-100">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] font-bold text-emerald-600 uppercase">GPS Points Today</p>
                      <span className="text-xs font-bold text-emerald-700">{gpsRoutes[selectedMapAgent!].length}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-[10px] text-slate-400 font-bold uppercase leading-tight">Select Agent to View Route & Output</p>
              </div>
            )}
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100">
             <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-emerald-500" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Map Legend</p>
             </div>
             <div className="flex flex-wrap gap-4">
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                  <div className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></div> Field Agent
               </div>
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                  <div className="w-2.5 h-2.5 bg-white border border-slate-300 rounded"></div> Store
               </div>
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                  <div className="w-2.5 h-2.5 bg-emerald-600 rounded"></div> Visited
               </div>
               <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-sm"></div> GPS Route
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
