import type { DiscoveredOpportunity } from "./opportunity.types";
import type { ListingContextRow, OpportunityDiscoveryContext } from "./opportunity-context.service";
import { compositeOpportunityScore, deriveConfidence, mergeWeights } from "./opportunity-scoring";
import type { OpportunityDiscoveryWeights } from "./opportunity.types";
import { suggestedNextActionsForOpportunity } from "./opportunity-next-actions";
import type { LecipmOpportunityRiskTier } from "@prisma/client";

function riskFromComplianceAndRatio(l: ListingContextRow): LecipmOpportunityRiskTier {
  if (!l.crmMarketplaceLive || l.complianceScore != null && l.complianceScore < 40) return "HIGH";
  if (l.priceRatioToMedian < 0.78 || (l.complianceScore != null && l.complianceScore < 65)) return "MEDIUM";
  return "LOW";
}

export function discoverUndervaluedListings(
  ctx: OpportunityDiscoveryContext,
  weights: OpportunityDiscoveryWeights,
  intentBoostByListingId: Record<string, number>,
): DiscoveredOpportunity[] {
  const out: DiscoveredOpportunity[] = [];
  for (const l of ctx.listings) {
    if (l.medianPeerPrice <= 0) continue;
    if (l.priceRatioToMedian >= 0.97) continue;
    if (!l.crmMarketplaceLive) continue;

    const valueGap = Math.max(0, Math.min(1, (0.95 - l.priceRatioToMedian) / 0.25));
    const engagementProxy = l.complianceScore != null ? l.complianceScore / 100 : 0.45;
    const urgency = Math.min(1, (Date.now() - l.createdAt.getTime()) / (120 * 86400000));

    const risk = riskFromComplianceAndRatio(l);
    let score = compositeOpportunityScore(
      {
        valueGap,
        conversion: engagementProxy * 0.7,
        urgency: urgency * 0.5,
        esgUpside: 0,
        investorMatch: 0,
        bookingUpside: 0,
        financing: 0.35,
      },
      risk,
      weights,
    );

    const iboost = intentBoostByListingId[l.id] ?? 0;
    score = Math.min(100, Math.round(score + iboost * 12));

    const dataQuality: "high" | "medium" | "low" =
      l.medianPeerPrice > 0 && ctx.listings.filter((x) => x.listingType === l.listingType).length >= 4 ? "high" : "medium";

    out.push({
      entityType: "LISTING",
      entityId: l.id,
      opportunityType: "UNDERVALUED",
      score,
      confidenceScore: deriveConfidence(dataQuality, 4),
      riskLevel: risk,
      rationale: {
        summary: "Listing price sits below peer median in your CRM slice — may indicate relative value or data sparsity.",
        explainability: [
          `Price / median in asset class: ${(l.priceRatioToMedian * 100).toFixed(1)}% (heuristic; not a formal appraisal).`,
          `Peer median (same listingType in your access set): ${Math.round(l.medianPeerPrice).toLocaleString()} (CAD display units as stored).`,
          l.complianceScore != null ? `Compliance checklist cache: ${l.complianceScore}/100.` : "Compliance score not cached — treat as lower confidence.",
        ],
        dataQuality,
        disclaimers: [
          "Not a valuation opinion. Confirm with comps, inspections, and seller disclosure.",
          "No guaranteed upside or ROI — modeling is directional only.",
        ],
        signals: {
          priceRatioToMedian: l.priceRatioToMedian,
          medianPeerPrice: l.medianPeerPrice,
          listingPrice: l.price,
          complianceScore: l.complianceScore,
        },
        riskFlags: risk === "HIGH" ? ["weak_compliance_or_visibility"] : l.priceRatioToMedian < 0.82 ? ["large_deviation_verify_data"] : [],
      },
      suggestedNextActions: suggestedNextActionsForOpportunity("UNDERVALUED", "LISTING"),
      propertyType: l.listingType,
      marketSegment: "residential_crm",
      esgRelevant: false,
      investorReady: false,
    });
  }
  return out;
}

export function runUndervaluedListingEngine(
  ctx: OpportunityDiscoveryContext,
  partialWeights?: Partial<OpportunityDiscoveryWeights>,
): DiscoveredOpportunity[] {
  const weights = mergeWeights(partialWeights);
  return discoverUndervaluedListings(ctx, weights, ctx.recommendationIntentByListingId);
}
