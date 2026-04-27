export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnvSafety } = await import("@repo/db/env-guard");
    assertEnvSafety({
      appId: "syria",
      appEnv: process.env.APP_ENV || process.env.NODE_ENV,
      dbUrl: process.env.DATABASE_URL,
      demoMode: process.env.INVESTOR_DEMO_MODE === "true",
    });
    const { assertDarlinkRuntimeEnv } = await import("./lib/guard");
    const { assertSyriaAppIsolation } = await import("./lib/env/app-isolation");
    assertDarlinkRuntimeEnv();
    assertSyriaAppIsolation();
  }
}
