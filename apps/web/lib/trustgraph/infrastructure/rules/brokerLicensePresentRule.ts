import type { BrokerVerificationRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "BROKER_LICENSE_PRESENT_RULE";

export function evaluateBrokerLicensePresentRule(ctx: BrokerVerificationRuleContext): RuleEvaluationResult {
  const lic = (ctx.licenseNumber ?? "").trim();
  if (lic.length < 3) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -20,
      confidence: 1,
      details: { hasLicense: false },
      signals: [
        {
          signalCode: "BROKER_LICENSE_MISSING",
          signalName: "Broker license not provided",
          category: "identity",
          severity: "high",
          scoreImpact: -20,
          confidence: 1,
          evidence: {},
          message: "Enter your professional license number for verification.",
        },
      ],
      recommendedActions: [
        {
          actionCode: "UPLOAD_OR_ENTER_LICENSE_INFO",
          title: "Add license number",
          description: "Complete broker verification with a valid license number.",
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
    scoreDelta: 15,
    confidence: 0.95,
    details: { hasLicense: true },
  };
}
