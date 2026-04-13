/**
 * Commission rules and creation after payment. Defaults: BNHUB booking 15% platform (see bnhub-connect); FSBO publish 100% platform; sale 70% broker / 30% platform; etc.
 */

import { prisma } from "@/lib/db";

const DEFAULTS: Record<string, { brokerPercent: number; platformPercent: number }> = {
  /** Align with BNHUB Stripe Connect `application_fee_amount` (`bnhub-connect` rate). */
  booking: { brokerPercent: 0, platformPercent: 15 },
  sale: { brokerPercent: 70, platformPercent: 30 },
  subscription: { brokerPercent: 0, platformPercent: 90 },
  lead: { brokerPercent: 20, platformPercent: 0 },
  lead_unlock: { brokerPercent: 20, platformPercent: 0 },
  /** Full amount to platform — broker pays to unlock contact on their assigned lead. */
  mortgage_contact_unlock: { brokerPercent: 0, platformPercent: 100 },
  deposit: { brokerPercent: 70, platformPercent: 30 },
  closing_fee: { brokerPercent: 70, platformPercent: 30 },
  featured_listing: { brokerPercent: 0, platformPercent: 100 },
  listing_contact_lead: { brokerPercent: 0, platformPercent: 100 },
  fsbo_publish: { brokerPercent: 0, platformPercent: 100 },
};

export async function getOrCreateCommissionRules(): Promise<void> {
  for (const [sourceType, pct] of Object.entries(DEFAULTS)) {
    await prisma.commissionRule.upsert({
      where: { sourceType },
      create: {
        sourceType,
        brokerPercent: pct.brokerPercent,
        platformPercent: pct.platformPercent,
      },
      update: {},
    });
  }
}

function getRuleForPaymentType(paymentType: string): { brokerPercent: number; platformPercent: number } {
  if (paymentType === "lead_unlock") return DEFAULTS.lead;
  return DEFAULTS[paymentType] ?? { brokerPercent: 0, platformPercent: 10 };
}

/**
 * Create BrokerCommission record(s) for a platform payment. Call after payment status = paid.
 */
export async function createCommissionsForPayment(params: {
  paymentId: string;
  paymentType: string;
  amountCents: number;
  brokerId?: string | null;
}): Promise<{ id: string; brokerAmountCents: number; platformAmountCents: number } | null> {
  const { paymentId, paymentType, amountCents, brokerId } = params;
  const rule = getRuleForPaymentType(paymentType);
  const brokerAmountCents = Math.round((amountCents * rule.brokerPercent) / 100);
  const platformAmountCents = Math.round((amountCents * rule.platformPercent) / 100);

  if (brokerAmountCents === 0 && platformAmountCents === 0) return null;

  const row = await prisma.brokerCommission.create({
    data: {
      paymentId,
      brokerId: brokerId ?? null,
      grossAmountCents: amountCents,
      brokerAmountCents,
      platformAmountCents,
      status: "pending",
    },
  });
  return { id: row.id, brokerAmountCents, platformAmountCents };
}
