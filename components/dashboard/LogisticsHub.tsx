'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  PackageCheck,
  Wallet,
  Truck,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  X,
  UserPlus,
  AlertCircle,
  MoreVertical,
  Activity,
  DollarSign,
  Briefcase,
  ExternalLink,
  Navigation,
  Camera,
  AlertTriangle,
  Calendar,
  Gauge,
  Fuel,
  User,
  FileText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Order {
  id: number;
  transaction_number: string;
  store_name: string;
  total_amount: number;
  payment_terms: string;
  status: string;
  requires_delivery: boolean;
  delivery_date: string | null;
  created_at: string;
  sales_agent: {
    id: number;
    name: string;
    email: string;
  };
  items: Array<{
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }>;
}

interface DeliveryAgent {
  id: number;
  name: string;
  email: string;
  role: string;
  agent_status: string | null;
  vehicle_id: number | null;
  active_tasks_count: number;
  current_lat: number | null;
  current_lng: number | null;
}

interface DeliveryOrder {
  id: number;
  order_number: string;
  transaction_id: number;
  store_name: string;
  delivery_address: string | null;
  contact_number: string | null;
  contact_person: string | null;
  assigned_to: number | null;
  delivery_date: string;
  completed_at: string | null;
  recipient_name: string | null;
  total_items: number | null;
  items_description: string;
  status: string;
  km_out: number | null;
  km_in: number | null;
  km_out_photo_url: string | null;
  km_in_photo_url: string | null;
  delivery_proof_photo_url: string | null;
  recipient_signature_url: string | null;
  started_at: string | null;
  time_out: string | null;
  time_in: string | null;
  delivery_notes: string | null;
  assignee?: {
    id: number;
    name: string;
  };
}

