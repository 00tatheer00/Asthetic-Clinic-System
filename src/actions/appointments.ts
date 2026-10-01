'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { appointmentBookingSchema, appointmentUpdateSchema } from '@/lib/validations';
import { sendAppointmentReceivedEmail, sendAppointmentConfirmedEmail } from '@/lib/email';
import { formatDateTime } from '@/lib/utils/helpers';
import { revalidatePath } from 'next/cache';
import type { AppointmentStatus } from '@/lib/types';

// ============================================================
// Public: Create appointment (guest, uses admin client)
// ============================================================

export async function createPublicAppointment(formData: unknown) {
  const parsed = appointmentBookingSchema.safeParse(formData);

  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const friendlyError = firstIssue ? firstIssue.message : 'Please check your details and try again.';
    return {
      success: false,
      error: friendlyError,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;

  // Flexible date check: allow today's booking requests with generous 24h grace window for timezones
  const scheduledTime = new Date(data.scheduled_at).getTime();
  const pastCutoff = Date.now() - 24 * 60 * 60 * 1000;
  if (isNaN(scheduledTime) || scheduledTime < pastCutoff) {
    return { success: false, error: 'Please select a valid upcoming date and time.' };
  }

  const supabase = createAdminClient();

  // Get treatment name for email with fallback
  let treatmentName = 'Aesthetic Consultation';
  let validTreatmentId = data.treatment_id;

  const { data: treatment } = await supabase
    .from('treatments')
    .select('id, name')
    .eq('id', data.treatment_id)
    .maybeSingle();

  if (treatment) {
    treatmentName = treatment.name;
    validTreatmentId = treatment.id;
  } else {
    // If an ID wasn't found in DB, resolve the first active treatment
    const { data: firstTreatment } = await supabase
      .from('treatments')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (firstTreatment) {
      treatmentName = firstTreatment.name;
      validTreatmentId = firstTreatment.id;
    }
  }

  // Format combined message with WhatsApp and custom notes
  const messageParts: string[] = [];
  if (data.whatsapp_number && data.whatsapp_number.trim() && data.whatsapp_number.trim() !== data.customer_phone) {
    messageParts.push(`WhatsApp Contact: ${data.whatsapp_number.trim()}`);
  }
  if (data.message && data.message.trim()) {
    messageParts.push(data.message.trim());
  }
  const finalMessage = messageParts.length > 0 ? messageParts.join('\n\n') : null;

  // Create appointment
  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      customer_email: data.customer_email || null,
      treatment_id: validTreatmentId,
      scheduled_at: data.scheduled_at,
      message: finalMessage,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Appointment] Create failed:', error);
    return { success: false, error: 'Failed to create appointment. Please try again.' };
  }

  // Send notification email (non-blocking, logged automatically)
  sendAppointmentReceivedEmail({
    customerName: data.customer_name,
    customerPhone: data.customer_phone,
    treatmentName: treatmentName,
    scheduledAt: formatDateTime(data.scheduled_at),
    message: finalMessage || undefined,
  }).catch(console.error);

  return { success: true, appointmentId: appointment.id };
}

// ============================================================
// Dashboard: Update appointment status
// ============================================================

export async function updateAppointmentStatus(
  appointmentId: string,
  newStatus: AppointmentStatus,
  reason?: string
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Get staff ID
  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff not found' };

  // Get current appointment
  const { data: appointment } = await supabase
    .from('appointments')
    .select('*, treatments(name)')
    .eq('id', appointmentId)
    .single();

  if (!appointment) return { success: false, error: 'Appointment not found' };

  // Validate status transition
  const validTransitions: Record<string, string[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['checked_in', 'rescheduled', 'no_show', 'cancelled'],
    rescheduled: ['confirmed', 'cancelled'],
    checked_in: ['completed'],
    completed: [],
    no_show: [],
    cancelled: [],
    expired: [],
  };

  const allowed = validTransitions[appointment.status] || [];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `Cannot change status from "${appointment.status}" to "${newStatus}".`,
    };
  }

  // Build update payload
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_by: staff.id,
  };

  if (newStatus === 'confirmed') {
    updateData.confirmed_at = new Date().toISOString();
    updateData.confirmed_by = staff.id;
  }

  if (newStatus === 'cancelled') {
    updateData.cancellation_reason = reason || null;
  }

  const { error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', appointmentId);

  if (error) {
    console.error('[Appointment] Update failed:', error);
    return { success: false, error: 'Failed to update appointment.' };
  }

  // Send confirmation email if confirming and customer has email
  if (newStatus === 'confirmed' && appointment.customer_email) {
    const { data: settings } = await supabase
      .from('clinic_settings')
      .select('clinic_phone')
      .limit(1)
      .single();

    sendAppointmentConfirmedEmail({
      customerEmail: appointment.customer_email,
      customerName: appointment.customer_name,
      treatmentName: appointment.treatments?.name || 'Treatment',
      scheduledAt: formatDateTime(appointment.scheduled_at),
      clinicPhone: settings?.clinic_phone || undefined,
    }).catch(console.error);
  }

  // Audit log
  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'update',
    entity_type: 'appointment',
    entity_id: appointmentId,
    description: `Status changed from ${appointment.status} to ${newStatus}`,
    old_values: { status: appointment.status },
    new_values: { status: newStatus },
  });

  revalidatePath('/dashboard/appointments');
  return { success: true };
}

