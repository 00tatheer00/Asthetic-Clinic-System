import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { POSTerminal } from './pos-terminal';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Point of Sale' };

export default async function POSPage() {
  await getAuthenticatedStaff();
  const supabase = await createClient();

  const [
    { data: products },
    { data: treatments },
    { data: categories },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, sale_price, stock_quantity, reserved_quantity, sku, category_id, product_categories(id, name)')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('treatments')
      .select('id, name, price, treatment_categories(id, name)')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('product_categories')
      .select('id, name')
      .order('name'),
    supabase
      .from('clinic_settings')
      .select('*')
      .limit(1)
      .single(),
  ]);

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      <POSTerminal
        products={products || []}
        treatments={treatments || []}
        categories={categories || []}
        taxRate={settings?.default_tax_rate || 0}
        clinicSettings={settings || undefined}
      />
    </div>
  );
}
