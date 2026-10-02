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

  const { search = '', status = 'all' } = await searchParams;

  const supabase = await createClient();

  const { data: invoices, count, error } = await supabase
    .from('invoices')
    .select(
      `
      *,
      invoice_line_items (*)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .limit(300);

  if (error) {
    console.error('[InvoicesPage] Error fetching invoices:', error);
  }

  return (
    <InvoicesList
      invoices={invoices || []}
      totalCount={count || 0}
      currentPage={1}
      pageSize={20}
      search={search}
      statusFilter={status}
      isAdmin={isAdmin}
    />
  );
}
