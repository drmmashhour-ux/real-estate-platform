import type { FsboListingRuleContext, ListingRuleRunOptions, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { evaluateComplianceRulesetRequirementRule } from "@/lib/trustgraph/infrastructure/rules/complianceRulesetRequirementRule";

export function collectPhase8ListingRuleResults(
  ctx: FsboListingRuleContext,
  _opts: ListingRuleRunOptions
): RuleEvaluationResult[] {
  if (!ctx.phase8?.enabled) {
    return [];
  }
  return [evaluateComplianceRulesetRequirementRule(ctx)];
}
