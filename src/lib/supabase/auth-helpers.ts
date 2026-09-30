import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { UserRole, Staff } from '@/lib/types';

/**
 * Get the current authenticated user and their staff record.
 * Redirects to login if not authenticated.
 * Returns the staff record with role information.
 */
export async function getAuthenticatedStaff(): Promise<Staff> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/login');
  }

  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .single();

  if (staffError || !staff) {
    // User exists in auth but has no active staff record
    await supabase.auth.signOut();
    redirect('/auth/login?error=unauthorized');
  }

  return staff as Staff;
}

/**
 * Check if the current user has the required role.
 * Returns the staff record if authorized, redirects to dashboard if not.
 */
export async function requireRole(requiredRole: UserRole): Promise<Staff> {
  const staff = await getAuthenticatedStaff();

  if (staff.role !== requiredRole && staff.role !== 'super_admin') {
    redirect('/dashboard?error=forbidden');
  }

  return staff;
}

/**
 * Check if the current user is a super admin.
 * Returns the staff record if authorized.
 */
export async function requireSuperAdmin(): Promise<Staff> {
  return requireRole('super_admin');
}

/**
 * Check if a staff member has permission for a specific action.
 * Does not redirect — returns boolean for conditional rendering.
 */
export function hasPermission(role: UserRole, permission: StaffPermission): boolean {
  if (role === 'super_admin') return true;

  return RECEPTIONIST_PERMISSIONS.includes(permission);
}

// Permission keys for granular checks
export type StaffPermission =
  | 'appointments.view'
  | 'appointments.create'
  | 'appointments.manage'
  | 'appointments.delete'
  | 'patients.view'
  | 'patients.create'
  | 'patients.edit'
  | 'patients.delete'
  | 'clinical_notes.view'
  | 'clinical_notes.manage'
  | 'pos.create'
  | 'pos.void'
  | 'invoices.view'
  | 'invoices.print'
  | 'invoices.void'
  | 'inventory.view'
  | 'inventory.manage'
  | 'inventory.view_costs'
  | 'orders.view'
  | 'orders.manage'
  | 'orders.delete'
  | 'reviews.view'
  | 'reviews.moderate'
  | 'reviews.delete'
  | 'gallery.view'
  | 'gallery.upload'
  | 'gallery.publish'
  | 'gallery.consent'
  | 'gallery.delete'
  | 'content.manage'
  | 'reports.view'
  | 'settings.manage'
  | 'staff.manage'
  | 'csv.export';

// Permissions granted to receptionist role
const RECEPTIONIST_PERMISSIONS: StaffPermission[] = [
  'appointments.view',
  'appointments.create',
  'appointments.manage',
  'patients.view',
  'patients.create',
  'patients.edit',
  'pos.create',
  'invoices.view',
  'invoices.print',
  'inventory.view',
  'orders.view',
  'orders.manage',
  'reviews.view',
  'reviews.moderate',
  'gallery.view',
  'gallery.upload',
];
