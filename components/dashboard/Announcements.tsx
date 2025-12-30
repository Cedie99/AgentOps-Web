'use client'

import React, { useState, useEffect } from 'react';
import { Megaphone, Send, Bell, Filter, MoreHorizontal, UserCheck, Loader2 } from 'lucide-react';

interface Announcement {
  id: number
  title: string
  content: string
  target: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  timestamp: string
  created_by: number
  user?: {
    name: string
    email: string
  }
}

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // Form state
  const [target, setTarget] = useState('All')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [expiresAt, setExpiresAt] = useState('')
  const [hasExpiration, setHasExpiration] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/announcements')
      if (response.ok) {
        const data = await response.json()
        setAnnouncements(data)
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please fill in both title and message')
      return
    }

    if (hasExpiration && !expiresAt) {
      alert('Please set an expiration date or disable expiration')
      return
    }

    setSending(true)
    try {
      const payload: any = {
        title,
        content,
        target,
        priority,
      }

      if (hasExpiration && expiresAt) {
        payload.expires_at = new Date(expiresAt).toISOString()
      }

      const response = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        // Clear form
        setTitle('')
        setContent('')
        setTarget('All')
        setPriority('MEDIUM')
        setExpiresAt('')
        setHasExpiration(false)

        // Refresh announcements list
        await fetchAnnouncements()

        alert('Announcement sent successfully!')
      } else {
        const error = await response.json()
        alert(`Failed to send announcement: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending announcement:', error)
      alert('Failed to send announcement')
    } finally {
      setSending(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

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
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Agents</option>
                  <option value="SURVEYOR">Surveyors Only</option>
                  <option value="SALES">Sales Fleet</option>
                  <option value="DELIVERY">Delivery Teams</option>
                  <option value="COLLECTOR">Collectors</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Priority Level</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subject</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Traffic Alert - Zone B"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Message Body</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
              <div className="border-t border-slate-100 pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasExpiration}
                    onChange={(e) => setHasExpiration(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Set expiration date/time</span>
                </label>
                {hasExpiration && (
                  <div className="mt-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Expires At</label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Announcement will be automatically removed after this time
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider px-2">Recent Broadcasts</h3>
            {loading ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading announcements...</p>
              </div>
            ) : announcements.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
                <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No announcements yet</p>
                <p className="text-slate-400 text-xs mt-1">Create your first broadcast above</p>
              </div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3">
                      <div className={`p-2 rounded-xl ${
                        ann.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                        ann.priority === 'MEDIUM' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800">{ann.title}</h4>
                        <p className="text-xs text-slate-400">
                          Target: <span className="text-slate-600 font-semibold">{ann.target}</span> • {formatTimestamp(ann.timestamp)}
                          {ann.user && <span className="ml-2">by {ann.user.name}</span>}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      ann.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                      ann.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">{ann.content}</p>
                </div>
              ))
            )}
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
