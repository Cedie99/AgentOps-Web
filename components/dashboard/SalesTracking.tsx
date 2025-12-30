'use client'

import React, { useState, useMemo } from 'react';
import { MOCK_AGENTS, MOCK_STORES } from '@/lib/constants';
import { Agent, MobileRole, Store, StoreStatus } from '@/lib/types';
import { 
  ShoppingBag, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Search, 
  Target,
  ChevronRight,
  TrendingUp,
  Map as MapIcon,
  DollarSign,
  Briefcase
} from 'lucide-react';

const SalesTracking: React.FC = () => {
  const [selectedSalesRep, setSelectedSalesRep] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const salesReps = useMemo(() => 
    MOCK_AGENTS.filter(a => a.role === MobileRole.SALES), 
  []);

  const filteredSalesReps = salesReps.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSalesVisits = (agentName: string) => {
    return MOCK_STORES.filter(store => 
      store.visitHistory.some(log => log.agentName === agentName)
    );
  };

  const selectedSalesVisits = useMemo(() => {
    if (!selectedSalesRep) return [];
    return getSalesVisits(selectedSalesRep.name);
  }, [selectedSalesRep]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sales Representative Hub</h1>
          <p className="text-slate-500 text-sm">Monitor sales activities, conversions, and field coverage per representative.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sales Rep List Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Find sales rep..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Field Personnel</p>
            {filteredSalesReps.map((agent) => {
              const visitCount = getSalesVisits(agent.name).length;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedSalesRep(agent)}
                  className={`w-full text-left p-4 rounded-3xl border transition-all relative overflow-hidden group ${
                    selectedSalesRep?.id === agent.id 
                      ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100' 
                      : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-colors ${
                        selectedSalesRep?.id === agent.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${selectedSalesRep?.id === agent.id ? 'text-white' : 'text-slate-900'}`}>{agent.name}</p>
                        <p className={`text-[10px] font-medium ${selectedSalesRep?.id === agent.id ? 'text-indigo-100' : 'text-slate-500'}`}>{agent.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black leading-none ${selectedSalesRep?.id === agent.id ? 'text-white' : 'text-indigo-600'}`}>{visitCount}</p>
                      <p className={`text-[8px] font-bold uppercase ${selectedSalesRep?.id === agent.id ? 'text-indigo-200' : 'text-slate-400'}`}>Visits</p>
                    </div>
                  </div>
                  {selectedSalesRep?.id === agent.id && (
                    <div className="absolute right-0 bottom-0 p-1 opacity-10">
                      <Briefcase className="w-12 h-12 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Details and Map Output */}
        <div className="lg:col-span-3 space-y-6">
          {selectedSalesRep ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Profile Header Card */}
              <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-indigo-200 border-4 border-white">
                    {selectedSalesRep.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-slate-900">{selectedSalesRep.name}</h2>
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase">Sales Active</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                       <DollarSign className="w-4 h-4 text-emerald-500" /> Linked to vehicle <span className="font-bold text-slate-700">{selectedSalesRep.vehicleId || 'N/A'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-2xl font-black text-slate-800">{selectedSalesVisits.length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Visits</p>
                  </div>
                  <div className="px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
                    <p className="text-2xl font-black text-emerald-600">75%</p>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Conversion</p>
                  </div>
                </div>
              </div>

              {/* Map & Activity Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Mini Map Visualization */}
                 <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm overflow-hidden h-96 flex flex-col">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-600" /> Sales Territory Coverage
                      </h3>
                      <button className="text-[10px] font-bold text-indigo-600 hover:underline">Full Analytics</button>
                   </div>
                   <div className="flex-1 bg-slate-100 rounded-3xl relative overflow-hidden">
                      <img 
                        src="https://picsum.photos/seed/sales-map/800/600" 
                        className="w-full h-full object-cover grayscale opacity-40 contrast-125" 
                        alt="sales rep territory"
                      />
                      <div className="absolute inset-0 bg-indigo-900/5"></div>
                      
                      {/* Highlight current agent */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                         <div className="w-8 h-8 bg-indigo-600 rounded-full border-2 border-white shadow-2xl animate-pulse flex items-center justify-center text-white">
                            <Target className="w-4 h-4" />
                         </div>
                      </div>

                      {/* Highlight visited stores */}
                      {selectedSalesVisits.map((store, i) => (
                        <div 
                          key={store.id} 
                          className="absolute w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                          style={{ 
                            top: `${20 + (i * 20) % 60}%`, 
                            left: `${15 + (i * 30) % 70}%` 
                          }}
                        >
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                      ))}
                   </div>
                 </div>

                 {/* Recent Sales Visits */}
                 <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm h-96 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" /> Recent Sales Logs
                      </h3>
                   </div>
                   <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                      {selectedSalesVisits.length > 0 ? (
                        selectedSalesVisits.map((store) => {
                          const log = store.visitHistory.find(v => v.agentName === selectedSalesRep.name);
                          return (
                            <div key={store.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-emerald-200 transition-colors">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-bold text-slate-800">{store.name}</p>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                  log?.outcome.includes('Order') ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                                } uppercase tracking-tighter`}>
                                  {log?.outcome || 'Visited'}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 italic mb-2 leading-relaxed line-clamp-2">
                                "{log?.notes || 'No visit notes available.'}"
                              </p>
                              <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {log?.timestamp || 'Recently'}</span>
                                {log?.locationVerified && <span className="text-emerald-500">Verified ✓</span>}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                          <ShoppingBag className="w-12 h-12 mb-2 text-slate-300" />
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No sales history</p>
                        </div>
                      )}
                   </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] bg-white rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="w-12 h-12 text-emerald-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Select Sales Representative</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Choose a representative from the sidebar (e.g., Jane Smith) to visualize their sales funnel and on-field efficiency.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesTracking;
