'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Megaphone, Send, Bell, Loader2, Clock, Users, TrendingUp, AlertCircle, Info, AlertTriangle, X, Trash2 } from 'lucide-react'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  const handleDeleteClick = (id: number) => {
    setAnnouncementToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!announcementToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/announcements/${announcementToDelete}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Announcement deleted successfully!')
        await fetchAnnouncements()
        setIsDeleteDialogOpen(false)
        setAnnouncementToDelete(null)
      } else {
        const error = await response.json()
        toast.error(`Failed to delete announcement: ${error.error}`)
      }
    } catch (error) {
      console.error('Error deleting announcement:', error)
      toast.error('Failed to delete announcement')
    } finally {
      setDeleting(false)
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
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-50 dark:bg-red-950',
          badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700',
        }
      case 'HIGH':
        return {
          icon: AlertTriangle,
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-50 dark:bg-orange-950',
          badge: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700',
        }
      case 'MEDIUM':
        return {
          icon: Info,
          color: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950',
          badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700',
        }
      default:
        return {
          icon: Bell,
          color: 'text-slate-600 dark:text-slate-400',
          bg: 'bg-slate-50 dark:bg-slate-900',
          badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
        }
    }
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Broadcast Centre</h1>
          <p className="text-muted-foreground mt-1">Send region-wide or role-specific notifications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
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
                    <p className="text-sm text-muted-foreground">
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
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg border">
                    <div className="space-y-2">
                      <Label>Expiration Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !expirationDate && 'text-muted-foreground'
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
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                      <div className="col-span-2 flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-lg">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <p className="text-sm text-blue-700 dark:text-blue-400">
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
                <Button onClick={handleSend} disabled={sending} className="bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800">
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Broadcasts</CardTitle>
              <CardDescription>History of sent announcements</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="rounded-lg border">
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0 z-10 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Target
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Sent
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Expires
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {[...Array(5)].map((_, i) => (
                          <tr key={i}>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <Skeleton className="w-10 h-10 rounded-lg" />
                                <Skeleton className="w-16 h-5 rounded-md" />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-3 w-60" />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Skeleton className="w-20 h-6 rounded-full" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="space-y-1">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-3 w-24" />
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <Skeleton className="w-24 h-6 rounded-md" />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex justify-end">
                                <Skeleton className="w-8 h-8 rounded-md" />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : announcements.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Megaphone className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-foreground font-semibold mb-1">No announcements yet</p>
                  <p className="text-muted-foreground text-sm">Create your first broadcast above</p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <div className="max-h-[600px] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0 z-10 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Priority
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Subject
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Target
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Sent
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Expires
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {announcements.map(ann => {
                          const priorityConfig = getPriorityConfig(ann.priority)
                          const Icon = priorityConfig.icon
                          const isExpired = ann.expires_at && new Date(ann.expires_at) < new Date()

                          return (
                            <tr key={ann.id} className="hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <Icon className={cn('w-5 h-5', priorityConfig.color)} />
                                  <Badge className={cn('text-xs', priorityConfig.badge)}>
                                    {ann.priority}
                                  </Badge>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div>
                                  <p className="font-semibold text-foreground text-sm">{ann.title}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{ann.content}</p>
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
                                  <p className="text-sm text-foreground">{formatTimestamp(ann.timestamp)}</p>
                                  {ann.user && (
                                    <p className="text-xs text-muted-foreground mt-0.5">by {ann.user.name}</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {ann.expires_at ? (
                                  <div className={cn(
                                    'inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium',
                                    isExpired
                                      ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400'
                                      : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                                  )}>
                                    <Clock className="w-3 h-3" />
                                    {isExpired ? (
                                      <span>Expired</span>
                                    ) : (
                                      <span>{format(new Date(ann.expires_at), 'MMM d')}</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">No expiration</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(ann.id)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Channel Stats</CardTitle>
              <CardDescription>Current month performance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <>
                  <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-xl border border-indigo-200 dark:border-indigo-700">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Skeleton className="w-5 h-5 rounded" />
                      <Skeleton className="h-12 w-24" />
                    </div>
                    <Skeleton className="h-4 w-40 mx-auto" />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="w-full h-2 rounded-full" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="w-full h-2 rounded-full" />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 rounded-xl border border-indigo-200 dark:border-indigo-700">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <p className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{announcements.length}</p>
                    </div>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 font-medium">Total Announcements</p>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Delivery Rate</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">99.8%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 w-[99.8%] transition-all" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Engagement</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">72%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 w-[72%] transition-all" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">1</span>
                </div>
                <p className="text-sm text-muted-foreground">Use <span className="font-semibold">URGENT</span> priority sparingly for critical updates only</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">2</span>
                </div>
                <p className="text-sm text-muted-foreground">Set expiration dates for time-sensitive announcements</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">3</span>
                </div>
                <p className="text-sm text-muted-foreground">Target specific teams for more relevant messaging</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false)
                  setAnnouncementToDelete(null)
                }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default Announcements
