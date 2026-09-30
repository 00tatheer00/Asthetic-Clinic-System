'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// ============================================================
// 1. Follow-Up Workflow Actions
// ============================================================

const createFollowUpSchema = z.object({
  patient_id: z.string().uuid(),
  visit_id: z.string().uuid().optional().nullable(),
  treatment_id: z.string().uuid().optional().nullable(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  notes: z.string().max(500).optional().nullable(),
});

export async function createFollowUp(input: z.infer<typeof createFollowUpSchema>) {
  try {
    const staff = await getAuthenticatedStaff();
    const validated = createFollowUpSchema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('patient_follow_ups')
      .insert({
        patient_id: validated.patient_id,
        visit_id: validated.visit_id || null,
        treatment_id: validated.treatment_id || null,
        due_date: validated.due_date,
        notes: validated.notes || null,
        created_by: staff.id,
      })
      .select('id')
      .single();

    if (error) throw error;

    logger.info('Follow-up task created', {
      operation: 'createFollowUp',
      userId: staff.id,
      metadata: { followUpId: data.id, patientId: validated.patient_id },
    });

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/patients/${validated.patient_id}`);
    return { success: true, id: data.id };
  } catch (err) {
    logger.error('Failed to create follow-up', {
      operation: 'createFollowUp',
      error: err,
    });
    return { success: false, error: err instanceof Error ? err.message : 'Failed to create follow-up' };
  }
}

export async function completeFollowUp(followUpId: string) {
  try {
    const staff = await getAuthenticatedStaff();
    const supabase = await createClient();

    const { error } = await supabase
      .from('patient_follow_ups')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: staff.id,
      })
      .eq('id', followUpId);

    if (error) throw error;

    logger.info('Follow-up task marked completed', {
      operation: 'completeFollowUp',
      userId: staff.id,
      metadata: { followUpId },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    logger.error('Failed to complete follow-up', {
      operation: 'completeFollowUp',
      error: err,
    });
    return { success: false, error: err instanceof Error ? err.message : 'Failed to update follow-up' };
  }
}

// ============================================================
// 2. End-of-Day Register Closing Calculation & Saving
// ============================================================

export async function getDailyClosingSummary(dateString: string) {
  try {
    await getAuthenticatedStaff();
    const supabase = await createClient();

    const startISO = `${dateString}T00:00:00.000Z`;
    const endISO = `${dateString}T23:59:59.999Z`;

    // Fetch invoices, sales, and appointments for this date
    const [invoicesRes, appointmentsRes] = await Promise.all([
      supabase
        .from('invoices')
        .select('id, invoice_number, subtotal, discount_amount, tax_amount, total, payment_method, status, created_at')
        .gte('created_at', startISO)
        .lte('created_at', endISO),
      supabase
        .from('appointments')
        .select('id, status, appointment_date')
        .eq('appointment_date', dateString),
    ]);

    const invoices = invoicesRes.data || [];
    const appointments = appointmentsRes.data || [];

    const issuedInvoices = invoices.filter((i) => i.status !== 'voided');
    const voidedInvoices = invoices.filter((i) => i.status === 'voided');

    let totalSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let cashPayments = 0;
    let cardPayments = 0;
    let bankTransferPayments = 0;

    for (const inv of issuedInvoices) {
      totalSales += Number(inv.total) || 0;
      totalDiscount += Number(inv.discount_amount) || 0;
      totalTax += Number(inv.tax_amount) || 0;

      if (inv.payment_method === 'cash') cashPayments += Number(inv.total) || 0;
      else if (inv.payment_method === 'card') cardPayments += Number(inv.total) || 0;
      else if (inv.payment_method === 'bank_transfer') bankTransferPayments += Number(inv.total) || 0;
    }

    const completedAppointments = appointments.filter((a) => a.status === 'completed').length;

    return {
      success: true,
      data: {
        closing_date: dateString,
        total_sales: totalSales,
        total_discount: totalDiscount,
        total_tax: totalTax,
        cash_payments: cashPayments,
        card_payments: cardPayments,
        bank_transfer_payments: bankTransferPayments,
        total_invoices_issued: issuedInvoices.length,
        total_invoices_voided: voidedInvoices.length,
        total_appointments_completed: completedAppointments,
      },
    };
  } catch (err) {
    logger.error('Failed to calculate daily closing', {
      operation: 'getDailyClosingSummary',
      error: err,
    });
    return { success: false, error: 'Could not compute daily closing' };
  }
}

// ============================================================
// 3. Global Dashboard Fast Search (Permission-Aware)
// ============================================================

export interface GlobalSearchResult {
  type: 'patient' | 'invoice' | 'order' | 'product';
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

export async function searchClinicGlobal(query: string): Promise<GlobalSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  try {
    const staff = await getAuthenticatedStaff();
    const supabase = await createClient();

    const results: GlobalSearchResult[] = [];

    // Search patients (by name or phone)
    const { data: patients } = await supabase
      .from('patients')
      .select('id, name, phone, mrn')
      .or(`name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%,mrn.ilike.%${trimmed}%`)
      .limit(5);

    if (patients) {
      for (const p of patients) {
        results.push({
          type: 'patient',
          id: p.id,
          title: p.name,
          subtitle: `MRN: ${p.mrn || 'N/A'} • Phone: ${p.phone}`,
          href: `/dashboard/patients/${p.id}`,
        });
      }
    }

    // Search products (by title or SKU)
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku, stock_quantity')
      .or(`name.ilike.%${trimmed}%,sku.ilike.%${trimmed}%`)
      .limit(5);

    if (products) {
      for (const prod of products) {
        results.push({
          type: 'product',
          id: prod.id,
          title: prod.name,
          subtitle: `SKU: ${prod.sku} • Stock: ${prod.stock_quantity}`,
          href: `/dashboard/inventory#${prod.id}`,
        });
      }
    }

    // Search invoices (by invoice number or customer name)
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, customer_name, total')
      .or(`invoice_number.ilike.%${trimmed}%,customer_name.ilike.%${trimmed}%`)
      .limit(5);

    if (invoices) {
      for (const inv of invoices) {
        results.push({
          type: 'invoice',
          id: inv.id,
          title: `Invoice #${inv.invoice_number}`,
          subtitle: `${inv.customer_name || 'Walk-in'} • Rs. ${inv.total}`,
          href: `/dashboard/invoices#${inv.id}`,
        });
      }
    }

    // Search orders (by order number)
    const { data: orders } = await supabase
      .from('orders')
      .select('id, order_number, customer_name, total')
      .or(`order_number.ilike.%${trimmed}%,customer_name.ilike.%${trimmed}%`)
      .limit(5);

    if (orders) {
      for (const ord of orders) {
        results.push({
          type: 'order',
          id: ord.id,
          title: `Order #${ord.order_number}`,
          subtitle: `${ord.customer_name || 'Customer'} • Rs. ${ord.total}`,
          href: `/dashboard/orders#${ord.id}`,
        });
      }
    }

    return results;
  } catch (err) {
    logger.error('Global search error', { operation: 'searchClinicGlobal', error: err });
    return [];
  }
}
