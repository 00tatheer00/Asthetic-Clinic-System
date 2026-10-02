import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SERVICE_ROLE_KEY && typeof window === 'undefined') {
  console.warn(
    '[Admin Client] SUPABASE_SERVICE_ROLE_KEY is not set. Public form submissions (bookings, reviews, orders) WILL FAIL due to RLS restrictions. Set this env variable in your hosting dashboard.'
  );
}


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
  return createSupabaseClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

