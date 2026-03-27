/**
 * Central place for typed HTTP + Supabase clients used by web, admin, and mobile.
 * Migrate call sites from app-local `lib/supabase.ts` gradually to imports from `@api/*`.
 */
import { createBrowserClient } from "@supabase/supabase-js";

export function createSupabaseBrowserClient(url: string, anonKey: string) {
  return createBrowserClient(url, anonKey);
}

export type { SupabaseClient } from "@supabase/supabase-js";
