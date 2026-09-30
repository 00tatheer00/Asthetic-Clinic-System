import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { InvoicesList } from './invoices-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoices | Brimish Clinic Dashboard',
  description: 'Manage clinic sales and treatment invoices.',
};

interface InvoicesPageProps {
  searchParams: Promise<{
    search?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function InvoicesPage({ searchParams }: InvoicesPageProps) {
  const staff = await getAuthenticatedStaff();
  const isAdmin = staff?.role === 'super_admin';

  const { search = '', status = 'all', page = '1' } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 20;

  const supabase = await createClient();

  let query = supabase
    .from('invoices')
    .select(
      `
      *,
      invoice_line_items (*)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(
      `invoice_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`
    );
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: invoices, count, error } = await query;

  if (error) {
    console.error('[InvoicesPage] Error fetching invoices:', error);
  }

  return (
    <InvoicesList
      invoices={invoices || []}
      totalCount={count || 0}
      currentPage={currentPage}
      pageSize={pageSize}
      search={search}
      statusFilter={status}
      isAdmin={isAdmin}
    />
  );
}
