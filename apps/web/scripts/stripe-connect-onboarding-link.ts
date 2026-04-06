/**
 * Print a hosted Connect onboarding URL for an existing Express account (test or live).
 * Usage (from apps/web): pnpm exec tsx scripts/stripe-connect-onboarding-link.ts acct_xxx
 */
import { resolve } from "node:path";
import { config } from "dotenv";
import Stripe from "stripe";

config({ path: resolve(process.cwd(), ".env"), override: true });
config({ path: resolve(process.cwd(), ".env.local"), override: true });

const accountId = process.argv[2]?.trim();
if (!accountId?.startsWith("acct_")) {
  console.error("Usage: pnpm exec tsx scripts/stripe-connect-onboarding-link.ts acct_xxx");
  process.exit(1);
}

const sk = process.env.STRIPE_SECRET_KEY?.trim();
if (!sk?.startsWith("sk_")) {
  console.error("STRIPE_SECRET_KEY missing");
  process.exit(1);
}

const stripe = new Stripe(sk);

async function main() {
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: "https://stripe.com/connect/account/refresh",
    return_url: "https://stripe.com/connect/account/return",
    collection_options: { fields: "eventually_due" },
  });
  console.log(link.url);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
