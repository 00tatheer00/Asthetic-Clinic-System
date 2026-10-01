import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { PatientsList } from './patients-list';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Patients' };

interface PageProps {
  searchParams: Promise<{ search?: string; page?: string }>;
}

export default async function PatientsPage({ searchParams }: PageProps) {
  const staff = await getAuthenticatedStaff();
  const supabase = await createClient();
  const params = await searchParams;

  const search = params.search || '';
  const page = parseInt(params.page || '1', 10);
  const pageSize = 25;

  let query = supabase
    .from('patients')
    .select('id, name, phone, email, gender, date_of_birth, created_at', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  query = query.range(from, from + pageSize - 1);

  const [{ data: patients, count }, { count: totalPatients }] = await Promise.all([
    query,
    supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage patient records and clinical history. {totalPatients || 0} total patients.
        </p>
      </div>
      <PatientsList
        patients={patients || []}
        totalCount={count || 0}
        currentPage={page}
        pageSize={pageSize}
        search={search}
        isAdmin={staff.role === 'super_admin'}
      />
    </div>
  );
}
