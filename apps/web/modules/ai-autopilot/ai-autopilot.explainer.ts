import type { ProposedAction } from "./ai-autopilot.types";

export function explainAction(a: ProposedAction): { summary: string; detail: Record<string, unknown> } {
  const triggeredBy =
    typeof a.reasons.triggeredBy === "string" ? a.reasons.triggeredBy : "platform signals + policy";
  const benefit =
    typeof a.reasons.expectedBenefit === "string" ? a.reasons.expectedBenefit : "measurable improvement";
  return {
    summary: `${a.title} — ${triggeredBy}. Expected benefit: ${benefit}. Risk class: ${a.riskLevel}; approval ${
      a.riskLevel === "LOW" ? "optional per policy" : "required before execution"
    }.`,
    detail: {
      domain: a.domain,
      actionType: a.actionType,
      dataSources: a.reasons.dataSources ?? [],
      cautions: a.reasons.cautions ?? [],
    },
  };
}
