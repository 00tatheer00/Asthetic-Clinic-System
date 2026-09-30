import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Package, AlertTriangle, Users, ShoppingCart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const staff = await getAuthenticatedStaff();
  const supabase = await createClient();
  const isAdmin = staff.role === 'super_admin';

  // Fetch basic stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();
  const tomorrowISO = new Date(today.getTime() + 86400000).toISOString();

  const [appointmentsRes, ordersRes, lowStockRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_at', todayISO)
      .lt('scheduled_at', tomorrowISO)
      .is('deleted_at', null),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['received', 'confirmed', 'preparing'])
      .is('deleted_at', null),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .filter('stock_quantity', 'lte', 'low_stock_threshold')
      .eq('is_active', true)
      .is('deleted_at', null),
  ]);

  const stats = {
    todayAppointments: appointmentsRes.count ?? 0,
    pendingOrders: ordersRes.count ?? 0,
    lowStockCount: lowStockRes.count ?? 0,
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getGreeting()}, {staff.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here&apos;s what&apos;s happening at the clinic today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/appointments">
            <Button size="sm" variant="outline" className="rounded-lg">
              <Calendar className="h-4 w-4 mr-1.5" />
              Appointments
            </Button>
          </Link>
          <Link href="/dashboard/pos">
            <Button size="sm" className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-lg">
              <ShoppingCart className="h-4 w-4 mr-1.5" />
              New Sale
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Today&apos;s Appointments</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.todayAppointments}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Orders</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingOrders}</p>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.lowStockCount}</p>
              </div>
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${stats.lowStockCount > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                <AlertTriangle className={`h-5 w-5 ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Patient', href: '/dashboard/patients?new=true', icon: Users, color: 'bg-indigo-50 text-indigo-600' },
            { label: 'New Appointment', href: '/dashboard/appointments?new=true', icon: Calendar, color: 'bg-blue-50 text-blue-600' },
            { label: 'New Sale', href: '/dashboard/pos', icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Add Product', href: '/dashboard/inventory?new=true', icon: Plus, color: 'bg-amber-50 text-amber-600' },
          ].map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="border border-gray-100 shadow-none hover:shadow-md hover:border-gray-200 transition-all cursor-pointer">
                <CardContent className="pt-5 pb-4 text-center">
                  <div className={`h-10 w-10 rounded-xl ${action.color} flex items-center justify-center mx-auto mb-2`}>
                    <action.icon className="h-4.5 w-4.5" />
                  </div>
                  <p className="text-sm font-medium text-gray-700">{action.label}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
