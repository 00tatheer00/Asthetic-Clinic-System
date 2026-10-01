import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { SettingsForm } from './settings-form';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Settings | Brimish Clinic Dashboard' };

export default async function SettingsPage() {
  const staff = await getAuthenticatedStaff();
  const supabase = await createClient();

  const isAdmin = staff.role === 'super_admin';

  const [{ data: settings }, { data: hours }, { data: allStaff }] = await Promise.all([
    supabase
      .from('clinic_settings')
      .select('*')
      .limit(1)
      .single(),
    supabase
      .from('operating_hours')
      .select('*')
      .order('day_of_week'),
    isAdmin
      ? supabase
          .from('staff')
          .select('id, name, email, role, is_active')
          .order('name')
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clinic Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure clinic identity, tax parameters, weekly operating hours, and admin login security.
        </p>
      </div>

      <SettingsForm
        settings={settings || null}
        operatingHours={hours || []}
        staff={{
          id: staff.id,
          name: staff.name,
          email: staff.email,
          role: staff.role,
        }}
        allStaff={allStaff || []}
        isAdmin={isAdmin}
      />
    </div>
  );
}

