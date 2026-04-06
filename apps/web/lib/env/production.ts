/**
 * Production-oriented env checks. Call from `instrumentation.ts` (server bootstrap).
 * Does not throw — logs and sets `process.env.LECIPM_ENV_VALIDATION` for tests/observability.
 */

const PRODUCTION_HINT = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

export type ProductionEnvCheck = {
  ok: boolean;
  missing: string[];
  warnings: string[];
};

export function getProductionEnvStatus(): ProductionEnvCheck {
  const required = [
    "DATABASE_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
  ] as const;

  const recommended = [
    "NEXT_PUBLIC_APP_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "OPENAI_API_KEY",
  ] as const;

  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of required) {
    const v = process.env[key]?.trim();
    if (!v) missing.push(key);
  }

  for (const key of recommended) {
    const v = process.env[key]?.trim();
    if (!v) warnings.push(key);
  }

  if (PRODUCTION_HINT && !process.env.DATABASE_URL?.includes("pooler") && process.env.DATABASE_URL) {
    warnings.push("DATABASE_URL may be direct (not pooled); use Supabase pooler URL for serverless runtime.");
  }

  const ok = missing.length === 0;
  if (typeof process.env.LECIPM_ENV_VALIDATION === "undefined") {
    process.env.LECIPM_ENV_VALIDATION = ok ? "ok" : "incomplete";
  }

  return { ok, missing, warnings };
}

export function validateProductionEnvAtStartup(): void {
  const { ok, missing, warnings } = getProductionEnvStatus();
  const strict =
    PRODUCTION_HINT && (process.env.FAIL_LAUNCH_ON_MISSING_ENV === "1" || process.env.STRICT_LAUNCH_ENV === "1");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (strict && !appUrl) {
    throw new Error("[lecipm] STRICT_LAUNCH: NEXT_PUBLIC_APP_URL is required");
  }
  if (!ok && strict) {
    throw new Error(`[lecipm] STRICT_LAUNCH: missing required env: ${missing.join(", ")}`);
  }
  if (!ok && PRODUCTION_HINT) {
    console.warn("[lecipm] Production env incomplete — missing:", missing.join(", "));
  }
  if (warnings.length > 0 && PRODUCTION_HINT) {
    console.warn("[lecipm] Production env warnings — unset or suboptimal:", warnings.join(", "));
  }
}
