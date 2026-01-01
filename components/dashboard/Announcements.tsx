'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Megaphone, Send, Bell, Loader2, Clock, Users, TrendingUp, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Announcement {
  id: number
  title: string
  content: string
  target: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  requires_acknowledgment: boolean
  timestamp: string
  created_by: number
  expires_at?: string | null
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
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [hasExpiration, setHasExpiration] = useState(false)
  const [expirationDate, setExpirationDate] = useState<Date>()
  const [expirationTime, setExpirationTime] = useState('12:00')

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
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in both title and message')
      return
    }

    if (hasExpiration && !expirationDate) {
      toast.error('Please set an expiration date or disable expiration')
      return
    }

    setSending(true)
    try {
      const payload: any = {
        title,
        content,
        target,
        priority,
        requires_acknowledgment: false,
      }

      if (hasExpiration && expirationDate) {
        const [hours, minutes] = expirationTime.split(':')
        const expiresAt = new Date(expirationDate)
        expiresAt.setHours(parseInt(hours), parseInt(minutes), 0, 0)
        payload.expires_at = expiresAt.toISOString()
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
        setExpirationDate(undefined)
        setExpirationTime('12:00')
        setHasExpiration(false)

        // Refresh announcements list
        await fetchAnnouncements()

        toast.success('Announcement sent successfully!')
      } else {
        const error = await response.json()
        toast.error(`Failed to send announcement: ${error.error}`)
      }
    } catch (error) {
      console.error('Error sending announcement:', error)
      toast.error('Failed to send announcement')
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
    return format(date, 'MMM d, yyyy')
  }

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bg: 'bg-red-50',
          badge: 'bg-red-100 text-red-700 border-red-200',
        }
      case 'HIGH':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600',
          bg: 'bg-orange-50',
          badge: 'bg-orange-100 text-orange-700 border-orange-200',
        }
      case 'MEDIUM':
        return {
          icon: Info,
          color: 'text-blue-600',
          bg: 'bg-blue-50',
          badge: 'bg-blue-100 text-blue-700 border-blue-200',
        }
      default:
        return {
          icon: Bell,
          color: 'text-slate-600',
          bg: 'bg-slate-50',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
        }
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Broadcast Centre</h1>
          <p className="text-slate-500 mt-1">Send region-wide or role-specific notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                New Announcement
              </CardTitle>
              <CardDescription>
                Compose and send announcements to your team
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target">Target Audience</Label>
                  <Select value={target} onValueChange={setTarget}>
                    <SelectTrigger id="target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Agents</SelectItem>
                      <SelectItem value="SURVEYOR">Surveyors Only</SelectItem>
                      <SelectItem value="SALES">Sales Fleet</SelectItem>
                      <SelectItem value="DELIVERY">Delivery Teams</SelectItem>
                      <SelectItem value="COLLECTOR">Collectors</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select value={priority} onValueChange={(val) => setPriority(val as any)}>
                    <SelectTrigger id="priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-slate-400" />
                          Low Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="MEDIUM">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          Medium Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="HIGH">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          High Priority
                        </div>
                      </SelectItem>
                      <SelectItem value="URGENT">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          Urgent
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Subject</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Traffic Alert - Zone B"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message Body</Label>
                <Textarea
                  id="content"
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type your message here..."
                  className="resize-none"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="expiration" className="text-base">Set Expiration</Label>
                    <p className="text-sm text-slate-500">
                      Automatically remove this announcement after a specific date/time
                    </p>
                  </div>
                  <Switch
                    id="expiration"
                    checked={hasExpiration}
                    onCheckedChange={setHasExpiration}
                  />
                </div>

                {hasExpiration && (
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="space-y-2">
                      <Label>Expiration Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !expirationDate && 'text-slate-500'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expirationDate ? format(expirationDate, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={expirationDate}
                            onSelect={setExpirationDate}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="time">Expiration Time</Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                          id="time"
                          type="time"
                          value={expirationTime}
                          onChange={(e) => setExpirationTime(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    {expirationDate && (
                      <div className="col-span-2 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <p className="text-sm text-blue-700">
                          This announcement will expire on{' '}
                          <span className="font-semibold">
                            {format(expirationDate, 'MMMM d, yyyy')} at {expirationTime}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTitle('')
                    setContent('')
                    setTarget('All')
                    setPriority('MEDIUM')
                    setExpirationDate(undefined)
                    setExpirationTime('12:00')
                    setHasExpiration(false)
                  }}
                >
                  Clear
                </Button>
                <Button onClick={handleSend} disabled={sending} className="bg-indigo-600 hover:bg-indigo-700">
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Recent Broadcasts</CardTitle>
              <CardDescription>History of sent announcements</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="p-12 text-center">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Loading announcements...</p>
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Megaphone className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-900 font-semibold mb-1">No announcements yet</p>
                  <p className="text-slate-500 text-sm">Create your first broadcast above</p>
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200">
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Target
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Sent
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider">
                            Expires
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {announcements.map(ann => {
                          const priorityConfig = getPriorityConfig(ann.priority)
                          const Icon = priorityConfig.icon
                          const isExpired = ann.expires_at && new Date(ann.expires_at) < new Date()

                          return (
                            <tr key={ann.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className={cn('p-2 rounded-lg', priorityConfig.bg)}>
                                    <Icon className={cn('w-4 h-4', priorityConfig.color)} />
                                  </div>
                                  <Badge className={cn('text-xs', priorityConfig.badge)}>
                                    {ann.priority}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-semibold text-slate-900 text-sm">{ann.title}</p>
                                  <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{ann.content}</p>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <Badge variant="outline" className="text-xs">
                                  <Users className="w-3 h-3 mr-1" />
                                  {ann.target}
                                </Badge>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="text-sm text-slate-700">{formatTimestamp(ann.timestamp)}</p>
                                  {ann.user && (
                                    <p className="text-xs text-slate-500 mt-0.5">by {ann.user.name}</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {ann.expires_at ? (
                                  <div className={cn(
                                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
                                    isExpired
                                      ? 'bg-red-50 text-red-700'
                                      : 'bg-amber-50 text-amber-700'
                                  )}>
                                    <Clock className="w-3 h-3" />
                                    {isExpired ? (
                                      <span>Expired</span>
                                    ) : (
                                      <span>{format(new Date(ann.expires_at), 'MMM d')}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-slate-400">No expiration</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Channel Stats</CardTitle>
              <CardDescription>Current month performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl border border-indigo-200">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  <p className="text-4xl font-bold text-indigo-600">{announcements.length}</p>
                </div>
                <p className="text-sm text-indigo-700 font-medium">Total Announcements</p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">Delivery Rate</span>
                    <span className="text-emerald-600 font-bold">99.8%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 w-[99.8%] transition-all" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 font-medium">Engagement</span>
                    <span className="text-blue-600 font-bold">72%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 w-[72%] transition-all" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            <CardHeader>
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600">1</span>
                </div>
                <p className="text-sm text-slate-600">Use <span className="font-semibold">URGENT</span> priority sparingly for critical updates only</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600">2</span>
                </div>
                <p className="text-sm text-slate-600">Set expiration dates for time-sensitive announcements</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600">3</span>
                </div>
                <p className="text-sm text-slate-600">Target specific teams for more relevant messaging</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Announcements
