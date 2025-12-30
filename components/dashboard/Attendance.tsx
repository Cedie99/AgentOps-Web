
import React from 'react';
import { MOCK_AGENTS } from '@/lib/constants';
import { Clock, LogIn, LogOut, Coffee, MapPin } from 'lucide-react';

const Attendance: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Tracker</h1>
        <p className="text-slate-500">View field agent work hours, check-ins, and durations.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Agent</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Check In</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Check Out</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total Duration</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">First Visit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_AGENTS.map((agent) => (
              <tr key={agent.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold">
                      {agent.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-800">{agent.name}</div>
                      <div className="text-[10px] text-slate-500">{agent.role}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold">
                    <LogIn className="w-4 h-4" /> {agent.attendance.checkIn}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <LogOut className="w-4 h-4" /> {agent.attendance.checkOut || '--:--'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <Clock className="w-4 h-4 text-indigo-500" /> {agent.attendance.duration || 'Running...'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="w-3.5 h-3.5" /> ST00{Math.floor(Math.random() * 9) + 1}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
