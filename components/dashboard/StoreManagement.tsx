'use client'

import React, { useState, useEffect } from 'react';
import { MOCK_STORES, MOCK_AGENTS } from '@/lib/constants';
import { Store, StoreStatus, MobileRole, Agent, VisitLog, CustomerType } from '@/lib/types';
import { useStoresStore, useAgentsStore, useUIStore } from '@/store';
import {
  Search,
  Filter,
  MapPin,
  Clock,
  ChevronRight,
  CheckCircle2,
  UserPlus,
  X,
  ArrowRight,
  ClipboardList,
  History,
  ShieldCheck,
  MoreVertical,
  Activity,
  Heart,
  Star,
  Users,
  Camera,
  Eye,
  Navigation
} from 'lucide-react';

const StatusBadge = ({ status }: { status: StoreStatus }) => {
  const styles = {
    [StoreStatus.SURVEYED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [StoreStatus.SALES_VISITED]: 'bg-green-100 text-green-700 border-green-200',
    [StoreStatus.DELIVERED]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [StoreStatus.COLLECTED]: 'bg-amber-100 text-amber-700 border-amber-200',
    [StoreStatus.PENDING]: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase border ${styles[status]}`}>
      {status}
    </span>
  );
};

const TypeBadge = ({ type }: { type: CustomerType }) => {
  const styles = {
    [CustomerType.PROSPECT]: 'bg-purple-100 text-purple-700 border-purple-200',
    [CustomerType.NEW]: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    [CustomerType.EXISTING]: 'bg-sky-100 text-sky-700 border-sky-200',
  };

  const Icons = {
    [CustomerType.PROSPECT]: Heart,
    [CustomerType.NEW]: Star,
    [CustomerType.EXISTING]: Users,
  };

  const Icon = Icons[type];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold border shadow-sm ${styles[type]}`}>
      <Icon className="w-3 h-3" />
      {type}
    </span>
  );
};

