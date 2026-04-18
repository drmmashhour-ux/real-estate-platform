/**
 * LECIPM Production Infrastructure v1 — **server-only** env validation.
 * Call from `instrumentation.ts`, scripts, or route bootstraps — not from client components.
 */
export {
  assertLecipmInfrastructureEnv,
  lecipmInfrastructureEnvSchema,
  parseLecipmInfrastructureEnv,
  type LecipmInfrastructureEnv,
} from "./env";

import { assertLecipmInfrastructureEnv } from "./env";

/**
 * When `STRICT_LECIPM_INFRASTRUCTURE=1`, require full Zod-validated infrastructure env at boot.
 * Do not enable globally until all production secrets (Supabase, Stripe, URLs) are present.
 */
export function assertStrictServerEnvIfProduction(): void {
  if (process.env.STRICT_LECIPM_INFRASTRUCTURE !== "1") return;
  assertLecipmInfrastructureEnv();
}
