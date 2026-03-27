import type { BrokerVerificationRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "BROKERAGE_INFO_PRESENT_RULE";

export function evaluateBrokerageInfoPresentRule(ctx: BrokerVerificationRuleContext): RuleEvaluationResult {
  const brokerage = (ctx.brokerageCompany ?? "").trim();
  if (brokerage.length < 2) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -10,
      confidence: 1,
      details: { hasBrokerage: false },
      signals: [
        {
          signalCode: `${CODE}_missing`,
          signalName: "Brokerage / agency name missing",
          category: "compliance",
          severity: "medium",
          scoreImpact: -10,
          confidence: 1,
          evidence: {},
          message: "Enter your brokerage or agency name.",
        },
      ],
      recommendedActions: [
        {
          actionCode: "ADD_BROKERAGE_INFO",
          title: "Add brokerage",
          description: "Provide the brokerage company name on your broker profile.",
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
    scoreDelta: 8,
    confidence: 0.95,
    details: { brokerage },
  };
}
