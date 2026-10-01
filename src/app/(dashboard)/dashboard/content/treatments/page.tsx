import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { TreatmentsList } from './treatments-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Treatments | Brimish Clinic Dashboard',
  description: 'Manage clinic procedures, pricing, and treatment services.',
};

interface TreatmentsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function TreatmentsPage({ searchParams }: TreatmentsPageProps) {
  const staff = await getAuthenticatedStaff();
  const isAdmin = staff?.role === 'super_admin';

  const { search = '', category = 'all', page = '1' } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 20;

  const supabase = await createClient();

  let query = supabase
    .from('treatments')
    .select(
      `
      *,
      treatment_categories (id, name)
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('sort_order', { ascending: true });

  if (category && category !== 'all') {
    query = query.eq('category_id', category);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const [{ data: categories }, { data: treatments, count, error }] = await Promise.all([
    supabase
      .from('treatment_categories')
      .select('id, name')
      .order('name'),
    query,
  ]);

  if (error) {
    console.error('[TreatmentsPage] Error fetching treatments:', error);
  }

  return (
    <TreatmentsList
      treatments={treatments || []}
      categories={categories || []}
      totalCount={count || 0}
      currentPage={currentPage}
      pageSize={pageSize}
      search={search}
      categoryFilter={category}
      isAdmin={isAdmin}
    />
  );
}
