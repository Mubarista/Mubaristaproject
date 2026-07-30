import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

// Client-side Supabase client (uses anon/publishable key)
// Session persistence is enabled by default with auth.persistSession = true
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storageKey: 'sb-mubarista-auth',
  },
});

// Dedicated admin client with its own isolated storage key.
// This keeps the admin session completely independent from the regular
// user session, so signing out of one never affects the other. Both are
// still managed securely by Supabase (encrypted JWTs, auto-refresh, server
// validation) — the only difference is where the session tokens are stored.
export const supabaseAdminAuth =
  typeof window !== "undefined"
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          flowType: 'pkce',
          storageKey: 'sb-mubarista-admin-auth',
        },
      })
    : supabase;


