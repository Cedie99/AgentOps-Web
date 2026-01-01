'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  MapPin,
  User,
  Package,
  Clock,
  Gauge,
  Navigation,
  CheckCircle2,
  Camera,
  FileText,
  Truck,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface DeliveryDetail {
  id: number
  order_number: string
  transaction_id: number
  store_name: string
  delivery_address: string | null
  contact_number: string | null
  contact_person: string | null
  gps_latitude: number | null
  gps_longitude: number | null
  assigned_to: number | null
  delivery_date: string
  completed_at: string | null
  recipient_name: string | null
  total_items: number | null
  items_description: string
  status: string
  km_out: number | null
  km_in: number | null
  km_out_photo_url: string | null
  km_in_photo_url: string | null
  delivery_proof_photo_url: string | null
  recipient_signature_url: string | null
  started_at: string | null
  time_out: string | null
  time_in: string | null
  delivery_notes: string | null
  assignee?: {
    id: number
    name: string
  }
}

export default function DeliveryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchDeliveryDetail()
    }
  }, [id])

  const fetchDeliveryDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/deliveries/${id}`)
      const data = await response.json()
      setDelivery(data.delivery)
    } catch (error) {
      console.error('Error fetching delivery:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Loading delivery details...</p>
        </div>
      </div>
    )
  }

  if (!delivery) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-slate-500">Delivery not found</p>
        </div>
      </div>
    )
  }

  const completedDate = delivery.completed_at ? new Date(delivery.completed_at) : null
  const timeOut = delivery.time_out ? new Date(delivery.time_out) : null
  const timeIn = delivery.time_in ? new Date(delivery.time_in) : null
  const kmTraveled = delivery.km_in && delivery.km_out ? Number(delivery.km_in) - Number(delivery.km_out) : null
  const mapCenter = delivery.gps_latitude && delivery.gps_longitude
    ? { lat: Number(delivery.gps_latitude), lng: Number(delivery.gps_longitude) }
    : null

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{delivery.order_number}</h1>
            <p className="text-sm text-slate-500">{delivery.store_name}</p>
          </div>
        </div>
        <Badge className="bg-blue-500 text-white">
          {delivery.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Delivery Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mapCenter ? (
                <div className="relative w-full h-96 bg-slate-100 rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps?q=${mapCenter.lat},${mapCenter.lng}&z=15&output=embed`}
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="w-full h-96 bg-slate-100 rounded-lg flex items-center justify-center">
                  <p className="text-slate-400">No GPS coordinates available</p>
                </div>
              )}
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-semibold text-slate-700 mb-1">Delivery Address</p>
                <p className="text-sm text-slate-600">{delivery.delivery_address || 'N/A'}</p>
                {delivery.contact_person && (
                  <p className="text-xs text-slate-500 mt-2">Contact: {delivery.contact_person} - {delivery.contact_number}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delivery Details Sidebar */}
        <div className="space-y-6">
          {/* Recipient Info */}
          {delivery.recipient_name && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  <User className="w-4 h-4" />
                  Received By
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-extrabold text-2xl text-emerald-700 tracking-tight">{delivery.recipient_name}</p>
                {completedDate && (
                  <p className="text-sm text-slate-500 mt-2">
                    {completedDate.toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Items Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide">
                <Package className="w-4 h-4" />
                Items Delivered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">{delivery.total_items || 0}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{delivery.items_description}</p>
            </CardContent>
          </Card>

          {/* Driver Info */}
          {delivery.assignee && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  <Truck className="w-4 h-4" />
                  Driver
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-extrabold text-2xl text-slate-900 tracking-tight">{delivery.assignee.name}</p>
              </CardContent>
            </Card>
          )}

          {/* Time Tracking */}
          {(timeOut || timeIn) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  <Clock className="w-4 h-4" />
                  Time Tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {timeOut && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Time Out</p>
                    <p className="text-lg font-extrabold text-slate-900 tracking-tight">{timeOut.toLocaleString()}</p>
                  </div>
                )}
                {timeIn && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Time In</p>
                    <p className="text-lg font-extrabold text-slate-900 tracking-tight">{timeIn.toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Odometer Readings */}
          {(delivery.km_out || delivery.km_in) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  <Gauge className="w-4 h-4" />
                  Odometer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {delivery.km_out && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">ODO Out</p>
                    <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{Number(delivery.km_out).toFixed(0)} <span className="text-base font-bold text-slate-500">km</span></p>
                  </div>
                )}
                {delivery.km_in && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">ODO In</p>
                    <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{Number(delivery.km_in).toFixed(0)} <span className="text-base font-bold text-slate-500">km</span></p>
                  </div>
                )}
                {kmTraveled && kmTraveled > 0 && (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Distance Traveled</p>
                    <p className="text-3xl font-extrabold text-blue-700 tracking-tight">{kmTraveled.toFixed(1)} <span className="text-lg font-bold text-blue-500">km</span></p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Delivery Notes */}
          {delivery.delivery_notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="w-4 h-4" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-700">{delivery.delivery_notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Proof Documents */}
      {(delivery.delivery_proof_photo_url || delivery.recipient_signature_url || delivery.km_out_photo_url || delivery.km_in_photo_url) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Proof of Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {delivery.delivery_proof_photo_url && (
                <div className="space-y-2">
                  <img
                    src={delivery.delivery_proof_photo_url}
                    alt="Delivery Proof"
                    className="w-full h-48 object-cover rounded-lg border border-slate-200"
                  />
                  <p className="text-xs font-semibold text-center text-slate-600">Delivery Photo</p>
                </div>
              )}
              {delivery.recipient_signature_url && (
                <div className="space-y-2">
                  <img
                    src={delivery.recipient_signature_url}
                    alt="Signature"
                    className="w-full h-48 object-cover rounded-lg border border-slate-200 bg-white"
                  />
                  <p className="text-xs font-semibold text-center text-slate-600">Signature</p>
                </div>
              )}
              {delivery.km_out_photo_url && (
                <div className="space-y-2">
                  <img
                    src={delivery.km_out_photo_url}
                    alt="ODO Out"
                    className="w-full h-48 object-cover rounded-lg border border-slate-200"
                  />
                  <p className="text-xs font-semibold text-center text-slate-600">ODO Out</p>
                </div>
              )}
              {delivery.km_in_photo_url && (
                <div className="space-y-2">
                  <img
                    src={delivery.km_in_photo_url}
                    alt="ODO In"
                    className="w-full h-48 object-cover rounded-lg border border-slate-200"
                  />
                  <p className="text-xs font-semibold text-center text-slate-600">ODO In</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
