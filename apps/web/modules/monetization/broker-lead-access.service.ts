/**
 * Enforces pay-per-assigned-lead: contact/detail APIs should call this before revealing PII.
 */

import type { PrismaClient } from "@prisma/client";
import { getOrCreateBrokerMonetizationProfile } from "@/modules/billing/brokerPricing";

export type BrokerLeadAccessResult =
  | { ok: true; billingStatus: string }
  | { ok: false; reason: "not_found" | "unpaid" | "wrong_broker" };

/**
 * Broker may view assigned lead CRM payload only when paid, waived, or subscription covers leads.
 */
export async function assertBrokerLeadPaidAccess(
  db: PrismaClient,
  brokerId: string,
  leadId: string,
): Promise<BrokerLeadAccessResult> {
  const profile = await getOrCreateBrokerMonetizationProfile(db, brokerId);
  if (profile.subscriptionCoversAssignedLeads) {
    return { ok: true, billingStatus: "waived" };
  }

  const bl = await db.brokerLead.findFirst({
    where: { leadId, brokerId },
    select: { billingStatus: true },
  });

  if (!bl) return { ok: false, reason: "not_found" };
  if (bl.billingStatus === "paid" || bl.billingStatus === "waived") {
    return { ok: true, billingStatus: bl.billingStatus };
  }
  return { ok: false, reason: "unpaid" };
}
