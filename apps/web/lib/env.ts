import { z } from "zod";

/** Production: set in Vercel / `.env`. Prisma reads `process.env.DATABASE_URL` only. */
export const DATABASE_URL = process.env.DATABASE_URL;

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
 * without every integration; call {@link parseLecipmEnv} only when you need validated access.
 */
const postgresUrlRegex = /^postgresql(\+[a-z0-9]+)?:\/\/.+/i;

export const lecipmEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((s) => postgresUrlRegex.test(s.trim()), {
      message: "DATABASE_URL must be a postgresql:// or postgres:// connection string",
    }),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  /** Optional — distributed rate limits / cache; see `lib/cache/redis.ts` (no-op when unset). */
  REDIS_URL: z.string().min(1).optional(),
});

export type LecipmEnv = z.infer<typeof lecipmEnvSchema>;

/** Safe parse — does not throw. */
export function parseLecipmEnv(): { success: true; data: LecipmEnv } | { success: false; error: z.ZodError } {
  const r = lecipmEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    REDIS_URL: process.env.REDIS_URL,
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

/** LECIPM Infrastructure v1 — strict server env for production bootstrap (Zod). */
export const lecipmInfrastructureEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((s) => postgresUrlRegex.test(s.trim()), { message: "DATABASE_URL must be a PostgreSQL URL" }),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  STRIPE_SECRET_KEY: z
    .string()
    .min(1)
    .refine((s) => s.startsWith("sk_test_") || s.startsWith("sk_live_"), {
      message: "STRIPE_SECRET_KEY must be sk_test_ or sk_live_",
    }),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1)
    .refine((s) => s.startsWith("whsec_"), { message: "STRIPE_WEBHOOK_SECRET must start with whsec_" }),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),
  APP_VERSION: z.string().optional(),
});

export type LecipmInfrastructureEnv = z.infer<typeof lecipmInfrastructureEnvSchema>;

function pickInfraEnv(): Record<string, string | undefined> {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    APP_VERSION: process.env.APP_VERSION,
  };
}

/**
 * Validates core production variables. **Throws** with a redacted-safe message if invalid.
 * Call from `instrumentation.ts` or deploy scripts when `VERCEL_ENV === 'production'`.
 */
export function assertLecipmInfrastructureEnv(): LecipmInfrastructureEnv {
  const r = lecipmInfrastructureEnvSchema.safeParse(pickInfraEnv());
  if (!r.success) {
    const flat = r.error.flatten().fieldErrors;
    const keys = Object.keys(flat).join(", ");
    throw new Error(`[LECIPM] Invalid infrastructure environment: check ${keys} (see apps/web/.env.example).`);
  }
  return r.data;
}

/** Safe parse for diagnostics / admin tooling. */
export function parseLecipmInfrastructureEnv():
  | { success: true; data: LecipmInfrastructureEnv }
  | { success: false; error: z.ZodError } {
  return lecipmInfrastructureEnvSchema.safeParse(pickInfraEnv()) as
    | { success: true; data: LecipmInfrastructureEnv }
    | { success: false; error: z.ZodError };
}

/** @see `./env.client.ts` — browser-safe public env. */
export { getClientEnvSnapshot, lecipmClientEnvSchema, type LecipmClientEnv } from "./env.client";
/** @see `./env.server.ts` — strict server assertions. */
export { assertStrictServerEnvIfProduction } from "./env.server";
