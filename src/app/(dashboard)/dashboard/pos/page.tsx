import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { POSTerminal } from './pos-terminal';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Point of Sale' };

export default async function POSPage() {
  await getAuthenticatedStaff();
  const supabase = await createClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, sale_price, stock_quantity, reserved_quantity')
    .eq('is_active', true)
    .is('deleted_at', null)
    .gt('stock_quantity', 0)
    .order('name');

  const { data: treatments } = await supabase
    .from('treatments')
    .select('id, name, price')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  const { data: settings } = await supabase
    .from('clinic_settings')
    .select('default_tax_rate')
    .limit(1)
    .single();

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>
        <p className="text-sm text-gray-500 mt-1">Create walk-in sales and generate invoices.</p>
      </div>
      <POSTerminal
        products={products || []}
        treatments={treatments || []}
        taxRate={settings?.default_tax_rate || 0}
      />
    </div>
  );
}
