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
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import { searchClinicGlobal, completeFollowUp, type GlobalSearchResult } from '@/actions/intelligence';
import { toast } from 'sonner';

interface DashboardIntelligenceProps {
  isAdmin: boolean;
  staffName: string;
  stats: {
    todayAppointments: number;
    todayCompletedVisits: number;
    todayRevenue: number;
    monthRevenue: number;
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
        toast.success(`Follow-up completed for ${patientName}`);
      } else {
        toast.error(res.error || 'Failed to complete follow-up');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Fast Global Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Welcome back, {staffName.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Operational and business intelligence overview for Brimish Skin Care Clinic.
          </p>
        </div>

        {/* Global Fast Search Bar */}
        <div className="relative w-full md:w-80">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search patient, phone, invoice, SKU..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-white rounded-xl shadow-xs border-gray-200"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-rose-500" />
            )}
          </div>

          {/* Quick Search Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {searchResults.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="block p-3 hover:bg-rose-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-rose-600 tracking-wider">
                      {item.type}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.subtitle}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actionable Business Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-sm ${
                alert.type === 'critical'
                  ? 'bg-red-50/70 border-red-200 text-red-900'
                  : alert.type === 'warning'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : 'bg-blue-50/70 border-blue-200 text-blue-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  <strong className="font-semibold">{alert.title}:</strong> {alert.description}
                </span>
              </div>
              <Link href={alert.href} className="underline text-xs font-medium shrink-0 hover:opacity-80">
                View &rarr;
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Appointments */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-blue-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Today&apos;s Appointments
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.todayAppointments}</p>
                <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {stats.todayCompletedVisits} completed
                </p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-100/60 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue KPI (Admin Only) or Patient Load */}
        {isAdmin ? (
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-emerald-50/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Today&apos;s Revenue
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.todayRevenue)}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Month: {formatCurrency(stats.monthRevenue)}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-emerald-100/60 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-indigo-50/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Total Patients
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalPatients}</p>
                  <p className="text-xs text-indigo-600 mt-1">Registered Clinic Patients</p>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-100/60 flex items-center justify-center">
                  <Users className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pending Online Orders */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-amber-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Pending Orders
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingOrders}</p>
                <p className="text-xs text-amber-600 mt-1">Web Checkout Dispatch</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-100/60 flex items-center justify-center">
                <Package className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inventory Alert KPI */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-rose-50/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  Low Stock Items
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.lowStockCount}</p>
                <p className="text-xs text-rose-600 mt-1">Requires Reordering</p>
              </div>
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                  stats.lowStockCount > 0 ? 'bg-red-100/60' : 'bg-green-100/60'
                }`}
              >
                <AlertTriangle
                  className={`h-6 w-6 ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Follow-Up Queue & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Patient Follow-Up Queue */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  Post-Procedure Follow-Up Queue
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Patients scheduled for operational follow-up calls or healing checks.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs font-normal">
                {followUps.length} Pending
              </Badge>
            </CardHeader>
            <CardContent>
              {followUps.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500 opacity-80" />
                  <p className="text-sm font-medium text-gray-600">All follow-ups are up to date!</p>
                  <p className="text-xs text-gray-400">No overdue patient calls pending today.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {followUps.map((fu) => (
                    <div key={fu.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {fu.patient?.name || 'Patient'}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {fu.patient?.phone}
                          </span>
                          <span>•</span>
                          <span>Due: {formatDate(fu.due_date)}</span>
                          {fu.treatment && (
                            <>
                              <span>•</span>
                              <span className="text-rose-600 font-medium">{fu.treatment.name}</span>
                            </>
                          )}
                        </p>
                        {fu.notes && <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{fu.notes}&rdquo;</p>}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isCompleting}
                        onClick={() => handleCompleteFollowUp(fu.id, fu.patient?.name || 'Patient')}
                        className="text-xs shrink-0 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                        Mark Done
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Quick Operational Actions */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-900">
                Front-Desk Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/pos">
                <Button className="w-full h-auto py-3.5 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-xl shadow-xs">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="text-xs font-medium">New POS Sale</span>
                </Button>
              </Link>
              <Link href="/dashboard/appointments?new=true">
                <Button
                  variant="outline"
                  className="w-full h-auto py-3.5 flex flex-col items-center justify-center gap-1.5 rounded-xl border-gray-200"
                >
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <span className="text-xs font-medium">Book Visit</span>
                </Button>
              </Link>
              <Link href="/dashboard/patients?new=true">
                <Button
                  variant="outline"
                  className="w-full h-auto py-3.5 flex flex-col items-center justify-center gap-1.5 rounded-xl border-gray-200"
                >
                  <Users className="h-5 w-5 text-indigo-600" />
                  <span className="text-xs font-medium">Add Patient</span>
                </Button>
              </Link>
              <Link href="/dashboard/inventory?new=true">
                <Button
                  variant="outline"
                  className="w-full h-auto py-3.5 flex flex-col items-center justify-center gap-1.5 rounded-xl border-gray-200"
                >
                  <Package className="h-5 w-5 text-amber-600" />
                  <span className="text-xs font-medium">Add Stock</span>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* End-of-Day Quick Reconciliation Link */}
          {isAdmin && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-900 to-gray-800 text-white">
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">End-of-Day Closing</h3>
                    <p className="text-xs text-gray-300 mt-0.5">
                      Verify register reconciliation & download closing CSV.
                    </p>
                  </div>
                  <Link href="/dashboard/reports">
                    <Button size="sm" variant="secondary" className="rounded-lg text-xs">
                      Reconcile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
