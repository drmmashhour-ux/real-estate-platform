import type { DiscoveredOpportunity } from "./opportunity.types";
import type { OpportunityDiscoveryContext } from "./opportunity-context.service";
import type { OpportunityDiscoveryWeights } from "./opportunity.types";
import { compositeOpportunityScore, deriveConfidence, mergeWeights, boostForIntent } from "./opportunity-scoring";
import { suggestedNextActionsForOpportunity } from "./opportunity-next-actions";
import type { LecipmOpportunityRiskTier } from "@prisma/client";

export function runBrokerOpportunityEngine(
  ctx: OpportunityDiscoveryContext,
  partialWeights?: Partial<OpportunityDiscoveryWeights>,
  intentBoost01?: number,
): DiscoveredOpportunity[] {
  const weights = mergeWeights(partialWeights);
  const out: DiscoveredOpportunity[] = [];

  for (const lead of ctx.leads) {
    if (lead.score < 58) continue;
    const cp = lead.conversionProbability ?? 0;
    const intent = Math.min(1, lead.convoIntent / 100 + (lead.aiTier === "hot" ? 0.35 : lead.aiTier === "warm" ? 0.2 : 0));
    if (intent < 0.35 && cp < 0.45 && lead.score < 72) continue;

    let risk: LecipmOpportunityRiskTier = lead.score >= 85 && cp >= 0.55 ? "LOW" : "MEDIUM";

    let score = compositeOpportunityScore(
      {
        conversion: Math.min(1, lead.score / 100 * 0.9 + cp * 0.8),
        urgency: Math.min(1, lead.convoPriority / 100 + 0.25),
        valueGap: 0.2,
        investorMatch: 0.2,
        bookingUpside: 0,
        financing: 0.25,
      },
      risk,
      weights,
    );

    score = boostForIntent(score, Math.min(1, intentBoost01 ?? intent * 0.35));

    out.push({
      entityType: "DEAL",
      entityId: lead.id,
      opportunityType: "HIGH_DEMAND",
      score,
      confidenceScore: deriveConfidence(lead.convoIntent > 40 ? "high" : "medium", 4),
      riskLevel: risk,
      rationale: {
        summary: "CRM lead shows strong intent or score — speed-to-lead may be the edge (no auto-outreach).",
        explainability: [
          `Lead score: ${lead.score}; modeled conversion: ${cp ? `${Math.round(cp * 100)}%` : "n/a"}.`,
          `AI tier: ${lead.aiTier ?? "n/a"}; chat intent score: ${lead.convoIntent}.`,
          `Pipeline stage: ${lead.pipelineStage}.`,
        ],
        dataQuality: lead.convoIntent > 35 ? "high" : "medium",
        disclaimers: [
          "Do not send unsolicited investment marketing; follow your compliance playbook.",
          "Intent signals are behavioral — confirm fit before commitments.",
        ],
        signals: {
          leadScore: lead.score,
          conversionProbability: cp,
          aiTier: lead.aiTier,
          convoIntent: lead.convoIntent,
        },
        riskFlags: cp < 0.35 ? ["conversion_uncertain"] : [],
      },
      suggestedNextActions: suggestedNextActionsForOpportunity("HIGH_DEMAND", "DEAL"),
      marketSegment: "broker_crm",
      investorReady: false,
      esgRelevant: false,
    });
  }

  for (const inv of ctx.investments) {
    if (!/PENDING|PROPOSED|SCREENING|REVIEW/i.test(inv.decisionStatus)) continue;
    const score = compositeOpportunityScore(
      {
        investorMatch: 0.75,
        conversion: 0.55,
        financing: 0.5,
        urgency: 0.45,
        valueGap: 0.35,
      },
      "MEDIUM",
      weights,
    );

    out.push({
      entityType: "INVESTMENT",
      entityId: inv.id,
      opportunityType: "INVESTOR_FIT",
      score,
      confidenceScore: deriveConfidence("medium", 3),
      riskLevel: "MEDIUM",
      rationale: {
        summary: "Capital pipeline row may match value-add themes — suitability and documentation still required.",
        explainability: [
          `Stage: ${inv.pipelineStage}; decision: ${inv.decisionStatus}.`,
          inv.listingId ? `Linked listing: ${inv.listingId}.` : "No listing linked yet.",
        ],
        dataQuality: "medium",
        disclaimers: [
          "Securities and advertising rules may apply — use governed materials only.",
          "No public solicitation from this engine.",
        ],
        signals: { pipelineStage: inv.pipelineStage, decisionStatus: inv.decisionStatus },
        riskFlags: ["supervised_distribution_only"],
      },
      suggestedNextActions: suggestedNextActionsForOpportunity("INVESTOR_FIT", "INVESTMENT"),
      investorReady: true,
      esgRelevant: false,
    });
  }

  return out;
}
