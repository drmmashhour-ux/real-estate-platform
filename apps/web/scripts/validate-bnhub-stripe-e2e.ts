/**
 * Validates BNHUB booking payment plumbing — delegates to `runStripeBookingE2e` (same core as
 * `scripts/e2e-stripe-booking-test.ts`). Creates a real Checkout Session via `createCheckoutSession`,
 * then posts a signed `checkout.session.completed` to the running Next app.
 *
 * Requires:
 *   - DATABASE_URL, STRIPE_SECRET_KEY=sk_test_*, STRIPE_WEBHOOK_SECRET=whsec_*
 *   - Next server running (default http://127.0.0.1:3001) — same DB as this script
 *
 * Run from apps/web:
 *   pnpm run validate:bnhub-stripe
 */
import "./load-apps-web-env";
import { prisma } from "../lib/db";
import { runStripeBookingE2e } from "../modules/launch/stripe-booking-e2e.engine";

const BASE = process.env.BNHUB_STRIPE_E2E_BASE_URL?.trim() || "http://127.0.0.1:3001";

type Result = { name: string; ok: boolean; detail?: string };
const results: Result[] = [];

function record(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "OK " : "FAIL"} ${name}${detail ? `: ${detail}` : ""}`);
}

function aggregate(names: string[]): "OK" | "FAIL" {
  const subset = results.filter((r) => names.includes(r.name));
  if (subset.length === 0) return "FAIL";
  return subset.every((r) => r.ok) ? "OK" : "FAIL";
}

function printSummary() {
  console.log("\n--- validate-bnhub-stripe summary ---");
  for (const r of results) {
    console.log(`${r.ok ? "OK " : "FAIL"} ${r.name}`);
  }

  const issues = results.filter((r) => !r.ok).map((r) => `${r.name}${r.detail ? `: ${r.detail}` : ""}`);

  console.log("\n--- FINAL REPORT (automated checks) ---");
  console.log(
    "Note: Browser listing→dates→checkout and Stripe Dashboard are manual; this script hits the same APIs + webhooks.\n",
  );
  console.log(
    `- user flow (server prep / quote / checkout prep): ${aggregate(["pricing_quote", "prepare_marketplace_checkout"])}`,
  );
  console.log(
    `- payment (Checkout Session + signed webhook): ${aggregate(["createCheckoutSession", "checkout_session_persisted", "webhook_checkout_completed", "platform_payment_created"])}`,
  );
  console.log(`- booking (DB CONFIRMED + integrity): ${aggregate(["db_booking_confirmed", "booking_integrity"])}`);
  if (issues.length) {
    console.log("\n- issues found:");
    for (const line of issues) console.log(`  - ${line}`);
  } else {
    console.log("\n- issues found: none");
  }
}

async function main() {
  const out = await runStripeBookingE2e({
    baseUrl: BASE,
    testDuplicateWebhook: false,
    skipCleanup: false,
  });

  for (const s of out.steps) {
    record(s.name, s.ok, s.detail);
  }

  if (!out.success) {
    printSummary();
    process.exit(1);
  }

  printSummary();
  process.exit(0);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
