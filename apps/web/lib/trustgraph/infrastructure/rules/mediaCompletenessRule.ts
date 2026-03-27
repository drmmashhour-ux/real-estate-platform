import { getFsboMaxPhotosForSellerPlan } from "@/lib/fsbo/photo-limits";
import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

const CODE = "media_completeness";
const VERSION = "1";

function parseTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string").map((t) => t.toUpperCase());
}

export function evaluateMediaCompletenessRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const max = getFsboMaxPhotosForSellerPlan(ctx.sellerPlan);
  const count = ctx.images?.length ?? 0;
  const tags = parseTags(ctx.photoTagsJson);
  const hasExteriorTag = tags.includes("EXTERIOR") || (tags[0] === "EXTERIOR" && count > 0);

  const overLimit = count > max;

  if (overLimit) {
    return {
      ruleCode: CODE,
      ruleVersion: VERSION,
      passed: false,
      scoreDelta: -12,
      confidence: 1,
      details: { count, max, sellerPlan: ctx.sellerPlan },
      signals: [
        {
          signalCode: `${CODE}_plan_limit`,
          signalName: "Photo count exceeds plan limit",
          category: "compliance",
          severity: "high",
          scoreImpact: -12,
          confidence: 1,
          evidence: { count, max },
          message: `This listing has ${count} photos but the current plan allows ${max}.`,
        },
      ],
      recommendedActions: [
        {
          actionCode: "upgrade_or_trim_photos",
          title: "Upgrade or remove extra photos",
          description: "Trim gallery to plan limits or upgrade your seller plan.",
          priority: "high",
          actorType: "user",
        },
      ],
    };
  }

  if (count === 0) {
    return {
      ruleCode: CODE,
      ruleVersion: VERSION,
      passed: false,
      scoreDelta: -20,
      confidence: 1,
      details: { count: 0 },
      signals: [
        {
          signalCode: `${CODE}_no_photos`,
          signalName: "No listing photos",
          category: "media",
          severity: "critical",
          scoreImpact: -20,
          confidence: 1,
          evidence: {},
          message: "Add at least one exterior photo for verification eligibility.",
        },
      ],
    };
  }

  if (!hasExteriorTag) {
    return {
      ruleCode: CODE,
      ruleVersion: VERSION,
      passed: false,
      scoreDelta: -12,
      confidence: 0.9,
      details: { tags },
      signals: [
        {
          signalCode: `${CODE}_no_exterior`,
          signalName: "Missing exterior-tagged photo",
          category: "media",
          severity: "high",
          scoreImpact: -12,
          confidence: 0.9,
          evidence: { tags },
          message: "Tag the first photo as Exterior (required for trust verification).",
        },
      ],
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: VERSION,
    passed: true,
    scoreDelta: 8,
    confidence: 0.9,
    details: { count, max, hasExteriorTag: true },
  };
}
