/**
 * Lead monetization monitoring — bounded counters; never throws.
 */

import { logInfo } from "@/lib/logger";

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
 */
export function onLeadUnlockPaymentRecorded(_args: { leadId: string; brokerUserId: string; amountCents: number }): void {
  try {
    recordLeadMonetizationUnlocked();
    logInfo(`${LOG} payment_recorded lead=${_args.leadId}`);
  } catch {
    /* noop */
  }
}
