'use server';

import { createClient } from '@/lib/supabase/server';
import {
  patientProcedureSchema,
  procedureSessionSchema,
  procedurePaymentSchema,
} from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import type { PaymentMethod, ProcedurePaymentStatus, ProcedureStatus } from '@/lib/types';

// ============================================================
// Helper: Generate Procedure Payment Receipt Number
// ============================================================

async function getNextReceiptNumber(supabase: any): Promise<string> {
  try {
    const { data: rpcNum, error } = await supabase.rpc('generate_procedure_receipt_number');
    if (!error && rpcNum) {
      return rpcNum;
    }
  } catch (err) {
    console.warn('[Receipt] RPC lookup fallback:', err);
  }

  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `BSC-PAY-${year}-${Date.now().toString().slice(-4)}${rand}`;
}

// ============================================================
// 1. Create Patient Procedure / Multi-Session Treatment Plan
// ============================================================

export async function createPatientProcedure(formData: unknown) {
  const parsed = patientProcedureSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff access required' };

  const totalCost = Number(data.total_cost) || 0;
  const advancePayment = Number(data.advance_payment) || 0;
  const balanceAmount = Math.max(0, totalCost - advancePayment);

  let paymentStatus: ProcedurePaymentStatus = 'pending';
  if (advancePayment >= totalCost && totalCost > 0) {
    paymentStatus = 'paid';
  } else if (advancePayment > 0) {
    paymentStatus = 'partial';
  }

  // Calculate default next due date if not provided but interval exists
  let nextDueDate = data.next_session_due_date || null;
  if (!nextDueDate && data.interval_days && data.interval_days > 0 && data.total_sessions > 1) {
    const d = new Date();
    d.setDate(d.getDate() + data.interval_days);
    nextDueDate = d.toISOString().split('T')[0];
  }

  // Insert procedure plan
  const { data: procedure, error: procErr } = await supabase
    .from('patient_procedures')
    .insert({
      patient_id: data.patient_id,
      treatment_id: data.treatment_id || null,
      plan_name: data.plan_name.trim(),
      total_sessions: data.total_sessions,
      completed_sessions: data.log_first_session ? 1 : 0,
      status: data.log_first_session && data.total_sessions === 1 ? 'completed' : 'active',
      total_cost: totalCost,
      paid_amount: advancePayment,
      balance_amount: balanceAmount,
      payment_status: paymentStatus,
      interval_days: data.interval_days || 30,
      next_session_due_date: nextDueDate,
      doctor_id: data.doctor_id || staff.id,
      notes: data.notes?.trim() || null,
      created_by: staff.id,
    })
    .select('id')
    .single();

  if (procErr || !procedure) {
    console.error('[Procedure] Create failed:', procErr);
    return { success: false, error: procErr?.message || 'Failed to create procedure plan.' };
  }

  let firstSessionId: string | null = null;

  // If first session is being conducted now
  if (data.log_first_session) {
    const { data: sessionData, error: sessErr } = await supabase
      .from('procedure_sessions')
      .insert({
        procedure_id: procedure.id,
        patient_id: data.patient_id,
        session_number: 1,
        session_date: new Date().toISOString(),
        status: 'completed',
        doctor_id: data.doctor_id || staff.id,
        treatment_area: data.first_session_area?.trim() || null,
        settings_used: data.first_session_settings?.trim() || null,
        observations_notes: data.first_session_notes?.trim() || 'Session 1 completed upon enrollment.',
        aftercare_instructions: 'Standard clinic aftercare advice given.',
        next_recommended_date: nextDueDate,
        created_by: staff.id,
      })
      .select('id')
      .single();

    if (sessErr) {
      console.warn('[Procedure] First session creation warning:', sessErr);
    } else if (sessionData) {
      firstSessionId = sessionData.id;
    }
  }

  // If advance payment was made, log receipt
  let receiptNumber: string | undefined = undefined;
  if (advancePayment > 0) {
    const receiptNum = await getNextReceiptNumber(supabase);
    receiptNumber = receiptNum;
    const { error: payErr } = await supabase
      .from('procedure_payments')
      .insert({
        procedure_id: procedure.id,
        patient_id: data.patient_id,
        session_id: firstSessionId,
        receipt_number: receiptNum,
        amount: advancePayment,
        payment_method: data.payment_method as PaymentMethod,
        payment_date: new Date().toISOString(),
        notes: `Initial advance payment for ${data.plan_name}`,
        received_by: staff.id,
      });

    if (payErr) {
      console.warn('[Procedure] Advance payment record warning:', payErr);
    }
  }

  // Audit log
  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'create',
    entity_type: 'patient_procedure',
    entity_id: procedure.id,
    description: `Created procedure plan "${data.plan_name}" (${data.total_sessions} sessions) for patient`,
  });

  revalidatePath(`/dashboard/patients/${data.patient_id}`);
  revalidatePath('/dashboard/patients');
  return { success: true, procedureId: procedure.id, receiptNumber };
}

