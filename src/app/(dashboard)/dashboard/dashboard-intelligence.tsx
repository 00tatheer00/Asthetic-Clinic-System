'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Package,
  AlertTriangle,
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  ArrowRight,
  Loader2,
  Plus,
  MessageCircle,
  FileText,
  Activity,
  Stethoscope,
  ExternalLink,
  ChevronRight,
  Check,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils/helpers';
import { searchClinicGlobal, completeFollowUp, type GlobalSearchResult } from '@/actions/intelligence';
import { APPOINTMENT_STATUS_COLORS } from '@/lib/constants';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import type {
  ChartDayData,
  ChartStatusData,
  ChartPaymentData,
} from '@/components/dashboard/dashboard-charts';

const DashboardCharts = dynamic(
  () => import('@/components/dashboard/dashboard-charts').then((mod) => mod.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 h-80 rounded-2xl sm:rounded-3xl bg-white border border-gray-100 p-6 animate-pulse" />
        <div className="lg:col-span-4 h-80 rounded-2xl sm:rounded-3xl bg-white border border-gray-100 p-6 animate-pulse" />
      </div>
    ),
  }
);

interface DashboardIntelligenceProps {
  isAdmin: boolean;
  staffName: string;
  stats: {
    todayAppointments: number;
    todayCompletedVisits: number;
    todayRevenue: number;
    monthRevenue: number;
    allTimeRevenue?: number;
    pendingOrders: number;
    lowStockCount: number;
    pendingReviewsCount: number;
    totalPatients: number;
  };
  followUps: Array<{
    id: string;
    due_date: string;
    notes: string | null;
    status: string;
    patient: { id: string; name: string; phone: string } | null;
    treatment: { name: string } | null;
  }>;
  todayAppointments: Array<{
    id: string;
    scheduled_at: string;
    status: string;
    notes: string | null;
    total_price: number;
    customer_name: string;
    customer_phone: string;
    treatment: { id: string; name: string; duration_minutes: number | null; price: number | null } | null;
  }>;
  pendingBookings?: Array<{
    id: string;
    scheduled_at: string;
    status: string;
    message?: string | null;
    customer_name: string;
    customer_phone: string;
    created_at?: string;
    treatment: { id?: string; name: string; duration_minutes?: number | null; price?: number | null } | null;
  }>;
  recentInvoices: Array<{
    id: string;
    invoice_number: string;
    customer_name: string;
    customer_phone: string;
    total: number;
    status: string;
    payment_method: string;
    created_at: string;
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    sku: string;
    stock_quantity: number;
    low_stock_threshold: number;
    sale_price: number;
  }>;
  popularTreatments: Array<{
    id: string;
    name: string;
    price: number | null;
    duration_minutes: number | null;
  }>;
  dailyData: ChartDayData[];
  statusData: ChartStatusData;
  paymentData: ChartPaymentData;
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'critical';
    title: string;
    description: string;
    href: string;
  }>;
}

