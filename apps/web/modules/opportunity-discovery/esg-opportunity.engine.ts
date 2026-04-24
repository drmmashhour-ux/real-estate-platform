import type { DiscoveredOpportunity } from "./opportunity.types";
import type { OpportunityDiscoveryContext } from "./opportunity-context.service";
import type { OpportunityDiscoveryWeights } from "./opportunity.types";
import { compositeOpportunityScore, deriveConfidence, mergeWeights } from "./opportunity-scoring";
import { suggestedNextActionsForOpportunity } from "./opportunity-next-actions";
import type { LecipmOpportunityRiskTier } from "@prisma/client";

export function runEsgOpportunityEngine(
  ctx: OpportunityDiscoveryContext,
  partialWeights?: Partial<OpportunityDiscoveryWeights>,
): DiscoveredOpportunity[] {
  const weights = mergeWeights(partialWeights);
  const out: DiscoveredOpportunity[] = [];

  for (const l of ctx.listings) {
    const comp = l.esgComposite;
    if (comp == null && !l.esgRenovation) continue;
    const weakEsg = comp != null ? comp < 58 : true;
    const upside = l.esgRenovation || (comp != null && comp < 52);
    if (!weakEsg && !upside) continue;

    const coverage = l.esgCoverage ?? 0;
    const esgUpside = upside ? Math.min(1, 0.55 + (60 - (comp ?? 45)) / 120) : 0.25;
    let risk: LecipmOpportunityRiskTier = coverage < 35 ? "MEDIUM" : "LOW";
    if (l.complianceScore != null && l.complianceScore < 50) risk = "HIGH";

    const score = compositeOpportunityScore(
      {
        esgUpside,
        valueGap: weakEsg ? 0.35 : 0.2,
        conversion: 0.35,
        urgency: 0.25,
        financing: 0.4,
      },
      risk,
      weights,
    );

    out.push({
      entityType: "LISTING",
      entityId: l.id,
      opportunityType: "ESG_UPSIDE",
      score,
      confidenceScore: deriveConfidence(coverage >= 45 ? "medium" : "low", 3),
      riskLevel: risk,
      rationale: {
        summary: "ESG profile suggests retrofit or evidence gap — directional upside only if upgrades pencil under your diligence.",
        explainability: [
          comp != null ? `Composite ESG score (internal): ${comp.toFixed(1)}.` : "Composite ESG score missing — low evidence confidence.",
          l.esgRenovation ? "Renovation flag present — review embodied carbon and bylaws." : "No renovation flag; upside may be operational/energy.",
          `Evidence coverage (internal): ${coverage.toFixed(0)}%.`,
        ],
        dataQuality: coverage >= 50 ? "medium" : "low",
        disclaimers: [
          "No greenwashing: claims require defensible evidence and regulatory context.",
          "Payback and financing fit are not guaranteed.",
        ],
        signals: { esgComposite: comp, esgCoverage: coverage, esgRenovation: l.esgRenovation },
        riskFlags: coverage < 35 ? ["low_evidence_coverage"] : [],
      },
      suggestedNextActions: suggestedNextActionsForOpportunity("ESG_UPSIDE", "LISTING"),
      propertyType: l.listingType,
      esgRelevant: true,
      investorReady: false,
    });
  }
  return out;
}