// ============================================================
// Dashboard: Link patient to appointment
// ============================================================

export async function linkPatientToAppointment(
  appointmentId: string,
  patientId: string
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff not found' };

  const { error } = await supabase
    .from('appointments')
    .update({
      patient_id: patientId,
      updated_by: staff.id,
    })
    .eq('id', appointmentId);

  if (error) {
    return { success: false, error: 'Failed to link patient.' };
  }

  revalidatePath('/dashboard/appointments');
  return { success: true };
}

// ============================================================
// Dashboard: Staff create appointment
// ============================================================

export async function createStaffAppointment(formData: {
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  treatment_id: string;
  patient_id?: string | null;
  scheduled_at: string;
  duration_minutes?: number;
  status?: AppointmentStatus;
  message?: string | null;
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

  if (!formData.customer_name?.trim()) return { success: false, error: 'Customer name is required' };
  if (!formData.customer_phone?.trim()) return { success: false, error: 'Customer phone is required' };
  if (!formData.treatment_id) return { success: false, error: 'Treatment is required' };
  if (!formData.scheduled_at) return { success: false, error: 'Appointment date and time is required' };

  const initialStatus = formData.status || 'confirmed';

  const insertData: Record<string, unknown> = {
    customer_name: formData.customer_name.trim(),
    customer_phone: formData.customer_phone.trim(),
    customer_email: formData.customer_email?.trim() || null,
    treatment_id: formData.treatment_id,
    patient_id: formData.patient_id || null,
    scheduled_at: formData.scheduled_at,
    duration_minutes: formData.duration_minutes || 45,
    status: initialStatus,
    message: formData.message?.trim() || null,
  };

  if (initialStatus === 'confirmed') {
    insertData.confirmed_at = new Date().toISOString();
    insertData.confirmed_by = staff.id;
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert(insertData)
    .select('id')
    .single();

  if (error || !appointment) {
    console.error('[Appointment] Staff create failed:', error);
    return { success: false, error: 'Failed to create appointment.' };
  }

  // Audit log
  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'create',
    entity_type: 'appointment',
    entity_id: appointment.id,
    description: `Staff booked appointment for ${formData.customer_name}`,
  });

  revalidatePath('/dashboard/appointments');
  return { success: true, appointmentId: appointment.id };
}

// ============================================================
// Dashboard: Delete (soft) appointment
// ============================================================

export async function deleteAppointment(appointmentId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  // Only super_admin can delete
  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can delete appointments.' };
  }

  const { error } = await supabase
    .from('appointments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', appointmentId);

  if (error) {
    return { success: false, error: 'Failed to delete appointment.' };
  }

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'delete',
    entity_type: 'appointment',
    entity_id: appointmentId,
    description: 'Appointment soft-deleted',
  });

  revalidatePath('/dashboard/appointments');
  return { success: true };
}

// ============================================================
// Public: Track appointment status by name, phone, or ID
// ============================================================

export async function trackPublicAppointment(searchQuery: string) {
  const query = (searchQuery || '').trim();
  if (!query || query.length < 2) {
    return { success: false, error: 'Please enter at least 2 characters to search.' };
  }

  const supabase = createAdminClient();

  // Normalize phone if entered
  const normalizedPhone = query.replace(/[\s\-\(\)\.]/g, '').replace(/^(\+92|0092|92)/, '0');

  // Query appointments
  let dbQuery = supabase
    .from('appointments')
    .select(`
      id,
      customer_name,
      customer_phone,
      customer_email,
      scheduled_at,
      status,
      message,
      cancellation_reason,
      confirmed_at,
      created_at,
      treatments(id, name, price)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (/^03[0-9]{9}$/.test(normalizedPhone)) {
    dbQuery = dbQuery.or(`customer_phone.eq.${normalizedPhone},customer_phone.eq.${query}`);
  } else if (/^[0-9a-fA-F-]{6,36}$/.test(query)) {
    // If UUID prefix or hex reference ID
    dbQuery = dbQuery.or(`id.ilike.%${query}%,customer_name.ilike.%${query}%`);
  } else {
    dbQuery = dbQuery.ilike('customer_name', `%${query}%`);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error('[Appointment] Track search failed:', error);
    return { success: false, error: 'Failed to search appointments. Please try again.' };
  }

  return { success: true, appointments: data || [] };
}

