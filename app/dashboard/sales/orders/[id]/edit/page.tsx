'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Plus, Minus, Trash2, Save, MapPin } from 'lucide-react'

interface OrderItem {
  id: number
  product_name: string
  product_code: string | null
  quantity: number
  unit_price: number
  total_amount: number
  unit_of_measure: string | null
}

interface OrderData {
  id: number
  transaction_number: string
  store_name: string
  total_amount: number
  payment_terms: string
  delivery_date: string | null
  items: OrderItem[]
  survey: {
    id: number
    store_name: string
    owner_name: string | null
    contact_number: string
    contact_person: string | null
    address: string
    address_line1: string
    address_line2: string
    address_line3: string | null
    city: string
    province: string
    landmark: string | null
    gps_latitude: number
    gps_longitude: number
    customer_status: string
  } | null
}

export default function EditOrderPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const orderId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [order, setOrder] = useState<OrderData | null>(null)

  // Form state
  const [storeName, setStoreName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [addressLine3, setAddressLine3] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [landmark, setLandmark] = useState('')
  const [customerStatus, setCustomerStatus] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])

  useEffect(() => {
    fetchOrderData()
  }, [orderId])

  const fetchOrderData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()

      if (response.ok) {
        setOrder(data.order)
        // Populate form fields
        setStoreName(data.order.survey?.store_name || data.order.store_name)
        setOwnerName(data.order.survey?.owner_name || '')
        setContactNumber(data.order.survey?.contact_number || '')
        setContactPerson(data.order.survey?.contact_person || '')
        setAddressLine1(data.order.survey?.address_line1 || '')
        setAddressLine2(data.order.survey?.address_line2 || '')
        setAddressLine3(data.order.survey?.address_line3 || '')
        setCity(data.order.survey?.city || '')
        setProvince(data.order.survey?.province || '')
        setLandmark(data.order.survey?.landmark || '')
        setCustomerStatus(data.order.survey?.customer_status || 'PROSPECT')
        setPaymentTerms(data.order.payment_terms)
        setDeliveryDate(data.order.delivery_date ? data.order.delivery_date.split('T')[0] : '')
        setItems(data.order.items.map((item: OrderItem) => ({ ...item })))
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: data.error || 'Failed to load order',
        })
        router.push('/dashboard/sales')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load order',
      })
      router.push('/dashboard/sales')
    } finally {
      setLoading(false)
    }
  }

  const updateItemQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return
    setItems(items.map(item =>
      item.id === itemId
        ? {
            ...item,
            quantity: newQuantity,
            total_amount: newQuantity * parseFloat(item.unit_price.toString())
          }
        : item
    ))
  }

  const updateItemPrice = (itemId: number, newPrice: number) => {
    setItems(items.map(item =>
      item.id === itemId
        ? {
            ...item,
            unit_price: newPrice,
            total_amount: item.quantity * newPrice
          }
        : item
    ))
  }

  const removeItem = (itemId: number) => {
    if (items.length <= 1) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Order must have at least one item',
      })
      return
    }
    setItems(items.filter(item => item.id !== itemId))
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + parseFloat(item.total_amount.toString()), 0)
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Update order
      const orderResponse = await fetch('/api/orders/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: parseInt(orderId),
          items: items.map(item => ({
            product_name: item.product_name,
            product_code: item.product_code,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_amount: item.total_amount,
            unit_of_measure: item.unit_of_measure
          })),
          payment_terms: paymentTerms,
          delivery_date: deliveryDate || null,
          total_amount: calculateTotal()
        })
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        console.error('Order update error:', errorData)
        throw new Error(errorData.details || 'Failed to update order')
      }

      // Update survey if it exists
      if (order?.survey) {
        const surveyResponse = await fetch(`/api/surveys/${order.survey.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            store_name: storeName,
            owner_name: ownerName,
            contact_number: contactNumber,
            contact_person: contactPerson,
            address_line1: addressLine1,
            address_line2: addressLine2,
            address_line3: addressLine3,
            city: city,
            province: province,
            landmark: landmark,
            customer_status: customerStatus
          })
        })

        if (!surveyResponse.ok) {
          throw new Error('Failed to update survey details')
        }
      }

      toast({
        title: 'Success',
        description: 'Order updated successfully',
      })

      router.push('/dashboard/sales')
    } catch (error: any) {
      console.error('Save error:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save changes',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading order...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/sales')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sales
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Edit Order</h1>
              <p className="text-slate-600 mt-1">{order.transaction_number}</p>
            </div>
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Store & Address Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store Information */}
            <Card>
              <CardHeader>
                <CardTitle>Store Information</CardTitle>
                <CardDescription>Update store and contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="storeName">Store Name *</Label>
                    <Input
                      id="storeName"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ownerName">Owner Name</Label>
                    <Input
                      id="ownerName"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactNumber">Contact Number *</Label>
                    <Input
                      id="contactNumber"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="customerStatus">Customer Status</Label>
                  <Select value={customerStatus} onValueChange={setCustomerStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PROSPECT">Prospect</SelectItem>
                      <SelectItem value="NEW">New Customer</SelectItem>
                      <SelectItem value="EXISTING">Existing Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Address Details
                </CardTitle>
                <CardDescription>Update store location and address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    placeholder="Street address, building number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="addressLine2">Address Line 2 *</Label>
                  <Input
                    id="addressLine2"
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    placeholder="Barangay, district"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="addressLine3">Address Line 3</Label>
                  <Input
                    id="addressLine3"
                    value={addressLine3}
                    onChange={(e) => setAddressLine3(e.target.value)}
                    placeholder="Additional address details"
                    className="mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="province">Province *</Label>
                    <Input
                      id="province"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="landmark">Landmark</Label>
                  <Input
                    id="landmark"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Nearby landmarks or directions"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items ({items.length})</CardTitle>
                <CardDescription>Edit product quantities and prices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={item.id} className="bg-white border-2 border-slate-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="mb-4 pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-7 h-7 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {index + 1}
                          </span>
                          <h4 className="font-semibold text-slate-900 text-lg">{item.product_name}</h4>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-8">
                        <div className="pr-4">
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Quantity</label>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 w-10 p-0 rounded-md border-2 hover:bg-slate-50 flex-shrink-0"
                              onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-20 h-10 text-center text-base border-2 border-slate-300 rounded-md px-3 font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none flex-shrink-0"
                              min="1"
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 w-10 p-0 rounded-md border-2 hover:bg-slate-50 flex-shrink-0"
                              onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="px-4 border-x border-slate-200">
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Unit Price</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">₱</span>
                            <input
                              type="text"
                              value={Math.abs(parseFloat(item.unit_price.toString())).toFixed(2)}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9.]/g, '')
                                updateItemPrice(item.id, Math.abs(parseFloat(value)) || 0)
                              }}
                              className="w-full h-10 pl-9 pr-4 text-base border-2 border-slate-300 rounded-md font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="pl-4">
                          <label className="block text-xs font-semibold text-slate-600 mb-2">Total Amount</label>
                          <div className="h-10 flex items-center justify-between bg-green-50 border-2 border-green-200 rounded-md px-4">
                            <span className="font-bold text-green-700 text-lg">
                              ₱{Math.abs(parseFloat(item.total_amount.toString())).toFixed(2)}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-md -mr-1"
                              onClick={() => removeItem(item.id)}
                              disabled={items.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment & Summary */}
          <div className="space-y-6">
            {/* Payment Details */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="COD">COD</SelectItem>
                      <SelectItem value="7 Days">7 Days</SelectItem>
                      <SelectItem value="CREDIT_7">7 Days Credit</SelectItem>
                      <SelectItem value="15 Days">15 Days</SelectItem>
                      <SelectItem value="CREDIT_15">15 Days Credit</SelectItem>
                      <SelectItem value="30 Days">30 Days</SelectItem>
                      <SelectItem value="CREDIT_30">30 Days Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deliveryDate">Delivery Date</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Items</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Quantity</span>
                    <span className="font-medium">{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-lg">Total Amount</span>
                      <span className="font-bold text-2xl text-green-600">
                        ₱{calculateTotal().toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} size="lg" className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving Changes...' : 'Save All Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
