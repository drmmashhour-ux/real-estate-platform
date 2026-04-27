/**
 * Startup / production sanity: log missing critical config (does not exit the process).
 * Call from `instrumentation.ts` on node runtime.
 */

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Warn when required or sensitive env is missing in production.
 */
export function logProductionEnvSanity(): void {
  if (!isProd()) return;

  if (!process.env.DATABASE_URL?.trim()) {
    console.error("[ENV] DATABASE_URL is missing — database access will fail");
  }

  const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY?.trim());
  if (!hasStripe) {
    console.warn("[ENV] STRIPE_SECRET_KEY missing — payments/checkout disabled until set");
  }

  if (process.env.DEMO_MODE === "1" || process.env.NEXT_PUBLIC_DEMO_MODE === "true") {
    console.warn("[ENV] Demo mode flag is on (DEMO_MODE / NEXT_PUBLIC_DEMO_MODE) — not full production");
  }

  if (!process.env.ADMIN_SECRET?.trim()) {
    console.warn(
      "[ENV] ADMIN_SECRET missing — /api/metrics, /api/investor/platform-dashboard, and other admin routes will reject all requests"
    );
  }
}
