import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ucyulaqwnoarbbhlhdxn.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable_AeIBkfn4hFRKY-gl7TSETA_2I0OCKYz';

/**
 * Supabase client for use in browser (Client Components).
 * Uses the anon key — all queries go through RLS.
 */
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

