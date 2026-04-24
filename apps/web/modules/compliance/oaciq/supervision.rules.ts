import type { ComplianceCaseContext, ComplianceRule, ComplianceRuleResult } from "@/modules/compliance/core/rule-types";

function r(
  id: string,
  passed: boolean,
  severity: ComplianceRuleResult["severity"],
  code: string,
  title: string,
  message: string,
  blocking?: boolean,
): ComplianceRuleResult {
  return { ruleId: id, passed, severity, code, title, message, blocking };
}

export const supervisionRules: ComplianceRule[] = [
  {
    id: "executive_supervision_for_high_risk_trust",
    category: "supervision",
    evaluate(ctx) {
      if (ctx.metadata?.agencyOperation !== true) return null;
      if (ctx.metadata?.highRiskTrustEvent !== true) return null;
      const ok = ctx.metadata.executiveSupervisionLogged === true;
      return r(
        "executive_supervision_for_high_risk_trust",
        ok,
        ok ? "low" : "high",
        "SUP_TRUST_HIGH",
        "Executive supervision — trust",
        ok ? "Executive supervision recorded for high-risk trust event." : "Log executive review for high-risk trust movement.",
        !ok,
      );
    },
  },
  {
    id: "solo_self_accountability_ack",
    category: "supervision",
    evaluate(ctx) {
      if (ctx.metadata?.soloBroker !== true) return null;
      const ok = ctx.metadata.soloSelfAccountabilityAck === true;
      return r(
        "solo_self_accountability_ack",
        ok,
        ok ? "low" : "medium",
        "SUP_SOLO_ACK",
        "Solo broker accountability",
        ok
          ? "Solo broker acknowledged self-accountability for compliance outcomes."
          : "Record solo broker self-accountability acknowledgment for supervised workflows.",
        false,
      );
    },
  },
];
