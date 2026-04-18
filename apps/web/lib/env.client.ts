/**
 * LECIPM Production Infrastructure v1 — **public** environment only (safe for client bundles).
 * Never import server secrets here.
 */
import { z } from "zod";

/** Shape of vars that may be inlined into the browser by Next.js. */
export const lecipmClientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_APP_VERSION: z.string().optional(),
});

export type LecipmClientEnv = z.infer<typeof lecipmClientEnvSchema>;

export function getClientEnvSnapshot(): { success: true; data: LecipmClientEnv } | { success: false; error: z.ZodError } {
  return lecipmClientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
  }) as { success: true; data: LecipmClientEnv } | { success: false; error: z.ZodError };
}
