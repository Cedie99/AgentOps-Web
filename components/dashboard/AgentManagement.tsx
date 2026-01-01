'use client'

import React, { useEffect } from 'react';
import { MOCK_AGENTS, MOCK_VEHICLES } from '@/lib/constants';
import { Agent, Vehicle, VehicleStatus, MobileRole } from '@/lib/types';
import { useAgentsStore, useVehiclesStore, useUIStore } from '@/store';
import { 
  MoreVertical, 
  Car, 
  ArrowLeftRight, 
  CheckCircle2, 
  X, 
  Search,
  MapPin,
  Clock,
  ArrowRight,
  ParkingCircle,
  AlertCircle,
  Filter,
  Users,
  Gauge,
  UserCheck,
  ShieldAlert
} from 'lucide-react';

const FleetAssignment: React.FC = () => {
  // Zustand stores
  const { agents } = useAgentsStore();
  const { vehicles, updateVehicle, selectedVehicle, setSelectedVehicle } = useVehiclesStore();
  const { modalOpen, openModal, closeModal } = useUIStore();
  const { updateAgent } = useAgentsStore();

  // Initialize data from mocks (in real app, this would be fetched from API)
  const { setAgents } = useAgentsStore();
  const { setVehicles } = useVehiclesStore();

  useEffect(() => {
    // Convert mock data IDs from string to number
    const convertedAgents = MOCK_AGENTS.map(a => ({
      ...a,
      id: parseInt(a.id.replace('A', '')),
      vehicleId: a.vehicleId ? parseInt(a.vehicleId.replace('V', '')) : null
    })) as any;

    const convertedVehicles = MOCK_VEHICLES.map(v => ({
      ...v,
      id: parseInt(v.id.replace('V', '')),
      assigned_to: v.assignedTo,
      total_km: v.totalKm || 0,
      fuel_rate: v.fuelRate || 0
    })) as any;

    setAgents(convertedAgents);
    setVehicles(convertedVehicles);
  }, []);

  const handleReturnToOffice = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    const agentIdStr = vehicle?.assigned_to;

    // 1. Mark vehicle as available
    updateVehicle(vehicleId, {
      status: 'AVAILABLE',
      assigned_to: undefined
    });

    // 2. Mark agent as available (if they were assigned)
    if (agentIdStr) {
      const agentId = typeof agentIdStr === 'string' ? parseInt(agentIdStr) : agentIdStr;
      updateAgent(agentId, {
        agent_status: 'AVAILABLE',
        vehicle_id: undefined
      });
    }
  };

  const handleAssignAgent = (vehicleId: number, agentId: number) => {
    // 1. Mark vehicle as in use and link to agent
    updateVehicle(vehicleId, {
      status: 'IN_USE',
      assigned_to: agentId.toString()
    });

    // 2. Update agent status and link to vehicle
    updateAgent(agentId, {
      agent_status: 'ON_FIELD',
      vehicle_id: vehicleId
    });

    closeModal('editVehicle');
    setSelectedVehicle(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Fleet Assignment</h1>
          <p className="text-slate-500">Dispatch vehicles to agents and manage office returns.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by plate or model..." 
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 transition-colors shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Summary Row - Focused on Fleet Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
           <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Car className="w-24 h-24 text-slate-900" />
           </div>
           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Fleet</p>
           <h3 className="text-2xl font-bold text-slate-800">{vehicles.length} Units</h3>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
           <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CheckCircle2 className="w-24 h-24 text-emerald-900" />
           </div>
           <p className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Available Ready</p>
           <h3 className="text-2xl font-bold text-emerald-600">{vehicles.filter(v => v.status === 'AVAILABLE').length} Units</h3>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
           <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ArrowLeftRight className="w-24 h-24 text-indigo-900" />
           </div>
           <p className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Vehicles In Use</p>
           <h3 className="text-2xl font-bold text-indigo-600">{vehicles.filter(v => v.status === 'IN_USE').length} Units</h3>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
           <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldAlert className="w-24 h-24 text-amber-900" />
           </div>
           <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mb-1">Maintenance</p>
           <h3 className="text-2xl font-bold text-amber-600">{vehicles.filter(v => v.status === 'MAINTENANCE').length} Units</h3>
        </div>
      </div>

      {/* Fleet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vehicles.map((vehicle) => {
          const assignedAgentId = vehicle.assigned_to ? (typeof vehicle.assigned_to === 'string' ? parseInt(vehicle.assigned_to) : vehicle.assigned_to) : null;
          const assignedAgent = assignedAgentId ? agents.find(a => a.id === assignedAgentId) : undefined;
          
          return (
            <div key={vehicle.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col group hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50/20 transition-all duration-300">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-indigo-600">
                    <Car className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter border ${
                      vehicle.status === 'IN_USE' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                      vehicle.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}>
                      {vehicle.status}
                    </span>
                    <button className="p-1 text-slate-300 hover:text-slate-600 transition-colors">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{vehicle.model}</h3>
                <div className="flex items-center gap-2 mb-6">
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600 border border-slate-200">
                    {vehicle.plate}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: {vehicle.id}</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Users className="w-4 h-4 text-slate-300" /> Currently Using
                    </span>
                    <span className={`font-bold ${assignedAgent ? 'text-indigo-600' : 'text-slate-400 italic'}`}>
                      {assignedAgent ? assignedAgent.name : 'Unassigned'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Gauge className="w-4 h-4 text-slate-300" /> Odometer
                    </span>
                    <span className="font-bold text-slate-700">
                      {vehicle.total_km.toLocaleString()} KM
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 group-hover:bg-white transition-colors">
                {vehicle.status === 'IN_USE' ? (
                  <button 
                    onClick={() => handleReturnToOffice(vehicle.id)}
                    className="w-full py-2.5 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                  >
                    <ParkingCircle className="w-4 h-4" /> Return to Office
                  </button>
                ) : vehicle.status === 'AVAILABLE' ? (
                  <button
                    onClick={() => { setSelectedVehicle(vehicle as any); openModal('editVehicle'); }}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                  >
                    <ArrowLeftRight className="w-4 h-4" /> Assign Agent
                  </button>
                ) : (
                  <div className="w-full py-2.5 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest border border-dashed border-slate-200 rounded-xl">
                    In Maintenance
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Assignment Modal */}
      {modalOpen.editVehicle && selectedVehicle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 text-white">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Agent Assignment</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Vehicle: {selectedVehicle.plate} ({selectedVehicle.model})</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => closeModal('editVehicle')}
                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto bg-white">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search available agents by name..."
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Available Personnel</p>
                   <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                     {agents.filter(a => a.agent_status === 'AVAILABLE').length} Ready
                   </span>
                </div>

                {agents.filter(a => a.agent_status === 'AVAILABLE').length > 0 ? (
                  agents.filter(a => a.agent_status === 'AVAILABLE').map((agent) => (
                    <div 
                      key={agent.id} 
                      className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50/50 transition-all cursor-pointer"
                      onClick={() => handleAssignAgent(selectedVehicle.id, agent.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          {agent.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{agent.name}</p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">
                            <span className="text-indigo-600">{agent.role}</span>
                            <span className="flex items-center gap-1 font-medium"><Clock className="w-3 h-3" /> Seen {agent.last_seen ? new Date(agent.last_seen).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        Assign Agent <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 px-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-500">No available agents</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">All agents are currently on field assignments or off-duty.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => closeModal('editVehicle')}
                className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-all text-sm shadow-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FleetAssignment;
