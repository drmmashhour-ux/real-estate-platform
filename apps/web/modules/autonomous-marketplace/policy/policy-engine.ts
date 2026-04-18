import { randomUUID } from "crypto";
import type { PolicyDecision, PolicyDisposition, PolicyRuleEvaluation, PolicyViolation, PolicyWarning } from "../types/domain.types";
import { autonomyLog } from "../internal/autonomy-log";
import type { PolicyContext } from "./policy-context";
import { allPolicyRuleEvaluators } from "./all-rules";
import { listingPreviewPolicyRuleEvaluators } from "./listing-preview-policy-rules";

export type EvaluatePolicyOptions = {
  /** When false, skips per-action decision log (e.g. batched listing preview). */
  logDecision?: boolean;
};

function aggregateDisposition(evals: PolicyRuleEvaluation[]): PolicyDisposition {
  const blocked = evals.filter((e) => e.result === "blocked");
  if (blocked.length > 0) {
    const needsApproval = blocked.some((b) => b.dispositionHint === "ALLOW_WITH_APPROVAL");
    if (needsApproval) return "ALLOW_WITH_APPROVAL";
    const dry = blocked.some((b) => b.dispositionHint === "ALLOW_DRY_RUN");
    if (dry) return "ALLOW_DRY_RUN";
    return "BLOCK";
  }
  const warnings = evals.filter((e) => e.result === "warning");
  if (warnings.length > 0) {
    const dry = warnings.some((w) => w.dispositionHint === "ALLOW_DRY_RUN");
    if (dry) return "ALLOW_DRY_RUN";
    return "ALLOW_WITH_APPROVAL";
  }
  return "ALLOW";
}

function evaluatePolicyWithRules(
  ctx: PolicyContext,
  rules: Array<(c: PolicyContext) => PolicyRuleEvaluation>,
  options?: EvaluatePolicyOptions,
): PolicyDecision {
  const ruleResults: PolicyRuleEvaluation[] = rules.map((fn) => {
    try {
      return fn(ctx);
    } catch (e) {
      autonomyLog.policy("rule error", { err: String(e) });
      return {
        ruleCode: "rule_error",
        result: "warning",
        reason: "Rule evaluation failed — defaulting to dry-run safety.",
      };
    }
  });

  const disposition = aggregateDisposition(ruleResults);
  const violations: PolicyViolation[] = [];
  const warnings: PolicyWarning[] = [];

  for (const e of ruleResults) {
    if (e.result === "blocked") {
      violations.push({
        code: e.ruleCode,
        message: e.reason ?? "Blocked by policy",
        ruleCode: e.ruleCode,
        metadata: e.metadata,
      });
    } else if (e.result === "warning") {
      warnings.push({
        code: e.ruleCode,
        message: e.reason ?? "Policy warning",
        ruleCode: e.ruleCode,
      });
    }
  }

  const id = `pdc-${randomUUID()}`;
  const decision: PolicyDecision = {
    id,
    actionId: ctx.action.id,
    disposition,
    violations,
    warnings,
    evaluatedAt: new Date().toISOString(),
    ruleResults,
  };

  if (options?.logDecision !== false) {
    autonomyLog.policy("decision", {
      actionId: ctx.action.id,
      type: ctx.action.type,
      disposition,
      violationCount: violations.length,
    });
  }

  return decision;
}

/** Full autonomy run — all registered rules. */
export function evaluateActionPolicy(ctx: PolicyContext): PolicyDecision {
  return evaluatePolicyWithRules(ctx, allPolicyRuleEvaluators);
}

/**
 * Listing preview — four rules only (pricing guardrail, active listing, duplicate promotion, high-risk approval).
 * Evaluate-only; does not execute actions.
 */
export function evaluateListingPreviewPolicy(ctx: PolicyContext): PolicyDecision {
  return evaluatePolicyWithRules(ctx, listingPreviewPolicyRuleEvaluators, { logDecision: false });
}
