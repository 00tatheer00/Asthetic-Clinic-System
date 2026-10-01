'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================================
// Create Visit Record
// ============================================================

export async function createVisit(formData: {
  patient_id: string;
  appointment_id?: string | null;
  treatment_id?: string | null;
  visit_date: string;
  notes?: string;
  next_visit_date?: string | null;
  products_used?: Array<{ product_id: string; quantity: number }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff not found' };

  // Create visit
  const { data: visit, error } = await supabase
    .from('visits')
    .insert({
      patient_id: formData.patient_id,
      appointment_id: formData.appointment_id || null,
      treatment_id: formData.treatment_id || null,
      visit_date: formData.visit_date,
      notes: formData.notes || null,
      created_by: staff.id,
    })
    .select('id')
    .single();

  if (error || !visit) {
    console.error('[Visit] Create failed:', error);
    return { success: false, error: 'Failed to create visit record.' };
  }

  // If products were used, deduct stock atomically
  if (formData.products_used && formData.products_used.length > 0) {
    for (const item of formData.products_used) {
      // Try atomic RPC
      const { data: rpcRes, error: rpcErr } = await supabase.rpc('atomic_deduct_stock', {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
        p_movement_type: 'sale',
        p_reference_type: 'visit',
        p_reference_id: visit.id,
        p_reason: 'Used in treatment visit',
        p_staff_id: staff.id,
      });

      if (rpcErr || !(rpcRes as { success?: boolean })?.success) {
        const { data: product } = await supabase
          .from('products')
          .select('stock_quantity, name')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const newStock = product.stock_quantity - item.quantity;
          if (newStock < 0) {
            return { success: false, error: `Insufficient stock for "${product.name}".` };
          }

          await supabase
            .from('products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id);

          await supabase.from('stock_movements').insert({
            product_id: item.product_id,
            movement_type: 'sale',
            quantity: -item.quantity,
            quantity_before: product.stock_quantity,
            quantity_after: newStock,
            reference_type: 'visit',
            reference_id: visit.id,
            reason: `Used in treatment visit`,
            created_by: staff.id,
          });
        }
      }
    }
  }

  // Audit
  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'create',
    entity_type: 'visit',
    entity_id: visit.id,
    description: `Visit recorded for patient ${formData.patient_id}`,
  });

  revalidatePath(`/dashboard/patients/${formData.patient_id}`);
  return { success: true, visitId: visit.id };
}

// ============================================================
// Before & After CRUD
// ============================================================

export async function createBeforeAfter(formData: {
  patient_id?: string | null;
  treatment_id?: string | null;
  visit_id?: string | null;
  title?: string;
  description?: string;
  before_image_url: string;
  after_image_url: string;
  is_public: boolean;
  consent_status?: 'pending' | 'given' | 'revoked';
  consent_notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin/doctor can manage before & after cases.' };
  }

  // PRIVACY: Cannot be public without consent
  if (formData.is_public && formData.consent_status !== 'given') {
    return { success: false, error: 'Cannot publish without patient consent.' };
  }

  const { data: baCase, error } = await supabase
    .from('before_after')
    .insert({
      patient_id: formData.patient_id || null,
      treatment_id: formData.treatment_id || null,
      visit_id: formData.visit_id || null,
      title: formData.title || null,
      description: formData.description || null,
      before_image_url: formData.before_image_url,
      after_image_url: formData.after_image_url,
      is_public: formData.is_public,
      created_by: staff.id,
    })
    .select('id')
    .single();

  if (error || !baCase) {
    console.error('[BeforeAfter] Create failed:', error);
    return { success: false, error: 'Failed to create case.' };
  }

  // Create consent record if patient is specified
  if (formData.patient_id && formData.consent_status) {
    await supabase.from('consent_records').insert({
      before_after_id: baCase.id,
      patient_id: formData.patient_id,
      consent_status: formData.consent_status,
      consent_given_at: formData.consent_status === 'given' ? new Date().toISOString() : null,
      consent_notes: formData.consent_notes || null,
      recorded_by: staff.id,
    });
  }

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'create',
    entity_type: 'before_after',
    entity_id: baCase.id,
    description: `Before/After case created`,
  });

  revalidatePath('/dashboard/gallery');
  revalidatePath('/gallery');
  if (formData.patient_id) revalidatePath(`/dashboard/patients/${formData.patient_id}`);
  return { success: true, caseId: baCase.id };
}

export async function updateBeforeAfterVisibility(caseId: string, isPublic: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can change visibility.' };
  }

  // If making public, verify consent exists
  if (isPublic) {
    const { data: consent } = await supabase
      .from('consent_records')
      .select('consent_status')
      .eq('before_after_id', caseId)
      .eq('consent_status', 'given')
      .limit(1)
      .single();

    // Allow public if no patient linked (anonymous) or consent given
    const { data: baCase } = await supabase
      .from('before_after')
      .select('patient_id')
      .eq('id', caseId)
      .single();

    if (baCase?.patient_id && !consent) {
      return { success: false, error: 'Cannot publish without patient consent.' };
    }
  }

  const { error } = await supabase
    .from('before_after')
    .update({ is_public: isPublic, updated_by: staff.id })
    .eq('id', caseId);

  if (error) return { success: false, error: 'Failed to update.' };

  revalidatePath('/dashboard/gallery');
  revalidatePath('/gallery');
  return { success: true };
}

