import { isReasonableEmail, isReasonablePhone } from "@/lib/fsbo/seller-declaration-validation";
import type { BrokerVerificationRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "BROKER_CONTACT_COMPLETENESS_RULE";

export function evaluateBrokerContactCompletenessRule(ctx: BrokerVerificationRuleContext): RuleEvaluationResult {
  const name = (ctx.displayName ?? "").trim();
  const email = ctx.email ?? "";
  const phone = ctx.phone ?? "";

  const issues: string[] = [];
  if (name.length < 2) issues.push("Display name is required.");
  if (!isReasonableEmail(email)) issues.push("Valid email is required.");
  if (!isReasonablePhone(phone)) issues.push("Valid phone number is required (10+ digits).");

  if (issues.length > 0) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -12,
      confidence: 0.95,
      details: { issues },
      signals: issues.map((msg, i) => ({
        signalCode: `${CODE}_${i}`,
        signalName: "Incomplete broker contact",
        category: "identity",
        severity: "medium",
        scoreImpact: -12,
        confidence: 0.95,
        evidence: {},
        message: msg,
      })),
      recommendedActions: [
        {
          actionCode: "COMPLETE_BROKER_CONTACT",
          title: "Complete contact profile",
          description: "Add name, email, and phone in your account profile.",
          priority: "high",
          actorType: "broker",
        },
      ],
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: 10,
    confidence: 0.9,
    details: { ok: true },
  };
}
