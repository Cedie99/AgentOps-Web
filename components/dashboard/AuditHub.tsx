'use client'

import React, { useState, useMemo } from 'react';
import { MOCK_STORES } from '@/lib/constants';
import { MobileRole, StoreStatus } from '@/lib/types';
import { 
  ShieldCheck, 
  Camera, 
  Wallet, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  MapPin, 
  ChevronRight,
  TrendingDown,
  X,
  Navigation,
  Download
} from 'lucide-react';

const AuditHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'proofs' | 'ledger'>('proofs');
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{url: string, store: string, agent: string, address: string, time: string} | null>(null);

  // Extract all delivery proof events from stores
  const deliveryProofs = useMemo(() => {
    const proofs: any[] = [];
    MOCK_STORES.forEach(store => {
      store.timeline.forEach(event => {
        if (event.role === MobileRole.DELIVERY && event.photoUrl) {
          proofs.push({
            storeName: store.name,
            address: store.address,
            agentName: event.agentName,
            timestamp: event.timestamp,
            photoUrl: event.photoUrl,
            storeId: store.id
          });
        }
      });
    });
    return proofs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  // Extract all collection events from stores
  const collectionLedger = useMemo(() => {
    const logs: any[] = [];
    MOCK_STORES.forEach(store => {
      store.timeline.forEach(event => {
        if (event.role === MobileRole.COLLECTOR && event.paymentStatus) {
          logs.push({
            storeName: store.name,
            agentName: event.agentName,
            timestamp: event.timestamp,
            paymentStatus: event.paymentStatus,
            amountCollected: event.amountCollected,
            totalOrderAmount: event.totalOrderAmount,
            note: event.note,
            storeId: store.id
          });
        }
      });
    });
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, []);

  const totalCollected = collectionLedger.reduce((acc, curr) => acc + (curr.amountCollected || 0), 0);
  const pendingBalance = collectionLedger.reduce((acc, curr) => acc + ((curr.totalOrderAmount || 0) - (curr.amountCollected || 0)), 0);

  const openProof = (proof: any) => {
    setSelectedProof({ 
      url: proof.photoUrl, 
      store: proof.storeName, 
      agent: proof.agentName,
      address: proof.address,
      time: proof.timestamp
    });
    setIsProofModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit & Verification Hub</h1>
          <p className="text-slate-500 text-sm">Monitor field proof-of-delivery and financial collections ledger.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button 
            onClick={() => setActiveTab('proofs')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${activeTab === 'proofs' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Camera className="w-4 h-4" /> Delivery Proofs ({deliveryProofs.length})
          </button>
          <button 
            onClick={() => setActiveTab('ledger')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${activeTab === 'ledger' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Wallet className="w-4 h-4" /> Collection Ledger ({collectionLedger.length})
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
           <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <TrendingDown className="rotate-180 w-7 h-7" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Collected Today</p>
              <h2 className="text-2xl font-black text-slate-900">${totalCollected.toLocaleString()}</h2>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
           <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-7 h-7" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding Balance</p>
              <h2 className="text-2xl font-black text-amber-600">${pendingBalance.toLocaleString()}</h2>
           </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-5">
           <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-7 h-7" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Verification Rate</p>
              <h2 className="text-2xl font-black text-emerald-600">98.4%</h2>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        {/* Sub-header with search/filter */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder={`Search ${activeTab === 'proofs' ? 'delivery proofs' : 'collections'}...`} 
                className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-100 transition-all"
              />
           </div>
           <div className="flex items-center gap-3">
              <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50">
                 <Filter className="w-4 h-4" /> Filter
              </button>
              <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg shadow-slate-100">
                 <Download className="w-4 h-4" /> Export CSV
              </button>
           </div>
        </div>

        <div className="p-6">
          {activeTab === 'proofs' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Store & Time</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location Info</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Delivery Agent</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Verification</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {deliveryProofs.length > 0 ? (
                    deliveryProofs.map((proof, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-5">
                          <p className="text-sm font-bold text-slate-800">{proof.storeName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-300" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase">{proof.timestamp}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <p className="text-[11px] text-slate-600 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {proof.address}
                          </p>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[10px] font-black text-emerald-600">
                              {proof.agentName.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-slate-700">{proof.agentName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-tighter border border-emerald-100 shadow-sm">
                            <ShieldCheck className="w-3 h-3" /> Verified
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <button 
                            onClick={() => openProof(proof)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all shadow-sm"
                          >
                            <Eye className="w-4 h-4" /> View Proof
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <Camera className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                        <p className="text-slate-400 text-sm font-bold">No delivery proofs available yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                    <tr>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Store / Time</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Collector</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Payment Status</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Collected / Total</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Variance</th>
                       <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {collectionLedger.map((log, idx) => {
                      const variance = (log.totalOrderAmount || 0) - (log.amountCollected || 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                           <td className="px-6 py-5">
                              <p className="text-sm font-bold text-slate-800">{log.storeName}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{log.timestamp}</p>
                           </td>
                           <td className="px-6 py-5">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                    {log.agentName.charAt(0)}
                                 </div>
                                 <span className="text-xs font-bold text-slate-700">{log.agentName}</span>
                              </div>
                           </td>
                           <td className="px-6 py-5 text-center">
                              <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border ${
                                log.paymentStatus === 'Full' 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                  : 'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                 {log.paymentStatus}
                              </span>
                           </td>
                           <td className="px-6 py-5 text-right font-black text-slate-800">
                              <p className="text-sm">${(log.amountCollected || 0).toLocaleString()}</p>
                              <p className="text-[9px] text-slate-400">of ${(log.totalOrderAmount || 0).toLocaleString()}</p>
                           </td>
                           <td className="px-6 py-5 text-right font-black">
                              <span className={`text-sm ${variance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                 {variance > 0 ? `-$${variance.toLocaleString()}` : 'Cleared'}
                              </span>
                           </td>
                           <td className="px-6 py-5 text-right">
                              <button className="p-2 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                                 <ChevronRight className="w-5 h-5" />
                              </button>
                           </td>
                        </tr>
                      );
                    })}
                  </tbody>
               </table>
               {collectionLedger.length === 0 && (
                  <div className="py-20 text-center">
                     <Wallet className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                     <p className="text-slate-400 text-sm font-bold">No collections recorded in the ledger.</p>
                  </div>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Proof Lightbox Modal */}
      {isProofModalOpen && selectedProof && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
           <button 
             onClick={() => setIsProofModalOpen(false)}
             className="absolute top-6 right-6 p-4 text-white hover:text-emerald-400 transition-colors bg-white/10 rounded-full shadow-2xl z-[130]"
           >
              <X className="w-8 h-8" />
           </button>
           <div className="max-w-5xl w-full flex flex-col items-center gap-8 animate-in zoom-in-95 duration-300">
              <div className="relative group overflow-hidden rounded-[40px] shadow-2xl border-4 border-white/10">
                 <img src={selectedProof.url} alt="Proof" className="max-h-[70vh] w-auto object-contain bg-slate-800" />
                 <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl text-slate-900 shadow-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider">
                       <Download className="w-5 h-5" /> Download original
                    </button>
                 </div>
              </div>
              <div className="bg-white/10 backdrop-blur-3xl px-12 py-8 rounded-[40px] border border-white/10 flex flex-col md:flex-row items-center gap-10 text-white shadow-2xl">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-500/30 rounded-2xl border border-emerald-400/20">
                       <Navigation className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Destination Verified</p>
                       <p className="text-lg font-black text-white">{selectedProof.store}</p>
                       <p className="text-[11px] text-white/50 font-medium">{selectedProof.address}</p>
                    </div>
                 </div>
                 <div className="hidden md:block w-px h-16 bg-white/10"></div>
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-emerald-500/30 rounded-2xl border border-emerald-400/20">
                       <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Delivery Handler</p>
                       <p className="text-lg font-black text-white">{selectedProof.agent}</p>
                       <p className="text-[11px] text-white/50 font-medium">{selectedProof.time}</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AuditHub;
