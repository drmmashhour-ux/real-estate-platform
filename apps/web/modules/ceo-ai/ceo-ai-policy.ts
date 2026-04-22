import { prisma } from "@/lib/db";
import type { CeoDecisionPayload, CeoDomain } from "@/modules/ceo-ai/ceo-ai.types";

/** Relative price delta above this always requires approval (unless policy OFF). */
export const CEO_PRICING_APPROVAL_THRESHOLD = 0.05;

export async function getOrCreateCeoPolicy() {
  const existing = await prisma.ceoPolicy.findFirst({ orderBy: { updatedAt: "desc" } });
  if (existing) return existing;
  return prisma.ceoPolicy.create({
    data: {},
  });
}

export function isHighRiskPayload(payload: CeoDecisionPayload): boolean {
  switch (payload.kind) {
    case "pricing_lead_adjust":
      return Math.abs(payload.relativeDelta) >= CEO_PRICING_APPROVAL_THRESHOLD;
    case "pricing_featured_adjust":
      return Math.abs(payload.relativeDelta) >= CEO_PRICING_APPROVAL_THRESHOLD;
    case "growth_cta_shift":
      return payload.scope === "homepage";
    case "outreach_operator_city":
      return "bulkSend" in payload && payload.bulkSend === true;
    default:
      return false;
  }
}

/**
 * Whether humans must approve before execution. Draft-only / queue-only items can be false when policy allows.
 */
export function requiresApprovalForProposal(
  domain: CeoDomain,
  payload: CeoDecisionPayload,
  policy: { autonomyMode: string }
): boolean {
  if (policy.autonomyMode === "OFF") return true;
  if (isHighRiskPayload(payload)) return true;

  if (payload.kind === "growth_cta_shift") return payload.scope === "homepage";
  if (payload.kind === "growth_seo_city_pages") return true;
  if (payload.kind === "pricing_lead_adjust" || payload.kind === "pricing_featured_adjust") {
    return Math.abs(payload.relativeDelta) >= CEO_PRICING_APPROVAL_THRESHOLD;
  }
  if (payload.kind === "pricing_promo_operator") return true;
  if (payload.kind.startsWith("outreach_")) return true;
  if (payload.kind === "retention_credit_offer") return true;
  if (domain === "OPERATIONS") return true;

  if (payload.kind === "growth_family_content") return false;
  if (payload.kind === "retention_broker_email" || payload.kind === "retention_operator_profile") return false;

  return true;
}

/** Safe drafts (ideas, queues without send) can skip approval when policy allows. */
export function canAutoExecuteDraft(
  domain: CeoDomain,
  payload: CeoDecisionPayload,
  policy: { allowAutoGrowthCopy: boolean; allowAutoRetention: boolean; allowAutoPricing: boolean }
): boolean {
  if (payload.kind === "growth_seo_city_pages" || payload.kind === "growth_family_content") {
    return policy.allowAutoGrowthCopy;
  }
  if (payload.kind === "retention_broker_email" || payload.kind === "retention_operator_profile") {
    return policy.allowAutoRetention;
  }
  if (payload.kind === "pricing_lead_adjust" && Math.abs(payload.relativeDelta) < CEO_PRICING_APPROVAL_THRESHOLD) {
    return policy.allowAutoPricing;
  }
  return false;
}
