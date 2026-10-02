'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { appointmentBookingSchema, appointmentUpdateSchema } from '@/lib/validations';
import { sendAppointmentReceivedEmail, sendAppointmentConfirmedEmail } from '@/lib/email';
import { formatDateTime } from '@/lib/utils/helpers';
import { revalidatePath } from 'next/cache';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { RATE_LIMITS } from '@/lib/constants';
import type { AppointmentStatus } from '@/lib/types';

// ============================================================
// Public: Create appointment (guest, uses admin client)
// ============================================================

export async function createPublicAppointment(formData: unknown) {
  try {
    // Rate limit: prevent bot/spam abuse
    const ip = await getClientIp();
    const { limited } = checkRateLimit(`booking:${ip}`, RATE_LIMITS.booking.requests, RATE_LIMITS.booking.windowMs);
    if (limited) {
      return { success: false, error: 'Too many booking requests. Please wait a moment and try again.' };
    }

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

    try {
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
    } catch (tErr) {
      console.warn('Treatment resolution warning:', tErr);
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

    // Normalize phone number server-side (strip spaces/dashes, convert +92 to 0)
    const normalizePhone = (phone: string) =>
      phone.replace(/[\s\-()]/g, '').replace(/^\+92/, '0');
    const normalizedPhone = normalizePhone(data.customer_phone);

    // Create appointment
    const { data: appointment, error } = await supabase
      .from('appointments')
      .insert({
        customer_name: data.customer_name,
        customer_phone: normalizedPhone,
        customer_email: data.customer_email || null,
        treatment_id: validTreatmentId,
        scheduled_at: data.scheduled_at,
        message: finalMessage,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error || !appointment) {
      console.error('[Appointment] Create failed:', error);
      return {
        success: false,
        error: error?.message || 'Failed to create appointment. Please try again.',
      };
    }

    // Send notification email (non-blocking, logged automatically)
    try {
      sendAppointmentReceivedEmail({
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        treatmentName: treatmentName,
        scheduledAt: formatDateTime(data.scheduled_at),
        message: finalMessage || undefined,
      }).catch(console.error);
    } catch (emailErr) {
      console.warn('Email trigger warning:', emailErr);
    }

    // Revalidate dashboard views immediately
    try {
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/appointments');
    } catch (revalErr) {
      console.warn('Revalidation warning:', revalErr);
    }

    return { success: true, appointmentId: appointment.id };
  } catch (err: any) {
    console.error('[createPublicAppointment] Fatal error:', err);
    return {
      success: false,
      error:
        err?.message && !err.message.includes('Minified React error')
          ? err.message
          : 'Unable to submit booking right now. Please call or WhatsApp our clinic at 0335-6400959.',
    };
  }
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

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) {
    return { success: false, error: 'Staff access required to delete appointments.' };
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
  revalidatePath('/dashboard');
  return { success: true };
}

// ============================================================
// Dashboard: Staff edit/update appointment
// ============================================================

export async function updateAppointment(
  appointmentId: string,
  formData: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string | null;
    treatment_id: string;
    patient_id?: string | null;
    scheduled_at: string;
    duration_minutes?: number;
    status: AppointmentStatus;
    message?: string | null;
  }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff not found' };

  if (!formData.customer_name?.trim()) return { success: false, error: 'Patient name is required.' };
  if (!formData.customer_phone?.trim()) return { success: false, error: 'Phone number is required.' };
  if (!formData.treatment_id) return { success: false, error: 'Treatment is required.' };
  if (!formData.scheduled_at) return { success: false, error: 'Date and time is required.' };

  const { error } = await supabase
    .from('appointments')
    .update({
      customer_name: formData.customer_name.trim(),
      customer_phone: formData.customer_phone.trim(),
      customer_email: formData.customer_email?.trim() || null,
      treatment_id: formData.treatment_id,
      patient_id: formData.patient_id || null,
      scheduled_at: formData.scheduled_at,
      duration_minutes: formData.duration_minutes || 45,
      status: formData.status,
      message: formData.message?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', appointmentId);

  if (error) {
    console.error('[Appointment] Update failed:', error);
    return { success: false, error: 'Failed to update appointment.' };
  }

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'update',
    entity_type: 'appointment',
    entity_id: appointmentId,
    description: `Staff edited appointment for ${formData.customer_name}`,
  });

  revalidatePath('/dashboard/appointments');
  revalidatePath('/dashboard');
  return { success: true };
}

// ============================================================
// Public: Track appointment status by phone or appointment ID
// Only returns safe, non-sensitive fields to protect patient privacy.
// ============================================================

export async function trackPublicAppointment(searchQuery: string) {
  const query = (searchQuery || '').trim();
  if (!query || query.length < 2) {
    return { success: false, error: 'Please enter your phone number or booking reference to search.' };
  }

  const supabase = createAdminClient();

  // Normalize phone if entered
  const normalizedPhone = query.replace(/[\s\-\(\)\.]/g, '').replace(/^(\+92|0092|92)/, '0');

  // Only allow search by exact phone match or appointment ID — NOT by name (privacy)
  let dbQuery = supabase
    .from('appointments')
    .select(`
      id,
      scheduled_at,
      status,
      confirmed_at,
      created_at,
      treatments(name)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(10);

  if (/^03[0-9]{9}$/.test(normalizedPhone)) {
    // Exact phone match only
    dbQuery = dbQuery.eq('customer_phone', normalizedPhone);
  } else if (/^[0-9a-fA-F-]{6,36}$/.test(query)) {
    // Appointment ID / reference lookup
    dbQuery = dbQuery.ilike('id', `%${query}%`);
  } else {
    // Reject name-based searches for privacy
    return { success: false, error: 'Please enter your phone number (e.g. 03001234567) or booking reference ID.' };
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error('[Appointment] Track search failed:', error);
    return { success: false, error: 'Failed to search appointments. Please try again.' };
  }

  // Return only safe fields — no phone, email, or messages
  const safeResults = (data || []).map((apt: any) => ({
    id: apt.id,
    scheduled_at: apt.scheduled_at,
    status: apt.status,
    confirmed_at: apt.confirmed_at,
    created_at: apt.created_at,
    treatments: apt.treatments,
  }));

  return { success: true, appointments: safeResults };
}

