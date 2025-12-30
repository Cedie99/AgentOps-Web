'use client'

import React, { useState, useMemo } from 'react';
import { MOCK_AGENTS, MOCK_STORES } from '@/lib/constants';
import { Agent, MobileRole, Store, StoreStatus } from '@/lib/types';
import { 
  ClipboardCheck, 
  MapPin, 
  Calendar, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  MoreVertical, 
  Search, 
  Target,
  ChevronRight,
  TrendingUp,
  Map as MapIcon
} from 'lucide-react';

const SurveyorTracking: React.FC = () => {
  const [selectedSurveyor, setSelectedSurveyor] = useState<Agent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const surveyors = useMemo(() => 
    MOCK_AGENTS.filter(a => a.role === MobileRole.SURVEYOR), 
  []);

  const filteredSurveyors = surveyors.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSurveyedStores = (agentName: string) => {
    return MOCK_STORES.filter(store => 
      store.timeline.some(event => 
        event.role === MobileRole.SURVEYOR && event.agentName === agentName
      )
    );
  };

  const selectedSurveyedStores = useMemo(() => {
    if (!selectedSurveyor) return [];
    return getSurveyedStores(selectedSurveyor.name);
  }, [selectedSurveyor]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Surveyor Hub</h1>
          <p className="text-slate-500 text-sm">Dedicated tracking for field surveyors and discovery output.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Surveyor List Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Find surveyor..." 
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Surveyors</p>
            {filteredSurveyors.map((agent) => {
              const count = getSurveyedStores(agent.name).length;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedSurveyor(agent)}
                  className={`w-full text-left p-4 rounded-3xl border transition-all relative overflow-hidden group ${
                    selectedSurveyor?.id === agent.id 
                      ? 'bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-100' 
                      : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-colors ${
                        selectedSurveyor?.id === agent.id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-700'
                      }`}>
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <p className={`text-sm font-bold ${selectedSurveyor?.id === agent.id ? 'text-white' : 'text-slate-900'}`}>{agent.name}</p>
                        <p className={`text-[10px] font-medium ${selectedSurveyor?.id === agent.id ? 'text-indigo-100' : 'text-slate-500'}`}>{agent.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-black leading-none ${selectedSurveyor?.id === agent.id ? 'text-white' : 'text-indigo-600'}`}>{count}</p>
                      <p className={`text-[8px] font-bold uppercase ${selectedSurveyor?.id === agent.id ? 'text-indigo-200' : 'text-slate-400'}`}>Pins</p>
                    </div>
                  </div>
                  {selectedSurveyor?.id === agent.id && (
                    <div className="absolute right-0 bottom-0 p-1 opacity-10">
                      <Target className="w-12 h-12 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Details and Map Output */}
        <div className="lg:col-span-3 space-y-6">
          {selectedSurveyor ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Profile Header Card */}
              <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center text-white text-3xl font-bold shadow-2xl shadow-indigo-200 border-4 border-white">
                    {selectedSurveyor.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-2xl font-bold text-slate-900">{selectedSurveyor.name}</h2>
                      <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 uppercase">On Field Tracking</span>
                    </div>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                       <MapIcon className="w-4 h-4 text-indigo-500" /> Currently assigned to vehicle <span className="font-bold text-slate-700">{selectedSurveyor.vehicleId || 'N/A'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                    <p className="text-2xl font-black text-slate-800">{selectedSurveyedStores.length}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lifetime Pins</p>
                  </div>
                  <div className="px-6 py-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                    <p className="text-2xl font-black text-indigo-600">8.2</p>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Avg Daily</p>
                  </div>
                </div>
              </div>

              {/* Map & Timeline Toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Mini Map Visualization */}
                 <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm overflow-hidden h-96 flex flex-col">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-indigo-600" /> Visual Field Map
                      </h3>
                      <button className="text-[10px] font-bold text-indigo-600 hover:underline">Expand Full Map</button>
                   </div>
                   <div className="flex-1 bg-slate-100 rounded-3xl relative overflow-hidden">
                      <img 
                        src="https://picsum.photos/seed/surveyor-map/800/600" 
                        className="w-full h-full object-cover grayscale opacity-40 contrast-125" 
                        alt="surveyor area map"
                      />
                      <div className="absolute inset-0 bg-indigo-900/5"></div>
                      {/* Highlight current agent */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                         <div className="w-8 h-8 bg-indigo-600 rounded-full border-2 border-white shadow-2xl animate-bounce flex items-center justify-center text-white">
                            <Target className="w-4 h-4" />
                         </div>
                      </div>
                      {/* Highlight surveyed stores as dots */}
                      {selectedSurveyedStores.map((store, i) => (
                        <div 
                          key={store.id} 
                          className="absolute w-3 h-3 bg-emerald-500 rounded-full border border-white shadow-sm"
                          style={{ 
                            top: `${30 + (i * 15) % 40}%`, 
                            left: `${20 + (i * 25) % 60}%` 
                          }}
                        ></div>
                      ))}
                   </div>
                 </div>

                 {/* Discovery Timeline */}
                 <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm h-96 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" /> Output Timeline
                      </h3>
                   </div>
                   <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                      {selectedSurveyedStores.length > 0 ? (
                        selectedSurveyedStores.map((store) => (
                          <div key={store.id} className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-50 transition-colors">
                               <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                               <p className="text-sm font-bold text-slate-800">{store.name}</p>
                               <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                 <Clock className="w-3 h-3" /> Surveyed 14:20 PM
                               </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                          <ClipboardCheck className="w-12 h-12 mb-2" />
                          <p className="text-xs font-bold uppercase tracking-widest">No activity found</p>
                        </div>
                      )}
                   </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-[600px] bg-white rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                <Target className="w-12 h-12 text-indigo-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Select a Surveyor to Track</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                Choose a personnel from the sidebar (e.g., Joseph) to view their current field performance and discovered locations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyorTracking;