// ============================================================
// 2. Log Procedure Session (e.g. Session 1, Session 2, Session 3...)
// ============================================================

export async function logProcedureSession(formData: unknown) {
  const parsed = procedureSessionSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff access required' };

  // Fetch parent procedure
  const { data: procedure, error: procFetchErr } = await supabase
    .from('patient_procedures')
    .select('*')
    .eq('id', data.procedure_id)
    .single();

  if (procFetchErr || !procedure) {
    return { success: false, error: 'Procedure plan not found.' };
  }

  // Insert session record
  const { data: session, error: sessErr } = await supabase
    .from('procedure_sessions')
    .insert({
      procedure_id: data.procedure_id,
      patient_id: data.patient_id,
      session_number: data.session_number,
      session_date: data.session_date,
      status: data.status,
      doctor_id: data.doctor_id || staff.id,
      treatment_area: data.treatment_area?.trim() || null,
      settings_used: data.settings_used?.trim() || null,
      observations_notes: data.observations_notes?.trim() || null,
      aftercare_instructions: data.aftercare_instructions?.trim() || null,
      next_recommended_date: data.next_recommended_date || null,
      created_by: staff.id,
    })
    .select('id')
    .single();

  if (sessErr || !session) {
    console.error('[ProcedureSession] Insert failed:', sessErr);
    return { success: false, error: sessErr?.message || 'Failed to log session.' };
  }

  // Handle payment collection during session if specified
  const paymentAmount = Number(data.payment_amount) || 0;
  let newPaid = Number(procedure.paid_amount) || 0;
  let newBalance = Number(procedure.balance_amount) || 0;
  let newPaymentStatus: ProcedurePaymentStatus = procedure.payment_status;

  let receiptNumber: string | undefined = undefined;
  if (paymentAmount > 0) {
    const receiptNum = await getNextReceiptNumber(supabase);
    receiptNumber = receiptNum;
    const { error: payErr } = await supabase
      .from('procedure_payments')
      .insert({
        procedure_id: data.procedure_id,
        patient_id: data.patient_id,
        session_id: session.id,
        receipt_number: receiptNum,
        amount: paymentAmount,
        payment_method: (data.payment_method || 'cash') as PaymentMethod,
        payment_date: new Date().toISOString(),
        notes: data.payment_notes?.trim() || `Payment received during Session #${data.session_number}`,
        received_by: staff.id,
      });

    if (payErr) {
      console.warn('[ProcedurePayment] Session payment insert warning:', payErr);
    } else {
      newPaid += paymentAmount;
      newBalance = Math.max(0, Number(procedure.total_cost) - newPaid);
      if (newPaid >= Number(procedure.total_cost) && Number(procedure.total_cost) > 0) {
        newPaymentStatus = 'paid';
      } else if (newPaid > 0) {
        newPaymentStatus = 'partial';
      }
    }
  }

  // Update procedure completion count & next due date
  const completedCount = data.status === 'completed'
    ? Math.max(procedure.completed_sessions + 1, data.session_number)
    : procedure.completed_sessions;

  const isAllCompleted = completedCount >= procedure.total_sessions;
  const newStatus: ProcedureStatus = isAllCompleted ? 'completed' : procedure.status;

  const updatePayload: Record<string, any> = {
    completed_sessions: completedCount,
    status: newStatus,
    paid_amount: newPaid,
    balance_amount: newBalance,
    payment_status: newPaymentStatus,
    updated_at: new Date().toISOString(),
  };

  if (data.next_recommended_date) {
    updatePayload.next_session_due_date = data.next_recommended_date;
  } else if (isAllCompleted) {
    updatePayload.next_session_due_date = null;
  }

  await supabase
    .from('patient_procedures')
    .update(updatePayload)
    .eq('id', data.procedure_id);

  // Audit log
  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'create',
    entity_type: 'procedure_session',
    entity_id: session.id,
    description: `Logged Session #${data.session_number} for procedure "${procedure.plan_name}"`,
  });

  revalidatePath(`/dashboard/patients/${data.patient_id}`);
  return { success: true, sessionId: session.id, receiptNumber };
}

