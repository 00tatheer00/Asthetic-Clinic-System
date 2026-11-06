'use server';

import { createClient } from '@/lib/supabase/server';
import { patientSchema, clinicalNoteSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

// ============================================================
// Create Patient
// ============================================================

export async function createPatient(formData: unknown) {
  const parsed = patientSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff not found' };

  // Check for duplicate phone
  const { data: existing } = await supabase
    .from('patients')
    .select('id')
    .eq('phone', parsed.data.phone)
    .is('deleted_at', null)
    .single();

  if (existing) {
    return { success: false, error: 'A patient with this phone number already exists.' };
  }

  const { data: patient, error } = await supabase
    .from('patients')
    .insert({
      ...parsed.data,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      created_by: staff.id,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Patient] Create failed:', error);
    return { success: false, error: 'Failed to create patient.' };
  }

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'create',
    entity_type: 'patient',
    entity_id: patient.id,
    description: `Created patient: ${parsed.data.name}`,
  });

  revalidatePath('/dashboard/patients');
  return { success: true, patientId: patient.id };
}

// ============================================================
// Update Patient
// ============================================================

export async function updatePatient(patientId: string, formData: unknown) {
  const parsed = patientSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff not found' };

  // Check for duplicate phone (exclude self)
  const { data: existing } = await supabase
    .from('patients')
    .select('id')
    .eq('phone', parsed.data.phone)
    .neq('id', patientId)
    .is('deleted_at', null)
    .single();

  if (existing) {
    return { success: false, error: 'Another patient with this phone number already exists.' };
  }

  const { error } = await supabase
    .from('patients')
    .update({
      ...parsed.data,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      updated_by: staff.id,
    })
    .eq('id', patientId);

  if (error) {
    console.error('[Patient] Update failed:', error);
    return { success: false, error: 'Failed to update patient.' };
  }

  revalidatePath('/dashboard/patients');
  revalidatePath(`/dashboard/patients/${patientId}`);
  return { success: true };
}

// ============================================================
// Delete (soft) Patient
// ============================================================

export async function deletePatient(patientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) {
    return { success: false, error: 'Staff access required to delete patients.' };
  }

  const { error } = await supabase
    .from('patients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', patientId);

  if (error) {
    return { success: false, error: 'Failed to delete patient.' };
  }

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'delete',
    entity_type: 'patient',
    entity_id: patientId,
    description: 'Patient soft-deleted',
  });

  revalidatePath('/dashboard/patients');
  return { success: true };
}

// ============================================================
// Create Clinical Note (Doctor Only)
// ============================================================

export async function createClinicalNote(formData: unknown) {
  const parsed = clinicalNoteSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only the doctor can manage clinical notes.' };
  }

  const { data: note, error } = await supabase
    .from('clinical_notes')
    .insert({
      patient_id: parsed.data.patient_id,
      visit_id: parsed.data.visit_id || null,
      appointment_id: parsed.data.appointment_id || null,
      note_text: parsed.data.note_text,
      diagnosis: parsed.data.diagnosis || null,
      prescription: parsed.data.prescription || null,
      created_by: staff.id,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[ClinicalNote] Create failed:', error);
    return { success: false, error: 'Failed to create clinical note.' };
  }

  revalidatePath(`/dashboard/patients/${parsed.data.patient_id}`);
  return { success: true, noteId: note.id };
}

// ============================================================
// Update Clinical Note (Doctor Only)
// ============================================================

export async function updateClinicalNote(noteId: string, formData: unknown) {
  const parsed = clinicalNoteSchema.safeParse(formData);
  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only the doctor can manage clinical notes.' };
  }

  const { error } = await supabase
    .from('clinical_notes')
    .update({
      note_text: parsed.data.note_text,
      diagnosis: parsed.data.diagnosis || null,
      prescription: parsed.data.prescription || null,
      updated_by: staff.id,
    })
    .eq('id', noteId);

  if (error) {
    return { success: false, error: 'Failed to update clinical note.' };
  }

  revalidatePath(`/dashboard/patients/${parsed.data.patient_id}`);
  return { success: true };
}

// ============================================================
// Create Custom Patient Service / Procedure & Issue Invoice
// ============================================================

