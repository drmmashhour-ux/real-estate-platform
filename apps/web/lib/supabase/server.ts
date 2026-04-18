import { createServerClient } from "@supabase/ssr";
import { createSupabaseCookieAdapter } from "@/lib/supabase/cookies";

/**
 * Server Supabase client — uses **anon key** + cookie session (Supabase Auth refresh flow).
 * Use in Server Components / Route Handlers when integrating Supabase Auth JWT alongside cookies.
 */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }

  const cookieAdapter = await createSupabaseCookieAdapter();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieAdapter.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
        cookieAdapter.setAll(cookiesToSet);
      },
    },
  });
}
