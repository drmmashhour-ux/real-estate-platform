/**
 * First-purchase / lead conversion — value-first, no fake urgency.
 * Uses platform `Lead` unlock (Stripe `lead_unlock`) when `marketplaceLeadId` is linked to a CRM row.
 */

import { prisma } from "@/lib/db";
import { logInfo } from "@/lib/logger";
import { listBrokerCrmLeads } from "@/lib/broker-crm/list-leads";
import { computeLeadValueAndPrice } from "@/modules/revenue/lead-pricing.service";
import { getRevenueControlSettings } from "@/modules/revenue/revenue-control-settings";

const TAG = "[broker-conversion]";

/** First lead intro price in cents (e.g. 9900 = $99 CAD) — below default list when eligible. */
export function getFirstLeadOfferCents(): number {
  const raw = process.env.BROKER_FIRST_LEAD_PRICE_CENTS?.trim();
  if (raw && /^\d+$/.test(raw)) return Math.max(100, Math.min(500_00, parseInt(raw, 10)));
  return 9900;
}

/** Counts completed lead contact unlocks paid by this broker (platform Lead). */
export async function countBrokerLeadUnlocks(brokerId: string): Promise<number> {
  return prisma.lead.count({
    where: { contactUnlockedByUserId: brokerId },
  });
}

export async function isFirstLeadPurchaseEligible(brokerId: string): Promise<boolean> {
  const n = await countBrokerLeadUnlocks(brokerId);
  return n === 0;
}

/**
 * Apply first-unlock promo: capped so we never exceed model price nor go below minimum policy.
 */
export function applyFirstLeadPricing(input: {
  computedListCents: number;
  firstLeadEligible: boolean;
  minPolicyCents: number;
  maxPolicyCents: number;
}): {
  chargedCents: number;
  listCents: number;
  firstLeadOfferApplied: boolean;
  savingsCents: number;
} {
  const listCents = Math.min(Math.max(input.computedListCents, input.minPolicyCents), input.maxPolicyCents);
  if (!input.firstLeadEligible) {
    return {
      chargedCents: listCents,
      listCents,
      firstLeadOfferApplied: false,
      savingsCents: 0,
    };
  }
  const offer = getFirstLeadOfferCents();
  const chargedCents = Math.min(listCents, Math.max(input.minPolicyCents, offer));
  return {
    chargedCents,
    listCents,
    firstLeadOfferApplied: chargedCents < listCents,
    savingsCents: Math.max(0, listCents - chargedCents),
  };
}

export async function resolveMarketplaceLeadForCrmLead(crmLeadId: string): Promise<string | null> {
  const row = await prisma.lecipmBrokerCrmLead.findUnique({
    where: { id: crmLeadId },
    select: {
      marketplaceLeadId: true,
      listingId: true,
      guestEmail: true,
      customer: { select: { email: true } },
    },
  });
  if (!row) return null;
  if (row.marketplaceLeadId) return row.marketplaceLeadId;

  const email = row.customer?.email?.trim() || row.guestEmail?.trim();
  if (!email || !row.listingId) return null;

  const match = await prisma.lead.findFirst({
    where: {
      listingId: row.listingId,
      email: { equals: email, mode: "insensitive" },
    },
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });
  if (match && !row.marketplaceLeadId) {
    await prisma.lecipmBrokerCrmLead
      .update({
        where: { id: crmLeadId },
        data: { marketplaceLeadId: match.id },
      })
      .catch(() => {});
    logInfo(`${TAG} backfilled marketplaceLeadId`, { crmLeadId, marketplaceLeadId: match.id });
  }
  return match?.id ?? null;
}

export type BrokerConversionLeadQuality = {
  qualityScore: number;
  qualityLabel: string;
  reasonLine: string;
  exclusiveAssignment: boolean;
};

export function describeLeadQuality(input: {
  marketplaceScore: number | null;
  crmPriorityScore: number;
  introducedByBrokerId: string | null;
  brokerUserId: string;
}): BrokerConversionLeadQuality {
  const platform = Math.min(100, Math.max(0, input.marketplaceScore ?? input.crmPriorityScore));
  const exclusive =
    Boolean(input.introducedByBrokerId) && input.introducedByBrokerId === input.brokerUserId;
  let reasonLine = "Solid inquiry fit for your pipeline.";
  if (platform >= 72) reasonLine = "High probability to close — strong signals on this inquiry.";
  else if (platform >= 48) reasonLine = "Good fit — timely follow-up improves outcomes.";
  else reasonLine = "Worth a conversation — qualifying questions help prioritize.";

  return {
    qualityScore: platform,
    qualityLabel: platform >= 72 ? "Strong" : platform >= 48 ? "Good" : "Standard",
    reasonLine,
    exclusiveAssignment: exclusive,
  };
}

