import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { ProductsList } from './products-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Manage Products | Brimish Clinic Dashboard',
  description: 'Manage skincare retail and clinical products.',
};

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const staff = await getAuthenticatedStaff();
  const isAdmin = staff?.role === 'super_admin';

  const { search = '', category = 'all', page = '1' } = await searchParams;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = 20;

  const supabase = await createClient();

  // Fetch categories for filter & dialog
  const { data: categories } = await supabase
    .from('product_categories')
    .select('id, name')
    .order('name');

  let query = supabase
    .from('products')
    .select(
      `
      *,
      product_categories (id, name)
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category_id', category);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
  }

  const from = (currentPage - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: products, count, error } = await query;

  if (error) {
    console.error('[ProductsPage] Error fetching products:', error);
  }

  return (
    <ProductsList
      products={products || []}
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
