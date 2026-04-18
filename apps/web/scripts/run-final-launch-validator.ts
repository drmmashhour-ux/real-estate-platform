#!/usr/bin/env npx tsx
/**
 * Full launch gate — Stripe E2E (optional), typecheck, RLS probe, API health.
 *
 *   cd apps/web && LAUNCH_VALIDATION_RUN_STRIPE_E2E=1 pnpm exec tsx scripts/run-final-launch-validator.ts
 *
 * Requires Next + DB + Stripe test keys when running E2E.
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { prisma } from "../lib/db";
import { runFinalLaunchValidation } from "../modules/launch/final-validator.service";

config({ path: resolve(process.cwd(), ".env"), override: true });

async function main() {
  const runStripe = process.env.LAUNCH_VALIDATION_RUN_STRIPE_E2E === "1";
  const report = await runFinalLaunchValidation({
    runStripeE2e: runStripe,
    runTypecheck: process.env.LAUNCH_VALIDATION_SKIP_TYPECHECK !== "1",
    baseUrl: process.env.BNHUB_STRIPE_E2E_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim(),
  });
  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
  process.exit(report.overall === "NO_GO" ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
