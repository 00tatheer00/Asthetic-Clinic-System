'use client';

import Link from 'next/link';
import NextImage from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import {
  LayoutDashboard, Calendar, ShoppingCart, Package, Users,
  FileText, Warehouse, Stethoscope, Box, Image, Star,
  BarChart3, Settings, LogOut, Menu, ChevronDown, Bell,
  PanelLeftClose, PanelLeft, AlertTriangle, CheckCircle2, ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { createClient } from '@/lib/supabase/client';
import { DASHBOARD_NAV_SECTIONS } from '@/lib/constants';
import { getInitials } from '@/lib/utils/helpers';
import type { Staff } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ClearCacheButton } from '@/components/clear-cache-button';
import { clearBrowserCacheAndReload } from '@/lib/cache-utils';
import { RefreshCw } from 'lucide-react';
import { RouteProgressBar } from '@/components/public/route-progress-bar';
import { RealtimeBookingNotifier } from './realtime-booking-notifier';
import { formatDateTime } from '@/lib/utils/helpers';

// Map icon strings to components
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Calendar, ShoppingCart, Package, Users,
  FileText, Warehouse, Stethoscope, Box, Image, Star,
  BarChart3, Settings,
};

interface DashboardShellProps {
  staff: Staff;
  children: React.ReactNode;
}

