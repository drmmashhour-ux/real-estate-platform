/**
 * Manual / helper conversion marking — does not replace Stripe or webhooks.
 */

import type { BrokerProspect } from "@/modules/brokers/broker-pipeline.types";
import {
  findProspectByEmailLoose,
  markBrokerPurchaseOnProspect,
} from "@/modules/brokers/broker-pipeline.service";

export type MarkBrokerConvertedInput = {
  prospectId: string;
  firstPurchaseDate: string;
  totalSpent?: number;
};

/**
 * Mark a pipeline prospect as converted with purchase metadata (operator or automated matcher).
 */
export function markBrokerConverted(input: MarkBrokerConvertedInput): BrokerProspect | null {
  return markBrokerPurchaseOnProspect(input.prospectId, {
    firstPurchaseDate: input.firstPurchaseDate,
    totalSpent: input.totalSpent,
    moveToConverted: true,
  });
}

export type TryMatchByEmailInput = {
  email: string | null | undefined;
  firstPurchaseDate: string;
  /** Optional cents from platform payment — stored as dollars on prospect. */
  totalSpentCents?: number;
};

/**
 * If a prospect exists with the same email (case-insensitive), attach purchase + converted.
 * Safe no-op when no match — call from future hooks without changing payment core.
 */
export function tryMarkProspectConvertedByBrokerEmail(input: TryMatchByEmailInput): BrokerProspect | null {
  const email = input.email?.trim();
  if (!email) return null;
  const p = findProspectByEmailLoose(email);
  if (!p) return null;
  const totalSpent =
    input.totalSpentCents != null && Number.isFinite(input.totalSpentCents)
      ? Math.round(input.totalSpentCents) / 100
      : undefined;
  return markBrokerPurchaseOnProspect(p.id, {
    firstPurchaseDate: input.firstPurchaseDate,
    totalSpent,
    moveToConverted: true,
  });
}
