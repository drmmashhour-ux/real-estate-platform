import type { AMLEvaluation, AMLSeverity, BrokerAMLApprovalPayload } from "@/lib/compliance/oaciq/aml/types";
import { maxTriggeredSeverity } from "@/lib/compliance/oaciq/aml/engine";

export function generateRiskSummary(evaluation: AMLEvaluation): string {
  if (evaluation.violations.length === 0) {
    return "No AML rule triggers on current facts — broker remains accountable for regulatory obligations.";
  }
  const head = evaluation.violations.slice(0, 4).map((v) => v.message);
  const more =
    evaluation.violations.length > 4 ? ` (+${evaluation.violations.length - 4} more)` : "";
  return `Gate: ${evaluation.gate} (score ${evaluation.risk_score}). ${head.join(" · ")}${more}`;
}

/**
 * Human-in-the-loop closing posture: AI summarizes risk; broker must review/sign when not OK.
 */
export function brokerFinalApproval(evaluation: AMLEvaluation): BrokerAMLApprovalPayload {
  const maxSev = maxTriggeredSeverity(evaluation.violations);
  let ai_status: AMLSeverity = "low";
  if (evaluation.gate === "BLOCK") {
    ai_status = "critical";
  } else if (evaluation.gate === "REVIEW_REQUIRED") {
    ai_status = maxSev === "critical" ? "critical" : "high";
  } else {
    ai_status = maxSev === "low" ? "low" : maxSev;
  }

  return {
    ai_status,
    summary: generateRiskSummary(evaluation),
    broker_action: evaluation.gate,
    requires_signature: evaluation.gate !== "OK",
  };
}
