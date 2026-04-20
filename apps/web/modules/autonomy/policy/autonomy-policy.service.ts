import type { AutonomyPolicyResult } from "../types/autonomy.types";
import { logAutonomy } from "../lib/autonomy-log";
import { trackAutonomyPolicyEvaluation } from "./autonomy-policy-monitoring.service";

import type {
  AutonomyPolicyContext,
  AutonomyPolicyEvaluationResult,
} from "./autonomy-policy.types";

function addResult(list: AutonomyPolicyResult[], result: AutonomyPolicyResult): void {
  list.push(result);
}

export function evaluateAutonomyPolicies(context: AutonomyPolicyContext): AutonomyPolicyEvaluationResult {
  const results: AutonomyPolicyResult[] = [];

  if (context.mode === "OFF") {
    addResult(results, {
      id: "mode-off",
      domain: context.domain,
      severity: "CRITICAL",
      allowed: false,
      requiresHumanApproval: false,
      reason: "Autonomy mode is OFF.",
    });
    const criticalTriggered = true;
    trackAutonomyPolicyEvaluation(criticalTriggered);
    logAutonomy("[autonomy:policy:evaluate]", {
      domain: context.domain,
      allowed: false,
      mode: context.mode,
    });
    return {
      results,
      allowed: false,
      requiresHumanApproval: false,
    };
  }

  if (context.mode === "ASSIST") {
    addResult(results, {
      id: "assist-only",
      domain: context.domain,
      severity: "WARNING",
      allowed: true,
      requiresHumanApproval: true,
      reason: "ASSIST mode only allows draft recommendations.",
    });
  }

  if (context.domain === "INVESTMENT") {
    addResult(results, {
      id: "investment-approval",
      domain: context.domain,
      severity: "WARNING",
      allowed: true,
      requiresHumanApproval: true,
      reason: "Investment actions always require human approval.",
    });
  }

  const revenue = context.estimatedImpact?.revenue ?? 0;
  if (revenue > 25000) {
    addResult(results, {
      id: "high-impact-revenue",
      domain: context.domain,
      severity: "WARNING",
      allowed: true,
      requiresHumanApproval: true,
      reason: "High-impact action requires human approval.",
    });
  }

  if (
    context.domain === "PRICING" &&
    typeof context.payload?.["deltaPercent"] === "number" &&
    Math.abs(Number(context.payload["deltaPercent"])) > 20
  ) {
    addResult(results, {
      id: "pricing-cap",
      domain: context.domain,
      severity: "CRITICAL",
      allowed: false,
      requiresHumanApproval: true,
      reason: "Pricing delta exceeds safe threshold.",
    });
  }

  const disallowed = results.some((r) => !r.allowed);
  const requiresHumanApproval = results.some((r) => r.requiresHumanApproval);

  if (!results.length) {
    results.push({
      id: "default-allow",
      domain: context.domain,
      severity: "INFO",
      allowed: true,
      requiresHumanApproval: false,
      reason: "No policy restrictions triggered.",
    });
  }

  const criticalTriggered = results.some((r) => r.severity === "CRITICAL" || !r.allowed);
  trackAutonomyPolicyEvaluation(criticalTriggered);
  logAutonomy("[autonomy:policy:evaluate]", {
    domain: context.domain,
    allowed: !disallowed,
    requiresHumanApproval,
    resultCount: results.length,
  });

  return {
    results,
    allowed: !disallowed,
    requiresHumanApproval,
  };
}
