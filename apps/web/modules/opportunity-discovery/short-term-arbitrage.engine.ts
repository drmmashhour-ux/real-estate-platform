import type { DiscoveredOpportunity } from "./opportunity.types";
import type { OpportunityDiscoveryContext } from "./opportunity-context.service";
import type { OpportunityDiscoveryWeights } from "./opportunity.types";
import { compositeOpportunityScore, deriveConfidence, mergeWeights } from "./opportunity-scoring";
import { suggestedNextActionsForOpportunity } from "./opportunity-next-actions";
import type { LecipmOpportunityRiskTier } from "@prisma/client";

export function runShortTermArbitrageEngine(
  ctx: OpportunityDiscoveryContext,
  partialWeights?: Partial<OpportunityDiscoveryWeights>,
): DiscoveredOpportunity[] {
  const weights = mergeWeights(partialWeights);
  const out: DiscoveredOpportunity[] = [];

  for (const s of ctx.strListings) {
    const demand = Math.min(1, s.completedStays / 12 + (s.aiDiscoveryScore ?? 30) / 130);
    const quality = s.ratingAvg != null ? Math.min(1, s.ratingAvg / 5) : 0.55;
    const occProxy = Math.min(1, s.reviewCount / 24 + demand * 0.5);
    const riskScore = s.operationalRiskScore ?? 35;
    let risk: LecipmOpportunityRiskTier = riskScore >= 70 ? "HIGH" : riskScore >= 45 ? "MEDIUM" : "LOW";

    const bookingUpside = Math.min(1, demand * 0.65 + occProxy * 0.35);
    const score = compositeOpportunityScore(
      {
        bookingUpside,
        conversion: quality,
        urgency: s.pricingSuggestionsEnabled ? 0.55 : 0.35,
        valueGap: 0.25,
        financing: 0.3,
      },
      risk,
      weights,
    );

    if (score < 42) continue;

    out.push({
      entityType: "SHORT_TERM_UNIT",
      entityId: s.id,
      opportunityType: "ARBITRAGE",
      score,
      confidenceScore: deriveConfidence(s.reviewCount >= 8 ? "medium" : "low", 4),
      riskLevel: risk,
      rationale: {
        summary: "STR signals show demand/reputation headroom — compliance and municipality rules still gate any scale-up.",
        explainability: [
          `Completed stays (platform): ${s.completedStays}.`,
          `Reviews: ${s.reviewCount}; avg rating: ${s.ratingAvg?.toFixed(2) ?? "n/a"}.`,
          `AI discovery score (cached): ${s.aiDiscoveryScore ?? "n/a"}; nightly rate (cents): ${s.nightPriceCents}.`,
          `Operational risk score (heuristic): ${riskScore}.`,
        ],
        dataQuality: s.reviewCount >= 10 ? "medium" : "low",
        disclaimers: [
          "STR legality varies by municipality — verify registration and zoning.",
          "Revenue upside is not guaranteed; seasonality and platform fees apply.",
        ],
        signals: {
          completedStays: s.completedStays,
          nightPriceCents: s.nightPriceCents,
          aiDiscoveryScore: s.aiDiscoveryScore,
          operationalRiskScore: s.operationalRiskScore,
        },
        riskFlags: riskScore >= 55 ? ["operational_or_compliance_review"] : [],
      },
      suggestedNextActions: suggestedNextActionsForOpportunity("ARBITRAGE", "SHORT_TERM_UNIT"),
      city: s.city,
      marketSegment: "short_term_rental",
      esgRelevant: false,
      investorReady: false,
    });
  }
  return out;
}
