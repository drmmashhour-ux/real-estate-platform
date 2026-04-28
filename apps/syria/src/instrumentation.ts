export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertEnvSafety } = await import("@repo/db/env-guard");
    const { isInvestorDemoModeActive } = await import("./lib/sybnb/investor-demo");
    assertEnvSafety({
      appId: "syria",
      appEnv: process.env.APP_ENV || process.env.NODE_ENV,
      dbUrl: process.env.DATABASE_URL,
      demoMode: isInvestorDemoModeActive(),
    });
    const { assertDarlinkRuntimeEnv } = await import("./lib/guard");
    const { assertSyriaAppIsolation } = await import("./lib/env/app-isolation");
    assertDarlinkRuntimeEnv();
    assertSyriaAppIsolation();
  }
}
