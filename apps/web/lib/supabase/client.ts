"use client";

/**
 * Browser Supabase client — **anon key only**. Safe for client components.
 * For authenticated server work, use {@link createSupabaseServerClient} in `server.ts`.
 */
import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for browser client.");
  }
  return createBrowserClient(url, anon);
}
