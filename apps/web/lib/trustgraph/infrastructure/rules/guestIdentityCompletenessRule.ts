import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateGuestIdentityCompletenessRule(ctx: {
  email: string;
  name: string | null;
  phone: string | null;
}): RuleEvaluationResult {
  const emailOk = ctx.email.includes("@");
  const nameOk = (ctx.name ?? "").trim().length > 1;
  const phoneOk = (ctx.phone ?? "").replace(/\D/g, "").length >= 7;
  const passed = emailOk && nameOk && phoneOk;
  return {
    ruleCode: "GUEST_IDENTITY_COMPLETENESS_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed,
    scoreDelta: passed ? 6 : -6,
    confidence: 1,
    details: { emailOk, nameOk, phoneOk },
  };
}
