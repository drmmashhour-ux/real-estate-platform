import type { PrismaClient } from "@prisma/client";
import type Stripe from "stripe";
import { logError, logInfo } from "@/lib/logger";
import type { BrokerPlanSlug } from "@/modules/subscription/domain/brokerPlans";
import { LECIPM_BROKER_SUBSCRIPTION_CHECKOUT } from "./constants";

function planFromStripeSubscription(sub: Stripe.Subscription): BrokerPlanSlug {
  const meta = sub.metadata?.lecipmBrokerPlan?.trim().toLowerCase();
  if (meta === "platinum" || meta === "pro") return meta;
  const priceId = sub.items.data[0]?.price?.id;
  if (priceId && process.env.STRIPE_PRICE_LECIPM_BROKER_PLATINUM === priceId) return "platinum";
  if (priceId && process.env.STRIPE_PRICE_LECIPM_BROKER_PRO === priceId) return "pro";
  return "pro";
}

function mapStripeStatus(sub: Stripe.Subscription): string {
  const s = sub.status;
  if (s === "trialing") return "trialing";
  if (s === "active") return "active";
  if (s === "past_due") return "past_due";
  if (s === "canceled" || s === "unpaid") return "canceled";
  return s;
}

export async function upsertBrokerLecipmFromStripeSubscription(
  db: PrismaClient,
  sub: Stripe.Subscription,
  userIdHint: string | null
): Promise<void> {
  const userId = userIdHint ?? sub.metadata?.userId?.trim() ?? null;
  if (!userId) {
    logError("Broker LECIPM subscription sync: missing userId", { subId: sub.id });
    return;
  }
  const custId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const planSlug = planFromStripeSubscription(sub);
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
  const cancelAtPeriodEnd = Boolean(sub.cancel_at_period_end);

  await db.brokerLecipmSubscription.upsert({
    where: { userId },
    create: {
      userId,
      planSlug,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: custId,
      status: mapStripeStatus(sub),
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
    },
    update: {
      planSlug,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: custId ?? undefined,
      status: mapStripeStatus(sub),
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
    },
  });

  logInfo("Broker LECIPM subscription synced", { userId, planSlug, subId: sub.id });
}

/**
 * checkout.session.completed — subscription mode for broker Pro/Platinum.
 */
export async function handleBrokerLecipmSubscriptionCheckoutCompleted(args: {
  stripe: Stripe;
  session: Stripe.Checkout.Session;
  prisma: PrismaClient;
}): Promise<boolean> {
  if (args.session.mode !== "subscription") return false;
  const pt = args.session.metadata?.paymentType?.trim();
  if (pt !== LECIPM_BROKER_SUBSCRIPTION_CHECKOUT) return false;
  const userId = args.session.metadata?.userId?.trim();
  if (!userId) return false;
  const subRef = args.session.subscription;
  const subId = typeof subRef === "string" ? subRef : subRef && typeof subRef === "object" ? subRef.id : null;
  if (!subId) return false;
  try {
    const sub = await args.stripe.subscriptions.retrieve(subId);
    await upsertBrokerLecipmFromStripeSubscription(args.prisma, sub, userId);
  } catch (e) {
    logError("Broker LECIPM checkout sync failed", e);
    return false;
  }
  return true;
}

/**
 * customer.subscription.* — keep broker plan row in sync (skip workspace subs).
 */
export async function handleBrokerLecipmSubscriptionStripeEvent(
  _stripe: Stripe,
  event: Stripe.Event,
  prisma: PrismaClient
): Promise<boolean> {
  const types = [
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ];
  if (!types.includes(event.type)) return false;

  const sub = event.data.object as Stripe.Subscription;
  const metaPlan = sub.metadata?.lecipmBrokerPlan?.trim();
  const metaPt = sub.metadata?.paymentType?.trim();

  const existing = await prisma.brokerLecipmSubscription.findUnique({
    where: { stripeSubscriptionId: sub.id },
    select: { userId: true },
  });

  const isBrokerSub =
    metaPt === LECIPM_BROKER_SUBSCRIPTION_CHECKOUT ||
    metaPlan === "pro" ||
    metaPlan === "platinum" ||
    Boolean(existing);

  if (!isBrokerSub) return false;

  if (event.type === "customer.subscription.deleted" || sub.status === "canceled") {
    if (existing) {
      await prisma.brokerLecipmSubscription
        .update({
          where: { userId: existing.userId },
          data: {
            status: "canceled",
            cancelAtPeriodEnd: false,
            currentPeriodEnd: sub.ended_at ? new Date(sub.ended_at * 1000) : new Date(),
          },
        })
        .catch((e) => logError("Broker LECIPM subscription delete sync failed", e));
    }
    return true;
  }

  const uid = sub.metadata?.userId?.trim() ?? existing?.userId ?? null;
  await upsertBrokerLecipmFromStripeSubscription(prisma, sub, uid);
  return true;
}

export function resolveBrokerCheckoutPriceId(plan: BrokerPlanSlug): string | null {
  if (plan === "platinum") {
    return process.env.STRIPE_PRICE_LECIPM_BROKER_PLATINUM?.trim() ?? null;
  }
  return process.env.STRIPE_PRICE_LECIPM_BROKER_PRO?.trim() ?? null;
}