export function DashboardIntelligence({
  isAdmin,
  staffName,
  stats,
  followUps,
  todayAppointments,
  pendingBookings = [],
  recentInvoices,
  lowStockProducts,
  popularTreatments,
  dailyData,
  statusData,
  paymentData,
  alerts,
}: DashboardIntelligenceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
  const [isSearching, startSearch] = useTransition();
  const [isCompleting, startCompleting] = useTransition();

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length >= 2) {
      startSearch(async () => {
        const results = await searchClinicGlobal(query);
        setSearchResults(results);
      });
    } else {
      setSearchResults([]);
    }
  };

  const handleCompleteFollowUp = (id: string, patientName: string) => {
    startCompleting(async () => {
      const res = await completeFollowUp(id);
      if (res.success) {
        toast.success(`Follow-up marked completed for ${patientName}`);
      } else {
        toast.error(res.error || 'Failed to complete follow-up');
      }
    });
  };

  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header Banner & Operational Status */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950 font-serif">
              Welcome back, {(staffName || 'Staff').split(' ')[0]}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Clinic Operational · Dr. Bilal On Duty
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{todayFormatted}</span>
            <span>•</span>
            <span>Dr. Bilal Skin Care & Laser Clinic</span>
            <span>•</span>
            <span className="text-rose-600 font-medium">Sami Tower, Ring Road, Peshawar</span>
          </p>
        </div>

        {/* Global Fast Search Bar */}
        <div className="relative w-full xl:w-96">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patient, phone, invoice, SKU..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-gray-50/80 hover:bg-white focus:bg-white rounded-xl shadow-2xs hover:shadow-xs focus:ring-2 focus:ring-rose-500/20 border-gray-200 hover:border-rose-200 transition-all duration-200"
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-3 h-4 w-4 animate-spin text-rose-500" />
            )}
          </div>

          {/* Quick Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 mt-1.5 w-full bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {searchResults.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="block p-3.5 hover:bg-rose-50/60 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-rose-600 tracking-wider">
                      {item.type}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Actionable Business Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 sm:p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm ${
                alert.type === 'critical'
                  ? 'bg-red-50/80 border-red-200 text-red-900'
                  : alert.type === 'warning'
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-blue-50/80 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <strong className="font-semibold">{alert.title}:</strong> {alert.description}
                </span>
              </div>
              <Link href={alert.href} className="underline text-xs font-semibold shrink-0 hover:opacity-80">
                Resolve &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* 3. Primary KPI Metrics Grid (Interactive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments (Blue) */}
        <Link href="/dashboard/appointments" className="group block focus:outline-none">
          <Card className="border border-blue-200/80 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 bg-gradient-to-br from-white via-white to-blue-50/20 rounded-2xl cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700/80">
                    Today&apos;s Appointments
                  </p>
                  <p className="text-3xl font-extrabold text-gray-950 mt-1 font-serif group-hover:text-blue-950 transition-colors">
                    {stats.todayAppointments}
                  </p>
                  <p className="text-xs text-blue-600 mt-1.5 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{stats.todayCompletedVisits} completed</span>
                  </p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-blue-100/70 text-blue-600 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Revenue KPI (Admin Only - Emerald) */}
        {isAdmin ? (
          <Link href="/dashboard/invoices" className="group block focus:outline-none">
            <Card className="border border-emerald-200/80 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 bg-gradient-to-br from-white via-white to-emerald-50/20 rounded-2xl cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700/80">
                      Today&apos;s Revenue
                    </p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-gray-950 mt-1 font-serif tracking-tight group-hover:text-emerald-950 transition-colors">
                      {formatCurrency(stats.todayRevenue)}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1.5 flex items-center gap-1 font-medium">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      <span>All-Time: {formatCurrency(stats.allTimeRevenue || stats.monthRevenue)}</span>
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-2xl bg-emerald-100/70 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link href="/dashboard/patients" className="group block focus:outline-none">
            <Card className="border border-indigo-200/80 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 bg-gradient-to-br from-white via-white to-indigo-50/20 rounded-2xl cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-700/80">
                      Total Patients
                    </p>
                    <p className="text-3xl font-extrabold text-gray-950 mt-1 font-serif group-hover:text-indigo-950 transition-colors">
                      {stats.totalPatients}
                    </p>
                    <p className="text-xs text-indigo-600 mt-1.5 font-medium">
                      Registered Clinic Directory
                    </p>
                  </div>
                  <div className="h-11 w-11 rounded-2xl bg-indigo-100/70 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Pending Web Orders (Amber) */}
        <Link href="/dashboard/orders" className="group block focus:outline-none">
          <Card className="border border-amber-200/80 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-300 bg-gradient-to-br from-white via-white to-amber-50/20 rounded-2xl cursor-pointer">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700/80">
                    Pending Orders
                  </p>
                  <p className="text-3xl font-extrabold text-gray-950 mt-1 font-serif group-hover:text-amber-950 transition-colors">
                    {stats.pendingOrders}
                  </p>
                  <p className="text-xs text-amber-700 mt-1.5 font-medium">
                    Web Checkout Dispatch
                  </p>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-amber-100/70 text-amber-700 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Package className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Low Stock Items (Rose if low stock, Teal if optimal) */}
        <Link href="/dashboard/inventory" className="group block focus:outline-none">
          <Card className={cn(
            'transition-all duration-300 rounded-2xl cursor-pointer',
            stats.lowStockCount > 0
              ? 'border border-rose-200/80 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/10 bg-gradient-to-br from-white via-white to-rose-50/20'
              : 'border border-teal-200/80 hover:border-teal-500 hover:shadow-lg hover:shadow-teal-500/10 bg-gradient-to-br from-white via-white to-teal-50/20'
          )}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className={cn(
                    'text-[11px] font-bold uppercase tracking-wider',
                    stats.lowStockCount > 0 ? 'text-rose-700/80' : 'text-teal-700/80'
                  )}>
                    Low Stock Items
                  </p>
                  <p className="text-3xl font-extrabold text-gray-950 mt-1 font-serif group-hover:text-gray-900 transition-colors">
                    {stats.lowStockCount}
                  </p>
                  <p
                    className={`text-xs mt-1.5 font-medium ${
                      stats.lowStockCount > 0 ? 'text-rose-600' : 'text-teal-600'
                    }`}
                  >
                    {stats.lowStockCount > 0 ? 'Requires Reordering' : 'Stock Optimal'}
                  </p>
                </div>
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-xs transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                    stats.lowStockCount > 0
                      ? 'bg-rose-100/80 text-rose-600 group-hover:bg-rose-600 group-hover:text-white'
                      : 'bg-teal-100/80 text-teal-600 group-hover:bg-teal-600 group-hover:text-white'
                  }`}
                >
                  <AlertTriangle className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 4. Chart.js Interactive Visual Analytics Engine */}
      <DashboardCharts
        dailyData={dailyData}
        statusData={statusData}
        paymentData={paymentData}
        isAdmin={isAdmin}
        allTimeRevenue={stats.allTimeRevenue}
        allTimeAppointments={stats.totalPatients}
      />

      {/* NEW ONLINE WEBSITE BOOKINGS QUEUE */}
      {pendingBookings.length > 0 && (
        <Card className="border-2 border-rose-300 bg-gradient-to-r from-rose-50/80 via-pink-50/40 to-white shadow-md rounded-2xl sm:rounded-3xl p-5 space-y-4 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-200/80">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm animate-pulse">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-gray-950 text-base">
                    New Online Website Bookings
                  </h3>
                  <Badge className="bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5">
                    {pendingBookings.length} Awaiting Approval
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  Patients booked these slots from the clinic website. Review and confirm on WhatsApp.
                </p>
              </div>
            </div>
            <Link href="/dashboard/appointments?status=pending">
              <Button size="sm" className="bg-[#2D1226] hover:bg-[#431b39] text-white text-xs font-semibold rounded-xl">
                <span>Open Full Queue</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingBookings.map((apt) => (
              <div
                key={apt.id}
                className="p-3.5 rounded-2xl bg-white border border-rose-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-950 text-sm truncate">{apt.customer_name}</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-rose-700 truncate">
                    {apt.treatment?.name || 'Aesthetic Treatment'}
                  </p>
                  <p className="text-[11px] text-gray-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{formatDate(apt.scheduled_at)} · {formatTime(apt.scheduled_at)}</span>
                  </p>
                  <p className="text-[11px] text-gray-500 font-mono flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <span>{apt.customer_phone}</span>
                  </p>
                  {apt.message && (
                    <p className="text-[10px] text-gray-400 italic line-clamp-1 border-t border-gray-100 pt-1 mt-1">
                      &ldquo;{apt.message.split('\n')[0]}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                  <Link
                    href={`/dashboard/appointments?status=pending&search=${encodeURIComponent(apt.customer_name)}`}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold text-center transition"
                  >
                    Review
                  </Link>
                  <a
                    href={`https://wa.me/${apt.customer_phone.replace(/^0/, '92')}?text=Assalam-o-Alaikum%20${encodeURIComponent(apt.customer_name)},%20this%20is%20Brimish%20Skin%20Care%20Clinic%20regarding%20your%20appointment%20request%20for%20${encodeURIComponent(apt.treatment?.name || 'treatment')}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                    title="WhatsApp Patient"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Today's Live Schedule */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border border-rose-200/80 hover:border-rose-500 hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
            <CardHeader className="flex flex-row items-center justify-between p-5 sm:p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <CardTitle className="text-base sm:text-lg font-bold text-gray-950 font-serif">
                    Today&apos;s Patient Appointments
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs font-semibold bg-rose-50 text-rose-700 border-rose-200">
                    {todayAppointments.length} Scheduled
                  </Badge>
                </div>
                <CardDescription className="text-xs text-gray-500">
                  Real-time schedule and consultation queue for Dr. Bilal&apos;s clinic today
                </CardDescription>
              </div>

              <Link href="/dashboard/appointments">
                <Button variant="ghost" size="sm" className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:bg-rose-50 hover:translate-x-0.5 transition-all">
                  <span>Full Calendar</span>
                  <ChevronRight className="h-4 w-4 ml-0.5" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto shadow-xs">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-gray-900">
                      No more appointments scheduled for today
                    </p>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      All visits are concluded or slots are open. You can book walk-in patients instantly.
                    </p>
                  </div>
                  <Link href="/dashboard/appointments?new=true">
                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md hover:scale-105 transition-all">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Book Walk-in Patient
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-4 sm:p-5 space-y-3">
                  {todayAppointments.map((app) => {
                    const statusColor =
                      APPOINTMENT_STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-800';
                    return (
                      <div
                        key={app.id}
                        className="group/entry p-4 sm:p-4.5 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60 hover:shadow-xs transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                      >
                        {/* Time & Patient Info */}
                        <div className="flex items-start gap-3.5">
                          <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-700 flex flex-col items-center justify-center shrink-0 border border-rose-100/80 group-hover/entry:scale-105 group-hover/entry:border-rose-300 transition-all duration-200">
                            <Clock className="h-3.5 w-3.5 mb-0.5 text-rose-500" />
                            <span className="text-[11px] font-bold leading-none">
                              {formatTime(app.scheduled_at)}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-gray-950 truncate group-hover/entry:text-rose-950 transition-colors">
                                {app.customer_name}
                              </p>
                              <Badge className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${statusColor}`}>
                                {app.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              {app.treatment && (
                                <span className="font-medium text-rose-700">
                                  {app.treatment.name}
                                </span>
                              )}
                              {app.treatment?.duration_minutes && (
                                <>
                                  <span>•</span>
                                  <span>{app.treatment.duration_minutes} mins</span>
                                </>
                              )}
                              <span>•</span>
                              <span className="font-semibold text-gray-900">
                                {formatCurrency(app.total_price)}
                              </span>
                            </p>

                            {app.notes && (
                              <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">
                                &ldquo;{app.notes}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Quick Contact & Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          {app.customer_phone && (
                            <a
                              href={`https://wa.me/${app.customer_phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 hover:border-emerald-300 hover:scale-105 hover:shadow-xs text-emerald-800 text-xs font-semibold transition-all duration-200 active:scale-95"
                              title="WhatsApp Patient"
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          <Link href={`/dashboard/appointments`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs rounded-xl hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 hover:shadow-xs transition-all duration-200 font-medium"
                            >
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols): Front-Desk Quick Actions & Room Readiness */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border border-indigo-200/80 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white space-y-4">
            <div>
              <CardTitle className="text-base font-bold text-gray-950 font-serif">
                Front-Desk Quick Actions
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">
                Instant patient checkout, scheduling, and billing
              </CardDescription>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/pos">
                <Button className="w-full h-auto py-3.5 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-2xl shadow-md shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/35 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-xs font-bold">New POS Sale</span>
                </Button>
              </Link>
              <Link href="/dashboard/appointments?new=true">
                <Button
                  variant="outline"
                  className="w-full h-auto py-3.5 flex flex-col items-center justify-center gap-1.5 rounded-2xl border-gray-200 hover:bg-blue-50/80 hover:text-blue-700 hover:border-blue-300 hover:shadow-md hover:shadow-blue-500/15 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-semibold">Book Visit</span>
                </Button>
              </Link>
              <Link href="/dashboard/patients?new=true">
                <Button
                  variant="outline"
                  className="w-full h-auto py-3.5 flex flex-col items-center justify-center gap-1.5 rounded-2xl border-gray-200 hover:bg-indigo-50/80 hover:text-indigo-700 hover:border-indigo-300 hover:shadow-md hover:shadow-indigo-500/15 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Users className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs font-semibold">Add Patient</span>
                </Button>
              </Link>
              <Link href="/dashboard/inventory?new=true">
                <Button
                  variant="outline"
                  className="w-full h-auto py-3.5 flex flex-col items-center justify-center gap-1.5 rounded-2xl border-gray-200 hover:bg-amber-50/80 hover:text-amber-700 hover:border-amber-300 hover:shadow-md hover:shadow-amber-500/15 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Package className="h-5 w-5 text-amber-600" />
                  <span className="text-xs font-semibold">Add Stock</span>
                </Button>
              </Link>
            </div>

            {/* Clinic Suites / Doctor Live Status */}
            <div className="pt-2 border-t border-gray-100 space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Clinic Suites & Doctor Readiness
              </p>
              
              <div className="p-3 rounded-xl bg-gray-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all duration-150 text-xs cursor-pointer group/suite">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold group-hover/suite:scale-105 transition-transform">
                    1
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 group-hover/suite:text-rose-900 block transition-colors">Dr. Bilal Consultation Suite</span>
                    <span className="text-[10px] text-gray-500">Laser & Aesthetic Dermatology</span>
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Active
                </Badge>
              </div>

              <div className="p-3 rounded-xl bg-gray-50/70 hover:bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all duration-150 text-xs cursor-pointer group/suite">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold group-hover/suite:scale-105 transition-transform">
                    2
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 group-hover/suite:text-pink-900 block transition-colors">HydraFacial & Peel Lounge</span>
                    <span className="text-[10px] text-gray-500">Clinical Esthetics Room</span>
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800 text-[10px] font-bold">
                  Ready
                </Badge>
              </div>
            </div>
          </Card>

          {/* End-of-Day Closing Reconcile Card */}
          {isAdmin && (
            <Card className="border border-gray-800 hover:border-gray-700 hover:shadow-md transition-all duration-200 shadow-xs bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white rounded-2xl sm:rounded-3xl p-5 cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-rose-400" />
                    <h3 className="text-sm font-bold tracking-tight">End-of-Day Register Closing</h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Verify cash register reconciliation, reconcile credit card terminal, and export day CSV.
                  </p>
                </div>

                <Link href="/dashboard/reports" className="shrink-0">
                  <Button size="sm" className="bg-white text-gray-950 hover:bg-gray-100 hover:scale-105 rounded-xl text-xs font-bold shadow-xs transition-all">
                    Reconcile
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 5. SECTION 2: RECENT FINANCIAL TRANSACTIONS (50%) + POST-PROCEDURE CARE QUEUE (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Recent POS Invoices & Sales Stream */}
        <Card className="border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-5 sm:p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" />
                <CardTitle className="text-base font-bold text-gray-950 font-serif">
                  Recent Invoices & Transactions
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-500">
                Latest patient treatment billings and POS retail sales
              </CardDescription>
            </div>
            <Link href="/dashboard/invoices">
              <Button variant="ghost" size="sm" className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold hover:bg-emerald-50 hover:translate-x-0.5 transition-all">
                <span>All Invoices</span>
                <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {recentInvoices.length === 0 ? (
              <div className="text-center py-10 px-4 text-gray-400">
                <Receipt className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">No invoices issued today yet</p>
                <p className="text-xs text-gray-400">New POS sales will appear here in real-time.</p>
              </div>
            ) : (
              <div className="p-4 space-y-2.5">
                {recentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="group/entry p-3.5 sm:p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60 hover:shadow-xs transition-all duration-150 flex items-center justify-between gap-3 text-xs cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-gray-900 group-hover/entry:text-emerald-950 transition-colors">
                          {inv.invoice_number}
                        </span>
                        <span className="font-medium text-gray-700 truncate">
                          {inv.customer_name || 'Walk-in Customer'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                        <span className="capitalize font-medium text-gray-600">
                          {inv.payment_method?.replace('_', ' ') || 'Cash'}
                        </span>
                        <span>•</span>
                        <span>{formatDate(inv.created_at)}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-950 text-sm font-serif group-hover/entry:text-emerald-700 transition-colors">
                        {formatCurrency(inv.total)}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] font-semibold uppercase px-2 py-0.2 ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Post-Procedure Patient Follow-Up Queue */}
        <Card className="border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-5 sm:p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-rose-600" />
                <CardTitle className="text-base font-bold text-gray-950 font-serif">
                  Post-Procedure Follow-Up Queue
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-500">
                Patients scheduled for operational check-in calls or healing reviews
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-xs font-semibold bg-rose-50 text-rose-700 border-rose-200">
              {followUps.length} Pending
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            {followUps.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-500 opacity-80" />
                <p className="text-sm font-semibold text-gray-700">All follow-ups are up to date!</p>
                <p className="text-xs text-gray-400">No overdue patient calls pending today.</p>
              </div>
            ) : (
              <div className="p-4 space-y-2.5">
                {followUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="group/entry p-3.5 sm:p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60 hover:shadow-xs transition-all duration-150 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-950 truncate group-hover/entry:text-rose-950 transition-colors">
                        {fu.patient?.name || 'Patient'}
                      </p>
                      <p className="text-xs text-gray-500 flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-rose-500" />
                          {fu.patient?.phone}
                        </span>
                        <span>•</span>
                        <span>Due: {formatDate(fu.due_date)}</span>
                        {fu.treatment && (
                          <>
                            <span>•</span>
                            <span className="text-rose-700 font-semibold">{fu.treatment.name}</span>
                          </>
                        )}
                      </p>
                      {fu.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic line-clamp-1">
                          &ldquo;{fu.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isCompleting}
                      onClick={() => handleCompleteFollowUp(fu.id, fu.patient?.name || 'Patient')}
                      className="text-xs shrink-0 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 hover:shadow-xs hover:scale-105 active:scale-95 transition-all duration-200 font-semibold"
                    >
                      <Check className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                      Mark Done
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 6. SECTION 3: INVENTORY WATCHLIST & CLINIC HIGHLIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pb-8">
        {/* Low Stock Watchlist */}
        <Card className="border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-4 border-b border-gray-100 bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-amber-600" />
                <CardTitle className="text-base font-bold text-gray-950 font-serif">
                  Inventory Watchlist & Reorder
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-500">
                Products nearing low stock threshold in clinic dispensary
              </CardDescription>
            </div>
            <Link href="/dashboard/inventory">
              <Button variant="ghost" size="sm" className="text-xs text-amber-700 hover:text-amber-800 font-semibold hover:bg-amber-50 hover:translate-x-0.5 transition-all">
                <span>Manage Stock</span>
                <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="h-7 w-7 mx-auto mb-1.5 text-emerald-500 opacity-80" />
                <p className="text-xs font-semibold text-gray-600">All products have healthy stock levels</p>
              </div>
            ) : (
              <div className="p-4 space-y-2.5">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="group/entry p-3.5 sm:p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60 hover:shadow-xs transition-all duration-150 flex items-center justify-between gap-3 text-xs cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-gray-950 truncate group-hover/entry:text-amber-950 transition-colors">{p.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        SKU: {p.sku || 'N/A'} · Threshold: {p.low_stock_threshold}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        variant="secondary"
                        className={`text-xs font-bold ${
                          p.stock_quantity <= 0
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.stock_quantity} left
                      </Badge>
                      <Link href={`/dashboard/inventory`}>
                        <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs text-rose-600 font-semibold hover:bg-rose-100/70 hover:scale-105 transition-all duration-200">
                          Restock
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Featured Clinic Treatments */}
        <Card className="border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 rounded-2xl sm:rounded-3xl overflow-hidden bg-white">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-4 border-b border-gray-100 bg-gray-50/50">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-rose-600" />
                <CardTitle className="text-base font-bold text-gray-950 font-serif">
                  Clinical Services & Procedures
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-500">
                Featured doctor-led aesthetic protocols and treatment pricing
              </CardDescription>
            </div>
            <Link href="/dashboard/content/treatments">
              <Button variant="ghost" size="sm" className="text-xs text-rose-700 hover:text-rose-800 font-semibold hover:bg-rose-50 hover:translate-x-0.5 transition-all">
                <span>All Protocols</span>
                <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            <div className="p-4 space-y-2.5">
              {popularTreatments.map((t) => (
                <div
                  key={t.id}
                  className="group/entry p-3.5 sm:p-4 rounded-xl border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/60 hover:shadow-xs transition-all duration-150 flex items-center justify-between gap-3 text-xs cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-gray-950 truncate group-hover/entry:text-rose-950 transition-colors">{t.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {t.duration_minutes ? `${t.duration_minutes} mins duration` : 'Standard protocol'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-bold text-gray-900 font-serif text-sm group-hover/entry:text-rose-700 transition-colors">
                      {t.price ? formatCurrency(t.price) : 'Custom Quote'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
