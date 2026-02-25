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
  TrendingUp
} from 'lucide-react';

const data = [
  { name: 'Mon', surveys: 42, visits: 35, deliveries: 18 },
  { name: 'Tue', surveys: 38, visits: 41, deliveries: 22 },
  { name: 'Wed', surveys: 55, visits: 38, deliveries: 25 },
  { name: 'Thu', surveys: 48, visits: 45, deliveries: 19 },
  { name: 'Fri', surveys: 52, visits: 42, deliveries: 28 },
  { name: 'Sat', surveys: 35, visits: 30, deliveries: 15 },
  { name: 'Sun', surveys: 28, visits: 25, deliveries: 12 },
];

const KPICard = ({ title, value, icon: Icon, color, trend }: any) => (
  <div className="bg-card p-6 rounded-2xl border shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      {trend && (
        <span className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm font-medium">
          {trend} <ArrowUpRight className="w-4 h-4 ml-1" />
        </span>
      )}
    </div>
    <p className="text-muted-foreground text-sm font-medium">{title}</p>
    <h3 className="text-2xl font-bold mt-1 text-foreground">{value}</h3>
  </div>
);

const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operations Overview</h1>
          <p className="text-muted-foreground">Real-time status of your field agents and store workflow.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-600 dark:bg-emerald-700 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-800 transition-colors font-medium">
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
        <div className="lg:col-span-2 bg-card p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Activity Trends</h3>
            <select className="bg-muted border text-sm rounded-lg px-3 py-1 outline-none text-foreground">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSurveys" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                />
                <Area type="monotone" dataKey="surveys" stroke="#10b981" fillOpacity={1} fill="url(#colorSurveys)" strokeWidth={2} />
                <Area type="monotone" dataKey="visits" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={2} />
                <Area type="monotone" dataKey="deliveries" stroke="#f59e0b" fillOpacity={1} fill="url(#colorDeliveries)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card p-6 rounded-2xl border shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6">Active Resources</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Active Agents</p>
                  <p className="text-xs text-muted-foreground">Currently on field</p>
                </div>
              </div>
              <span className="text-lg font-bold text-foreground">42/50</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950 rounded-lg text-emerald-600 dark:text-emerald-400">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Vehicles in Motion</p>
                  <p className="text-xs text-muted-foreground">Real-time GPS</p>
                </div>
              </div>
              <span className="text-lg font-bold text-foreground">38/45</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 dark:bg-amber-950 rounded-lg text-amber-600 dark:text-amber-400">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Avg Response Time</p>
                  <p className="text-xs text-muted-foreground">Hours per task</p>
                </div>
              </div>
              <span className="text-lg font-bold text-foreground">2.4h</span>
            </div>

            <div className="mt-8 pt-8 border-t">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Top Performers</h4>
                <button className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {[
                  { name: 'John Doe', role: 'Surveyor', count: 12 },
                  { name: 'Jane Smith', role: 'Sales', count: 8 },
                  { name: 'Bob Wilson', role: 'Delivery', count: 15 }
                ].map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.role}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-foreground">{p.count} tasks</span>
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