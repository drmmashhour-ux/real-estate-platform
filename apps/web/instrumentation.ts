export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    const { warnIfLiveStripeKeyWhileTestMode } = await import("@/lib/stripe/test-mode-stripe-guard");
    warnIfLiveStripeKeyWhileTestMode();
    const { validateProductionEnvAtStartup } = await import("@/lib/env/production");
    validateProductionEnvAtStartup();
    const { logStripeIntegrationEnvWarnings } = await import("@/lib/stripe/envWarnings");
    logStripeIntegrationEnvWarnings();
  } else if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
