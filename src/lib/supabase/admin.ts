import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase admin client using the service role key.
 * BYPASSES RLS — use only for server-side operations that need elevated privileges:
 * - Public form submissions (booking, orders, reviews) where no user is authenticated
 * - Cron job operations
 * - Email logging
 * - Invoice number generation
 *
 * NEVER expose this client or the service role key to the browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
