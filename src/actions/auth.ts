'use server';

import { createClient } from '@/lib/supabase/server';
import { loginSchema, type LoginInput } from '@/lib/validations';

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
