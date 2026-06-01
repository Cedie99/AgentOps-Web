'use client'

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Calendar as CalendarIcon,
  User,
  Phone,
  Briefcase,
  FileText,
  MapPinned,
  Filter,
  ChevronDown
} from 'lucide-react';
import Image from 'next/image';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StoreVisit {
  id: number;
  assignment_id: number;
  sales_agent_id: number;
  survey_id: number;
  visit_date: string;
  visit_photo_url: string | null;
  new_contact_name: string | null;
  new_contact_number: string | null;
  new_contact_position: string | null;
  notes: string | null;
  visit_latitude: number;
  visit_longitude: number;
  distance_from_store: number | null;
  created_at: string;
  sales_agent_name: string;
  sales_agent_email: string;
  store_name: string;
  address: string | null;
  city: string | null;
  customer_status: 'PROSPECT' | 'NEW' | 'EXISTING';
}

interface SalesAgent {
  id: number;
  name: string;
  email: string;
}

const StoreVisits: React.FC = () => {
  const [visits, setVisits] = useState<StoreVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [salesAgents, setSalesAgents] = useState<SalesAgent[]>([]);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [expandedVisit, setExpandedVisit] = useState<number | null>(null);

  useEffect(() => {
    fetchSalesAgents();
    fetchVisits();
  }, [selectedAgent, dateFrom, dateTo]);

  const fetchSalesAgents = async () => {
    try {
      const response = await fetch('/api/users?roles=SALES_AGENT');
      const data = await response.json();
      setSalesAgents(data.users || []);
    } catch (error) {
      console.error('Error fetching sales agents:', error);
    }
  };

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAgent && selectedAgent !== 'all') params.append('sales_agent_id', selectedAgent);
      if (dateFrom) params.append('date_from', format(dateFrom, 'yyyy-MM-dd'));
      if (dateTo) params.append('date_to', format(dateTo, 'yyyy-MM-dd'));

      const response = await fetch(`/api/store-visits?${params.toString()}`);
      const data = await response.json();
      setVisits(data.visits || []);
    } catch (error) {
      console.error('Error fetching store visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Manila',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PROSPECT':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'NEW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'EXISTING':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleViewMap = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Store Visits</h1>
          <p className="text-slate-500 text-sm">Monitor and review all store visit activities</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">{visits.length} Visits</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">Sales Agent</label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {salesAgents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-600">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  disabled={(date) => dateFrom ? date < dateFrom : false}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Visits Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      ) : visits.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 text-sm">No store visits found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {visits.map((visit) => (
            <div
              key={visit.id}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {/* Compact Header */}
              <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-white truncate">{visit.store_name}</h3>
                    <p className="text-emerald-50 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{visit.city || 'Unknown City'}</span>
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${getStatusColor(visit.customer_status)}`}>
                    {visit.customer_status}
                  </span>
                </div>
              </div>

              {/* Photo - Smaller */}
              {visit.visit_photo_url && (
                <div className="relative h-32 bg-slate-100">
                  <Image
                    src={visit.visit_photo_url}
                    alt="Store visit photo"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Compact Content */}
              <div className="p-3 space-y-2">
                {/* Sales Agent & Date - Side by side */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-start gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">Agent</p>
                      <p className="font-semibold text-slate-900 truncate">{visit.sales_agent_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide">Date</p>
                      <p className="font-semibold text-slate-900 text-[11px]">{formatDate(visit.visit_date)}</p>
                    </div>
                  </div>
                </div>

                {/* Distance Badge */}
                {visit.distance_from_store !== null && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-md">
                    <MapPinned className="w-3 h-3 text-slate-500" />
                    <span className="text-[11px] text-slate-600 font-medium">{visit.distance_from_store.toFixed(0)}m from store</span>
                  </div>
                )}

                {/* Expandable Details */}
                {(visit.new_contact_name || visit.notes) && (
                  <div className="border-t border-slate-100 pt-2">
                    <button
                      onClick={() => setExpandedVisit(expandedVisit === visit.id ? null : visit.id)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-emerald-600 transition-colors"
                    >
                      <span>View Details</span>
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedVisit === visit.id ? 'rotate-180' : ''}`} />
                    </button>

                    {expandedVisit === visit.id && (
                      <div className="mt-2 space-y-2">
                        {/* New Contact */}
                        {visit.new_contact_name && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <Briefcase className="w-3 h-3 text-amber-600" />
                              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wide">New Contact</span>
                            </div>
                            <p className="text-xs font-semibold text-amber-900">{visit.new_contact_name}</p>
                            {visit.new_contact_position && (
                              <p className="text-[11px] text-amber-700">{visit.new_contact_position}</p>
                            )}
                            {visit.new_contact_number && (
                              <p className="text-[11px] text-amber-700 flex items-center gap-1 mt-1">
                                <Phone className="w-3 h-3" />
                                {visit.new_contact_number}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Notes */}
                        {visit.notes && (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2">
                            <div className="flex items-center gap-1.5 mb-1">
                              <FileText className="w-3 h-3 text-slate-500" />
                              <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Notes</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">{visit.notes}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* View Location Button */}
                <button
                  onClick={() => handleViewMap(visit.visit_latitude, visit.visit_longitude)}
                  className="w-full mt-2 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-emerald-200"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  View Location on Map
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StoreVisits;
