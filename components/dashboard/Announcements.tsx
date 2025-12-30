
import React from 'react';
import { MOCK_ANNOUNCEMENTS } from '@/lib/constants';
import { Megaphone, Send, Bell, Filter, MoreHorizontal, UserCheck } from 'lucide-react';

const Announcements: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Broadcast Centre</h1>
          <p className="text-slate-500">Send region-wide or role-specific notifications.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-600" /> New Announcement
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Audience</label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option>All Agents</option>
                  <option>Surveyors Only</option>
                  <option>Sales Fleet</option>
                  <option>Delivery Teams</option>
                  <option>Collectors</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject</label>
                <input type="text" placeholder="e.g. Traffic Alert - Zone B" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Message Body</label>
                <textarea rows={4} placeholder="Type your message here..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button className="px-6 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Save Draft</button>
                <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                  <Send className="w-4 h-4" /> Send Now
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider px-2">Recent Broadcasts</h3>
            {MOCK_ANNOUNCEMENTS.map(ann => (
              <div key={ann.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3">
                    <div className={`p-2 rounded-xl ${ann.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{ann.title}</h4>
                      <p className="text-xs text-slate-400">Target: <span className="text-slate-600 font-semibold">{ann.target}</span> • {ann.timestamp}</p>
                    </div>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal className="w-5 h-5" /></button>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{ann.content}</p>
                <div className="flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-4">
                   <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> 84% Read</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Channel Stats</h4>
             <div className="space-y-6">
                <div className="text-center p-4 bg-slate-50 rounded-2xl">
                   <p className="text-3xl font-bold text-indigo-600">4,281</p>
                   <p className="text-xs text-slate-500 font-medium">Messages Sent (MTD)</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold">Delivery Rate</span>
                    <span className="text-emerald-600 font-bold">99.8%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[99.8%]"></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 font-bold">Engagement</span>
                    <span className="text-indigo-600 font-bold">72%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[72%]"></div>
                  </div>
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
