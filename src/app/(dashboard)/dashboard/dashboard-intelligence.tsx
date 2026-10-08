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
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-slate-300 shadow-sm">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 font-serif">
              Welcome back, {(staffName || 'Staff').split(' ')[0]}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-950 border-2 border-emerald-400 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              Clinic Operational · Dr. Bilal On Duty
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-slate-900">{todayFormatted}</span>
            <span>•</span>
            <span className="text-slate-800">Dr. Bilal Skin Care & Laser Clinic</span>
            <span>•</span>
            <span className="text-rose-700 font-bold">Sami Tower, Ring Road, Peshawar</span>
          </p>
        </div>

        {/* Global Fast Search Bar */}
        <div className="relative w-full xl:w-96">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search patient, phone, invoice, SKU..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-white hover:bg-slate-50 focus:bg-white rounded-xl shadow-2xs hover:shadow-xs focus:ring-2 focus:ring-rose-500/30 border-2 border-slate-300 hover:border-rose-400 text-slate-950 font-medium placeholder:text-slate-400 transition-all duration-200"
            />
            {isSearching && (
              <Loader2 className="absolute right-3.5 top-3 h-4 w-4 animate-spin text-rose-600" />
            )}
          </div>

          {/* Quick Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 mt-1.5 w-full bg-white rounded-2xl shadow-2xl border-2 border-slate-300 overflow-hidden divide-y-2 divide-slate-100">
              {searchResults.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="block p-3.5 hover:bg-rose-50/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase text-rose-700 tracking-wider">
                      {item.type}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-950 mt-0.5">{item.title}</p>
                  <p className="text-xs text-slate-600 font-medium">{item.subtitle}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Actionable Business Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between gap-3 text-xs sm:text-sm shadow-xs ${
                alert.type === 'critical'
                  ? 'bg-rose-100/95 border-rose-400 text-rose-950 font-medium'
                  : alert.type === 'warning'
                  ? 'bg-amber-100/95 border-amber-400 text-amber-950 font-medium'
                  : 'bg-blue-100/95 border-blue-400 text-blue-950 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" />
                <span>
                  <strong className="font-bold">{alert.title}:</strong> {alert.description}
                </span>
              </div>
              <Link href={alert.href} className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shrink-0 transition-colors shadow-2xs">
                Resolve &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* 3. FRONT-DESK RECEPTION PRIORITY: NEW ONLINE WEBSITE BOOKINGS QUEUE */}
      {pendingBookings.length > 0 ? (
        <Card className="border-2 border-rose-400 bg-gradient-to-r from-rose-100/80 via-pink-50/60 to-white shadow-md rounded-2xl sm:rounded-3xl p-5 space-y-4 animate-in fade-in-50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-rose-200">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-sm animate-pulse">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-slate-950 text-base">
                    New Online Website Bookings
                  </h3>
                  <Badge className="bg-rose-600 text-white text-xs font-extrabold px-2.5 py-0.5 shadow-2xs">
                    {pendingBookings.length} Awaiting Approval
                  </Badge>
                </div>
                <p className="text-xs text-slate-700 font-medium mt-0.5">
                  Patients booked these slots from the clinic website. Review and confirm on WhatsApp.
                </p>
              </div>
            </div>
            <Link href="/dashboard/appointments?status=pending">
              <Button size="sm" className="bg-[#2D1226] hover:bg-[#431b39] text-white text-xs font-bold rounded-xl shadow-xs">
                <span>Open Full Queue</span>
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingBookings.map((apt) => (
              <div
                key={apt.id}
                className="p-3.5 rounded-2xl bg-white border-2 border-rose-200/90 shadow-sm hover:border-rose-400 hover:shadow-md transition-all flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-950 text-sm truncate">{apt.customer_name}</p>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-400 uppercase">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs font-bold text-rose-700 truncate">
                    {apt.treatment?.name || 'Aesthetic Treatment'}
                  </p>
                  <p className="text-[11px] text-slate-700 font-semibold flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{formatDate(apt.scheduled_at)} · {formatTime(apt.scheduled_at)}</span>
                  </p>
                  <p className="text-[11px] text-slate-600 font-mono font-medium flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>{apt.customer_phone}</span>
                  </p>
                  {apt.message && (
                    <p className="text-[10px] text-slate-500 italic line-clamp-1 border-t border-slate-100 pt-1 mt-1 font-medium">
                      &ldquo;{apt.message.split('\n')[0]}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <Link
                    href={`/dashboard/appointments?status=pending&search=${encodeURIComponent(apt.customer_name)}`}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold text-center transition shadow-2xs"
                  >
                    Review
                  </Link>
                  <a
                    href={`https://wa.me/${apt.customer_phone.replace(/^0/, '92')}?text=Assalam-o-Alaikum%20${encodeURIComponent(apt.customer_name)},%20this%20is%20Brimish%20Skin%20Care%20Clinic%20regarding%20your%20appointment%20request%20for%20${encodeURIComponent(apt.treatment?.name || 'treatment')}.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition shadow-2xs"
                    title="WhatsApp Patient"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white border-2 border-slate-300 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-950 font-serif">
                  New Online Website Bookings
                </h4>
                <Badge variant="outline" className="text-[10px] font-bold bg-emerald-100 text-emerald-950 border-2 border-emerald-400">
                  All Caught Up
                </Badge>
              </div>
              <p className="text-xs text-slate-600 font-medium mt-0.5">
                No pending website booking requests awaiting WhatsApp confirmation.
              </p>
            </div>
          </div>
          <Link href="/dashboard/appointments?status=pending">
            <Button variant="ghost" size="sm" className="text-xs text-rose-700 hover:text-rose-800 hover:bg-rose-50 font-bold h-8 px-3 rounded-xl border border-rose-200">
              <span>View Bookings Queue</span>
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* 4. FRONT-DESK RECEPTION WORKFLOW: TODAY'S APPOINTMENTS (8 cols) & QUICK ACTIONS (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Today's Live Schedule */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-2 border-slate-300 hover:border-rose-400 hover:shadow-md transition-all duration-300 rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between p-5 sm:p-6 pb-4 border-b-2 border-slate-200 bg-slate-50/80">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-600 animate-pulse" />
                  <CardTitle className="text-base sm:text-lg font-bold text-slate-950 font-serif">
                    Today&apos;s Patient Appointments
                  </CardTitle>
                  <Badge className="text-xs font-extrabold bg-rose-100 text-rose-900 border-2 border-rose-300 shadow-2xs">
                    {todayAppointments.length} Scheduled
                  </Badge>
                </div>
                <CardDescription className="text-xs text-slate-600 font-medium">
                  Real-time schedule and consultation queue for Dr. Bilal&apos;s clinic today
                </CardDescription>
              </div>

              <Link href="/dashboard/appointments">
                <Button variant="ghost" size="sm" className="text-xs text-rose-700 hover:text-rose-800 font-bold hover:bg-rose-50 hover:translate-x-0.5 transition-all">
                  <span>Full Calendar</span>
                  <ChevronRight className="h-4 w-4 ml-0.5" />
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {todayAppointments.length === 0 ? (
                <div className="text-center py-12 px-4 space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto shadow-xs border-2 border-rose-200">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-950">
                      No more appointments scheduled for today
                    </p>
                    <p className="text-xs text-slate-600 font-medium max-w-sm mx-auto">
                      All visits are concluded or slots are open. You can book walk-in patients instantly.
                    </p>
                  </div>
                  <Link href="/dashboard/appointments?new=true">
                    <Button size="sm" className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md hover:scale-105 transition-all">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Book Walk-in Patient
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-4 sm:p-5 space-y-3">
                  {todayAppointments.map((app) => {
                    const statusColor =
                      APPOINTMENT_STATUS_COLORS[app.status] || 'bg-slate-200 text-slate-900 border border-slate-300 font-bold';
                    return (
                      <div
                        key={app.id}
                        className="group/entry p-4 sm:p-4.5 rounded-xl border-2 border-slate-200 hover:border-rose-400 bg-white hover:bg-rose-50/30 hover:shadow-sm transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                      >
                        {/* Time & Patient Info */}
                        <div className="flex items-start gap-3.5">
                          <div className="h-12 w-12 rounded-2xl bg-rose-600 text-white flex flex-col items-center justify-center shrink-0 shadow-xs group-hover/entry:scale-105 group-hover/entry:bg-rose-700 transition-all duration-200">
                            <Clock className="h-3.5 w-3.5 mb-0.5 text-rose-200" />
                            <span className="text-[11px] font-extrabold leading-none">
                              {formatTime(app.scheduled_at)}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-950 truncate group-hover/entry:text-rose-950 transition-colors">
                                {app.customer_name}
                              </p>
                              <Badge className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${statusColor}`}>
                                {app.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            <p className="text-xs text-slate-600 font-medium mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              {app.treatment && (
                                <span className="font-bold text-rose-700">
                                  {app.treatment.name}
                                </span>
                              )}
                              {app.treatment?.duration_minutes && (
                                <>
                                  <span>•</span>
                                  <span className="font-semibold text-slate-700">{app.treatment.duration_minutes} mins</span>
                                </>
                              )}
                              <span>•</span>
                              <span className="font-extrabold text-slate-950 font-serif">
                                {formatCurrency(app.total_price)}
                              </span>
                            </p>

                            {app.notes && (
                              <p className="text-xs text-slate-500 mt-1 italic line-clamp-1 font-medium">
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105 hover:shadow-xs text-xs font-bold transition-all duration-200 active:scale-95 shadow-2xs"
                              title="WhatsApp Patient"
                            >
                              <MessageCircle className="h-3.5 w-3.5 text-white" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          <Link href={`/dashboard/appointments`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs rounded-xl border-2 border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-400 hover:shadow-xs transition-all duration-200 font-bold text-slate-800"
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
          <Card className="border-2 border-indigo-300 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300 rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-white space-y-4 shadow-sm">
            <div>
              <CardTitle className="text-base font-bold text-slate-950 font-serif">
                Front-Desk Quick Actions
              </CardTitle>
              <CardDescription className="text-xs text-slate-600 font-medium mt-0.5">
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
                  className="w-full h-auto py-3.5 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Calendar className="h-5 w-5 text-white" />
                  <span className="text-xs font-bold">Book Visit</span>
                </Button>
              </Link>
              <Link href="/dashboard/patients?new=true">
                <Button
                  className="w-full h-auto py-3.5 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Users className="h-5 w-5 text-white" />
                  <span className="text-xs font-bold">Add Patient</span>
                </Button>
              </Link>
              <Link href="/dashboard/inventory?new=true">
                <Button
                  className="w-full h-auto py-3.5 flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-1 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
                >
                  <Package className="h-5 w-5 text-white" />
                  <span className="text-xs font-bold">Add Stock</span>
                </Button>
              </Link>
            </div>

            {/* Clinic Suites / Doctor Live Status */}
            <div className="pt-2 border-t-2 border-slate-100 space-y-2.5">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
                Clinic Suites & Doctor Readiness
              </p>
              
              <div className="p-3 rounded-xl bg-rose-50/90 hover:bg-rose-100/80 border-2 border-rose-300 hover:border-rose-400 hover:shadow-xs transition-all duration-150 text-xs cursor-pointer group/suite">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold group-hover/suite:scale-105 transition-transform shadow-2xs">
                    1
                  </div>
                  <div>
                    <span className="font-bold text-slate-950 group-hover/suite:text-rose-950 block transition-colors">Dr. Bilal Consultation Suite</span>
                    <span className="text-[10px] text-slate-600 font-medium">Laser & Aesthetic Dermatology</span>
                  </div>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px] font-extrabold shadow-2xs border-0">
                  Active
                </Badge>
              </div>

              <div className="p-3 rounded-xl bg-pink-50/90 hover:bg-pink-100/80 border-2 border-pink-300 hover:border-pink-400 hover:shadow-xs transition-all duration-150 text-xs cursor-pointer group/suite">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-lg bg-pink-600 text-white flex items-center justify-center font-bold group-hover/suite:scale-105 transition-transform shadow-2xs">
                    2
                  </div>
                  <div>
                    <span className="font-bold text-slate-950 group-hover/suite:text-pink-950 block transition-colors">HydraFacial & Peel Lounge</span>
                    <span className="text-[10px] text-slate-600 font-medium">Clinical Esthetics Room</span>
                  </div>
                </div>
                <Badge className="bg-blue-600 text-white text-[10px] font-extrabold shadow-2xs border-0">
                  Ready
                </Badge>
              </div>
            </div>
          </Card>

          {/* End-of-Day Closing Reconcile Card */}
          {isAdmin && (
            <Card className="border-2 border-slate-800 hover:border-slate-700 hover:shadow-lg transition-all duration-200 shadow-sm bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-2xl sm:rounded-3xl p-5 cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-rose-400" />
                    <h3 className="text-sm font-bold tracking-tight">End-of-Day Register Closing</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">
                    Verify cash register reconciliation, reconcile credit card terminal, and export day CSV.
                  </p>
                </div>

                <Link href="/dashboard/reports" className="shrink-0">
                  <Button size="sm" className="bg-white text-slate-950 hover:bg-slate-100 hover:scale-105 rounded-xl text-xs font-bold shadow-xs transition-all">
                    Reconcile
                  </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 5. Primary KPI Metrics Grid (Interactive Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments (Blue) */}
        <Link href="/dashboard/appointments" className="group block focus:outline-none">
          <Card className="border-2 border-blue-300 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/15 transition-all duration-300 bg-gradient-to-br from-white via-blue-50/70 to-blue-100/70 rounded-2xl cursor-pointer shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">
                    Today&apos;s Appointments
                  </p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1 font-serif group-hover:text-blue-950 transition-colors">
                    {stats.todayAppointments}
                  </p>
                  <p className="text-xs text-blue-900 mt-1.5 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-700" />
                    <span>{stats.todayCompletedVisits} completed</span>
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Calendar className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Revenue KPI (Admin Only - Emerald) */}
        {isAdmin ? (
          <Link href="/dashboard/invoices" className="group block focus:outline-none">
            <Card className="border-2 border-emerald-300 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/15 transition-all duration-300 bg-gradient-to-br from-white via-emerald-50/70 to-emerald-100/70 rounded-2xl cursor-pointer shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900">
                      Today&apos;s Revenue
                    </p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-slate-950 mt-1 font-serif tracking-tight group-hover:text-emerald-950 transition-colors">
                      {formatCurrency(stats.todayRevenue)}
                    </p>
                    <p className="text-xs text-emerald-900 mt-1.5 flex items-center gap-1 font-bold">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
                      <span>All-Time: {formatCurrency(stats.allTimeRevenue || stats.monthRevenue)}</span>
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Link href="/dashboard/patients" className="group block focus:outline-none">
            <Card className="border-2 border-indigo-300 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/15 transition-all duration-300 bg-gradient-to-br from-white via-indigo-50/70 to-indigo-100/70 rounded-2xl cursor-pointer shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-900">
                      Total Patients
                    </p>
                    <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1 font-serif group-hover:text-indigo-950 transition-colors">
                      {stats.totalPatients}
                    </p>
                    <p className="text-xs text-indigo-900 mt-1.5 font-bold">
                      Registered Clinic Directory
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Users className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}

        {/* Pending Web Orders (Amber) */}
        <Link href="/dashboard/orders" className="group block focus:outline-none">
          <Card className="border-2 border-amber-300 hover:border-amber-500 hover:shadow-xl hover:shadow-amber-500/15 transition-all duration-300 bg-gradient-to-br from-white via-amber-50/70 to-amber-100/70 rounded-2xl cursor-pointer shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                    Pending Orders
                  </p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1 font-serif group-hover:text-amber-950 transition-colors">
                    {stats.pendingOrders}
                  </p>
                  <p className="text-xs text-amber-900 mt-1.5 font-bold">
                    Web Checkout Dispatch
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/30 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Low Stock Items (Rose if low stock, Teal if optimal) */}
        <Link href="/dashboard/inventory" className="group block focus:outline-none">
          <Card className={cn(
            'transition-all duration-300 rounded-2xl cursor-pointer shadow-sm',
            stats.lowStockCount > 0
              ? 'border-2 border-rose-300 hover:border-rose-500 hover:shadow-xl hover:shadow-rose-500/15 bg-gradient-to-br from-white via-rose-50/70 to-rose-100/70'
              : 'border-2 border-teal-300 hover:border-teal-500 hover:shadow-xl hover:shadow-teal-500/15 bg-gradient-to-br from-white via-teal-50/70 to-teal-100/70'
          )}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className={cn(
                    'text-[11px] font-extrabold uppercase tracking-wider',
                    stats.lowStockCount > 0 ? 'text-rose-900' : 'text-teal-900'
                  )}>
                    Low Stock Items
                  </p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1 font-serif group-hover:text-slate-900 transition-colors">
                    {stats.lowStockCount}
                  </p>
                  <p
                    className={`text-xs mt-1.5 font-bold ${
                      stats.lowStockCount > 0 ? 'text-rose-800' : 'text-teal-800'
                    }`}
                  >
                    {stats.lowStockCount > 0 ? 'Requires Reordering' : 'Stock Optimal'}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                    stats.lowStockCount > 0
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30'
                      : 'bg-teal-600 text-white shadow-md shadow-teal-500/30'
                  }`}
                >
                  <AlertTriangle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* 6. Chart.js Interactive Visual Analytics Engine */}
      <DashboardCharts
        dailyData={dailyData}
        statusData={statusData}
        paymentData={paymentData}
        isAdmin={isAdmin}
        allTimeRevenue={stats.allTimeRevenue}
        allTimeAppointments={stats.totalPatients}
      />

      {/* 7. SECTION 2: RECENT FINANCIAL TRANSACTIONS (50%) + POST-PROCEDURE CARE QUEUE (50%) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Recent POS Invoices & Sales Stream */}
        <Card className="border-2 border-slate-300 hover:border-slate-400 hover:shadow-md transition-all duration-200 rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 sm:p-6 pb-4 border-b-2 border-slate-200 bg-slate-50/90">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-950 font-serif">
                  Recent Invoices & Transactions
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-600 font-medium mt-0.5">
                Latest patient treatment billings and POS retail sales
              </CardDescription>
            </div>
            <Link href="/dashboard/invoices">
              <Button variant="ghost" size="sm" className="text-xs text-emerald-800 hover:text-emerald-900 font-bold hover:bg-emerald-50 hover:translate-x-0.5 transition-all">
                <span>All Invoices</span>
                <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {recentInvoices.length === 0 ? (
              <div className="text-center py-10 px-4 text-slate-500">
                <Receipt className="h-8 w-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm font-bold text-slate-800">No invoices issued today yet</p>
                <p className="text-xs text-slate-500 font-medium">New POS sales will appear here in real-time.</p>
              </div>
            ) : (
              <div className="p-4 space-y-2.5">
                {recentInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="group/entry p-3.5 sm:p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-400 bg-white hover:bg-emerald-50/20 hover:shadow-xs transition-all duration-150 flex items-center justify-between gap-3 text-xs cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-950 group-hover/entry:text-emerald-950 transition-colors">
                          {inv.invoice_number}
                        </span>
                        <span className="font-semibold text-slate-800 truncate">
                          {inv.customer_name || 'Walk-in Customer'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-2 font-medium">
                        <span className="capitalize font-bold text-slate-800">
                          {inv.payment_method?.replace('_', ' ') || 'Cash'}
                        </span>
                        <span>•</span>
                        <span>{formatDate(inv.created_at)}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-slate-950 text-sm sm:text-base font-serif group-hover/entry:text-emerald-700 transition-colors">
                        {formatCurrency(inv.total)}
                      </p>
                      <Badge
                        className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-2xs ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-950 border-2 border-emerald-400'
                            : 'bg-amber-100 text-amber-950 border-2 border-amber-400'
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
        <Card className="border-2 border-slate-300 hover:border-slate-400 hover:shadow-md transition-all duration-200 rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 sm:p-6 pb-4 border-b-2 border-slate-200 bg-slate-50/90">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Stethoscope className="h-3.5 w-3.5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-950 font-serif">
                  Post-Procedure Follow-Up Queue
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-600 font-medium mt-0.5">
                Patients scheduled for operational check-in calls or healing reviews
              </CardDescription>
            </div>
            <Badge className="text-xs font-extrabold bg-rose-100 text-rose-900 border-2 border-rose-300 shadow-2xs">
              {followUps.length} Pending
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            {followUps.length === 0 ? (
              <div className="text-center py-10 px-4 space-y-2">
                <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600" />
                <p className="text-sm font-bold text-slate-800">All follow-ups are up to date!</p>
                <p className="text-xs text-slate-500 font-medium">No overdue patient calls pending today.</p>
              </div>
            ) : (
              <div className="p-4 space-y-2.5">
                {followUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="group/entry p-3.5 sm:p-4 rounded-xl border-2 border-slate-200 hover:border-rose-400 bg-white hover:bg-rose-50/20 hover:shadow-xs transition-all duration-150 flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-950 truncate group-hover/entry:text-rose-950 transition-colors">
                        {fu.patient?.name || 'Patient'}
                      </p>
                      <p className="text-xs text-slate-600 flex flex-wrap items-center gap-2 mt-0.5 font-medium">
                        <span className="flex items-center gap-1 font-semibold text-slate-800">
                          <Phone className="h-3.5 w-3.5 text-rose-600" />
                          {fu.patient?.phone}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-800">Due: {formatDate(fu.due_date)}</span>
                        {fu.treatment && (
                          <>
                            <span>•</span>
                            <span className="text-rose-700 font-bold">{fu.treatment.name}</span>
                          </>
                        )}
                      </p>
                      {fu.notes && (
                        <p className="text-xs text-slate-500 mt-1 italic line-clamp-1 font-medium">
                          &ldquo;{fu.notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      disabled={isCompleting}
                      onClick={() => handleCompleteFollowUp(fu.id, fu.patient?.name || 'Patient')}
                      className="text-xs shrink-0 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-xs hover:scale-105 active:scale-95 transition-all duration-200 font-bold shadow-2xs"
                    >
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Mark Done
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 8. SECTION 3: INVENTORY WATCHLIST & CLINIC HIGHLIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start pb-8">
        {/* Low Stock Watchlist */}
        <Card className="border-2 border-slate-300 hover:border-slate-400 hover:shadow-md transition-all duration-200 rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-4 border-b-2 border-slate-200 bg-slate-50/90">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Package className="h-3.5 w-3.5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-950 font-serif">
                  Inventory Watchlist & Reorder
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-600 font-medium mt-0.5">
                Products nearing low stock threshold in clinic dispensary
              </CardDescription>
            </div>
            <Link href="/dashboard/inventory">
              <Button variant="ghost" size="sm" className="text-xs text-amber-800 hover:text-amber-900 font-bold hover:bg-amber-50 hover:translate-x-0.5 transition-all">
                <span>Manage Stock</span>
                <ChevronRight className="h-4 w-4 ml-0.5" />
              </Button>
            </Link>
          </CardHeader>

          <CardContent className="p-0">
            {lowStockProducts.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle2 className="h-7 w-7 mx-auto mb-1.5 text-emerald-600" />
                <p className="text-xs font-bold text-slate-800">All products have healthy stock levels</p>
              </div>
            ) : (
              <div className="p-4 space-y-2.5">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="group/entry p-3.5 sm:p-4 rounded-xl border-2 border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/20 hover:shadow-xs transition-all duration-150 flex items-center justify-between gap-3 text-xs cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-950 truncate group-hover/entry:text-amber-950 transition-colors">{p.name}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                        SKU: {p.sku || 'N/A'} · Threshold: {p.low_stock_threshold}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge
                        className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-2xs ${
                          p.stock_quantity <= 0
                            ? 'bg-rose-100 text-rose-950 border-2 border-rose-400'
                            : 'bg-amber-100 text-amber-950 border-2 border-amber-400'
                        }`}
                      >
                        {p.stock_quantity} left
                      </Badge>
                      <Link href={`/dashboard/inventory`}>
                        <Button size="sm" className="h-8 px-3 text-xs bg-rose-600 text-white font-bold hover:bg-rose-700 hover:scale-105 transition-all duration-200 shadow-2xs">
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
        <Card className="border-2 border-slate-300 hover:border-slate-400 hover:shadow-md transition-all duration-200 rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-4 border-b-2 border-slate-200 bg-slate-50/90">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <Activity className="h-3.5 w-3.5" />
                </div>
                <CardTitle className="text-base font-bold text-slate-950 font-serif">
                  Clinical Services & Procedures
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-600 font-medium mt-0.5">
                Featured doctor-led aesthetic protocols and treatment pricing
              </CardDescription>
            </div>
            <Link href="/dashboard/content/treatments">
              <Button variant="ghost" size="sm" className="text-xs text-rose-700 hover:text-rose-800 font-bold hover:bg-rose-50 hover:translate-x-0.5 transition-all">
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
                  className="group/entry p-3.5 sm:p-4 rounded-xl border-2 border-slate-200 hover:border-rose-400 bg-white hover:bg-rose-50/20 hover:shadow-xs transition-all duration-150 flex items-center justify-between gap-3 text-xs cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-950 truncate group-hover/entry:text-rose-950 transition-colors">{t.name}</p>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
                      {t.duration_minutes ? `${t.duration_minutes} mins duration` : 'Standard protocol'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-rose-700 font-serif text-sm group-hover/entry:text-rose-800 transition-colors">
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
