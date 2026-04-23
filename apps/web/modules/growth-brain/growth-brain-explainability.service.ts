import type { ExplainabilityPack, GrowthOpportunity, NormalizedSignal } from "./growth-brain.types";

function confidenceTier(c: number): string {
  if (c >= 0.72) return "high";
  if (c >= 0.48) return "medium";
  return "low";
}

export function buildExplainability(
  opportunity: GrowthOpportunity,
  signals: NormalizedSignal[]
): ExplainabilityPack {
  const refs = signals.filter((s) => opportunity.sourceSignalIds.includes(s.signalId));
  const sigTitles = refs.map((s) => s.signalType.replace(/_/g, " "));

  const conf = confidenceTier(opportunity.confidence);
  const needsApproval =
    opportunity.expectedImpact >= 0.65 ||
    opportunity.domain === "SALES" ||
    opportunity.domain === "BNHUB";

  return {
    headline: opportunity.title,
    signalsReferenced: sigTitles.length ? sigTitles : ["aggregated cross-module metrics"],
    prioritizationReason: `Ranked using weighted blend of revenue upside (${opportunity.expectedImpact.toFixed(
      2
    )}), urgency (${opportunity.urgency.toFixed(2)}), confidence (${opportunity.confidence.toFixed(
      2
    )}), ease (${opportunity.easeOfExecution.toFixed(2)}), and strategic domain fit (${opportunity.strategicFit.toFixed(
      2
    )}).`,
    targetMetric:
      opportunity.domain === "MARKETING"
        ? "Lead capture rate from organic + paid surfaces"
        : opportunity.domain === "SALES"
          ? "Stage conversion and close rate"
          : "Qualified pipeline velocity for the highlighted domain",
    confidenceExplanation: `Confidence is ${conf} because upstream signal sampling is ${conf}; sparse data lowers certainty.`,
    approvalExplanation: needsApproval
      ? "Approval required: impact crosses threshold or touches revenue-sensitive routing / campaigns."
      : "No mandatory approval for low-touch drafting or coaching assignments when autonomy allows.",
  };
}
