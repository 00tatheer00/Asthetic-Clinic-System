import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { GalleryList } from './gallery-list';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Before & After Gallery | Brimish Clinic Dashboard',
  description: 'Manage clinical before and after case photographs and patient consent records.',
};

export default async function GalleryPage() {
  const staff = await getAuthenticatedStaff();
  const isAdmin = staff?.role === 'super_admin';

  const supabase = await createClient();

  // Fetch treatments and patients for dropdown
  const [{ data: treatments }, { data: patients }, { data: cases }] = await Promise.all([
    supabase.from('treatments').select('id, name').order('name'),
    supabase.from('patients').select('id, name, phone').order('name').limit(100),
    supabase
      .from('before_after')
      .select(
        `
        *,
        treatments (id, name),
        patients (id, name, phone),
        consent_records (*)
      `
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <GalleryList
      cases={cases || []}
      treatments={treatments || []}
      patients={patients || []}
      isAdmin={isAdmin}
    />
  );
}
