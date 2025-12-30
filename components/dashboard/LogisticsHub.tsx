'use client'

import React, { useState, useMemo } from 'react';
import { MOCK_STORES, MOCK_AGENTS } from '@/lib/constants';
import { Store, StoreStatus, MobileRole, Agent } from '@/lib/types';
import { 
  PackageCheck, 
  Wallet, 
  Truck, 
  Search, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  X,
  UserPlus,
  AlertCircle,
  MoreVertical,
  Activity,
  DollarSign,
  Briefcase,
  ExternalLink,
  Navigation,
  Camera,
  AlertTriangle
} from 'lucide-react';

const LogisticsHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'delivery' | 'collection'>('delivery');
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Stores awaiting delivery (Sales Visited -> Need Delivery)
  const deliveryQueue = useMemo(() => 
    MOCK_STORES.filter(s => s.status === StoreStatus.SALES_VISITED), 
  []);

  // Stores awaiting collection (Delivered -> Need Collection)
  const collectionQueue = useMemo(() => 
    MOCK_STORES.filter(s => s.status === StoreStatus.DELIVERED), 
  []);

  // Available agents for the current task
  const taskRole = activeTab === 'delivery' ? MobileRole.DELIVERY : MobileRole.COLLECTOR;
  const filteredAgents = useMemo(() => {
    return MOCK_AGENTS.filter(a => a.role === taskRole && a.status !== 'Off Duty');
  }, [taskRole]);

  const handleDispatchStart = (store: Store) => {
    setSelectedStore(store);
    setIsAssignModalOpen(true);
  };

  const confirmDispatch = () => {
    setIsAssignModalOpen(false);
    setDispatchSuccess(true);
    setTimeout(() => setDispatchSuccess(false), 3000);
  };

  const queue = activeTab === 'delivery' ? deliveryQueue : collectionQueue;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dispatch Command</h1>
          <p className="text-slate-500 text-sm">Assign delivery and collection tasks to optimize field logistics.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('delivery')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${activeTab === 'delivery' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Truck className="w-4 h-4" /> Delivery Queue ({deliveryQueue.length})
          </button>
          <button 
            onClick={() => setActiveTab('collection')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${activeTab === 'collection' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Wallet className="w-4 h-4" /> Collections ({collectionQueue.length})
          </button>
        </div>
      </div>

      {dispatchSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
           <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <CheckCircle2 className="w-5 h-5" />
           </div>
           <div>
              <p className="text-sm font-bold text-emerald-800">Task Successfully Dispatched</p>
              <p className="text-xs text-emerald-600">Personnel has been notified via their mobile application.</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Task Queue Board */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending Assignments</h3>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-[10px] font-bold text-slate-400">HIGH PRIORITY</span>
               </div>
               <span className="text-[10px] text-slate-300">|</span>
               <button className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                 AREA GROUPING <Navigation className="w-3 h-3" />
               </button>
            </div>
          </div>

          {queue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {queue.map(store => {
                const lastEvent = store.timeline[store.timeline.length - 1];
                const hasPhoto = lastEvent?.photoUrl;
                const isPartial = lastEvent?.paymentStatus === 'Partial';

                return (
                  <div key={store.id} className="bg-white rounded-[32px] border border-slate-200 p-8 hover:border-emerald-500 transition-all group relative shadow-sm hover:shadow-xl hover:shadow-emerald-50/30 overflow-hidden">
                    {/* Status Overlays */}
                    {hasPhoto && (
                      <div className="absolute top-4 right-12 flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[8px] font-bold border border-emerald-100">
                         <Camera className="w-2.5 h-2.5" /> PROOF ATTACHED
                      </div>
                    )}
                    {isPartial && (
                      <div className="absolute top-4 right-12 flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-full text-[8px] font-bold border border-amber-100">
                         <AlertTriangle className="w-2.5 h-2.5" /> PARTIAL COLLECTION
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 rounded-2xl flex items-center justify-center shadow-inner ${activeTab === 'delivery' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {activeTab === 'delivery' ? <PackageCheck className="w-6 h-6" /> : <Wallet className="w-6 h-6" />}
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Store ID</p>
                         <p className="text-xs font-black text-slate-800">{store.id}</p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{store.name}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-300" /> {store.address}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{activeTab === 'delivery' ? 'Order Value' : 'Target Collection'}</p>
                          <p className="text-base font-black text-slate-800">${(store.orderValue || store.collectionAmount || 0).toLocaleString()}</p>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Stage Time</p>
                          <p className="text-base font-black text-slate-800">4h 20m</p>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 mb-8 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 p-2 rounded-lg border border-dashed border-slate-200">
                       <Activity className="w-3.5 h-3.5 text-emerald-500" />
                       Last Step: {lastEvent?.agentName}
                    </div>

                    <button 
                      onClick={() => handleDispatchStart(store)}
                      className={`w-full py-4 rounded-[20px] text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-xl ${
                        activeTab === 'delivery' 
                          ? 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700 hover:-translate-y-0.5' 
                          : 'bg-amber-600 text-white shadow-amber-100 hover:bg-amber-700 hover:-translate-y-0.5'
                      }`}
                    >
                      Assign {activeTab === 'delivery' ? 'Delivery Agent' : 'Field Collector'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 py-32 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-12 h-12 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Operational Queue Clear</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">All stores processed in the previous stage have been assigned to their respective logistics personnel.</p>
            </div>
          )}
        </div>

        {/* Fleet Monitor Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm sticky top-6">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Fleet Status</h3>
                <ExternalLink className="w-4 h-4 text-slate-300" />
             </div>
             
             <div className="space-y-6">
                {/* Statistics */}
                <div className="grid grid-cols-2 gap-3">
                   <div className="text-center p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <p className="text-xl font-black text-emerald-600">{filteredAgents.filter(a => a.status === 'Available').length}</p>
                      <p className="text-[9px] font-bold text-emerald-400 uppercase">Idle</p>
                   </div>
                   <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xl font-black text-slate-800">{filteredAgents.filter(a => a.status === 'On Field').length}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Busy</p>
                   </div>
                </div>

                {/* Personnel List */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                   {filteredAgents.map(agent => (
                      <div key={agent.id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-emerald-200 transition-all group">
                         <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                               <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-xs font-bold text-slate-700">
                                 {agent.name.charAt(0)}
                               </div>
                               <div>
                                  <p className="text-xs font-bold text-slate-900">{agent.name}</p>
                                  <p className="text-[10px] text-slate-500">{agent.vehicleId || 'No Vehicle'}</p>
                               </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${agent.status === 'Available' ? 'bg-emerald-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                         </div>
                         <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Tasks: <span className="text-emerald-600">{agent.activeTasksCount || 0}</span></span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Load: <span className={agent.activeTasksCount && agent.activeTasksCount > 2 ? 'text-amber-500' : 'text-emerald-500'}>{agent.activeTasksCount && agent.activeTasksCount > 2 ? 'High' : 'Optimal'}</span></span>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Dispatch & Assign Modal */}
      {isAssignModalOpen && selectedStore && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className={`p-10 border-b border-slate-100 flex items-center justify-between ${activeTab === 'delivery' ? 'bg-emerald-50/50' : 'bg-amber-50/50'}`}>
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center shadow-2xl text-white ${activeTab === 'delivery' ? 'bg-emerald-600' : 'bg-amber-600'}`}>
                  {activeTab === 'delivery' ? <Truck className="w-10 h-10" /> : <Wallet className="w-10 h-10" />}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Task Dispatch</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                     <span className={`text-xs font-bold uppercase tracking-widest ${activeTab === 'delivery' ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedStore.name}</span>
                     <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                     <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">ORDER VAL: ${(selectedStore.orderValue || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="p-4 bg-white/50 hover:bg-white rounded-[24px] text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto bg-white">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
                <input 
                  type="text" 
                  placeholder={`Search available ${taskRole.toLowerCase()}s by name or area...`}
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[28px] text-sm outline-none focus:ring-4 focus:ring-emerald-100 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                   <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Live Fleet Recommendation</p>
                   <span className="text-[10px] font-bold text-emerald-500">SORT BY LOAD</span>
                </div>
                
                {filteredAgents.length > 0 ? (
                  filteredAgents.map((agent) => (
                    <div 
                      key={agent.id} 
                      className="group flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[36px] hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-50/50 transition-all cursor-pointer"
                      onClick={confirmDispatch}
                    >
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 font-black text-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            {agent.name.charAt(0)}
                          </div>
                          {agent.status === 'Available' && (
                             <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{agent.name}</p>
                          <div className="flex items-center gap-5 text-xs text-slate-500 font-bold uppercase mt-1">
                            <span className="flex items-center gap-2">
                              <Briefcase className="w-4 h-4 text-slate-300" /> {agent.activeTasksCount || 0} active tasks
                            </span>
                            <span className="flex items-center gap-2">
                              <Navigation className="w-4 h-4 text-slate-300" /> 2.4km away
                            </span>
                          </div>
                        </div>
                      </div>
                      <button className={`flex items-center gap-2 px-8 py-4 rounded-2xl text-xs font-black transition-all shadow-sm ${
                        activeTab === 'delivery' ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white'
                      }`}>
                        Dispatch <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-base font-bold text-slate-600">No personnel available</p>
                    <p className="text-sm text-slate-400 mt-2">All {activeTab} agents are currently unreachable or signed off.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button 
                onClick={() => setIsAssignModalOpen(false)}
                className="px-10 py-4 bg-white border border-slate-200 text-slate-600 rounded-[20px] font-bold hover:bg-slate-100 transition-all text-sm shadow-sm"
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

export default LogisticsHub;
