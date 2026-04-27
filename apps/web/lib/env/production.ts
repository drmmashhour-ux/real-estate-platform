/**
 * Production-oriented env checks. Call from `instrumentation.ts` (server bootstrap).
 * Does not throw — logs and sets `process.env.LECIPM_ENV_VALIDATION` for tests/observability.
 */

import {
  getDatabaseSslWarningForProduction,
  productionRequiresDatabaseSslStrict,
} from "@/lib/db/database-url-ssl";
import { databaseUrlHasLiteralHostPlaceholder } from "@/lib/db/database-host-hint";
import { resolveDatabaseUrlIntoEnv } from "@/lib/db/resolve-database-url";

/** Read at call time — not at module load — so tests and late env injection see current values. */
function productionLikeRuntime(): boolean {
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export type ProductionEnvCheck = {
  ok: boolean;
  missing: string[];
  warnings: string[];
};

export function getProductionEnvStatus(): ProductionEnvCheck {
  resolveDatabaseUrlIntoEnv();

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
    "REDIS_URL",
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

  const db = process.env.DATABASE_URL?.trim();
  const prodHint = productionLikeRuntime();
  if (prodHint && db && databaseUrlHasLiteralHostPlaceholder(db)) {
    warnings.push(
      "DATABASE_URL still uses the literal hostname HOST (template not replaced). In Vercel → Environment Variables, paste the full Supabase Transaction pooler URI (port 6543)."
    );
  }
  if (prodHint && db && /ep-xxxx|USER:PASSWORD|placeholder/i.test(db)) {
    warnings.push(
      "DATABASE_URL looks like a placeholder or example string — replace with the real Supabase pooler connection string."
    );
  }
  if (prodHint && db && db.includes("supabase.com") && !db.includes("pooler") && !db.includes(":6543")) {
    warnings.push(
      "DATABASE_URL may be a direct Supabase session string; for serverless Prisma prefer the Transaction pooler (hostname contains pooler, port 6543)."
    );
  }

  const sslWarn = getDatabaseSslWarningForProduction(db);
  if (sslWarn) warnings.push(sslWarn);
  if (productionRequiresDatabaseSslStrict() && sslWarn) {
    throw new Error(`[lecipm] REQUIRE_DATABASE_SSL_IN_URL: ${sslWarn}`);
  }

  const ok = missing.length === 0;
  if (typeof process.env.LECIPM_ENV_VALIDATION === "undefined") {
    process.env.LECIPM_ENV_VALIDATION = ok ? "ok" : "incomplete";
  }

  return { ok, missing, warnings };
}

export function validateProductionEnvAtStartup(): void {
  const { ok, missing, warnings } = getProductionEnvStatus();
  const prodHint = productionLikeRuntime();
  const strict =
    prodHint && (process.env.FAIL_LAUNCH_ON_MISSING_ENV === "1" || process.env.STRICT_LAUNCH_ENV === "1");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (strict && !appUrl) {
    throw new Error("[lecipm] STRICT_LAUNCH: NEXT_PUBLIC_APP_URL is required");
  }
  if (!ok && strict) {
    throw new Error(`[lecipm] STRICT_LAUNCH: missing required env: ${missing.join(", ")}`);
  }
  if (!ok && prodHint) {
    console.warn("[lecipm] Production env incomplete — missing:", missing.join(", "));
  }
  if (warnings.length > 0 && prodHint) {
    console.warn("[lecipm] Production env warnings — unset or suboptimal:", warnings.join(", "));
  }
}
