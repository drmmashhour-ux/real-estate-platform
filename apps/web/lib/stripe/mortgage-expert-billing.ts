import Stripe from "stripe";
import { getMortgagePlanDefaults } from "@/modules/mortgage/services/subscription-plans";

export const MORTGAGE_EXPERT_CHECKOUT_PAYMENT_SUB = "mortgage_expert_subscription";
export const MORTGAGE_EXPERT_CHECKOUT_PAYMENT_CREDITS = "mortgage_expert_credits";

export type MortgageExpertPlanKey = "basic" | "pro" | "premium";

export function getStripeMortgageSubscriptionPriceId(plan: string): string | null {
  const p = plan.toLowerCase().trim() as MortgageExpertPlanKey;
  const map: Record<MortgageExpertPlanKey, string | undefined> = {
    basic: process.env.STRIPE_PRICE_MORTGAGE_BASIC_MONTHLY?.trim(),
    pro: process.env.STRIPE_PRICE_MORTGAGE_PRO_MONTHLY?.trim(),
    premium: process.env.STRIPE_PRICE_MORTGAGE_PREMIUM_MONTHLY?.trim(),
  };
  const id = map[p] ?? map.basic;
  return id || null;
}

export function getStripeMortgageLeadCreditPriceId(): string | null {
  return process.env.STRIPE_PRICE_MORTGAGE_LEAD_CREDIT_UNIT?.trim() || null;
}

export function parseMortgageExpertPlanFromMetadata(plan: string | undefined): MortgageExpertPlanKey {
  const p = (plan ?? "basic").toLowerCase().trim();
  if (p === "pro" || p === "premium" || p === "basic") return p;
  return "basic";
}

export async function applyExpertSubscriptionFromStripe(args: {
  expertId: string;
  plan: MortgageExpertPlanKey;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: string;
  currentPeriodEnd: Date | null;
}): Promise<void> {
  const { prisma } = await import("@/lib/db");
  const defs = getMortgagePlanDefaults(args.plan);

  await prisma.$transaction(async (tx) => {
    await tx.expertBilling.upsert({
      where: { expertId: args.expertId },
      create: {
        expertId: args.expertId,
        stripeCustomerId: args.stripeCustomerId,
        stripeSubscriptionId: args.stripeSubscriptionId,
        plan: args.plan,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd,
      },
      update: {
        stripeCustomerId: args.stripeCustomerId ?? undefined,
        stripeSubscriptionId: args.stripeSubscriptionId ?? undefined,
        plan: args.plan,
        status: args.status,
        currentPeriodEnd: args.currentPeriodEnd ?? undefined,
      },
    });

    const isPaidActive =
      args.status === "active" || args.status === "trialing";

    await tx.expertSubscription.upsert({
      where: { expertId: args.expertId },
      create: {
        expertId: args.expertId,
        plan: args.plan,
        price: defs.price,
        maxLeadsPerDay: defs.maxLeadsPerDay,
        maxLeadsPerMonth: defs.maxLeadsPerMonth,
        priorityWeight: defs.priorityWeight,
        isActive: isPaidActive,
      },
      update: {
        plan: args.plan,
        price: defs.price,
        maxLeadsPerDay: defs.maxLeadsPerDay,
        maxLeadsPerMonth: defs.maxLeadsPerMonth,
        priorityWeight: defs.priorityWeight,
        isActive: isPaidActive,
      },
    });

    if (isPaidActive) {
      await tx.mortgageExpert.update({
        where: { id: args.expertId },
        data: { isAvailable: true },
      });
    }
  });
}

export function mapStripeSubscriptionStatus(sub: Stripe.Subscription): string {
  return sub.status;
}

export async function downgradeExpertAfterFailedSubscription(
  stripeSubscriptionId: string,
  opts?: { canceled?: boolean }
): Promise<void> {
  const { prisma } = await import("@/lib/db");
  const basic = getMortgagePlanDefaults("basic");
  const canceled = Boolean(opts?.canceled);

  const billing = await prisma.expertBilling.findFirst({
    where: { stripeSubscriptionId },
    select: { expertId: true },
  });
  if (!billing) return;

  await prisma.$transaction(async (tx) => {
    await tx.expertBilling.update({
      where: { expertId: billing.expertId },
      data: {
        status: canceled ? "canceled" : "past_due",
        plan: "basic",
        stripeSubscriptionId: canceled ? null : stripeSubscriptionId,
      },
    });
    await tx.expertSubscription.update({
      where: { expertId: billing.expertId },
      data: {
        plan: "basic",
        price: basic.price,
        maxLeadsPerDay: basic.maxLeadsPerDay,
        maxLeadsPerMonth: basic.maxLeadsPerMonth,
        priorityWeight: basic.priorityWeight,
        isActive: false,
      },
    });
    await tx.mortgageExpert.update({
      where: { id: billing.expertId },
      data: { isAvailable: false },
    });
  });

  const { sendMortgageBillingEmail } = await import("@/lib/email/mortgage-billing-emails");
  void sendMortgageBillingEmail({
    expertId: billing.expertId,
    kind: "subscription_payment_failed",
  });
}
