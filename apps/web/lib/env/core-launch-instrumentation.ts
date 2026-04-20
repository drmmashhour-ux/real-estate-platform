/**
 * Fail fast at Node bootstrap when critical infrastructure env is missing (production / strict mode).
 * Maps product docs "SUPABASE_URL" to Next.js `NEXT_PUBLIC_SUPABASE_*` which the app actually reads.
 */

import { logApi } from "@/lib/server/launch-logger";

function vercelProduction(): boolean {
  return process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production";
}

function strictLaunch(): boolean {
  if (process.env.ALLOW_INCOMPLETE_CORE_ENV === "1") return false;
  return (
    process.env.LAUNCH_CORE_ENV_STRICT === "1" ||
    process.env.REQUIRE_CORE_ENV === "1" ||
    vercelProduction()
  );
}

export type CoreLaunchEnvReport = {
  ok: boolean;
  missing: string[];
};

/** Keys required for a real-money + auth deployment. */
export function getCoreLaunchEnvMissing(): string[] {
  const missing: string[] = [];
  const req = [
    ["DATABASE_URL", () => process.env.DATABASE_URL?.trim()],
    ["STRIPE_SECRET_KEY", () => process.env.STRIPE_SECRET_KEY?.trim()],
    ["STRIPE_WEBHOOK_SECRET", () => process.env.STRIPE_WEBHOOK_SECRET?.trim()],
    ["NEXT_PUBLIC_SUPABASE_URL", () => process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()],
    ["NEXT_PUBLIC_SUPABASE_ANON_KEY", () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()],
  ] as const;
  for (const [name, get] of req) {
    if (!get()) missing.push(name);
  }
  return missing;
}

/**
 * Call from `instrumentation.ts` `register()` (nodejs). Throws to prevent serving a broken production deploy.
 */
export function assertCoreLaunchEnvOrThrow(): void {
  if (!strictLaunch()) return;
  const missing = getCoreLaunchEnvMissing();
  if (missing.length === 0) return;
  logApi.error("core launch env incomplete — refusing to boot", { missing });
  throw new Error(`[lecipm] Missing required env: ${missing.join(", ")}`);
}
