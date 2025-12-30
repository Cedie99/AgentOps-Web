'use client'

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { 
  ClipboardCheck, 
  ShoppingBag, 
  Truck, 
  Wallet, 
  Users, 
  Car, 
  ArrowUpRight, 
  Fuel 
} from 'lucide-react';

const data = [
  { name: 'Mon', fuel: 400, visits: 240 },
  { name: 'Tue', fuel: 300, visits: 139 },
  { name: 'Wed', fuel: 200, visits: 980 },
  { name: 'Thu', fuel: 278, visits: 390 },
  { name: 'Fri', fuel: 189, visits: 480 },
  { name: 'Sat', fuel: 239, visits: 380 },
  { name: 'Sun', fuel: 349, visits: 430 },
];

const KPICard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <span className="flex items-center text-emerald-600 text-sm font-medium">
          {trend} <ArrowUpRight className="w-4 h-4 ml-1" />
        </span>
      )}
    </div>
    <p className="text-slate-500 text-sm font-medium">{title}</p>
    <h3 className="text-2xl font-bold mt-1 text-slate-800">{value}</h3>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Operations Overview</h1>
          <p className="text-slate-500">Real-time status of your field agents and store workflow.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium">
            Generate Report
          </button>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard title="Surveyed Stores" value="1,284" icon={ClipboardCheck} color="bg-emerald-600" trend="+12%" />
        {/* Fix: removed invalid conditional expression and duplicate icon attribute on line 60 */}
        <KPICard title="Pending Sales" value="432" icon={ShoppingBag} color="bg-emerald-500" trend="+5%" />
        <KPICard title="Pending Deliveries" value="128" icon={Truck} color="bg-emerald-700" trend="+18%" />
        <KPICard title="Collections" value="89" icon={Wallet} color="bg-amber-600" trend="+2%" />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Fuel & Trip Trends</h3>
            <select className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorFuel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                />
                <Area type="monotone" dataKey="fuel" stroke="#10b981" fillOpacity={1} fill="url(#colorFuel)" strokeWidth={2} />
                <Area type="monotone" dataKey="visits" stroke="#059669" fillOpacity={0.1} fill="#059669" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Active Resources</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Active Agents</p>
                  <p className="text-xs text-slate-500">Currently on field</p>
                </div>
              </div>
              <span className="text-lg font-bold text-slate-800">42/50</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Vehicles in Motion</p>
                  <p className="text-xs text-slate-500">Real-time GPS</p>
                </div>
              </div>
              <span className="text-lg font-bold text-slate-800">38/45</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                  <Fuel className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Avg Fuel Efficiency</p>
                  <p className="text-xs text-slate-500">KM/Liter across fleet</p>
                </div>
              </div>
              <span className="text-lg font-bold text-slate-800">14.2</span>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Top Performers</h4>
                <button className="text-xs text-emerald-600 font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'John Doe', role: 'Surveyor', count: 12 },
                  { name: 'Jane Smith', role: 'Sales', count: 8 },
                  { name: 'Bob Wilson', role: 'Delivery', count: 15 }
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.role}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-700">{p.count} tasks</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;