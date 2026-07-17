import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || '';

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}

// Server-side Supabase client with service role key (bypasses RLS)
// Use this in API routes and server components for admin operations
export const supabaseAdmin = supabaseSecretKey
  ? createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : (() => {
      console.warn("SUPABASE_SECRET_KEY not found, falling back to anon key - admin operations may fail");
      return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '', {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    })();
