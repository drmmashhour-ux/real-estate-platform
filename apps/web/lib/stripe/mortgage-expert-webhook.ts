import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import { logError, logInfo } from "@/lib/logger";
import {
  applyExpertSubscriptionFromStripe,
  downgradeExpertAfterFailedSubscription,
  mapStripeSubscriptionStatus,
  MORTGAGE_EXPERT_CHECKOUT_PAYMENT_CREDITS,
  MORTGAGE_EXPERT_CHECKOUT_PAYMENT_SUB,
  parseMortgageExpertPlanFromMetadata,
} from "@/lib/stripe/mortgage-expert-billing";
import { sendMortgageBillingEmail } from "@/lib/email/mortgage-billing-emails";

/**
 * @returns true when this checkout was a mortgage expert flow (handled exclusively here).
 */
export async function handleMortgageExpertCheckoutCompleted(args: {
  stripe: Stripe;
  session: Stripe.Checkout.Session;
  stripeEventId: string;
}): Promise<boolean> {
  const { stripe, session } = args;
  const paymentType = session.metadata?.paymentType ?? "";
  if (paymentType !== MORTGAGE_EXPERT_CHECKOUT_PAYMENT_SUB && paymentType !== MORTGAGE_EXPERT_CHECKOUT_PAYMENT_CREDITS) {
    return false;
  }

  const expertId = session.metadata?.expertId?.trim();
  if (!expertId) {
    logError("Mortgage expert checkout missing expertId", { sessionId: session.id });
    return true;
  }

  const existingInv = await prisma.expertInvoice.findFirst({
    where: { stripeCheckoutSessionId: session.id },
  });
  if (existingInv) return true;

  if (paymentType === MORTGAGE_EXPERT_CHECKOUT_PAYMENT_SUB) {
    const subId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;
    const custId =
      typeof session.customer === "string" ? session.customer : session.customer?.id ?? null;
    const plan = parseMortgageExpertPlanFromMetadata(session.metadata?.plan);

    let status = "active";
    let periodEnd: Date | null = null;
    if (subId) {
      try {
        const sub = await stripe.subscriptions.retrieve(subId);
        status = mapStripeSubscriptionStatus(sub);
        periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
      } catch (e) {
        logError("Mortgage expert: retrieve subscription failed", e);
      }
    }

    await applyExpertSubscriptionFromStripe({
      expertId,
      plan,
      stripeCustomerId: custId,
      stripeSubscriptionId: subId ?? null,
      status,
      currentPeriodEnd: periodEnd,
    });

    const amount = session.amount_total ?? 0;
    await prisma.expertInvoice.create({
      data: {
        expertId,
        type: "subscription",
        amountCents: amount,
        currency: (session.currency ?? "cad").toLowerCase(),
        stripeCheckoutSessionId: session.id,
        description: `Mortgage expert subscription — ${plan}`,
        metadata: { stripeEventId: args.stripeEventId, plan } as object,
      },
    });

    void sendMortgageBillingEmail({
      expertId,
      kind: "subscription_active",
      extra: { plan, amountCents: amount },
    });
    return true;
  }

  // Lead credits (one-time)
  const qtyRaw = session.metadata?.creditsQty ?? session.metadata?.quantity ?? "1";
  const qty = Math.max(1, Math.min(5000, Math.round(Number.parseInt(String(qtyRaw), 10) || 1)));
  const amount = session.amount_total ?? 0;

  await prisma.$transaction(async (tx) => {
    await tx.expertCredits.upsert({
      where: { expertId },
      create: { expertId, credits: qty },
      update: { credits: { increment: qty } },
    });
    await tx.expertInvoice.create({
      data: {
        expertId,
        type: "lead_credits",
        amountCents: amount,
        currency: (session.currency ?? "cad").toLowerCase(),
        stripeCheckoutSessionId: session.id,
        description: `Pay-per-lead credits (${qty})`,
        metadata: { credits: qty, stripeEventId: args.stripeEventId } as object,
      },
    });
  });

  const piId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent && typeof session.payment_intent === "object"
        ? (session.payment_intent as Stripe.PaymentIntent).id
        : null;
  if (piId) {
    await prisma.expertInvoice
      .updateMany({
        where: { stripeCheckoutSessionId: session.id },
        data: { stripePaymentIntentId: piId },
      })
      .catch(() => {});
  }

  void sendMortgageBillingEmail({
    expertId,
    kind: "credits_purchased",
    extra: { credits: qty, amountCents: amount },
  });

  return true;
}

/**
 * Sync subscription lifecycle (renewals, cancel, past_due). Idempotent per subscription id.
 */
export async function handleMortgageExpertSubscriptionStripeEvent(
  _stripe: Stripe,
  event: Stripe.Event
): Promise<boolean> {
  if (
    event.type !== "customer.subscription.updated" &&
    event.type !== "customer.subscription.deleted"
  ) {
    return false;
  }

  const sub = event.data.object as Stripe.Subscription;
  const expertIdMeta = sub.metadata?.expertId?.trim();

  const billingRow =
    (expertIdMeta
      ? await prisma.expertBilling.findUnique({
          where: { expertId: expertIdMeta },
          select: { expertId: true, stripeSubscriptionId: true, plan: true },
        })
      : null) ??
    (await prisma.expertBilling.findFirst({
      where: { stripeSubscriptionId: sub.id },
      select: { expertId: true, stripeSubscriptionId: true, plan: true },
    }));

  if (!billingRow) return false;

  const plan = parseMortgageExpertPlanFromMetadata(sub.metadata?.plan || billingRow.plan);
  const custId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null;
  const status = mapStripeSubscriptionStatus(sub);
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;

  if (event.type === "customer.subscription.deleted" || status === "canceled") {
    await downgradeExpertAfterFailedSubscription(sub.id, { canceled: true });
    return true;
  }

  if (status === "unpaid" || status === "incomplete_expired") {
    await downgradeExpertAfterFailedSubscription(sub.id, { canceled: false });
    return true;
  }

  if (status === "past_due") {
    await prisma.expertBilling.update({
      where: { expertId: billingRow.expertId },
      data: {
        status: "past_due",
        stripeSubscriptionId: sub.id,
        stripeCustomerId: custId,
        currentPeriodEnd: periodEnd,
        plan,
      },
    });
    await prisma.mortgageExpert.update({
      where: { id: billingRow.expertId },
      data: { isAvailable: false },
    });
    void sendMortgageBillingEmail({
      expertId: billingRow.expertId,
      kind: "subscription_payment_failed",
    });
    return true;
  }

  await applyExpertSubscriptionFromStripe({
    expertId: billingRow.expertId,
    plan,
    stripeCustomerId: custId,
    stripeSubscriptionId: sub.id,
    status,
    currentPeriodEnd: periodEnd,
  });

  logInfo("Mortgage expert subscription synced", { expertId: billingRow.expertId, status });
  return true;
}
