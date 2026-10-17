import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { POSTerminal } from './pos-terminal';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Point of Sale' };

export default async function POSPage() {
  await getAuthenticatedStaff();
  const supabase = await createClient();

  const [
    treatmentsRes,
    categoriesRes,
    settingsRes,
  ] = await Promise.all([
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

  let { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, sale_price, stock_quantity, reserved_quantity, sku, category_id, is_taxable, tax_rate, tax_type, tax_inclusive, flat_tax_amount, product_categories(id, name)')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  // Fallback if migration 008 columns are not yet applied in DB
  if (prodErr && (prodErr.code === '42703' || prodErr.code === 'PGRST204' || prodErr.message?.includes('does not exist'))) {
    const fallback = await supabase
      .from('products')
      .select('id, name, sale_price, stock_quantity, reserved_quantity, sku, category_id, product_categories(id, name)')
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('name');
    products = (fallback.data || []).map((p) => ({
      ...p,
      is_taxable: false,
      tax_rate: 0,
      tax_type: 'flat' as const,
      tax_inclusive: true,
      flat_tax_amount: 0,
    })) as any;
  }

  const treatments = treatmentsRes.data;
  const categories = categoriesRes.data;
  const settings = settingsRes.data;

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
