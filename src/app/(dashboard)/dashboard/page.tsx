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
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const todayDateStr = today.toISOString().split('T')[0];
  const firstDayOfMonthISO = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const todayStartISO = todayStart.toISOString();

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();

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
    todayAppointmentsListRes,
    recentInvoicesRes,
    lowStockProductsRes,
    popularTreatmentsRes,
    sevenDaysInvoicesRes,
    sevenDaysAppointmentsRes,
    monthAppointmentsStatusRes,
    pendingOnlineBookingsRes,
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString())
      .is('deleted_at', null),

    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString())
      .eq('status', 'completed')
      .is('deleted_at', null),

    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['received', 'confirmed', 'preparing'])
      .is('deleted_at', null),

    supabase
      .from('products')
      .select('id, name, stock_quantity, low_stock_threshold')
      .lte('stock_quantity', 5)
      .eq('is_active', true)
      .is('deleted_at', null),

    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .is('deleted_at', null),

    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),

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

    // Full rows for Today's Appointments Schedule
    supabase
      .from('appointments')
      .select('id, scheduled_at, status, notes, total_price, customer_name, customer_phone, treatments(id, name, duration_minutes, price), patients(id, name, phone)')
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString())
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true })
      .limit(10),

    // Full rows for Recent Transactions / POS Invoices
    supabase
      .from('invoices')
      .select('id, invoice_number, customer_name, customer_phone, total, status, payment_method, created_at')
      .neq('status', 'voided')
      .order('created_at', { ascending: false })
      .limit(6),

    // Low stock watchlist products
    supabase
      .from('products')
      .select('id, name, sku, stock_quantity, low_stock_threshold, sale_price')
      .lte('stock_quantity', 10)
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('stock_quantity', { ascending: true })
      .limit(5),

    // Top clinic treatments
    supabase
      .from('treatments')
      .select('id, name, price, duration_minutes')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('price', { ascending: false })
      .limit(4),

    // 7-day rolling invoices for revenue line chart & payment tender breakdown
    supabase
      .from('invoices')
      .select('total, created_at, payment_method')
      .gte('created_at', sevenDaysAgoISO)
      .neq('status', 'voided'),

    // 7-day rolling appointments for volume bar chart
    supabase
      .from('appointments')
      .select('id, scheduled_at, status')
      .gte('scheduled_at', sevenDaysAgoISO)
      .is('deleted_at', null),

    // Monthly appointment status distribution
    supabase
      .from('appointments')
      .select('status')
      .gte('scheduled_at', firstDayOfMonthISO)
      .is('deleted_at', null),

    // Pending Online Booking Requests (regardless of scheduled date so staff never misses upcoming bookings)
    supabase
      .from('appointments')
      .select('id, scheduled_at, status, message, customer_name, customer_phone, created_at, treatments(id, name, duration_minutes, price)')
      .eq('status', 'pending')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
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

  // Normalize today's appointments
  const normalizedAppointments = (todayAppointmentsListRes.data || []).map((app: any) => ({
    id: app.id,
    scheduled_at: app.scheduled_at,
    status: app.status,
    notes: app.notes,
    total_price: Number(app.total_price) || 0,
    customer_name: app.customer_name || app.patients?.name || 'Walk-in Patient',
    customer_phone: app.customer_phone || app.patients?.phone || '',
    treatment: Array.isArray(app.treatments) ? app.treatments[0] || null : app.treatments || null,
  }));

  // Normalize recent invoices
  const normalizedInvoices = (recentInvoicesRes.data || []).map((inv: any) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    customer_name: inv.customer_name,
    customer_phone: inv.customer_phone,
    total: Number(inv.total) || 0,
    status: inv.status,
    payment_method: inv.payment_method,
    created_at: inv.created_at,
  }));

  // 7-Day Rolling Trend Data for Chart.js
  const dailyData: Array<{
    dayLabel: string;
    dateISO: string;
    revenue: number;
    appointments: number;
  }> = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateISO = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-GB', { weekday: 'short' });
    dailyData.push({
      dayLabel,
      dateISO,
      revenue: 0,
      appointments: 0,
    });
  }

  (sevenDaysInvoicesRes.data || []).forEach((inv: any) => {
    const d = inv.created_at?.split('T')[0];
    const target = dailyData.find((x) => x.dateISO === d);
    if (target) {
      target.revenue += Number(inv.total) || 0;
    }
  });

  (sevenDaysAppointmentsRes.data || []).forEach((app: any) => {
    const d = app.scheduled_at?.split('T')[0];
    const target = dailyData.find((x) => x.dateISO === d);
    if (target) {
      target.appointments += 1;
    }
  });

  // If today has revenue from todayInvoicesRes, ensure it reflects on the current day's slot
  const todayEntry = dailyData[dailyData.length - 1];
  if (todayEntry && todayEntry.revenue === 0 && todayRevenue > 0) {
    todayEntry.revenue = todayRevenue;
  }
  if (todayEntry && todayEntry.appointments === 0 && (appointmentsRes.count ?? 0) > 0) {
    todayEntry.appointments = appointmentsRes.count ?? 0;
  }

  // Appointment Status distribution for Doughnut Chart
  const statusData = {
    completed: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
  };

  (monthAppointmentsStatusRes.data || []).forEach((a: any) => {
    if (a.status === 'completed') statusData.completed += 1;
    else if (a.status === 'confirmed' || a.status === 'checked_in') statusData.confirmed += 1;
    else if (a.status === 'pending') statusData.pending += 1;
    else if (a.status === 'cancelled' || a.status === 'no_show') statusData.cancelled += 1;
  });

  if (statusData.completed + statusData.confirmed + statusData.pending + statusData.cancelled === 0) {
    statusData.completed = completedVisitsRes.count ?? 0;
    statusData.confirmed = Math.max(0, (appointmentsRes.count ?? 0) - (completedVisitsRes.count ?? 0));
    if (statusData.completed + statusData.confirmed === 0) {
      statusData.confirmed = 1;
    }
  }

  // Payment Tender distribution for Chart.js
  const paymentData = {
    cash: 0,
    card: 0,
    bank_transfer: 0,
  };

  (sevenDaysInvoicesRes.data || []).forEach((inv: any) => {
    const amt = Number(inv.total) || 0;
    if (inv.payment_method === 'card') paymentData.card += amt;
    else if (inv.payment_method === 'bank_transfer') paymentData.bank_transfer += amt;
    else paymentData.cash += amt;
  });

  if (paymentData.cash + paymentData.card + paymentData.bank_transfer === 0 && todayRevenue > 0) {
    paymentData.cash = todayRevenue;
  }

  // Normalize pending online bookings
  const normalizedPendingBookings = (pendingOnlineBookingsRes.data || []).map((app: any) => ({
    id: app.id,
    scheduled_at: app.scheduled_at,
    status: app.status,
    message: app.message,
    customer_name: app.customer_name || 'Online Patient',
    customer_phone: app.customer_phone || '',
    created_at: app.created_at,
    treatment: Array.isArray(app.treatments) ? app.treatments[0] || null : app.treatments || null,
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
      todayAppointments={normalizedAppointments}
      pendingBookings={normalizedPendingBookings}
      recentInvoices={normalizedInvoices}
      lowStockProducts={lowStockProductsRes.data || []}
      popularTreatments={popularTreatmentsRes.data || []}
      dailyData={dailyData}
      statusData={statusData}
      paymentData={paymentData}
      alerts={alerts}
    />
  );
}
