import type { AutopilotPolicyDecision } from "./full-autopilot-policy.service";

export type AutopilotExplanationPayload = {
  headline: string;
  detail: string;
  policyRuleId: string;
  advisoryNote: string;
};

export function buildAutopilotExplanation(
  domain: string,
  actionType: string,
  decision: AutopilotPolicyDecision
): AutopilotExplanationPayload {
  return {
    headline: `${decision.outcome.replace(/_/g, " ")} · ${domain}`,
    detail: [
      `Action: ${actionType}`,
      `Rule: ${decision.policyRuleId}`,
      `Risk tier: ${decision.riskLevel}`,
      `Model confidence (policy): ${(decision.confidence * 100).toFixed(0)}%`,
      decision.reason,
    ].join("\n"),
    policyRuleId: decision.policyRuleId,
    advisoryNote:
      "LECIPM autopilot is bounded: high-impact, compliance, and monetary flows remain gated unless explicitly approved by policy.",
  };
}
