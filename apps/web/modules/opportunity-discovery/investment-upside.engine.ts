import type { LecipmOpportunityRiskTier } from "@prisma/client";
import type { DealContextRow, OpportunityDiscoveryContext } from "./opportunity-context.service";
import type { DiscoveredOpportunity, OpportunityDiscoveryWeights } from "./opportunity.types";
import { compositeOpportunityScore, deriveConfidence, mergeWeights } from "./opportunity-scoring";
import { suggestedNextActionsForOpportunity } from "./opportunity-next-actions";

function dealRiskTier(d: DealContextRow): LecipmOpportunityRiskTier {
  if (d.status === "CONFLICT_REQUIRES_DISCLOSURE") return "HIGH";
  if (d.riskLevel === "HIGH" || d.riskLevel === "CRITICAL") return "HIGH";
  if (d.riskLevel === "MEDIUM") return "MEDIUM";
  return "LOW";
}

export function runInvestmentUpsideEngine(
  ctx: OpportunityDiscoveryContext,
  partialWeights?: Partial<OpportunityDiscoveryWeights>,
): DiscoveredOpportunity[] {
  const weights = mergeWeights(partialWeights);
  const out: DiscoveredOpportunity[] = [];

  for (const d of ctx.deals) {
    const ds = d.dealScore ?? 0;
    const cp = d.closeProbability ?? 0;
    if (ds < 68 && cp < 0.55) continue;

    const risk = dealRiskTier(d);
    const valueGap = Math.min(1, ds / 100 * 0.85 + cp * 0.35);
    const financing = cp > 0.62 ? 0.65 : 0.4;
    const investorMatch = ctx.investments.length > 0 ? 0.55 : 0.35;

    const score = compositeOpportunityScore(
      {
        valueGap,
        conversion: cp,
        urgency: cp > 0.7 ? 0.72 : 0.45,
        financing,
        investorMatch,
        esgUpside: 0.25,
      },
      risk,
      weights,
    );

    out.push({
      entityType: "DEAL",
      entityId: d.id,
      opportunityType: "VALUE_ADD",
      score,
      confidenceScore: deriveConfidence(ds >= 75 && cp > 0 ? "high" : "medium", 5),
      riskLevel: risk,
      rationale: {
        summary: "Deal intelligence suggests underwriting momentum — still requires your supervision and factual verification.",
        explainability: [
          `Deal score (model): ${ds || "n/a"}.`,
          `Close probability (model): ${cp ? `${Math.round(cp * 100)}%` : "n/a"}.`,
          `CRM stage: ${d.crmStage ?? "n/a"}; deal status: ${d.status}.`,
        ],
        dataQuality: ds >= 75 ? "high" : "medium",
        disclaimers: [
          "Not a commitment to lend or invest. Financing and investor fit must be re-verified.",
          "No promised returns — scenarios are illustrative.",
        ],
        signals: { dealScore: ds, closeProbability: cp, status: d.status },
        riskFlags: risk === "HIGH" ? ["conflict_or_elevated_model_risk"] : [],
      },
      suggestedNextActions: suggestedNextActionsForOpportunity("VALUE_ADD", "DEAL"),
      investorReady: cp >= 0.58,
      esgRelevant: false,
    });
  }
  return out;
}
