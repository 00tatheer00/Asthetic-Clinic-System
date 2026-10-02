import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { InventoryList } from './inventory-list';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Inventory' };

export default async function InventoryPage() {
  const staff = await getAuthenticatedStaff();
  const supabase = await createClient();

  const [
    { data: products },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, slug, sku, category_id, description, short_description, purchase_price, sale_price, stock_quantity, reserved_quantity, low_stock_threshold, is_active, is_published, image_url, product_categories(id, name)')
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('product_categories')
      .select('id, name')
      .order('name'),
  ]);

  const lowStockProducts = (products || []).filter(
    (p) => p.is_active && p.stock_quantity <= p.low_stock_threshold
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track stock levels, edit product pricing & details, and manage inventory.
          {lowStockProducts.length > 0 && (
            <span className="text-amber-600 font-medium ml-1">
              ⚠ {lowStockProducts.length} item{lowStockProducts.length > 1 ? 's' : ''} low on stock.
            </span>
          )}
        </p>
      </div>
      <InventoryList
        products={(products as any) || []}
        categories={categories || []}
        isAdmin={staff.role === 'super_admin'}
      />
    </div>
  );
}
