#!/usr/bin/env npx tsx
/**
 * Stripe test-mode BNHub booking E2E — delegates to `runStripeBookingE2e`.
 *
 *   cd apps/web && pnpm exec tsx scripts/e2e-stripe-booking-test.ts
 *
 * Requires: DATABASE_URL, STRIPE_SECRET_KEY=sk_test_*, STRIPE_WEBHOOK_SECRET=whsec_*,
 * Next dev server (default http://127.0.0.1:3001) with same DATABASE_URL.
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import { prisma } from "../lib/db";
import { runStripeBookingE2e } from "../modules/launch/stripe-booking-e2e.engine";

config({ path: resolve(process.cwd(), ".env"), override: true });

async function main() {
  const baseUrl = process.env.BNHUB_STRIPE_E2E_BASE_URL?.trim();
  const r = await runStripeBookingE2e({
    baseUrl,
    skipCleanup: process.env.E2E_SKIP_CLEANUP === "1",
    testDuplicateWebhook: process.env.E2E_SKIP_DUPLICATE_TEST !== "1",
  });

  console.log(JSON.stringify(r, null, 2));
  process.exit(r.success ? 0 : 1);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