const StoreManagement: React.FC = () => {
  // Zustand stores
  const { stores } = useStoresStore();
  const { agents } = useAgentsStore();
  const { modalOpen, openModal, closeModal } = useUIStore();

  // Initialize data from mocks
  const { setStores } = useStoresStore();
  const { setAgents } = useAgentsStore();

  useEffect(() => {
    // Convert mock data IDs from string to number
    const convertedStores = MOCK_STORES.map((s, index) => ({
      ...s,
      id: s.id && typeof s.id === 'string' ? parseInt(s.id.replace('S', '')) : index + 1,
      currentAssignment: s.currentAssignment ? {
        ...s.currentAssignment,
        agentId: s.currentAssignment.agentId && typeof s.currentAssignment.agentId === 'string'
          ? parseInt(s.currentAssignment.agentId.replace('A', ''))
          : null
      } : null,
      visitHistory: s.visitHistory?.map((v, vIndex) => ({
        ...v,
        id: v.id && typeof v.id === 'string' ? parseInt(v.id.replace('L', '')) : vIndex,
        agentId: v.agentId && typeof v.agentId === 'string' ? parseInt(v.agentId.replace('A', '')) : null
      })) || [],
      timeline: s.timeline?.map(t => ({
        ...t,
        agentId: t.agentId && typeof t.agentId === 'string' ? parseInt(t.agentId.replace('A', '')) : null
      })) || []
    })) as any;

    const convertedAgents = MOCK_AGENTS.map((a, index) => ({
      ...a,
      id: a.id && typeof a.id === 'string' ? parseInt(a.id.replace('A', '')) : index + 1,
      vehicleId: a.vehicleId && typeof a.vehicleId === 'string' ? parseInt(a.vehicleId.replace('V', '')) : null
    })) as any;

    setStores(convertedStores);
    setAgents(convertedAgents);
  }, []);

  // Local state for UI
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);
  const [targetRole, setTargetRole] = useState<MobileRole | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'visits'>('timeline');

  const getNextAction = (status: StoreStatus) => {
    switch (status) {
      case StoreStatus.SURVEYED:
        return { label: 'Assign Sales Rep (Prospecting)', role: MobileRole.SALES };
      case StoreStatus.SALES_VISITED:
        return { label: 'Assign Delivery Team', role: MobileRole.DELIVERY };
      case StoreStatus.DELIVERED:
        return { label: 'Assign Collector', role: MobileRole.COLLECTOR };
      case StoreStatus.PENDING:
        return { label: 'Assign Surveyor', role: MobileRole.SURVEYOR };
      default:
        return null;
    }
  };

  const handleAssignClick = (role: MobileRole) => {
    setTargetRole(role);
    openModal('addStore');
  };

  const viewProof = (url: string) => {
    setActiveProofUrl(url);
    setIsProofModalOpen(true);
  };

  const nextAction = selectedStore ? getNextAction(selectedStore.status) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Store Lifecycle</h1>
          <p className="text-slate-500">Manage Prospects, New, and Existing Customers through field operations.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Store List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search by store name, ID or customer type..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors font-medium">
              <Filter className="w-4 h-4" /> Filter
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Store & Segment</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Personnel</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stores.map((store) => (
                  <tr 
                    key={store.id} 
                    className={`hover:bg-slate-50 cursor-pointer transition-all ${selectedStore?.id === store.id ? 'bg-emerald-50/50' : ''}`}
                    onClick={() => setSelectedStore(store)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{store.name}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <TypeBadge type={store.customerType} />
                        <span className="text-[10px] text-slate-400 font-medium">ID: {store.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={store.status} />
                    </td>
                    <td className="px-6 py-4">
                      {store.currentAssignment ? (
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 border-2 border-white shadow-sm">
                            {store.currentAssignment.agentName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{store.currentAssignment.agentName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{store.currentAssignment.role}</p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 italic font-medium">Available for Assignment</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight className="w-5 h-5 text-slate-300 inline group-hover:text-emerald-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Store Detail Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm h-fit sticky top-6 overflow-hidden">
          {selectedStore ? (
            <div>
              <div className="p-6 bg-slate-50 border-b border-slate-200">
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-tight">{selectedStore.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <TypeBadge type={selectedStore.customerType} />
                       <StatusBadge status={selectedStore.status} />
                    </div>
                  </div>
                  <button className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                {selectedStore.currentAssignment && (
                  <div className="mb-6 p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                       <Activity className="w-12 h-12 text-emerald-600" />
                    </div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Live Assignment</span>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 animate-pulse">
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div> ON FIELD
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-100">
                        {selectedStore.currentAssignment.agentName.charAt(0)}
                      </div>
                      <div>
                        <p className="sm:text-sm font-bold text-slate-900">{selectedStore.currentAssignment.agentName}</p>
                        <p className="text-xs text-slate-500 font-medium">{selectedStore.currentAssignment.role} • Since {selectedStore.currentAssignment.assignedAt.split(' ')[0]}</p>
                      </div>
                    </div>
                  </div>
                )}

                {nextAction && (
                  <button 
                    onClick={() => handleAssignClick(nextAction.role)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 group"
                  >
                    <UserPlus className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                    {nextAction.label}
                  </button>
                )}
              </div>

              {/* Detail Tabs */}
              <div className="flex border-b border-slate-100 px-2">
                <button 
                  onClick={() => setActiveTab('timeline')}
                  className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'timeline' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <ClipboardList className="w-4 h-4" /> Workflow
                  </div>
                </button>
                <button 
                  onClick={() => setActiveTab('visits')}
                  className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'visits' ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <History className="w-4 h-4" /> Daily Logs ({selectedStore.visitHistory.length})
                  </div>
                </button>
              </div>

              <div className="p-6">
                {activeTab === 'timeline' ? (
                  <div className="space-y-8 relative pl-2">
                    <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                    {[
                      { status: StoreStatus.SURVEYED, label: 'Store Surveyed', detail: 'Prospect Identified' },
                      { status: StoreStatus.SALES_VISITED, label: 'Sales Engagement', detail: 'Conversion Process' },
                      { status: StoreStatus.DELIVERED, label: 'Delivery Managed', detail: 'Order Fulfilled' },
                      { status: StoreStatus.COLLECTED, label: 'Collection Handled', detail: 'Cycle Complete' }
                    ].map((step, idx) => {
                      const event = selectedStore.timeline.find(t => t.status === step.status);
                      const isDone = !!event;
                      
                      return (
                        <div key={idx} className="flex gap-5 relative z-10">
                          <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                            isDone ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-100' : 'bg-white border-slate-200'
                          }`}>
                            {isDone ? <CheckCircle2 className="w-5 h-5 text-white" /> : <div className="w-2 h-2 bg-slate-200 rounded-full"></div>}
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-bold leading-none ${isDone ? 'text-slate-800' : 'text-slate-300'}`}>
                              {step.label}
                            </p>
                            <p className={`text-[10px] mt-1 font-semibold ${isDone ? 'text-emerald-600' : 'text-slate-300'}`}>
                               {step.detail}
                            </p>
                            {isDone ? (
                              <div className="mt-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm group/step relative overflow-hidden">
                                <div className="flex items-center justify-between text-[11px] mb-2">
                                  <span className="font-bold text-slate-700">{event.agentName}</span>
                                  <span className="text-slate-400 font-medium">{event.timestamp}</span>
                                </div>
                                
                                {event.photoUrl && (
                                  <div className="mb-3">
                                     <div className="relative h-24 w-full rounded-xl overflow-hidden cursor-pointer group/photo" onClick={() => viewProof(event.photoUrl!)}>
                                        <img src={event.photoUrl} alt="Proof" className="w-full h-full object-cover transition-transform group-hover/photo:scale-110" />
                                        <div className="absolute inset-0 bg-emerald-900/40 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                                           <Eye className="w-6 h-6 text-white" />
                                        </div>
                                        <div className="absolute bottom-1 right-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] font-bold flex items-center gap-1">
                                           <Camera className="w-2 h-2" /> PROOF ATTACHED
                                        </div>
                                     </div>
                                  </div>
                                )}

                                {event.paymentStatus && (
                                   <div className={`p-3 rounded-xl border mb-2 ${event.paymentStatus === 'Full' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                                      <div className="flex items-center justify-between mb-1">
                                         <p className="text-[10px] font-bold text-slate-500 uppercase">Payment Status</p>
                                         <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${event.paymentStatus === 'Full' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                            {event.paymentStatus}
                                         </span>
                                      </div>
                                      <div className="flex items-end justify-between">
                                         <h4 className={`text-base font-black ${event.paymentStatus === 'Full' ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            ${(event.amountCollected || 0).toLocaleString()}
                                         </h4>
                                         <p className="text-[9px] font-bold text-slate-400">Total: ${(event.totalOrderAmount || 0).toLocaleString()}</p>
                                      </div>
                                      {event.paymentStatus === 'Partial' && (
                                         <div className="mt-2 h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-amber-500" style={{ width: `${((event.amountCollected || 0) / (event.totalOrderAmount || 1)) * 100}%` }}></div>
                                         </div>
                                      )}
                                   </div>
                                )}

                                {event.note && (
                                   <p className="text-[10px] text-slate-500 italic mt-1 leading-relaxed">"{event.note}"</p>
                                )}
                              </div>
                            ) : (
                              <div className="mt-1 h-2"></div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedStore.visitHistory.length > 0 ? (
                      selectedStore.visitHistory.map((log) => (
                        <div key={log.id} className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-100 transition-all group">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className={`w-4 h-4 ${log.locationVerified ? 'text-emerald-500' : 'text-slate-300'}`} />
                              <span className="text-xs font-bold text-slate-800">{log.outcome}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{log.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3">
                            "{log.notes}"
                          </p>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-tight pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-1.5">
                               <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[8px]">{log.agentName.charAt(0)}</div>
                               {log.agentName}
                            </div>
                            <span className={log.locationVerified ? 'text-emerald-600' : 'text-slate-400'}>
                              {log.locationVerified ? 'GPS Match ✓' : 'Location Not Verified'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                           <History className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 text-xs font-medium">No sales logs recorded yet.</p>
                        <p className="text-slate-300 text-[10px] mt-1">Visit history begins after Sales assignment.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-16 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-slate-200">
                <Search className="w-10 h-10 text-slate-200" />
              </div>
              <h4 className="text-slate-900 font-bold mb-2">No Store Selected</h4>
              <p className="text-slate-400 text-sm max-w-[200px] mx-auto">Select a store from the fleet list to manage its growth and assignments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Proof Viewer Modal */}
      {isProofModalOpen && activeProofUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-300">
           <button onClick={() => setIsProofModalOpen(false)} className="absolute top-6 right-6 p-4 text-white hover:text-emerald-400 transition-colors">
              <X className="w-10 h-10" />
           </button>
           <div className="max-w-4xl w-full flex flex-col items-center gap-6">
              <img src={activeProofUrl} alt="Delivery Proof" className="max-h-[80vh] w-auto rounded-3xl shadow-2xl border-4 border-white/10" />
              <div className="bg-white/10 backdrop-blur-xl px-8 py-4 rounded-3xl border border-white/10 flex items-center gap-6 text-white">
                 <div className="flex items-center gap-3">
                    <Camera className="w-5 h-5 text-emerald-400" />
                    <div>
                       <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Verification Method</p>
                       <p className="text-sm font-bold">On-Site Mobile Capture</p>
                    </div>
                 </div>
                 <div className="h-8 w-px bg-white/10"></div>
                 <div className="flex items-center gap-3">
                    <Navigation className="w-5 h-5 text-emerald-400" />
                    <div>
                       <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">GPS Coordinates</p>
                       <p className="text-sm font-bold">Match Store Location ✓</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Assignment Modal */}
      {modalOpen.addStore && selectedStore && targetRole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 text-white">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Assign to {targetRole} Team</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">{selectedStore.name}</span>
                     <span className="w-1 h-1 bg-emerald-200 rounded-full"></span>
                     <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{selectedStore.customerType}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => closeModal('addStore')}
                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto bg-white">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder={`Search active ${targetRole} agents...`}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
                />
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Available On-Field Agents</p>
                {agents.filter(a => a.role === targetRole).map((agent) => (
                  <div 
                    key={agent.id} 
                    className="group flex items-center justify-between p-4 bg-white border border-slate-100 rounded-3xl hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-50/50 transition-all cursor-pointer"
                    onClick={() => closeModal('addStore')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700 font-bold text-lg">
                          {agent.name.charAt(0)}
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{agent.name}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Seen {agent.lastSeen}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> Area: North
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all">
                      Confirm <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => closeModal('addStore')}
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

export default StoreManagement;
