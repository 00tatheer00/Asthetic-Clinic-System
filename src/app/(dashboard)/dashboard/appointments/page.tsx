import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { AppointmentsList } from './appointments-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Appointments',
};

interface PageProps {
  searchParams: Promise<{
    status?: string;
    date?: string;
    search?: string;
    page?: string;
  }>;
}

export default async function AppointmentsPage({ searchParams }: PageProps) {
  const staff = await getAuthenticatedStaff();
  const supabase = await createClient();
  const params = await searchParams;

  const status = params.status || 'all';
  // If viewing pending requests, show all dates so staff doesn't miss future requests
  const dateFilter = params.date || (status === 'pending' ? 'all' : 'today');
  const search = params.search || '';
  const page = parseInt(params.page || '1', 10);
  const pageSize = 20;

  // Build query
  let query = supabase
    .from('appointments')
    .select(
      '*, treatments(id, name), patients(id, name, phone)',
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: true });

  // Status filter
  if (status !== 'all') {
    query = query.eq('status', status);
  }

  // Date filter
  const now = new Date();
  if (dateFilter === 'today') {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    query = query
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString());
  } else if (dateFilter === 'tomorrow') {
    const tmrStart = new Date(now);
    tmrStart.setDate(tmrStart.getDate() + 1);
    tmrStart.setHours(0, 0, 0, 0);
    const tmrEnd = new Date(tmrStart);
    tmrEnd.setHours(23, 59, 59, 999);
    query = query
      .gte('scheduled_at', tmrStart.toISOString())
      .lte('scheduled_at', tmrEnd.toISOString());
  } else if (dateFilter === 'week') {
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    query = query
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', weekEnd.toISOString());
  } else if (dateFilter === 'past') {
    query = query.lt('scheduled_at', now.toISOString());
    query = query.order('scheduled_at', { ascending: false });
  }
  // 'all' = no date filter

  // Search filter
  if (search) {
    query = query.or(
      `customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
    );
  }

  // Pagination
  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const { data: appointments, count } = await query;

  // Get stats for filter badges
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [{ count: pendingCount }, { count: todayCount }, { data: treatments }, { data: patients }] =
    await Promise.all([
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending')
        .is('deleted_at', null),
      supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .gte('scheduled_at', todayStart.toISOString())
        .lte('scheduled_at', todayEnd.toISOString())
        .is('deleted_at', null),
      supabase
        .from('treatments')
        .select('id, name, price, duration_minutes')
        .is('deleted_at', null)
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('patients')
        .select('id, name, phone')
        .is('deleted_at', null)
        .order('name')
        .limit(100),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage clinic appointments and patient bookings.
          </p>
        </div>
      </div>

      <AppointmentsList
        appointments={appointments || []}
        totalCount={count || 0}
        currentPage={page}
        pageSize={pageSize}
        filters={{ status, date: dateFilter, search }}
        stats={{ pending: pendingCount || 0, today: todayCount || 0 }}
        isAdmin={staff.role === 'super_admin'}
        treatments={treatments || []}
        patients={patients || []}
      />
    </div>
  );
}
