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
  const dateFilter = params.date || (status === 'pending' ? 'all' : 'today');
  const search = params.search || '';
  const pageSize = 20;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // Parallel database execution for blazing speed - loads all active bookings so client filters in 0ms!
  const [
    { data: appointments, count },
    { data: pendingAppointments, count: pendingCount },
    { count: todayCount },
    { count: allTimeTotalCount },
    { data: treatments },
    { data: patients },
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select(
        '*, treatments(id, name, price, duration_minutes), patients(id, name, phone)',
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true })
      .limit(1000),
    supabase
      .from('appointments')
      .select(
        '*, treatments(id, name, price, duration_minutes), patients(id, name, phone)',
        { count: 'exact' }
      )
      .eq('status', 'pending')
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: true })
      .limit(50),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .gte('scheduled_at', todayStart.toISOString())
      .lte('scheduled_at', todayEnd.toISOString())
      .is('deleted_at', null),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
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
        pendingAppointments={pendingAppointments || []}
        totalCount={count || 0}
        currentPage={1}
        pageSize={pageSize}
        filters={{ status, date: dateFilter, search }}
        stats={{ pending: pendingCount || 0, today: todayCount || 0, total: allTimeTotalCount || 0 }}
        isAdmin={staff.role === 'super_admin'}
        treatments={treatments || []}
        patients={patients || []}
      />
    </div>
  );
}
