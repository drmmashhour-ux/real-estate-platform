import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";
import { MIN_LISTING_PHOTOS_FOR_VERIFICATION } from "@/lib/bnhub/moderation-requirements";
import type { RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

export function evaluateShortTermListingQualityRule(ctx: {
  title: string;
  description: string | null;
  photoCount: number;
  houseRules: string | null;
}): RuleEvaluationResult {
  const titleOk = ctx.title.trim().length >= 8;
  const descOk = (ctx.description ?? "").trim().length >= 40;
  const photosOk = ctx.photoCount >= MIN_LISTING_PHOTOS_FOR_VERIFICATION;
  const rulesOk = (ctx.houseRules ?? "").trim().length >= 10;
  const passed = titleOk && descOk && photosOk && rulesOk;
  return {
    ruleCode: "SHORT_TERM_LISTING_QUALITY_RULE",
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed,
    scoreDelta: passed ? 8 : -4,
    confidence: 1,
    details: { titleOk, descOk, photosOk, rulesOk, photoCount: ctx.photoCount },
  };
}