// ============================================================
// 3. Record Procedure Payment / Balance Clearance
// ============================================================

export async function recordProcedurePayment(formData: unknown) {
  const parsed = procedurePaymentSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const data = parsed.data;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff access required' };

  // Fetch procedure
  const { data: procedure, error: procErr } = await supabase
    .from('patient_procedures')
    .select('*')
    .eq('id', data.procedure_id)
    .single();

  if (procErr || !procedure) {
    return { success: false, error: 'Procedure plan not found.' };
  }

  const amount = Number(data.amount) || 0;
  if (amount <= 0) {
    return { success: false, error: 'Payment amount must be greater than 0.' };
  }

  const receiptNum = await getNextReceiptNumber(supabase);

  // Insert payment
  const { data: payment, error: payErr } = await supabase
    .from('procedure_payments')
    .insert({
      procedure_id: data.procedure_id,
      patient_id: data.patient_id,
      session_id: data.session_id || null,
      receipt_number: receiptNum,
      amount,
      payment_method: data.payment_method as PaymentMethod,
      payment_date: data.payment_date || new Date().toISOString(),
      notes: data.notes?.trim() || null,
      received_by: staff.id,
    })
    .select('id')
    .single();

  if (payErr || !payment) {
    console.error('[ProcedurePayment] Insert failed:', payErr);
    return { success: false, error: payErr?.message || 'Failed to record payment.' };
  }

  // Update procedure financial balance
  const newPaid = Number(procedure.paid_amount) + amount;
  const newBalance = Math.max(0, Number(procedure.total_cost) - newPaid);

  let newPaymentStatus: ProcedurePaymentStatus = 'partial';
  if (newPaid >= Number(procedure.total_cost) && Number(procedure.total_cost) > 0) {
    newPaymentStatus = 'paid';
  }

  await supabase
    .from('patient_procedures')
    .update({
      paid_amount: newPaid,
      balance_amount: newBalance,
      payment_status: newPaymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.procedure_id);

  // Audit log
  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'create',
    entity_type: 'procedure_payment',
    entity_id: payment.id,
    description: `Recorded payment of PKR ${amount} (${data.payment_method}) for procedure "${procedure.plan_name}" (Receipt: ${receiptNum})`,
  });

  revalidatePath(`/dashboard/patients/${data.patient_id}`);
  return { success: true, paymentId: payment.id, receiptNumber: receiptNum };
}

// ============================================================
// 4. Update Procedure Plan Status (active, completed, paused, cancelled)
// ============================================================

export async function updateProcedureStatus(
  procedureId: string,
  patientId: string,
  newStatus: ProcedureStatus
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff access required' };

  const { error } = await supabase
    .from('patient_procedures')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', procedureId);

  if (error) {
    return { success: false, error: 'Failed to update procedure status.' };
  }

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'update',
    entity_type: 'patient_procedure',
    entity_id: procedureId,
    description: `Status changed to ${newStatus}`,
  });

  revalidatePath(`/dashboard/patients/${patientId}`);
  return { success: true };
}

// ============================================================
// 5. Delete / Cancel Procedure Plan
// ============================================================

export async function deleteProcedurePlan(procedureId: string, patientId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const { data: staff } = await supabase
    .from('staff')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .single();

  if (!staff) return { success: false, error: 'Staff access required' };

  const { error } = await supabase
    .from('patient_procedures')
    .update({
      deleted_at: new Date().toISOString(),
      status: 'cancelled',
    })
    .eq('id', procedureId);

  if (error) {
    return { success: false, error: 'Failed to delete procedure.' };
  }

  await supabase.from('audit_log').insert({
    staff_id: staff.id,
    action: 'delete',
    entity_type: 'patient_procedure',
    entity_id: procedureId,
    description: `Procedure soft-deleted`,
  });

  revalidatePath(`/dashboard/patients/${patientId}`);
  return { success: true };
}
