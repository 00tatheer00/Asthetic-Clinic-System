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
      .select(
        'id, invoice_number, total, subtotal, discount_amount, tax_amount, payment_method, payment_status, status, created_at, customer_name, customer_phone, customer_email, customer_address, patient_id, patients(id, name, phone, email, address), invoice_line_items(id, description, quantity, unit_price, line_total)'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('appointments')
      .select(
        'id, status, scheduled_at, duration_minutes, customer_name, customer_phone, customer_email, message, confirmed_at, created_at, treatment_id, treatments(id, name, price), patient_id, patients(id, name, phone, email, gender)'
      )
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: false }),
    supabase
      .from('orders')
      .select(
        'id, order_number, total, subtotal, delivery_fee, discount_amount, status, delivery_method, delivery_address, delivery_city, payment_method, payment_status, created_at, customer_name, customer_phone, customer_email, order_items(id, name, quantity, unit_price, line_total)'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select(
        'id, name, sku, stock_quantity, reserved_quantity, low_stock_threshold, sale_price, purchase_price, expiry_date, is_active, is_published, product_categories(id, name)'
      )
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('treatments')
      .select('id, name, price, treatment_categories(id, name)')
      .is('deleted_at', null),
    supabase
      .from('patients')
      .select('id, name, phone, email, gender, date_of_birth, address, notes, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  const normalizedInvoices = (invoices || []).map((inv: any) => ({
    ...inv,
    patients: Array.isArray(inv.patients) ? inv.patients[0] || null : inv.patients || null,
    invoice_line_items: Array.isArray(inv.invoice_line_items) ? inv.invoice_line_items : [],
  }));

  const normalizedAppointments = (appointments || []).map((a: any) => ({
    ...a,
    treatments: Array.isArray(a.treatments) ? a.treatments[0] || null : a.treatments || null,
    patients: Array.isArray(a.patients) ? a.patients[0] || null : a.patients || null,
  }));

  const normalizedOrders = (orders || []).map((o: any) => ({
    ...o,
    order_items: Array.isArray(o.order_items) ? o.order_items : [],
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
      invoices={normalizedInvoices}
      appointments={normalizedAppointments}
      orders={normalizedOrders}
      products={normalizedProducts}
      treatments={normalizedTreatments}
      patients={patients || []}
    />
  );
}
