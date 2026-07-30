import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

function getSessionAuthStorage(): Storage {
  if (typeof window !== "undefined") {
    return window.sessionStorage;
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0,
  } as unknown as Storage;
}

// Client-side Supabase client (uses anon/publishable key)
// User session is stored in sessionStorage so it does not survive a closed tab/browser.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: getSessionAuthStorage(),
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


