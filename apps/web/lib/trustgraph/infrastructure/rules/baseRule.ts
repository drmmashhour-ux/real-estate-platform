import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export type ListingRuleEvaluator = (ctx: FsboListingRuleContext) => RuleEvaluationResult;

/**
 * Wraps a pure listing rule so `ruleVersion` defaults to {@link TRUSTGRAPH_RULE_VERSION} when empty.
 * Rules remain deterministic; no I/O here.
 */
export function withDefaultListingRuleVersion(evaluate: ListingRuleEvaluator): ListingRuleEvaluator {
  return (ctx) => {
    const out = evaluate(ctx);
    const ruleVersion = out.ruleVersion?.trim() ? out.ruleVersion : TRUSTGRAPH_RULE_VERSION;
    return { ...out, ruleVersion };
  };
}
