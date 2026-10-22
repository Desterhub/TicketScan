import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
// Automatically strip trailing /rest/v1/ or slashes if user copied the Data API endpoint directly
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const fallbackUrl = 'https://placeholder-instance.supabase.co';
const fallbackKey = 'placeholder-anon-key-ticketscan';

/**
 * Public browser-safe Supabase client (respects RLS)
 */
export function getSupabaseClient() {
  const url = supabaseUrl || fallbackUrl;
  const key = supabaseAnonKey || fallbackKey;
  return createSupabaseClient(url, key);
}

/**
 * Server-side Admin / Service-Role Supabase client (used for secure server operations & migrations)
 */
export function getServiceRoleClient() {
  const url = supabaseUrl || fallbackUrl;
  const key = supabaseServiceKey || supabaseAnonKey || fallbackKey;
  return createSupabaseClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && (supabaseServiceKey || supabaseAnonKey));
}