export function DashboardShell({ staff, children }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAdmin = staff.role === 'super_admin';
  const [lowStockItems, setLowStockItems] = useState<Array<{ id: string; name: string; stock_quantity: number; sku?: string | null }>>([]);
  const [pendingBookings, setPendingBookings] = useState<Array<{
    id: string;
    customer_name: string;
    customer_phone: string;
    scheduled_at: string;
    treatments?: { name: string } | null;
  }>>([]);
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);
  const [pendingOrders, setPendingOrders] = useState<Array<{
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    total: number;
    status: string;
    created_at: string;
  }>>([]);
  const [notifTab, setNotifTab] = useState<'bookings' | 'orders' | 'stock' | 'reviews'>('bookings');

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const supabase = createClient();
        const [{ data: products }, { data: bookings }, { count: revCount }, { data: orders }] = await Promise.all([
          supabase
            .from('products')
            .select('id, name, stock_quantity, sku')
            .eq('is_active', true)
            .lte('stock_quantity', 5)
            .order('stock_quantity', { ascending: true })
            .limit(10),
          supabase
            .from('appointments')
            .select('id, customer_name, customer_phone, scheduled_at, treatments(name)')
            .eq('status', 'pending')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(8),
          supabase
            .from('reviews')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending')
            .is('deleted_at', null),
          supabase
            .from('orders')
            .select('id, order_number, customer_name, customer_phone, total, status, created_at')
            .in('status', ['received', 'confirmed', 'preparing'])
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(8),
        ]);
        if (products) setLowStockItems(products);
        if (bookings) setPendingBookings(bookings as any);
        if (typeof revCount === 'number') setPendingReviewsCount(revCount);
        if (orders) setPendingOrders(orders as any);
      } catch {
        // silent fallback
      }
    };
    fetchAlerts();

    const handleNewApt = () => {
      fetchAlerts();
    };
    window.addEventListener('clinic_appointment_created', handleNewApt);
    return () => {
      window.removeEventListener('clinic_appointment_created', handleNewApt);
    };
  }, [pathname]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  };

  const navContent = (
    <div className="flex-1 min-h-0 overflow-y-auto py-2 px-1 overscroll-contain [scrollbar-width:thin] [scrollbar-color:rgba(244,63,94,0.3)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 hover:[&::-webkit-scrollbar-thumb]:bg-rose-300">
      {DASHBOARD_NAV_SECTIONS.map((section) => {
        const visibleItems = section.items.filter(
          (item) => !('adminOnly' in item && item.adminOnly) || isAdmin
        );
        if (visibleItems.length === 0) return null;

        return (
          <div key={section.label} className="mb-2">
            {!collapsed && (
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                {section.label}
              </p>
            )}
            {visibleItems.map((item) => {
              const Icon = iconMap[item.icon] || LayoutDashboard;
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname === item.href || pathname.startsWith(item.href + '/');

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'group/nav relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 mx-2 cursor-pointer',
                    isActive
                      ? 'bg-rose-50/90 text-rose-700 font-semibold shadow-xs border border-rose-200/70'
                      : 'text-gray-600 hover:bg-rose-50/50 hover:text-rose-700 hover:translate-x-1',
                    collapsed && 'justify-center px-2 hover:translate-x-0'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover/nav:scale-110',
                      isActive ? 'text-rose-600' : 'text-gray-400 group-hover/nav:text-rose-600'
                    )}
                  />
                  {!collapsed && <span className="transition-colors duration-200">{item.label}</span>}
                  {item.href === '/dashboard/reviews' && pendingReviewsCount > 0 && !collapsed && (
                    <span className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full shadow-xs animate-pulse">
                      {pendingReviewsCount}
                    </span>
                  )}
                  {isActive && !collapsed && !(item.href === '/dashboard/reviews' && pendingReviewsCount > 0) && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-rose-600 animate-pulse" />
                  )}
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger className="w-full">{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }

              return <div key={item.href}>{link}</div>;
            })}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="fixed inset-0 h-screen w-screen flex overflow-hidden bg-slate-50">
      <Suspense fallback={null}>
        <RouteProgressBar />
      </Suspense>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-full border-r border-gray-200 bg-white transition-all duration-300 shrink-0 select-none z-20 min-h-0 overflow-hidden',
          collapsed ? 'w-[68px]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className={cn('flex items-center h-16 shrink-0 px-4 border-b border-gray-100 bg-white', collapsed && 'justify-center px-2')}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 rounded-xl overflow-hidden border border-rose-100 shadow-sm shrink-0 bg-white">
              <NextImage
                src="/images/logo.png"
                alt="Brimish Skin Care Logo"
                width={36}
                height={36}
                className="h-full w-full object-contain p-0.5"
              />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 tracking-tight font-serif leading-tight">
                  Brimish
                </span>
                <span className="text-[10px] text-rose-600 font-medium tracking-wide">
                  Clinic Intelligence
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Nav */}
        {navContent}


        {/* Collapse Toggle */}
        <div className="border-t border-gray-100 p-2 shrink-0 bg-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="w-full justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50/80 transition-all duration-200"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col h-full overflow-hidden min-w-0">
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-8 z-10 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                aria-label="Open navigation menu"
                className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Dashboard Navigation</SheetTitle>
                <div className="flex items-center h-16 px-4 border-b border-gray-100">
                  <div className="flex items-center gap-2.5">
                    <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-rose-100 shadow-sm shrink-0 bg-white">
                      <NextImage
                        src="/images/logo.png"
                        alt="Brimish Skin Care Logo"
                        width={32}
                        height={32}
                        className="h-full w-full object-contain p-0.5"
                      />
                    </div>
                    <span className="text-sm font-bold text-gray-900 font-serif">Brimish</span>
                  </div>
                </div>
                <div className="flex flex-col h-[calc(100%-4rem)] min-h-0 overflow-hidden">
                  {navContent}

                </div>
              </SheetContent>
            </Sheet>

            <h2 className="text-sm font-medium text-gray-700 hidden sm:block">
              Clinic Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Clear Browser Cache & Reload Button */}
            <ClearCacheButton variant="icon" />

            {/* Notifications: Online Bookings & Low Stock Alerts */}
            {(() => {
              const totalAlerts = pendingBookings.length + pendingOrders.length + lowStockItems.length + pendingReviewsCount;
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="relative h-9 w-9 flex items-center justify-center text-gray-500 hover:text-rose-600 hover:bg-rose-50 hover:scale-105 transition-all duration-200 rounded-xl cursor-pointer border border-transparent hover:border-rose-100"
                    aria-label="Clinic Alerts"
                  >
                    <Bell className="h-[18px] w-[18px]" />
                    {totalAlerts > 0 && (
                      <span className={cn(
                        'absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-bold text-white shadow-xs',
                        pendingBookings.length > 0 ? 'bg-rose-600 animate-pulse ring-2 ring-white' : 'bg-amber-600'
                      )}>
                        {totalAlerts}
                      </span>
                    )}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[340px] sm:w-[420px] p-0 shadow-xl rounded-2xl border-rose-100 bg-white">
                    {/* Header Tabs — 4 notification categories */}
                    <div className="p-2 bg-gradient-to-r from-rose-50/90 to-pink-50/90 border-b border-rose-100">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setNotifTab('bookings')}
                          className={cn(
                            'flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1',
                            notifTab === 'bookings'
                              ? 'bg-white text-rose-900 shadow-xs'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                          )}
                        >
                          <Calendar className="h-3 w-3 text-rose-600" />
                          <span className="hidden sm:inline">Bookings</span>
                          {pendingBookings.length > 0 && (
                            <span className="h-4 min-w-4 px-1 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                              {pendingBookings.length}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setNotifTab('orders')}
                          className={cn(
                            'flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1',
                            notifTab === 'orders'
                              ? 'bg-white text-blue-900 shadow-xs'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                          )}
                        >
                          <ShoppingCart className="h-3 w-3 text-blue-600" />
                          <span className="hidden sm:inline">Orders</span>
                          {pendingOrders.length > 0 && (
                            <span className="h-4 min-w-4 px-1 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center">
                              {pendingOrders.length}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setNotifTab('stock')}
                          className={cn(
                            'flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1',
                            notifTab === 'stock'
                              ? 'bg-white text-amber-900 shadow-xs'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                          )}
                        >
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          <span className="hidden sm:inline">Stock</span>
                          {lowStockItems.length > 0 && (
                            <span className="h-4 min-w-4 px-1 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center">
                              {lowStockItems.length}
                            </span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setNotifTab('reviews')}
                          className={cn(
                            'flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1',
                            notifTab === 'reviews'
                              ? 'bg-white text-purple-900 shadow-xs'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                          )}
                        >
                          <MessageSquare className="h-3 w-3 text-purple-600" />
                          <span className="hidden sm:inline">Reviews</span>
                          {pendingReviewsCount > 0 && (
                            <span className="h-4 min-w-4 px-1 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">
                              {pendingReviewsCount}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Tab 1: Online Bookings Queue */}
                    {notifTab === 'bookings' && (
                      <div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 p-1">
                          {pendingBookings.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                              <span className="font-medium text-gray-700">No pending online bookings</span>
                              <span className="text-[11px] text-gray-400">New website requests will alert with audio chime</span>
                            </div>
                          ) : (
                            pendingBookings.map((apt) => (
                              <div
                                key={apt.id}
                                className="p-3 hover:bg-rose-50/50 flex items-start justify-between gap-3 text-xs transition-colors rounded-xl"
                              >
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-gray-950 truncate">{apt.customer_name}</p>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold uppercase">
                                      Pending
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-rose-700 font-medium truncate">
                                    {apt.treatments?.name || 'Aesthetic Treatment'}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    Slot: {formatDateTime(apt.scheduled_at)}
                                  </p>
                                  <p className="text-[10px] text-gray-400 font-mono">
                                    Phone: {apt.customer_phone}
                                  </p>
                                </div>
                                <Link
                                  href={`/dashboard/appointments?status=pending&search=${encodeURIComponent(apt.customer_name)}`}
                                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#2D1226] hover:bg-[#431b39] text-white text-[11px] font-semibold transition shadow-xs"
                                >
                                  Review
                                </Link>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="p-2.5 bg-gray-50/80 border-t border-gray-100 text-center">
                          <Link
                            href="/dashboard/appointments?status=pending"
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
                          >
                            <span>Open All Pending Online Requests</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Tab 2: Stock Alerts */}
                    {notifTab === 'stock' && (
                      <div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 p-1">
                          {lowStockItems.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                              <span className="font-medium text-gray-700">All products adequately stocked</span>
                            </div>
                          ) : (
                            lowStockItems.map((item) => (
                              <div key={item.id} className="p-2.5 hover:bg-amber-50/40 flex items-center justify-between gap-2 text-xs transition-colors rounded-lg">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-gray-900 truncate leading-snug">{item.name}</p>
                                  {item.sku && <p className="text-[10px] text-gray-400 font-mono">SKU: {item.sku}</p>}
                                </div>
                                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', item.stock_quantity <= 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                                  {item.stock_quantity <= 0 ? 'Out of Stock' : `${item.stock_quantity} left`}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="p-2.5 bg-gray-50/80 border-t border-gray-100 text-center">
                          <Link
                            href="/dashboard/inventory?filter=low"
                            className="text-xs font-semibold text-amber-700 hover:text-amber-800 inline-flex items-center gap-1"
                          >
                            <span>Open Inventory Restock</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Pending Orders */}
                    {notifTab === 'orders' && (
                      <div>
                        <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 p-1">
                          {pendingOrders.length === 0 ? (
                            <div className="p-6 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                              <span className="font-medium text-gray-700">No pending orders</span>
                              <span className="text-[11px] text-gray-400">All customer orders have been processed</span>
                            </div>
                          ) : (
                            pendingOrders.map((order) => (
                              <div
                                key={order.id}
                                className="p-3 hover:bg-blue-50/50 flex items-start justify-between gap-3 text-xs transition-colors rounded-xl"
                              >
                                <div className="min-w-0 flex-1 space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-gray-950 truncate">{order.customer_name}</p>
                                    <span className={cn(
                                      'text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase',
                                      order.status === 'received' ? 'bg-amber-100 text-amber-800' :
                                      order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                      'bg-indigo-100 text-indigo-800'
                                    )}>
                                      {order.status}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-gray-700 font-mono font-semibold">
                                    {order.order_number}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    Total: PKR {(order.total || 0).toLocaleString()} · {formatDateTime(order.created_at)}
                                  </p>
                                </div>
                                <Link
                                  href={`/dashboard/orders?search=${encodeURIComponent(order.order_number)}`}
                                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition shadow-xs"
                                >
                                  Process
                                </Link>
                              </div>
                            ))
                          )}
                        </div>
                        <div className="p-2.5 bg-gray-50/80 border-t border-gray-100 text-center">
                          <Link
                            href="/dashboard/orders"
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                          >
                            <span>Open All Orders</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* Tab 4: Pending Reviews */}
                    {notifTab === 'reviews' && (
                      <div>
                        <div className="p-6 text-center text-xs space-y-3">
                          {pendingReviewsCount === 0 ? (
                            <div className="flex flex-col items-center gap-2">
                              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                              <span className="font-medium text-gray-700">All reviews have been moderated</span>
                              <span className="text-[11px] text-gray-400">No new patient reviews awaiting approval</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-3">
                              <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center">
                                <MessageSquare className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-950">
                                  {pendingReviewsCount} Review{pendingReviewsCount > 1 ? 's' : ''} Awaiting Moderation
                                </p>
                                <p className="text-[11px] text-gray-500 mt-1">
                                  Patient testimonials need your approval before they appear on the public website.
                                </p>
                              </div>
                              <Link
                                href="/dashboard/reviews"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition shadow-xs"
                              >
                                <span>Review & Approve</span>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 pl-2 pr-3 h-9 rounded-xl hover:bg-rose-50/70 border border-transparent hover:border-rose-200/60 transition-all duration-200 cursor-pointer">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-rose-100 text-rose-700 text-xs font-semibold">
                    {getInitials(staff.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-xs font-medium text-gray-900 leading-none">
                    {staff.name}
                  </span>
                  <span className="text-[10px] text-gray-500 leading-none mt-0.5">
                    {staff.role === 'super_admin' ? 'Admin' : 'Receptionist'}
                  </span>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400 hidden sm:block" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <div className="px-2 py-1.5 sm:hidden">
                  <p className="text-sm font-medium">{staff.name}</p>
                  <p className="text-xs text-gray-500">
                    {staff.role === 'super_admin' ? 'Admin' : 'Receptionist'}
                  </p>
                </div>
                <DropdownMenuSeparator className="sm:hidden" />
                <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => clearBrowserCacheAndReload()}
                  className="text-gray-700 hover:text-rose-600 cursor-pointer"
                >
                  <RefreshCw className="mr-2 h-4 w-4 text-rose-500" />
                  Clear Cache & Refresh
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  variant="destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main
          className={cn(
            'flex-1 min-h-0 bg-slate-50/60',
            pathname === '/dashboard/pos' ? 'overflow-hidden flex flex-col' : 'overflow-y-auto'
          )}
        >
          <div
            className={cn(
              pathname === '/dashboard/pos'
                ? 'h-full flex flex-col p-2.5 sm:p-4 overflow-hidden'
                : 'mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-20 animate-page-enter'
            )}
          >
            <RealtimeBookingNotifier />
            {children}


          </div>
        </main>
      </div>
    </div>
  );
}
