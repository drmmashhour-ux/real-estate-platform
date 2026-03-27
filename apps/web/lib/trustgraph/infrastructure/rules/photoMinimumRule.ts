import {
  MIN_PHOTOS_FOR_VERIFICATION,
} from "@/lib/trustgraph/config/listing-rules-config";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "PHOTO_MINIMUM_RULE";

export function evaluatePhotoMinimumRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const count = ctx.images?.length ?? 0;
  if (count < MIN_PHOTOS_FOR_VERIFICATION) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -15,
      confidence: 1,
      details: { count, minRequired: MIN_PHOTOS_FOR_VERIFICATION },
      signals: [
        {
          signalCode: `${CODE}_under_min`,
          signalName: "Below minimum photo count",
          category: "media",
          severity: "high",
          scoreImpact: -15,
          confidence: 1,
          evidence: { count },
          message: `Add at least ${MIN_PHOTOS_FOR_VERIFICATION} photo(s) for verification eligibility.`,
        },
      ],
      recommendedActions: [
        {
          actionCode: "ADD_LISTING_PHOTOS",
          title: "Add photos",
          description: "Upload the minimum number of listing photos.",
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
    scoreDelta: 4,
    confidence: 0.95,
    details: { count },
  };
}
