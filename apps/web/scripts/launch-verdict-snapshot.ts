/**
 * One-off DB + Stripe snapshot for launch verdict (no simulated passes).
 * Run: cd apps/web && npx tsx scripts/launch-verdict-snapshot.ts
 */
import { config } from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, "../.env"), override: true });

const prisma = new PrismaClient();

async function main() {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const events = ["CREATE_BOOKING", "CHECKOUT_START", "PAYMENT_SUCCESS"];
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e] = await prisma.launchEvent.count({ where: { event: e, createdAt: { gte: since } } });
  }

  const recent = await prisma.launchEvent.findMany({
    where: { event: { in: events }, createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
    take: 15,
    select: { event: true, createdAt: true, payload: true },
  });

  const latestConfirmed = await prisma.booking.findFirst({
    where: { status: "CONFIRMED", updatedAt: { gte: since } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      status: true,
      payment: { select: { status: true } },
    },
  });

  const host = await prisma.user.findFirst({
    where: { email: "host@demo.com" },
    select: { stripeAccountId: true, stripeOnboardingComplete: true },
  });

  let charges_enabled: boolean | null = null;
  let payouts_enabled: boolean | null = null;
  let details_submitted: boolean | null = null;
  const sk = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  let stripeRetrieveError: string | null = null;
  if (host?.stripeAccountId && (sk.startsWith("sk_test_") || sk.startsWith("sk_live_"))) {
    try {
      const stripe = new Stripe(sk);
      const acct = await stripe.accounts.retrieve(host.stripeAccountId);
      charges_enabled = Boolean(acct.charges_enabled);
      payouts_enabled = Boolean(acct.payouts_enabled);
      details_submitted = Boolean(acct.details_submitted);
    } catch (e) {
      stripeRetrieveError = e instanceof Error ? e.message : String(e);
    }
  }

  console.log(
    JSON.stringify(
      {
        countsLast7d: counts,
        recentLaunchEvents: recent.map((r) => ({
          event: r.event,
          at: r.createdAt.toISOString(),
        })),
        latestConfirmedBooking: latestConfirmed
          ? {
              id: latestConfirmed.id,
              bookingStatus: latestConfirmed.status,
              paymentStatus: latestConfirmed.payment?.status ?? null,
            }
          : null,
        hostDemo: {
          stripeAccountId: host?.stripeAccountId ? `${host.stripeAccountId.slice(0, 10)}…` : null,
          stripeOnboardingCompleteDb: host?.stripeOnboardingComplete ?? null,
          stripeApi: {
            details_submitted,
            charges_enabled,
            payouts_enabled,
            retrieveError: stripeRetrieveError,
          },
        },
        stripeWebhookSecretFormat: process.env.STRIPE_WEBHOOK_SECRET?.startsWith("whsec_") ?? false,
      },
      null,
      2
    )
  );

  await prisma.$disconnect();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
