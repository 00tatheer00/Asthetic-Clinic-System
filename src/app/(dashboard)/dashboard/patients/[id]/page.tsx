import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { notFound } from 'next/navigation';
import { PatientDetail } from './patient-detail';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Patient — ${id.slice(0, 8)}` };
}

export default async function PatientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const staff = await getAuthenticatedStaff();
  const supabase = await createClient();
  const isAdmin = staff.role === 'super_admin';

  // Fetch patient
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (!patient) notFound();

  // Fetch appointments
  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, treatment_id, scheduled_at, status, treatments(name)')
    .eq('patient_id', id)
    .is('deleted_at', null)
    .order('scheduled_at', { ascending: false })
    .limit(50);

  // Fetch visits
  const { data: visits } = await supabase
    .from('visits')
    .select('id, visit_date, notes, treatment_id, sale_id, treatments(name)')
    .eq('patient_id', id)
    .order('visit_date', { ascending: false })
    .limit(50);

  // Fetch sales (direct POS sales linked to patient)
  const { data: sales } = await supabase
    .from('sales')
    .select('id, total, payment_method, payment_status, created_at, voided_at')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch invoices
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, total, status, payment_status, created_at')
    .eq('patient_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch clinical notes (admin only)
  let clinicalNotes: Array<{
    id: string;
    note_text: string;
    diagnosis: string | null;
    prescription: string | null;
    created_at: string;
    visit_id: string | null;
  }> = [];

  if (isAdmin) {
    const { data } = await supabase
      .from('clinical_notes')
      .select('id, note_text, diagnosis, prescription, created_at, visit_id')
      .eq('patient_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    clinicalNotes = data || [];
  }

  // Fetch before/after cases
  const { data: beforeAfterCases } = await supabase
    .from('before_after')
    .select('id, title, before_image_url, after_image_url, is_public, created_at, treatments(name)')
    .eq('patient_id', id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  // Calculate stats
  const totalVisits = (visits || []).length;
  const totalSpending = (sales || []).filter(s => !s.voided_at).reduce((sum, s) => sum + s.total, 0);
  const lastVisit = visits && visits.length > 0 ? visits[0].visit_date : null;

  // Fetch treatments list for visit form
  const { data: treatments } = await supabase
    .from('treatments')
    .select('id, name, price')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name');

  return (
    <PatientDetail
      patient={patient}
      appointments={appointments || []}
      visits={visits || []}
      sales={sales || []}
      invoices={invoices || []}
      clinicalNotes={clinicalNotes}
      beforeAfterCases={beforeAfterCases || []}
      treatments={treatments || []}
      stats={{ totalVisits, totalSpending, lastVisit }}
      isAdmin={isAdmin}
    />
  );
}
