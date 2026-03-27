import { freePlanPhotoMax, isFreeSellerPlan } from "@/lib/trustgraph/config/listing-rules-config";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "FREE_PLAN_PHOTO_LIMIT_RULE";

export function evaluateFreePlanPhotoLimitRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  if (!isFreeSellerPlan(ctx.sellerPlan)) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 1,
      details: { skipped: true, reason: "not_free_plan" },
    };
  }

  const max = freePlanPhotoMax(ctx.sellerPlan);
  const count = ctx.images?.length ?? 0;

  if (count > max) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -12,
      confidence: 1,
      details: { count, max, sellerPlan: ctx.sellerPlan },
      signals: [
        {
          signalCode: `${CODE}_over_limit`,
          signalName: "Free plan photo limit exceeded",
          category: "compliance",
          severity: "high",
          scoreImpact: -12,
          confidence: 1,
          evidence: { count, max },
          message: `This listing has ${count} photos; the free plan allows ${max}.`,
        },
      ],
      recommendedActions: [
        {
          actionCode: "TRIM_OR_UPGRADE_PHOTOS",
          title: "Reduce photos or upgrade",
          description: "Remove extra images or upgrade your seller plan.",
          priority: "high",
          actorType: "user",
        },
      ],
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: true,
    scoreDelta: 2,
    confidence: 1,
    details: { count, max },
  };
}
