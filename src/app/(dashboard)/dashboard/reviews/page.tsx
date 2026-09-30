import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { ReviewsList } from './reviews-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Review Moderation | Brimish Clinic Dashboard',
  description: 'Moderate customer and patient reviews before publishing.',
};

interface ReviewsPageProps {
  searchParams: Promise<{
    status?: string;
    page?: string;
  }>;
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const staff = await getAuthenticatedStaff();
  const isAdmin = staff?.role === 'super_admin';

  const { status = 'all', page = '1' } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 15;

  const supabase = await createClient();

  let query = supabase
    .from('reviews')
    .select(
      `
      *,
      treatments (id, name)
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: reviews, count, error } = await query;

  if (error) {
    console.error('[ReviewsPage] Error fetching reviews:', error);
  }

  return (
    <ReviewsList
      reviews={reviews || []}
      totalCount={count || 0}
      currentPage={currentPage}
      pageSize={pageSize}
      statusFilter={status}
      isAdmin={isAdmin}
    />
  );
}
