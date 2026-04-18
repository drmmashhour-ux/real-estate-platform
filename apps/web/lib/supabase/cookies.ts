/**
 * Cookie adapter for `@supabase/ssr` server client — single place for get/set behavior.
 */
import { cookies } from "next/headers";

export async function createSupabaseCookieAdapter() {
  const cookieStore = await cookies();
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(
      cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[],
    ) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]),
        );
      } catch {
        /* Called from Server Component — cookies may be read-only */
      }
    },
  };
}
