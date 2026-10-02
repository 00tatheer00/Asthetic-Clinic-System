import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { OrdersList } from './orders-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orders | Brimish Clinic Dashboard',
  description: 'Manage online product orders and delivery fulfillment.',
};

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; page?: string }>;
}

export default async function OrdersPage({ searchParams }: PageProps) {
  const staff = await getAuthenticatedStaff();
  const supabase = await createClient();
  const params = await searchParams;

  const status = params.status || 'all';
  const search = params.search || '';
  const page = parseInt(params.page || '1', 10);
  const pageSize = 20;

  const query = supabase
    .from('orders')
    .select(
      `
      id,
      order_number,
      customer_name,
      customer_phone,
      customer_email,
      delivery_method,
      delivery_address,
      delivery_city,
      delivery_notes,
      notes,
      status,
      subtotal,
      delivery_fee,
      discount_amount,
      total,
      payment_method,
      payment_status,
      created_at,
      order_items (
        id,
        name,
        quantity,
        unit_price,
        line_total
      )
    `,
      { count: 'exact' }
    )
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(300);

  const [{ data: orders, count }, { count: activeCount }] = await Promise.all([
    query,
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .in('status', ['received', 'confirmed', 'preparing', 'ready'])
      .is('deleted_at', null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders & Fulfillment</h1>
        <p className="text-sm text-gray-500 mt-1">Manage online skincare orders, deliveries, and fulfillment status.</p>
      </div>
      <OrdersList
        orders={orders || []}
        totalCount={count || 0}
        currentPage={page}
        pageSize={pageSize}
        filters={{ status, search }}
        activeCount={activeCount || 0}
        isAdmin={staff.role === 'super_admin'}
      />
    </div>
  );
}
