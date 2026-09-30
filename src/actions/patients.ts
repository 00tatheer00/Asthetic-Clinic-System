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

  if (!staff || staff.role !== 'super_admin') {
    return { success: false, error: 'Only admin can delete patients.' };
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
