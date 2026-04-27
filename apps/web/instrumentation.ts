export async function register() {
  // Order 80 — load Sentry when DSN is set (no Prisma in this module; avoids v7 init issues).
  if (process.env.SENTRY_DSN?.trim() && process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnvSafety } = await import("@repo/db/env-guard");
    assertEnvSafety({
      appId: "lecipm",
      appEnv: process.env.APP_ENV || process.env.NODE_ENV,
      dbUrl: process.env.DATABASE_URL,
      demoMode: process.env.INVESTOR_DEMO_MODE === "true",
    });
    const { assertLecipmAppNameEnv, assertLecipmDatabaseUrlIsolation } = await import(
      "@/lib/env/db-app-isolation"
    );
    const { logProductionEnvSanity } = await import("@/lib/env/sanity");
    const { assertProductionEnvSafety } = await import("@/lib/env/production-guard");
    assertLecipmAppNameEnv();
    assertLecipmDatabaseUrlIsolation();
    assertProductionEnvSafety();
    logProductionEnvSanity();
  }
}
