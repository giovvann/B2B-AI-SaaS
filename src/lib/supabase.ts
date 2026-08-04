import { createBrowserClient } from '@supabase/ssr';

export const createClient = (options?: { detectSessionInUrl?: boolean }) => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { detectSessionInUrl: options?.detectSessionInUrl ?? true }
  );
};