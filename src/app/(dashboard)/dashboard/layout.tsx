import { redirect } from 'next/navigation';
import { getAuthenticatedStaff } from '@/lib/supabase/auth-helpers';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getAuthenticatedStaff();

  if (!staff) {
    redirect('/auth/login');
  }

  return (
    <DashboardShell staff={staff}>
      {children}
    </DashboardShell>
  );
}
