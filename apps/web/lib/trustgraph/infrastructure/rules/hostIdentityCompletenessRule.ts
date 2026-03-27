import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export type HostIdentityRuleContext = {
  name: string | null;
  email: string | null;
  phone: string | null;
};

export function evaluateHostIdentityCompletenessRule(ctx: HostIdentityRuleContext): RuleEvaluationResult {
  const hasName = (ctx.name ?? "").trim().length > 1;
  const hasEmail = (ctx.email ?? "").includes("@");
  const hasPhone = (ctx.phone ?? "").replace(/\D/g, "").length >= 7;
  const passed = hasName && hasEmail && hasPhone;
  return {
    ruleCode: "HOST_IDENTITY_COMPLETENESS_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed,
    scoreDelta: passed ? 6 : -8,
    confidence: 1,
    details: { hasName, hasEmail, hasPhone },
  };
}
