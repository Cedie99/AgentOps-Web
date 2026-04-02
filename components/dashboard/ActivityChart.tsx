'use client'

import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface Props {
  data: { name: string; surveys: number; orders: number; deliveries: number }[]
}

export default function ActivityChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorSurveys" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorDeliveries" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
        <Area type="monotone" dataKey="surveys" name="Surveys" stroke="#10b981" fillOpacity={1} fill="url(#colorSurveys)" strokeWidth={2} />
        <Area type="monotone" dataKey="orders" name="Orders" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrders)" strokeWidth={2} />
        <Area type="monotone" dataKey="deliveries" name="Deliveries" stroke="#f59e0b" fillOpacity={1} fill="url(#colorDeliveries)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}
