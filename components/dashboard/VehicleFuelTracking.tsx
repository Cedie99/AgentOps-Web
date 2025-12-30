'use client'

import React, { useState, useEffect } from 'react';
import { MOCK_VEHICLES, MOCK_FUEL_ENTRIES } from '@/lib/constants';
import { Vehicle, FuelEntry } from '@/lib/types';
import { useVehiclesStore, useUIStore } from '@/store';
import { Fuel, TrendingUp, Gauge, Map as MapIcon, Calculator, Plus, X, CheckCircle2, History, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const VehicleFuelTracking: React.FC = () => {
  // Zustand stores
  const { vehicles, selectedVehicle, setSelectedVehicle } = useVehiclesStore();
  const { modalOpen, openModal, closeModal } = useUIStore();

  // Initialize data from mocks
  const { setVehicles } = useVehiclesStore();

  useEffect(() => {
    // Convert mock data IDs from string to number
    const convertedVehicles = MOCK_VEHICLES.map(v => ({
      ...v,
      id: parseInt(v.id.replace('V', '')),
      assignedTo: v.assignedTo
    })) as any;

    setVehicles(convertedVehicles);
  }, []);

  // Local state for fuel logs
  const [fuelLogs, setFuelLogs] = useState<FuelEntry[]>(MOCK_FUEL_ENTRIES);

  const fuelData = [
    { name: 'V001', consumption: 45, efficiency: 12.5 },
    { name: 'V002', consumption: 58, efficiency: 10.2 },
    { name: 'V003', consumption: 12, efficiency: 45.0 },
    { name: 'V004', consumption: 32, efficiency: 15.1 },
  ];

  const handleOpenModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    openModal('addVehicle');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fleet & Fuel Analytics</h1>
          <p className="text-slate-500">Monitor fuel consumption and vehicle efficiency.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium flex items-center gap-2">
            <Calculator className="w-5 h-5" /> Efficiency Calculator
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">Weekly Fuel Consumption (Liters)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fuelData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="consumption" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Fleet Status</h3>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{vehicles.length} Vehicles</span>
            </div>
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Vehicle Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Efficiency</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{v.model}</div>
                      <div className="text-xs text-slate-500">{v.plate} • {v.id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${Math.min((v.fuelRate / 45) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-700">{v.fuelRate} km/L</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenModal(v)}
                        className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Log Fuel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200">
             <div className="flex items-center justify-between mb-6">
                <Fuel className="w-8 h-8 opacity-80" />
                <TrendingUp className="w-6 h-6 text-emerald-400" />
             </div>
             <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider mb-1">Total Fuel Cost Today</p>
             <h2 className="text-4xl font-bold mb-6">$1,248.50</h2>
             <div className="flex items-center gap-2 text-xs font-bold text-indigo-200">
                <span className="bg-white/20 px-2 py-1 rounded-lg">+12% from yesterday</span>
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 mb-6">
               <History className="w-5 h-5 text-slate-400" />
               <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recent Activity</h4>
             </div>
             <div className="space-y-4">
                {fuelLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-start border-b border-slate-50 pb-3 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{log.vehicleId} filled {log.liters}L</p>
                      <p className="text-[10px] text-slate-400">{log.date} by {log.loggedBy}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600">${log.cost}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {/* Fuel Log Modal */}
      {modalOpen.addVehicle && selectedVehicle && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200 text-white">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Log Fuel Addition</h3>
                  <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">{selectedVehicle.plate} • {selectedVehicle.model}</p>
                </div>
              </div>
              <button
                onClick={() => closeModal('addVehicle')}
                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form className="p-6 space-y-5" onSubmit={(e) => { e.preventDefault(); closeModal('addVehicle'); }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Liters Added</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">L</span>
                  </div>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Total Cost</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="number" 
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      required
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Date & Time</label>
                  <input 
                    type="datetime-local" 
                    defaultValue={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => closeModal('addVehicle')}
                  className="flex-1 px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleFuelTracking;
