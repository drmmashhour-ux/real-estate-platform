export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const sk = process.env.STRIPE_SECRET_KEY?.trim();
    if (sk && process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console -- dev-only fingerprint (never log in production)
      console.log("[STRIPE] Using key:", sk.slice(0, 12));
    }
    const { warnIfLiveStripeKeyWhileTestMode } = await import("@/lib/stripe/test-mode-stripe-guard");
    warnIfLiveStripeKeyWhileTestMode();
    const { validateProductionEnvAtStartup } = await import("@/lib/env/production");
    validateProductionEnvAtStartup();
    const { logStripeIntegrationEnvWarnings } = await import("@/lib/stripe/envWarnings");
    logStripeIntegrationEnvWarnings();
  }
}