export async function deleteBeforeAfter(caseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can delete before & after cases.' };
  }

  const { error } = await supabase
    .from('before_after')
    .update({
      deleted_at: new Date().toISOString(),
      is_public: false,
      updated_by: staff.id,
    })
    .eq('id', caseId);

  if (error) {
    console.error('[BeforeAfter] Delete failed:', error);
    return { success: false, error: 'Failed to delete case.' };
  }

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'delete',
    entity_type: 'before_after',
    entity_id: caseId,
    description: 'Before/After case deleted',
  });

  revalidatePath('/dashboard/gallery');
  revalidatePath('/gallery');
  return { success: true };
}

// ============================================================
// Invoice Actions
// ============================================================

export async function sendInvoiceEmail(invoiceId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff not found' };

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, invoice_line_items(*)')
    .eq('id', invoiceId)
    .single();

  if (!invoice) return { success: false, error: 'Invoice not found.' };
  if (!invoice.customer_email) return { success: false, error: 'No customer email on record.' };

  // Import email helper
  const { sendInvoiceEmailTemplate } = await import('@/lib/email');

  const lineItems = (invoice.invoice_line_items || [])
    .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    .map((item: { description: string; quantity: number; unit_price: number; line_total: number }) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      line_total: item.line_total,
    }));

  const result = await sendInvoiceEmailTemplate({
    customerEmail: invoice.customer_email,
    customerName: invoice.customer_name,
    invoiceNumber: invoice.invoice_number,
    items: lineItems,
    subtotal: invoice.subtotal,
    discountAmount: invoice.discount_amount,
    taxAmount: invoice.tax_amount,
    taxLabel: invoice.tax_label || 'GST',
    taxRate: invoice.tax_rate,
    total: invoice.total,
    paymentMethod: invoice.payment_method || 'Cash',
    clinicAddress: invoice.clinic_address || 'Peshawar, Pakistan',
    clinicPhone: invoice.clinic_phone || '',
    clinicNtn: invoice.clinic_ntn,
    clinicStrn: invoice.clinic_strn,
  });

  if (!result.success) return { success: false, error: result.error || 'Failed to send email.' };
  return { success: true };
}

export async function voidInvoice(invoiceId: string, reason: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can void invoices.' };
  }

  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'voided',
      voided_at: new Date().toISOString(),
      voided_by: staff.id,
      void_reason: reason,
    })
    .eq('id', invoiceId);

  if (error) return { success: false, error: 'Failed to void invoice.' };

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'void',
    entity_type: 'invoice',
    entity_id: invoiceId,
    description: `Invoice voided: ${reason}`,
  });

  revalidatePath('/dashboard/invoices');
  return { success: true };
}

// ============================================================
// Clinic Settings Management (Admin)
// ============================================================

export async function updateClinicSettings(formData: {
  clinic_name: string;
  clinic_phone: string;
  clinic_email?: string | null;
  clinic_address: string;
  default_tax_label?: string | null;
  default_tax_rate?: number;
  ntn?: string | null;
  strn?: string | null;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can update clinic settings.' };
  }

  const { data: current } = await supabase
    .from('clinic_settings')
    .select('id')
    .limit(1)
    .single();

  if (!current) {
    return { success: false, error: 'Clinic settings record not found.' };
  }

  const { error } = await supabase
    .from('clinic_settings')
    .update({
      clinic_name: formData.clinic_name.trim(),
      clinic_phone: formData.clinic_phone.trim(),
      clinic_email: formData.clinic_email?.trim() || null,
      clinic_address: formData.clinic_address.trim(),
      default_tax_label: formData.default_tax_label?.trim() || 'GST',
      default_tax_rate: Number(formData.default_tax_rate) || 0,
      ntn: formData.ntn?.trim() || null,
      strn: formData.strn?.trim() || null,
      updated_by: staff.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', current.id);

  if (error) {
    console.error('[ClinicSettings] Update failed:', error);
    return { success: false, error: 'Failed to update clinic settings.' };
  }

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'update',
    entity_type: 'clinic_settings',
    entity_id: current.id,
    description: 'Clinic settings updated',
  });

  revalidatePath('/dashboard/settings');
  return { success: true };
}

export async function updateOperatingHours(
  hours: Array<{ id: string; open_time: string; close_time: string; is_closed: boolean }>
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can update operating hours.' };
  }

  for (const h of hours) {
    await supabase
      .from('operating_hours')
      .update({
        open_time: h.open_time,
        close_time: h.close_time,
        is_closed: h.is_closed,
      })
      .eq('id', h.id);
  }

  revalidatePath('/dashboard/settings');
  return { success: true };
}
