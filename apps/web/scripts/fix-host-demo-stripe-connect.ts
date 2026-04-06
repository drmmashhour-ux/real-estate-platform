/**
 * Replaces host@demo.com connected account with a new Express account on the CURRENT
 * STRIPE_SECRET_KEY platform (fixes stale acct_* from another Stripe account).
 *
 * Run: cd apps/web && npx tsx scripts/fix-host-demo-stripe-connect.ts
 */
import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env"), override: true });

const HOST_EMAIL = "host@demo.com";

async function main(): Promise<void> {
  const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!sk.startsWith("sk_test_") && !sk.startsWith("sk_live_")) {
    console.error("STRIPE_SECRET_KEY must be sk_test_* or sk_live_*");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const stripe = new Stripe(sk);

  const user = await prisma.user.findUnique({
    where: { email: HOST_EMAIL },
    select: { id: true, stripeAccountId: true },
  });
  if (!user) {
    console.error(`No user ${HOST_EMAIL}`);
    process.exit(1);
  }

  const oldId = user.stripeAccountId?.trim() || null;

  const account = await stripe.accounts.create({
    type: "express",
    country: "CA",
    email: HOST_EMAIL,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: { platformUserId: user.id, source: "fix-host-demo-stripe-connect" },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { stripeAccountId: account.id, stripeOnboardingComplete: false },
  });

  if (oldId && oldId !== account.id) {
    try {
      await stripe.accounts.del(oldId);
      console.warn("Deleted old connected account:", oldId);
    } catch (e) {
      console.warn(
        "Old account delete skipped (wrong platform or already gone):",
        e instanceof Error ? e.message : e
      );
    }
  }

  const v = await stripe.accounts.retrieve(account.id);
  console.log(
    JSON.stringify(
      {
        hostEmail: HOST_EMAIL,
        newStripeAccountId: account.id,
        previousStripeAccountId: oldId,
        retrieveOk: true,
        details_submitted: v.details_submitted,
        charges_enabled: v.charges_enabled,
        payouts_enabled: v.payouts_enabled,
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

void main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
