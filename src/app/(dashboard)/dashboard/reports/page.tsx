import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { redirect } from 'next/navigation';
import { ReportsView } from './reports-view';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports & Analytics | Brimish Clinic Dashboard',
  description: 'Financial performance, clinical appointments, and sales analytics.',
};

export default async function ReportsPage() {
  const staff = await getAuthenticatedStaff();
  if (!staff || staff.role !== 'super_admin') {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  // Run analytics aggregation queries in parallel
  const [
    { data: invoices },
    { data: appointments },
    { data: orders },
    { data: products },
    { data: treatments },
    { data: patients },
  ] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, invoice_number, total, subtotal, discount_amount, tax_amount, payment_method, status, created_at, customer_name')
      .order('created_at', { ascending: false }),
    supabase
      .from('appointments')
      .select('id, status, appointment_date, start_time, treatment_id, treatments(name), patient_id, patients(name), created_at')
      .order('appointment_date', { ascending: false }),
    supabase
      .from('orders')
      .select('id, order_number, total, status, delivery_method, payment_method, created_at, customer_name')
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, name, sku, stock_quantity, sale_price, purchase_price, product_categories(name)')
      .is('deleted_at', null),
    supabase
      .from('treatments')
      .select('id, name, price, treatment_categories(name)')
      .is('deleted_at', null),
    supabase
      .from('patients')
      .select('id, name, phone, email, gender, created_at')
      .is('deleted_at', null),
  ]);

  const normalizedAppointments = (appointments || []).map((a: any) => ({
    ...a,
    treatments: Array.isArray(a.treatments) ? a.treatments[0] || null : a.treatments || null,
    patients: Array.isArray(a.patients) ? a.patients[0] || null : a.patients || null,
  }));

  const normalizedProducts = (products || []).map((p: any) => ({
    ...p,
    product_categories: Array.isArray(p.product_categories)
      ? p.product_categories[0] || null
      : p.product_categories || null,
  }));

  const normalizedTreatments = (treatments || []).map((t: any) => ({
    ...t,
    treatment_categories: Array.isArray(t.treatment_categories)
      ? t.treatment_categories[0] || null
      : t.treatment_categories || null,
  }));

  return (
    <ReportsView
      invoices={invoices || []}
      appointments={normalizedAppointments}
      orders={orders || []}
      products={normalizedProducts}
      treatments={normalizedTreatments}
      patients={patients || []}
    />
  );
}
