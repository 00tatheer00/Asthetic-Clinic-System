import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { createClient } from '@/lib/supabase/server';
import { DashboardIntelligence } from './dashboard-intelligence';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Brimish Clinic Intelligence',
  description: 'Operational analytics, patient follow-up queue, and clinic KPIs.',
};

export default async function DashboardPage() {
  const staff = await getAuthenticatedStaff();
  const supabase = await createClient();
  const isAdmin = staff.role === 'super_admin';

  const today = new Date();
  const todayDateStr = today.toISOString().split('T')[0];
  const firstDayOfMonthISO = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const todayStartISO = `${todayDateStr}T00:00:00.000Z`;

  // Parallel database queries for real-time intelligence
  const [
    appointmentsRes,
    completedVisitsRes,
    ordersRes,
    lowStockRes,
    reviewsRes,
    patientsCountRes,
    todayInvoicesRes,
    monthInvoicesRes,
    followUpsRes,
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('appointment_date', todayDateStr),

    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('appointment_date', todayDateStr)
      .eq('status', 'completed'),

    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['received', 'confirmed', 'preparing']),

    supabase
      .from('products')
      .select('id, name, stock_quantity, reorder_level')
      .lte('stock_quantity', 5)
      .eq('is_active', true),

    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('is_approved', false),

    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true }),

    supabase
      .from('invoices')
      .select('total')
      .gte('created_at', todayStartISO)
      .neq('status', 'voided'),

    supabase
      .from('invoices')
      .select('total')
      .gte('created_at', firstDayOfMonthISO)
      .neq('status', 'voided'),

    supabase
      .from('patient_follow_ups')
      .select('id, due_date, notes, status, patients(id, name, phone), treatments(name)')
      .eq('status', 'pending')
      .lte('due_date', todayDateStr)
      .order('due_date', { ascending: true })
      .limit(6),
  ]);

  // Aggregate today's and monthly revenue
  const todayRevenue = (todayInvoicesRes.data || []).reduce(
    (sum, inv) => sum + (Number(inv.total) || 0),
    0
  );
  const monthRevenue = (monthInvoicesRes.data || []).reduce(
    (sum, inv) => sum + (Number(inv.total) || 0),
    0
  );

  const lowStockCount = lowStockRes.data?.length ?? 0;
  const pendingOrdersCount = ordersRes.count ?? 0;
  const pendingReviewsCount = reviewsRes.count ?? 0;

  // Build actionable business alerts
  const alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'critical';
    title: string;
    description: string;
    href: string;
  }> = [];

  if (lowStockCount > 0) {
    alerts.push({
      id: 'alert-low-stock',
      type: 'warning',
      title: 'Low Inventory Warning',
      description: `${lowStockCount} product(s) have reached or fallen below reorder levels.`,
      href: '/dashboard/inventory',
    });
  }

  if (pendingOrdersCount > 0) {
    alerts.push({
      id: 'alert-pending-orders',
      type: 'info',
      title: 'Web Orders Pending',
      description: `${pendingOrdersCount} customer order(s) require confirmation and packaging.`,
      href: '/dashboard/orders',
    });
  }

  if (pendingReviewsCount > 0) {
    alerts.push({
      id: 'alert-reviews',
      type: 'info',
      title: 'Testimonials Awaiting Moderation',
      description: `${pendingReviewsCount} patient review(s) are pending approval for public display.`,
      href: '/dashboard/reviews',
    });
  }

  // Normalize follow-up records
  const normalizedFollowUps = (followUpsRes.data || []).map((fu: any) => ({
    id: fu.id,
    due_date: fu.due_date,
    notes: fu.notes,
    status: fu.status,
    patient: Array.isArray(fu.patients) ? fu.patients[0] || null : fu.patients || null,
    treatment: Array.isArray(fu.treatments) ? fu.treatments[0] || null : fu.treatments || null,
  }));

  return (
    <DashboardIntelligence
      isAdmin={isAdmin}
      staffName={staff.name}
      stats={{
        todayAppointments: appointmentsRes.count ?? 0,
        todayCompletedVisits: completedVisitsRes.count ?? 0,
        todayRevenue,
        monthRevenue,
        pendingOrders: pendingOrdersCount,
        lowStockCount,
        pendingReviewsCount,
        totalPatients: patientsCountRes.count ?? 0,
      }}
      followUps={normalizedFollowUps}
      alerts={alerts}
    />
  );
}
