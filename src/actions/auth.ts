'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { loginSchema, type LoginInput } from '@/lib/validations';
import { revalidatePath } from 'next/cache';

export interface LoginActionResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Server Action for Staff Authentication.
 * Handles credential verification, session cookie writing via Set-Cookie headers,
 * and role/privilege validation on the server.
 */
export async function loginStaffAction(
  data: LoginInput,
  redirectTo: string = '/dashboard'
): Promise<LoginActionResult> {
  try {
    // 1. Validate inputs
    const parsed = loginSchema.safeParse(data);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid input provided.';
      return { success: false, error: firstError };
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    // 2. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (authError) {
      console.warn('[AuthAction] Sign in failed for:', email, authError.message);
      return {
        success: false,
        error:
          authError.message === 'Invalid login credentials'
            ? 'Invalid email or password. Please check your credentials.'
            : authError.message,
      };
    }

    if (!authData.user) {
      return { success: false, error: 'Authentication failed. Please try again.' };
    }

    // 3. Verify that the authenticated user has an active record in the staff table
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('id, name, role, is_active')
      .eq('auth_user_id', authData.user.id)
      .single();

    if (staffError || !staff) {
      console.warn('[AuthAction] User exists in auth but no staff record found:', authData.user.id);
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Your account is not registered as clinic staff. Contact administrator.',
      };
    }

    if (!staff.is_active) {
      console.warn('[AuthAction] Staff account is deactivated:', staff.id);
      await supabase.auth.signOut();
      return {
        success: false,
        error: 'Your staff account has been deactivated. Please contact the clinic director.',
      };
    }

    console.log(`[AuthAction] Successful staff login: ${staff.name} (${staff.role})`);
    return { success: true, redirectTo: redirectTo || '/dashboard' };
  } catch (err: unknown) {
    console.error('[AuthAction] Unexpected error during login:', err);
    const message = err instanceof Error ? err.message : 'An unexpected server error occurred.';
    return { success: false, error: message };
  }
}

/**
 * Server Action for Staff Logout
 */
export async function logoutStaffAction(): Promise<{ success: boolean }> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch (err) {
    console.error('[AuthAction] Logout error:', err);
    return { success: false };
  }
}

/**
 * Server Action: Super Admin update login email for a staff member or themselves.
 */
export async function updateStaffEmailAction(data: {
  newEmail: string;
  staffId?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized session.' };

    const { data: currentStaff } = await supabase
      .from('staff')
      .select('id, name, role')
      .eq('auth_user_id', user.id)
      .single();

    if (!currentStaff || currentStaff.role !== 'super_admin') {
      return { success: false, error: 'Only Super Admin can reset login email.' };
    }

    const emailTrimmed = data.newEmail?.trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes('@') || !emailTrimmed.includes('.')) {
      return { success: false, error: 'Please provide a valid email address.' };
    }

    // Determine target staff
    let targetStaff = currentStaff;
    if (data.staffId && data.staffId !== currentStaff.id) {
      const { data: found } = await supabase
        .from('staff')
        .select('id, name, role, auth_user_id')
        .eq('id', data.staffId)
        .single();
      if (!found) return { success: false, error: 'Target staff record not found.' };
      targetStaff = found;
    }

    const targetAuthUserId = (targetStaff as any).auth_user_id || user.id;

    // 1. Try updating via admin client with auto confirmation
    let authUpdated = false;
    let authErrorMessage = '';
    try {
      const adminClient = createAdminClient();
      const { error: adminError } = await adminClient.auth.admin.updateUserById(targetAuthUserId, {
        email: emailTrimmed,
        email_confirm: true,
      });
      if (!adminError) {
        authUpdated = true;
      } else {
        authErrorMessage = adminError.message;
      }
    } catch (e: any) {
      authErrorMessage = e?.message || 'Admin client error';
    }

    // 2. Fallback to standard client if user is updating self
    if (!authUpdated && targetAuthUserId === user.id) {
      const { error: selfUpdateError } = await supabase.auth.updateUser({
        email: emailTrimmed,
      });
      if (!selfUpdateError) {
        authUpdated = true;
      } else {
        return { success: false, error: selfUpdateError.message || authErrorMessage };
      }
    } else if (!authUpdated) {
      return { success: false, error: authErrorMessage || 'Failed to update authentication email.' };
    }

    // 3. Update email in staff table
    await supabase
      .from('staff')
      .update({ email: emailTrimmed, updated_at: new Date().toISOString() })
      .eq('id', targetStaff.id);

    // 4. Audit log
    await supabase.from('audit_log').insert({
      staff_id: currentStaff.id,
      action: 'update',
      entity_type: 'staff_credential',
      entity_id: targetStaff.id,
      description: `Super Admin (${currentStaff.name}) updated login email to ${emailTrimmed} for ${targetStaff.name}`,
    });

    revalidatePath('/dashboard/settings');
    return { success: true, message: `Login email successfully updated to ${emailTrimmed}.` };
  } catch (err: any) {
    console.error('[AuthAction] Email update failed:', err);
    return { success: false, error: err?.message || 'Failed to update login email.' };
  }
}

/**
 * Server Action: Super Admin update login password for a staff member or themselves.
 */
export async function updateStaffPasswordAction(data: {
  newPassword: string;
  staffId?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized session.' };

    const { data: currentStaff } = await supabase
      .from('staff')
      .select('id, name, role')
      .eq('auth_user_id', user.id)
      .single();

    if (!currentStaff || currentStaff.role !== 'super_admin') {
      return { success: false, error: 'Only Super Admin can reset login password.' };
    }

    if (!data.newPassword || data.newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    // Determine target staff
    let targetStaff = currentStaff;
    if (data.staffId && data.staffId !== currentStaff.id) {
      const { data: found } = await supabase
        .from('staff')
        .select('id, name, role, auth_user_id')
        .eq('id', data.staffId)
        .single();
      if (!found) return { success: false, error: 'Target staff record not found.' };
      targetStaff = found;
    }

    const targetAuthUserId = (targetStaff as any).auth_user_id || user.id;

    // 1. Try updating via admin client
    let pwdUpdated = false;
    let pwdErrorMessage = '';
    try {
      const adminClient = createAdminClient();
      const { error: adminError } = await adminClient.auth.admin.updateUserById(targetAuthUserId, {
        password: data.newPassword,
      });
      if (!adminError) {
        pwdUpdated = true;
      } else {
        pwdErrorMessage = adminError.message;
      }
    } catch (e: any) {
      pwdErrorMessage = e?.message || 'Admin client error';
    }

    // 2. Fallback to standard client if user is updating self
    if (!pwdUpdated && targetAuthUserId === user.id) {
      const { error: selfUpdateError } = await supabase.auth.updateUser({
        password: data.newPassword,
      });
      if (!selfUpdateError) {
        pwdUpdated = true;
      } else {
        return { success: false, error: selfUpdateError.message || pwdErrorMessage };
      }
    } else if (!pwdUpdated) {
      return { success: false, error: pwdErrorMessage || 'Failed to update authentication password.' };
    }

    // 3. Audit log
    await supabase.from('audit_log').insert({
      staff_id: currentStaff.id,
      action: 'update',
      entity_type: 'staff_credential',
      entity_id: targetStaff.id,
      description: `Super Admin (${currentStaff.name}) updated password for ${targetStaff.name}`,
    });

    revalidatePath('/dashboard/settings');
    return { success: true, message: `Login password for ${targetStaff.name} has been updated successfully.` };
  } catch (err: any) {
    console.error('[AuthAction] Password update failed:', err);
    return { success: false, error: err?.message || 'Failed to update password.' };
  }
}