export async function createCustomPatientServiceAction(data: {
  patient_id: string;
  name: string;
  category?: string;
  price: number;
  discount?: number;
  amount_paid: number;
  payment_method: 'cash' | 'card' | 'bank_transfer';
  total_sessions?: number;
  doctor_id?: string;
  notes?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, name')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff access required' };

  const trimmedName = data.name?.trim();
  if (!trimmedName) {
    return { success: false, error: 'Custom service or procedure name is required.' };
  }

  const price = Number(data.price) || 0;
  if (price < 0) {
    return { success: false, error: 'Price must be 0 or greater.' };
  }

  const discount = Math.max(0, Number(data.discount) || 0);
  const total = Math.max(0, price - discount);
  const amountPaid = Math.max(0, Number(data.amount_paid) || 0);
  const balance = Math.max(0, total - amountPaid);
  const totalSessions = Math.max(1, Number(data.total_sessions) || 1);

  // 1. Fetch Patient details
  const { data: patient, error: patientErr } = await supabase
    .from('patients')
    .select('id, name, phone, email')
    .eq('id', data.patient_id)
    .single();

  if (patientErr || !patient) {
    return { success: false, error: 'Patient record not found.' };
  }

  // 2. Generate Invoice Number
  const { data: invoiceNumRpc } = await supabase.rpc('generate_invoice_number');
  let finalInvoiceNumber = invoiceNumRpc;
  if (!finalInvoiceNumber) {
    const year = new Date().getFullYear();
    const rand = Math.floor(10000 + Math.random() * 90000);
    finalInvoiceNumber = `INV-${year}-${rand}`;
  }

  const paymentStatus = amountPaid >= total && total > 0 ? 'paid' : amountPaid > 0 ? 'partial' : 'pending';

  // 3. Create Sale
  const { data: sale, error: saleErr } = await supabase
    .from('sales')
    .insert({
      patient_id: patient.id,
      customer_name: patient.name,
      customer_phone: patient.phone || null,
      subtotal: price,
      discount_type: discount > 0 ? 'fixed' : null,
      discount_value: discount,
      discount_amount: discount,
      tax_amount: 0,
      total,
      payment_method: data.payment_method,
      payment_status: paymentStatus,
      amount_received: amountPaid,
      change_returned: Math.max(0, amountPaid - total),
      staff_id: staff.id,
      idempotency_key: `custom-sale-${patient.id}-${Date.now()}`,
    })
    .select('id')
    .single();

  if (saleErr || !sale) {
    console.error('[CustomService] Sale insert failed:', saleErr);
    return { success: false, error: 'Failed to record sale.' };
  }

  // 4. Create Sale Item
  await supabase.from('sale_items').insert({
    sale_id: sale.id,
    item_type: 'service',
    name: trimmedName,
    quantity: 1,
    unit_price: price,
    discount_type: discount > 0 ? 'fixed' : null,
    discount_value: discount,
    discount_amount: discount,
    line_total: total,
    product_id: null,
    treatment_id: null,
  });

  // 5. Create Invoice
  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .insert({
      invoice_number: finalInvoiceNumber,
      sale_id: sale.id,
      patient_id: patient.id,
      customer_name: patient.name,
      customer_phone: patient.phone || null,
      customer_email: patient.email || null,
      subtotal: price,
      discount_amount: discount,
      tax_amount: 0,
      total,
      amount_tendered: amountPaid,
      change_returned: Math.max(0, amountPaid - total),
      payment_method: data.payment_method,
      payment_status: paymentStatus,
      status: 'paid',
      paid_at: new Date().toISOString(),
      created_by: staff.id,
    })
    .select('id')
    .single();

  if (invErr) {
    console.error('[CustomService] Invoice insert warning:', invErr);
  }

  // 6. Create Invoice Line Items
  if (invoice) {
    await supabase.from('invoice_line_items').insert({
      invoice_id: invoice.id,
      description: `${trimmedName}${data.category ? ` (${data.category})` : ' (Custom Service)'}`,
      quantity: 1,
      unit_price: price,
      discount_amount: discount,
      line_total: total,
      sort_order: 0,
    });
  }

  // 7. Also create Procedure Plan & Session so it is tracked in clinical history
  const { data: procedure } = await supabase
    .from('patient_procedures')
    .insert({
      patient_id: patient.id,
      treatment_id: null,
      plan_name: trimmedName,
      total_sessions: totalSessions,
      completed_sessions: 1,
      status: totalSessions <= 1 ? 'completed' : 'active',
      total_cost: total,
      paid_amount: amountPaid,
      balance_amount: balance,
      payment_status: paymentStatus,
      doctor_id: data.doctor_id || staff.id,
      notes: data.notes?.trim() || `Custom procedure: ${data.category || 'Special Clinical Service'}`,
      created_by: staff.id,
    })
    .select('id')
    .single();

  if (procedure) {
    // Log Session 1
    await supabase.from('procedure_sessions').insert({
      procedure_id: procedure.id,
      patient_id: patient.id,
      session_number: 1,
      session_date: new Date().toISOString(),
      status: 'completed',
      doctor_id: data.doctor_id || staff.id,
      treatment_area: 'Treated Area',
      observations_notes: data.notes?.trim() || 'Custom procedure conducted.',
      aftercare_instructions: 'Follow-up consultation valid within 30 days.',
      created_by: staff.id,
    });

    // Log Procedure Payment with invoice number
    if (amountPaid > 0) {
      await supabase.from('procedure_payments').insert({
        procedure_id: procedure.id,
        patient_id: patient.id,
        receipt_number: finalInvoiceNumber,
        amount: amountPaid,
        payment_method: data.payment_method,
        payment_date: new Date().toISOString(),
        notes: `Payment for ${trimmedName}`,
        received_by: staff.id,
      });
    }
  }

  // 8. If clinical notes provided, also record in clinical_notes
  if (data.notes?.trim()) {
    await supabase.from('clinical_notes').insert({
      patient_id: patient.id,
      note_text: `[Custom Service: ${trimmedName}] ${data.notes.trim()}`,
      created_by: staff.id,
    });
  }

  // 9. Audit Log
  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'create',
    entity_type: 'custom_service',
    entity_id: sale.id,
    description: `Custom service "${trimmedName}" created for patient ${patient.name} (${finalInvoiceNumber})`,
  });

  revalidatePath(`/dashboard/patients/${patient.id}`);
  revalidatePath('/dashboard/patients');
  revalidatePath('/dashboard/invoices');
  revalidatePath('/dashboard/pos');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/reports');

  return {
    success: true,
    invoiceNumber: finalInvoiceNumber,
    saleId: sale.id,
    invoiceId: invoice?.id,
    procedureId: procedure?.id,
    total,
    amountPaid,
    balance,
  };
}
