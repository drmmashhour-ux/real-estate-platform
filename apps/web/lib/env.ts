import { z } from "zod";

type EnvConfig = {
  DATABASE_URL: string;
  OPENAI_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  RESEND_API_KEY?: string;
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
};

/**
 * Strict shape for server-side validation (e.g. deploy checks). Optional keys allow local dev
 * without Supabase/OpenAI; call {@link parseLecipmEnv} only when you need validated access.
 */
export const lecipmEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
});

export type LecipmEnv = z.infer<typeof lecipmEnvSchema>;

/** Safe parse — does not throw. */
export function parseLecipmEnv(): { success: true; data: LecipmEnv } | { success: false; error: z.ZodError } {
  const r = lecipmEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  });
  return r.success ? { success: true, data: r.data } : { success: false, error: r.error };
}

export function getEnv(): EnvConfig {
  return {
    DATABASE_URL: process.env.DATABASE_URL || "",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  };
}

export function validateEnv(): { ok: boolean; missing: string[] } {
  const env = getEnv();
  const required: (keyof EnvConfig)[] = [
    "DATABASE_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ];
  const missing = required.filter((key) => !env[key]);
  return { ok: missing.length === 0, missing };
}
