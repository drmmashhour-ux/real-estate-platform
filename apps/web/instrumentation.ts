export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertCoreLaunchEnvOrThrow } = await import("@/lib/env/core-launch-instrumentation");
    assertCoreLaunchEnvOrThrow();
    const { assertLecipmRuntimeEnv } = await import("./lib/assertContext");
    assertLecipmRuntimeEnv();
    await import("./sentry.server.config");
    const { warnIfLiveStripeKeyWhileTestMode } = await import("@/lib/stripe/test-mode-stripe-guard");
    warnIfLiveStripeKeyWhileTestMode();
    const { validateProductionEnvAtStartup } = await import("@/lib/env/production");
    validateProductionEnvAtStartup();
    const { logStripeIntegrationEnvWarnings } = await import("@/lib/stripe/envWarnings");
    logStripeIntegrationEnvWarnings();
    const { assertStrictServerEnvIfProduction } = await import("@/lib/env.server");
    assertStrictServerEnvIfProduction();
  } else if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
