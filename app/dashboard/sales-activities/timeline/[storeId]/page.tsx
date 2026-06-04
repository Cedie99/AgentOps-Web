'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Activity,
  Calendar,
  User,
  MapPin,
  FileText,
  Phone,
  ZoomIn,
  Download,
  Filter,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatPHRelativeDate } from '@/lib/utils'

interface Store {
  id: number
  store_name: string
  address: string
  contact_number: string | null
  gps_latitude: number | null
  gps_longitude: number | null
}

interface SalesAgent {
  id: number
  name: string
  email: string
}

interface ActivityRecord {
  id: number
  activity_type: string
  activity_date: string
  proof_image_url: string
  notes: string | null
  gps_latitude: number | null
  gps_longitude: number | null
  client_name: string | null
  client_contact: string | null
  sales_agent: SalesAgent
}

const ACTIVITY_LABELS: Record<string, string> = {
  COLD_CALL: 'Cold Call',
  COLD_EMAIL: 'Cold Email',
  QUOTATION_PREP: 'Quotation Preparation',
  CLIENT_FOLLOWUP: 'Client Follow-up',
  REVIVE_DORMANT: 'Revive Dormant Client',
  SOCIAL_PROSPECTING: 'Social Media Prospecting',
  EMAIL_INQUIRY_REPLY: 'Email Inquiry Reply',
  CALL_INQUIRY_REPLY: 'Call Inquiry Reply',
  WEEKLY_TODO_PREP: 'Weekly To-Do Preparation',
  VEHICLE_RESERVATION: 'Vehicle Reservation',
  SAMPLE_REQUEST: 'Sample Request',
  MARKETING_MATERIAL_REQUEST: 'Marketing Material Request',
  DESIGN_REQUEST: 'Design Request',
  INTERNAL_PO: 'Internal PO',
  SALES_MEETING: 'Sales Meeting',
  WALKIN_CLIENT: 'Walk-in Client',
  CLIENT_ISSUE: 'Client Issue',
  DELIVERY_FOLLOWUP: 'Delivery Follow-up',
  SAMPLE_FOLLOWUP: 'Sample Follow-up',
  PRICING_REQUEST: 'Pricing Request',
  STORE_VISIT: 'Store Visit',
  OTHER: 'Other',
}

export default function StoreActivityTimelinePage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [store, setStore] = useState<Store | null>(null)
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all')

  useEffect(() => {
    fetchStoreActivities()
  }, [resolvedParams.storeId])

  useEffect(() => {
    filterActivities()
  }, [activities, activityTypeFilter])

  const fetchStoreActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/sales-activities/${resolvedParams.storeId}`)

      if (response.ok) {
        const data = await response.json()
        setStore(data.store)
        setActivities(data.activities || [])
      } else {
        console.error('Failed to fetch store activities')
      }
    } catch (error) {
      console.error('Error fetching store activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterActivities = () => {
    if (activityTypeFilter === 'all') {
      setFilteredActivities(activities)
    } else {
      setFilteredActivities(activities.filter(a => a.activity_type === activityTypeFilter))
    }
  }

  const formatDate = (dateString: string) => formatPHRelativeDate(dateString, true)

  const uniqueActivityTypes = Array.from(new Set(activities.map(a => a.activity_type)))

  if (loading) {
    return (
      <div className="h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading activities...</p>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-700">Store not found</p>
          <Button className="mt-4" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{store.store_name}</h1>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <MapPin className="w-4 h-4" />
                {store.address}
              </div>
              {store.contact_number && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Phone className="w-4 h-4" />
                  {store.contact_number}
                </div>
              )}
            </div>
          </div>
        </div>

        <Card className="p-4 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800">
          <div className="text-center">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Total Activities</p>
            <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{activities.length}</p>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-slate-500" />
          <div className="flex-1">
            <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by activity type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity Types ({activities.length})</SelectItem>
                {uniqueActivityTypes.map(type => {
                  const count = activities.filter(a => a.activity_type === type).length
                  return (
                    <SelectItem key={type} value={type}>
                      {ACTIVITY_LABELS[type] || type} ({count})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="secondary">
            Showing {filteredActivities.length} of {activities.length}
          </Badge>
        </div>
      </Card>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">No activities found</p>
            <p className="text-sm text-slate-500 mt-1">
              {activityTypeFilter === 'all'
                ? 'No activities have been recorded for this store yet'
                : 'Try selecting a different activity type'}
            </p>
          </Card>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 dark:bg-slate-700"></div>

            {/* Activity cards */}
            <div className="space-y-6">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id} className="relative pl-20">
                  {/* Timeline dot */}
                  <div className="absolute left-6 top-6 w-5 h-5 rounded-full bg-emerald-600 border-4 border-white dark:border-slate-900 shadow-lg"></div>

                  <Card className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className="bg-emerald-600 hover:bg-emerald-700">
                            {ACTIVITY_LABELS[activity.activity_type] || activity.activity_type}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-slate-500">
                            <Calendar className="w-4 h-4" />
                            {formatDate(activity.activity_date)}
                          </div>
                        </div>

                        {/* Agent info */}
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                            <User className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.sales_agent.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{activity.sales_agent.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Proof image */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Proof Image
                      </p>
                      <div className="relative group">
                        <img
                          src={activity.proof_image_url}
                          alt="Activity proof"
                          className="w-full h-64 object-cover rounded-lg border-2 border-slate-200 dark:border-slate-700"
                        />
                        <button
                          onClick={() => setSelectedImage(activity.proof_image_url)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                        >
                          <ZoomIn className="w-8 h-8 text-white" />
                        </button>
                      </div>
                    </div>

                    {/* Client info */}
                    {activity.client_name && (
                      <Card className="p-3 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-4">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Client Information</p>
                        <div className="space-y-1">
                          <p className="text-sm text-slate-900 dark:text-slate-100">
                            <span className="font-medium">Name:</span> {activity.client_name}
                          </p>
                          {activity.client_contact && (
                            <p className="text-sm text-slate-900 dark:text-slate-100">
                              <span className="font-medium">Contact:</span> {activity.client_contact}
                            </p>
                          )}
                        </div>
                      </Card>
                    )}

                    {/* Notes */}
                    {activity.notes && (
                      <div>
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Notes</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                          {activity.notes}
                        </p>
                      </div>
                    )}

                    {/* GPS location */}
                    {activity.gps_latitude && activity.gps_longitude && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        <span>
                          {activity.gps_latitude.toFixed(6)}, {activity.gps_longitude.toFixed(6)}
                        </span>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors"
            onClick={() => setSelectedImage(null)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={selectedImage}
            alt="Activity proof full size"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <a
            href={selectedImage}
            download
            className="absolute bottom-4 right-4 bg-white text-slate-900 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-slate-100 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
            Download
          </a>
        </div>
      )}
    </div>
  )
}
