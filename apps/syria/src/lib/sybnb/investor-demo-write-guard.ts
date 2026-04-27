import { assertInvestorDemoSeedEnvironmentOk } from "@/lib/sybnb/investor-demo";

export type InvestorDemoWriteAction = "seed" | "reset";

/**
 * Blocks destructive demo writes in production unless explicitly opted-in.
 * Call immediately before any investor-demo seed/reset DB mutation.
 */
export function assertDemoWriteAllowed(action: InvestorDemoWriteAction): void {
  assertInvestorDemoSeedEnvironmentOk();

  const env = process.env.APP_ENV || process.env.NODE_ENV || "";

  if (env === "production" && process.env.INVESTOR_DEMO_ALLOW_SEED_IN_PRODUCTION !== "true") {
    throw new Error(
      "❌ Demo seed/reset is blocked in production. Set INVESTOR_DEMO_ALLOW_SEED_IN_PRODUCTION=true ONLY if you are 100% sure.",
    );
  }

  console.warn("[DEMO MODE]", {
    action,
    timestamp: new Date().toISOString(),
  });
}
