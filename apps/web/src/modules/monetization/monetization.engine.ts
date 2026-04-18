import { revenueV4Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import { logRevenueEngineV4Event } from "@/src/modules/revenue/revenue.logger";

export type MonetizationSuggestion = {
  type: "premium_listing" | "featured_boost" | "broker_paid_lead" | "bnhub_promotion";
  score: number;
  entityType: string;
  entityId: string;
  rationale: string[];
  requiresApproval: boolean;
};

/**
 * Ranks monetization surfaces — does not charge or publish.
 */
export async function evaluateMonetizationForFsboListing(listingId: string): Promise<MonetizationSuggestion[]> {
  if (!revenueV4Flags.monetizationEngineV1) return [];

  const row = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    include: { _count: { select: { leads: true, buyerListingViews: true } } },
  });
  if (!row || row.status !== "ACTIVE") return [];

  const suggestions: MonetizationSuggestion[] = [];

  if (row.publishPlan === "basic" && row._count.leads >= 2) {
    suggestions.push({
      type: "premium_listing",
      score: 62,
      entityType: "fsbo_listing",
      entityId: listingId,
      rationale: ["Multiple leads on basic plan — upgrade may unlock tools per product policy."],
      requiresApproval: true,
    });
  }

  if (!row.featuredUntil && row._count.buyerListingViews > 40) {
    suggestions.push({
      type: "featured_boost",
      score: 58,
      entityType: "fsbo_listing",
      entityId: listingId,
      rationale: ["High visibility — featured placement candidate if inventory rules allow."],
      requiresApproval: true,
    });
  }

  await logRevenueEngineV4Event({
    engine: "monetization",
    action: "evaluate_fsbo",
    entityType: "fsbo_listing",
    entityId: listingId,
    outputJson: { suggestions: suggestions.map((s) => s.type) },
    confidence: 50,
    explanation: "Heuristic monetization hints — billing layer must confirm eligibility.",
  });

  return suggestions;
}
