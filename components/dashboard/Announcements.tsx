'use client'

import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Calendar as CalendarIcon,
  Megaphone,
  Send,
  Bell,
  Loader2,
  Clock,
  Users,
  AlertCircle,
  Info,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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

const PRIORITY_CONFIG = {
  URGENT: {
    icon: AlertCircle,
    border: 'border-l-red-500',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    pill: 'bg-red-500 text-white',
    pillIdle: 'border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400',
  },
  HIGH: {
    icon: AlertTriangle,
    border: 'border-l-orange-500',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    pill: 'bg-orange-500 text-white',
    pillIdle: 'border border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400',
  },
  MEDIUM: {
    icon: Info,
    border: 'border-l-blue-500',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    pill: 'bg-blue-500 text-white',
    pillIdle: 'border border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400',
  },
  LOW: {
    icon: Bell,
    border: 'border-l-slate-300',
    badge: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    pill: 'bg-slate-500 text-white',
    pillIdle: 'border border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400',
  },
}

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

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
      const payload: any = { title, content, target, priority, requires_acknowledgment: false }

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
        setTitle('')
        setContent('')
        setTarget('All')
        setPriority('MEDIUM')
        setExpirationDate(undefined)
        setExpirationTime('12:00')
        setHasExpiration(false)
        await fetchAnnouncements()
        toast.success('Announcement sent!')
      } else {
        const error = await response.json()
        toast.error(`Failed: ${error.error}`)
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
      const response = await fetch(`/api/announcements/${announcementToDelete}`, { method: 'DELETE' })
      if (response.ok) {
        toast.success('Announcement deleted')
        await fetchAnnouncements()
        setIsDeleteDialogOpen(false)
        setAnnouncementToDelete(null)
      } else {
        const error = await response.json()
        toast.error(`Failed: ${error.error}`)
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
    const diff = Date.now() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return format(date, 'MMM d, yyyy')
  }

  const clearForm = () => {
    setTitle('')
    setContent('')
    setTarget('All')
    setPriority('MEDIUM')
    setExpirationDate(undefined)
    setExpirationTime('12:00')
    setHasExpiration(false)
  }

  return (
    <div className="space-y-6 pb-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Send notifications to your field teams</p>
        </div>
        {!loading && (
          <Badge variant="secondary" className="text-xs px-3 py-1">
            {announcements.length} active
          </Badge>
        )}
      </div>

      {/* Compose Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-muted-foreground" />
            New Announcement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Priority pills + Target row */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5 flex-1 min-w-[160px]">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Priority</Label>
              <div className="flex gap-2">
                {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => {
                  const cfg = PRIORITY_CONFIG[p]
                  const active = priority === p
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold transition-all',
                        active ? cfg.pill : cfg.pillIdle
                      )}
                    >
                      {p}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-1.5 w-44">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">Audience</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Agents</SelectItem>
                  <SelectItem value="SURVEYOR">Surveyors</SelectItem>
                  <SelectItem value="SALES">Sales</SelectItem>
                  <SelectItem value="DELIVERY">Delivery</SelectItem>
                  <SelectItem value="COLLECTOR">Collectors</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs text-muted-foreground uppercase tracking-wide">Subject</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Traffic Alert — Zone B"
            />
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <Label htmlFor="content" className="text-xs text-muted-foreground uppercase tracking-wide">Message</Label>
            <Textarea
              id="content"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              className="resize-none"
            />
          </div>

          {/* Expiration toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="expiration" className="text-sm cursor-pointer select-none">
                Set expiration
              </Label>
              <Switch id="expiration" checked={hasExpiration} onCheckedChange={setHasExpiration} />
            </div>

            {hasExpiration && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-muted/50 rounded-lg border">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn('w-full justify-start font-normal', !expirationDate && 'text-muted-foreground')}
                      >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {expirationDate ? format(expirationDate, 'MMM d, yyyy') : 'Pick a date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={expirationDate}
                        onSelect={setExpirationDate}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="time"
                      value={expirationTime}
                      onChange={(e) => setExpirationTime(e.target.value)}
                      className="pl-9 h-9 text-sm"
                    />
                  </div>
                </div>

                {expirationDate && (
                  <p className="col-span-2 text-xs text-muted-foreground">
                    Expires <span className="font-medium text-foreground">{format(expirationDate, 'MMM d, yyyy')}</span> at <span className="font-medium text-foreground">{expirationTime}</span>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={clearForm}>Clear</Button>
            <Button size="sm" onClick={handleSend} disabled={sending}>
              {sending ? (
                <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Sending...</>
              ) : (
                <><Send className="w-3.5 h-3.5 mr-2" />Send</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Announcements list */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recent</h2>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 rounded-lg border bg-card">
                <Skeleton className="w-1 h-auto rounded-full self-stretch" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center rounded-lg border border-dashed bg-muted/30">
            <Megaphone className="w-8 h-8 text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No announcements yet</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Create your first broadcast above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {announcements.map((ann) => {
              const cfg = PRIORITY_CONFIG[ann.priority]
              const Icon = cfg.icon
              const isExpired = ann.expires_at && new Date(ann.expires_at) < new Date()

              return (
                <div
                  key={ann.id}
                  className={cn(
                    'flex gap-0 rounded-lg border bg-card overflow-hidden transition-colors hover:bg-muted/30',
                    'border-l-4',
                    cfg.border
                  )}
                >
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', cfg.badge)}>
                            <Icon className="w-3 h-3" />
                            {ann.priority}
                          </span>
                          <Badge variant="outline" className="text-xs gap-1">
                            <Users className="w-3 h-3" />
                            {ann.target}
                          </Badge>
                          {ann.expires_at && (
                            <span className={cn(
                              'inline-flex items-center gap-1 text-xs',
                              isExpired ? 'text-red-500' : 'text-amber-600 dark:text-amber-400'
                            )}>
                              <Clock className="w-3 h-3" />
                              {isExpired ? 'Expired' : format(new Date(ann.expires_at), 'MMM d')}
                            </span>
                          )}
                        </div>
                        <p className="font-semibold text-sm text-foreground">{ann.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{ann.content}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{formatTimestamp(ann.timestamp)}</p>
                          {ann.user && (
                            <p className="text-xs text-muted-foreground/60">by {ann.user.name}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          onClick={() => handleDeleteClick(ann.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this announcement? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setIsDeleteDialogOpen(false); setAnnouncementToDelete(null) }}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={deleting}>
                {deleting ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Deleting...</>
                ) : (
                  <><Trash2 className="w-3.5 h-3.5 mr-2" />Delete</>
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