export async function buildConversionContextForMarketplaceLead(
  leadId: string,
  brokerUserId: string
): Promise<{
  marketplaceLeadId: string;
  listPriceCents: number;
  offerPriceCents: number;
  firstLeadEligible: boolean;
  firstLeadOfferApplied: boolean;
  unlocked: boolean;
  quality: BrokerConversionLeadQuality;
} | null> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      contactUnlockedAt: true,
      introducedByBrokerId: true,
      score: true,
      message: true,
      leadSource: true,
      leadType: true,
      engagementScore: true,
      dynamicLeadPriceCents: true,
      email: true,
      phone: true,
      _count: { select: { crmInteractions: true, leadTimelineEvents: true } },
    },
  });
  if (!lead) return null;

  const settings = await getRevenueControlSettings();
  const priced = computeLeadValueAndPrice(
    {
      message: lead.message,
      leadSource: lead.leadSource,
      leadType: lead.leadType,
      score: lead.score,
      engagementScore: lead.engagementScore,
      interactionCount: lead._count.crmInteractions + lead._count.leadTimelineEvents,
      hasCompleteContact: Boolean(lead.email?.trim() && lead.phone?.trim()),
    },
    {
      basePriceCents: lead.dynamicLeadPriceCents ?? undefined,
      minCents: settings.leadUnlockMinCents,
      maxCents: settings.leadUnlockMaxCents,
      defaultLeadPriceCents: settings.leadDefaultPriceCents,
    },
  );

  const firstEligible = await isFirstLeadPurchaseEligible(brokerUserId);
  const applied = applyFirstLeadPricing({
    computedListCents: priced.leadPriceCents,
    firstLeadEligible: firstEligible,
    minPolicyCents: settings.leadUnlockMinCents,
    maxPolicyCents: settings.leadUnlockMaxCents,
  });

  const quality = describeLeadQuality({
    marketplaceScore: priced.leadScore ?? lead.score,
    crmPriorityScore: lead.score,
    introducedByBrokerId: lead.introducedByBrokerId,
    brokerUserId,
  });

  return {
    marketplaceLeadId: leadId,
    listPriceCents: applied.listCents,
    offerPriceCents: applied.chargedCents,
    firstLeadEligible: firstEligible,
    firstLeadOfferApplied: applied.firstLeadOfferApplied,
    unlocked: Boolean(lead.contactUnlockedAt),
    quality,
  };
}

export async function getConversionOfferForCrmLead(crmLeadId: string, brokerUserId: string) {
  const ml = await resolveMarketplaceLeadForCrmLead(crmLeadId);
  if (!ml) {
    return {
      ok: false as const,
      reason: "no_marketplace_link" as const,
      message:
        "This conversation is not yet linked to a billable inquiry record. Contact support if you expected paid unlock.",
    };
  }
  const ctx = await buildConversionContextForMarketplaceLead(ml, brokerUserId);
  if (!ctx) return { ok: false as const, reason: "lead_not_found" as const, message: "Lead not found." };
  return { ok: true as const, crmLeadId, ...ctx };
}

export type BrokerConversionHomeSummary = {
  topOpportunities: Awaited<ReturnType<typeof listBrokerCrmLeads>>;
  unlockCount: number;
  firstLeadEligible: boolean;
  dealsAtRiskCount: number;
  highPotentialOpenCount: number;
  coachTips: string[];
};

export async function getBrokerConversionHomeSummary(
  brokerUserId: string,
  isAdmin: boolean
): Promise<BrokerConversionHomeSummary> {
  const now = new Date();
  const [topOpportunities, unlockCount, firstEligible, dealsAtRiskCount, highPotentialOpenCount] =
    await Promise.all([
      listBrokerCrmLeads({ brokerUserId, isAdmin, filter: "all", take: 3 }),
      countBrokerLeadUnlocks(brokerUserId),
      isFirstLeadPurchaseEligible(brokerUserId),
      prisma.lecipmBrokerCrmLead.count({
        where: {
          ...(isAdmin ? {} : { brokerUserId }),
          status: { notIn: ["closed", "lost"] },
          nextFollowUpAt: { lt: now },
        },
      }),
      prisma.lecipmBrokerCrmLead.count({
        where: {
          ...(isAdmin ? {} : { brokerUserId }),
          priorityLabel: "high",
          status: { notIn: ["closed", "lost"] },
        },
      }),
    ]);

  const coachTips = [
    "Follow up within 24h increases close rate on warm inquiries.",
    ...(dealsAtRiskCount > 0 ? [`${dealsAtRiskCount} deal${dealsAtRiskCount === 1 ? "" : "s"} ${dealsAtRiskCount === 1 ? "needs" : "need"} follow-up — pick one now.`] : []),
  ];

  logInfo(`${TAG} home_summary`, {
    brokerUserId,
    unlockCount,
    firstEligible,
    dealsAtRiskCount,
  });

  return {
    topOpportunities,
    unlockCount,
    firstLeadEligible: firstEligible,
    dealsAtRiskCount,
    highPotentialOpenCount,
    coachTips,
  };
}

/** Funnel analytics — server-side only; no PII in path. */
export async function recordBrokerConversionEvent(input: {
  brokerId: string;
  eventType:
    | "broker_conversion_crm_view"
    | "broker_conversion_unlock_click"
    | "broker_conversion_detail_open";
  crmLeadId?: string;
  marketplaceLeadId?: string;
}): Promise<void> {
  await prisma.trafficEvent
    .create({
      data: {
        eventType: input.eventType,
        path: "/dashboard/crm",
        source: "broker_conversion",
        meta: {
          brokerId: input.brokerId,
          ...(input.crmLeadId ? { crmLeadId: input.crmLeadId } : {}),
          ...(input.marketplaceLeadId ? { marketplaceLeadId: input.marketplaceLeadId } : {}),
        } as object,
      },
    })
    .catch(() => {});
}