const LogisticsHub: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'delivery' | 'collection' | 'completed'>('delivery');
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveredOrders, setDeliveredOrders] = useState<DeliveryOrder[]>([]);
  const [agents, setAgents] = useState<DeliveryAgent[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [dispatchSuccess, setDispatchSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryDate, setDeliveryDate] = useState<string>('');
  const [agentSearchQuery, setAgentSearchQuery] = useState('');

  // Fetch approved orders and agents on mount
  useEffect(() => {
    fetchOrders();
    fetchDeliveredOrders();
    fetchAgents();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/orders?status=APPROVED');
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/users?role=DELIVERY');
      const data = await response.json();
      setAgents(data.users || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchDeliveredOrders = async () => {
    try {
      const response = await fetch('/api/deliveries?status=DELIVERED');
      const data = await response.json();
      setDeliveredOrders(data.deliveries || []);
    } catch (error) {
      console.error('Error fetching delivered orders:', error);
    }
  };

  const handleDispatchStart = (order: Order) => {
    setSelectedOrder(order);
    setAgentSearchQuery('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDeliveryDate(tomorrow.toISOString().split('T')[0]);
    setIsAssignModalOpen(true);
  };

  const confirmDispatch = async (agentId: number) => {
    if (!selectedOrder) return;
    if (!deliveryDate) {
      alert('Please select a delivery date');
      return;
    }

    try {
      const response = await fetch('/api/orders/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          assignType: 'DELIVERY',
          assigneeId: agentId,
          deliveryDate: deliveryDate,
        }),
      });

      if (response.ok) {
        setIsAssignModalOpen(false);
        setDispatchSuccess(true);
        setTimeout(() => setDispatchSuccess(false), 3000);
        fetchOrders(); // Refresh the list
      } else {
        const data = await response.json();
        alert(`Failed to assign order: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error assigning order:', error);
      alert('Failed to assign order');
    }
  };

  // Filter available agents
  const availableAgents = agents.filter(a => a.agent_status !== 'OFF_DUTY');

  // Filter agents by search query
  const filteredAgents = availableAgents.filter(agent =>
    agent.name.toLowerCase().includes(agentSearchQuery.toLowerCase())
  );

  // Determine what to show based on active tab
  const showOrders = activeTab === 'delivery';
  const showCompleted = activeTab === 'completed';
  const queue = activeTab === 'delivery' ? orders : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dispatch Command</h1>
          <p className="text-slate-500 text-sm">Assign delivery and collection tasks to optimize field logistics.</p>
        </div>
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={() => setActiveTab('delivery')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${activeTab === 'delivery' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Truck className="w-4 h-4" /> Delivery Queue ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('collection')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${activeTab === 'collection' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Wallet className="w-4 h-4" /> Collections (0)
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider flex items-center gap-2 ${activeTab === 'completed' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <CheckCircle2 className="w-4 h-4" /> Completed ({deliveredOrders.length})
          </button>
        </div>
      </div>

      {dispatchSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-4 duration-500">
           <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <CheckCircle2 className="w-5 h-5" />
           </div>
           <div>
              <p className="text-sm font-bold text-emerald-800">Task Successfully Dispatched</p>
              <p className="text-xs text-emerald-600">Personnel has been notified via their mobile application.</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Task Queue Board */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {activeTab === 'completed' ? 'Completed Deliveries' : 'Pending Assignments'}
            </h3>
            {activeTab === 'delivery' && (
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span className="text-[10px] font-bold text-slate-400">HIGH PRIORITY</span>
                 </div>
                 <span className="text-[10px] text-slate-300">|</span>
                 <button className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                   AREA GROUPING <Navigation className="w-3 h-3" />
                 </button>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 py-32 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-slate-300 animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Loading Deliveries...</h3>
            </div>
          ) : queue.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {queue.map(order => {
                const createdDate = new Date(order.created_at);
                const hoursSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60));
                const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                const itemsDescription = order.items.map(item => `${item.product_name} (${item.quantity})`).join(', ');

                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-emerald-500 transition-all group shadow-sm hover:shadow-md">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${activeTab === 'delivery' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                          {activeTab === 'delivery' ? <PackageCheck className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900">{order.store_name}</h4>
                          <p className="text-xs text-slate-500">{order.transaction_number}</p>
                        </div>
                      </div>
                      {hoursSinceCreated > 24 && (
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 mb-0.5">Amount</p>
                        <p className="text-sm font-bold text-slate-900">₱{Number(order.total_amount).toLocaleString()}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 mb-0.5">Items</p>
                        <p className="text-sm font-bold text-slate-900">{totalItems}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-500 mb-0.5">Pending</p>
                        <p className="text-sm font-bold text-slate-900">{hoursSinceCreated}h</p>
                      </div>
                    </div>

                    {/* Payment Badge */}
                    <div className="mb-4">
                      <Badge variant="outline" className="text-xs">{order.payment_terms}</Badge>
                    </div>

                    {/* Assign Button */}
                    <button
                      onClick={() => handleDispatchStart(order)}
                      className={`w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
                        activeTab === 'delivery'
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-amber-600 text-white hover:bg-amber-700'
                      }`}
                    >
                      Assign Agent
                    </button>
                  </div>
                );
              })}
            </div>
          ) : showCompleted && deliveredOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {deliveredOrders.map(delivery => {
                const completedDate = delivery.completed_at ? new Date(delivery.completed_at) : null;
                const timeOut = delivery.time_out ? new Date(delivery.time_out) : null;
                const timeIn = delivery.time_in ? new Date(delivery.time_in) : null;

                // Calculate trip distance (handle case where ODO might reset or have errors)
                let kmTraveled = null;
                if (delivery.km_in && delivery.km_out) {
                  const kmInVal = Number(delivery.km_in);
                  const kmOutVal = Number(delivery.km_out);
                  const diff = Math.abs(kmInVal - kmOutVal);
                  // Only show if the difference is reasonable (less than 500km for a delivery)
                  if (diff > 0 && diff < 500) {
                    kmTraveled = diff;
                  }
                }

                return (
                  <div
                    key={delivery.id}
                    onClick={() => router.push(`/dashboard/logistics/delivery/${delivery.id}`)}
                    className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-500 transition-all group shadow-sm hover:shadow-md cursor-pointer"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Delivery #</p>
                         <p className="text-xs font-black text-slate-800">{delivery.order_number}</p>
                      </div>
                    </div>

                    {/* Store Info */}
                    <div className="mb-4">
                      <h4 className="text-lg font-bold text-slate-900">{delivery.store_name}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" /> {delivery.delivery_address || 'N/A'}
                      </p>
                    </div>

                    {/* Summary Info */}
                    <div className={`grid gap-2 mb-4 ${kmTraveled ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      {kmTraveled && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-[9px] font-bold text-blue-600 uppercase mb-1">Trip</p>
                          <p className="text-lg font-black text-blue-800">{kmTraveled.toFixed(1)} <span className="text-xs">km</span></p>
                        </div>
                      )}
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Items</p>
                        <p className="text-lg font-black text-slate-800">{delivery.total_items || 0}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-[9px] font-bold text-slate-500 uppercase mb-1">Date</p>
                        <p className="text-sm font-black text-slate-800">{completedDate ? completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : timeIn ? timeIn.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}</p>
                      </div>
                    </div>

                    {/* Driver Info */}
                    {delivery.assignee && (
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                         <Truck className="w-3.5 h-3.5 text-blue-500" />
                         <p className="text-xs font-semibold text-slate-600">Driver: <span className="text-slate-900">{delivery.assignee.name}</span></p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-[40px] border-2 border-dashed border-slate-200 py-32 text-center">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Briefcase className="w-12 h-12 text-slate-200" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {showCompleted ? 'No Completed Deliveries' : 'Operational Queue Clear'}
              </h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto">
                {showCompleted
                  ? 'No deliveries have been completed yet.'
                  : 'All stores processed in the previous stage have been assigned to their respective logistics personnel.'}
              </p>
            </div>
          )}
        </div>

        {/* Fleet Monitor Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-6 flex flex-col max-h-[calc(100vh-120px)]">
             {/* Header - Fixed */}
             <div className="px-5 py-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Fleet Status</h3>
                  <Badge variant="outline" className="text-xs">
                    {availableAgents.length} agents
                  </Badge>
                </div>
             </div>

             {/* Statistics - Fixed */}
             <div className="px-5 py-4 border-b border-slate-100">
                <div className="grid grid-cols-2 gap-2">
                   <div className="text-center p-3 bg-emerald-50 rounded-lg">
                      <p className="text-2xl font-bold text-emerald-600">{availableAgents.filter(a => a.agent_status === 'AVAILABLE').length}</p>
                      <p className="text-[10px] font-semibold text-emerald-600 uppercase mt-1">Idle</p>
                   </div>
                   <div className="text-center p-3 bg-slate-50 rounded-lg">
                      <p className="text-2xl font-bold text-slate-800">{availableAgents.filter(a => a.agent_status === 'ON_FIELD').length}</p>
                      <p className="text-[10px] font-semibold text-slate-500 uppercase mt-1">Busy</p>
                   </div>
                </div>
             </div>

             {/* Personnel List - Scrollable */}
             <ScrollArea className="flex-1 px-5">
               <div className="py-4 space-y-2">
                   {availableAgents.map(agent => (
                      <div key={agent.id} className="p-3 bg-slate-50 rounded-lg hover:bg-emerald-50 hover:border-emerald-200 transition-all border border-transparent">
                         <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2.5">
                               <Avatar className="h-8 w-8">
                                 <AvatarFallback className="bg-emerald-500 text-white text-xs font-bold">
                                   {agent.name.charAt(0)}
                                 </AvatarFallback>
                               </Avatar>
                               <div>
                                  <p className="text-xs font-bold text-slate-900">{agent.name}</p>
                                  <p className="text-[10px] text-slate-500">{agent.vehicle_id ? `Vehicle #${agent.vehicle_id}` : 'No Vehicle'}</p>
                               </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${agent.agent_status === 'AVAILABLE' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                         </div>
                         <div className="flex items-center justify-between text-[10px]">
                            <span className="text-slate-500">
                              <span className="font-semibold text-slate-700">{agent.active_tasks_count || 0}</span> tasks
                            </span>
                            <Badge
                              variant="outline"
                              className={`text-[9px] px-2 py-0 ${agent.active_tasks_count && agent.active_tasks_count > 2 ? 'border-amber-300 text-amber-700' : 'border-emerald-300 text-emerald-700'}`}
                            >
                              {agent.active_tasks_count && agent.active_tasks_count > 2 ? 'High Load' : 'Optimal'}
                            </Badge>
                         </div>
                      </div>
                   ))}
                   {availableAgents.length === 0 && (
                     <div className="text-center py-12 text-slate-400 text-xs">
                       <Truck className="w-12 h-12 mx-auto mb-2 text-slate-200" />
                       <p>No delivery agents available</p>
                     </div>
                   )}
                </div>
             </ScrollArea>
          </div>
        </div>
      </div>

      {/* Dispatch & Assign Modal - Simple Agent Selection */}
      <Dialog open={isAssignModalOpen} onOpenChange={setIsAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Delivery Agent</DialogTitle>
            <DialogDescription>
              Choose an agent for {selectedOrder?.store_name}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              {/* Delivery Date */}
              <div>
                <Label htmlFor="delivery-date" className="text-sm font-medium mb-2 block">
                  Delivery Date
                </Label>
                <Input
                  id="delivery-date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Agent List */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Available Agents ({filteredAgents.length})
                </Label>
                <ScrollArea className="h-[300px] rounded-md border p-2">
                  <div className="space-y-2">
                    {filteredAgents.length > 0 ? (
                      filteredAgents.map((agent) => (
                        <Button
                          key={agent.id}
                          variant="outline"
                          className="w-full justify-start h-auto py-3 hover:bg-emerald-50 hover:border-emerald-500"
                          onClick={() => confirmDispatch(agent.id)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-emerald-500 text-white font-semibold">
                                {agent.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left">
                              <p className="font-semibold">{agent.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {agent.active_tasks_count || 0} active tasks
                              </p>
                            </div>
                            {agent.agent_status === 'AVAILABLE' && (
                              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                                Available
                              </Badge>
                            )}
                          </div>
                        </Button>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-300 mb-2" />
                        <p className="text-sm text-muted-foreground">No agents available</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LogisticsHub;
