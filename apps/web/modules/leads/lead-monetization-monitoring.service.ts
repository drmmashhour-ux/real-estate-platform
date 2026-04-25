/**
 * Lead monetization monitoring — bounded counters; never throws.
 * On confirmed Stripe payment, also attributes unlock revenue to broker-acquisition prospects (email match).
 */

import { logInfo } from "@/lib/logger";
import { prisma } from "@/lib/db";

const LOG = "[leads:monetization]";

export type LeadMonetizationMonitoringState = {
  leadsViewed: number;
  leadsUnlocked: number;
  unlockAttempts: number;
};

let state: LeadMonetizationMonitoringState = {
  leadsViewed: 0,
  leadsUnlocked: 0,
  unlockAttempts: 0,
};

export function getLeadMonetizationMonitoringSnapshot(): LeadMonetizationMonitoringState & {
  unlockConversionRate: number;
} {
  const attempts = Math.max(1, state.unlockAttempts);
  const unlockConversionRate = Math.round((state.leadsUnlocked / attempts) * 1000) / 1000;
  return { ...state, unlockConversionRate };
}

export function resetLeadMonetizationMonitoringForTests(): void {
  state = { leadsViewed: 0, leadsUnlocked: 0, unlockAttempts: 0 };
}

export function recordLeadMonetizationView(): void {
  try {
    state.leadsViewed += 1;
    logInfo(`${LOG} view`);
  } catch {
    /* noop */
  }
}

export function recordLeadUnlockAttempt(): void {
  try {
    state.unlockAttempts += 1;
    logInfo(`${LOG} unlock_attempt`);
  } catch {
    /* noop */
  }
}

export function recordLeadMonetizationUnlocked(): void {
  try {
    state.leadsUnlocked += 1;
    logInfo(`${LOG} unlocked`);
  } catch {
    /* noop */
  }
}

/**
 * Called after Stripe webhook confirms CRM lead_unlock (additive; does not replace ledger).
 * Resolves paying user email and updates in-memory broker pipeline + assignment log when the prospect exists.
 */
export async function onLeadUnlockPaymentRecorded(args: {
  leadId: string;
  brokerUserId: string;
  amountCents: number;
}): Promise<void> {
  try {
    recordLeadMonetizationUnlocked();
    logInfo(`${LOG} payment_recorded lead=${args.leadId}`);

    const uid = args.brokerUserId?.trim();
    if (!uid) return;

    const user = await prisma.user
      .findUnique({
        where: { id: uid },
        select: { email: true },
      })
      .catch(() => null);
    const email = user?.email?.trim();
    if (!email) return;

    const amountCad = Math.max(0, args.amountCents) / 100;
    const { applyLeadUnlockToProspectByBrokerEmail } = await import("@/modules/brokers/broker-performance.service");
    applyLeadUnlockToProspectByBrokerEmail(email, amountCad);

    const { markLeadAssignmentUnlocked } = await import("@/modules/brokers/broker-leads.service");
    markLeadAssignmentUnlocked(args.leadId);

    const { markBrokerTestimonialEligible } = await import("@/modules/growth/broker-testimonial.service");
    await markBrokerTestimonialEligible(uid, "first_purchase").catch(() => {});
  } catch {
    /* noop */
  }
}
