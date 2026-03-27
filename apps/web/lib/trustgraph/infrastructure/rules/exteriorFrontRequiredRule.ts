import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "EXTERIOR_FRONT_REQUIRED_RULE";

function parseTags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string").map((t) => t.toUpperCase());
}

export function evaluateExteriorFrontRequiredRule(ctx: FsboListingRuleContext): RuleEvaluationResult {
  const tags = parseTags(ctx.photoTagsJson);
  const hasExterior = tags.includes("EXTERIOR") || (tags.length > 0 && tags[0] === "EXTERIOR");
  const count = ctx.images?.length ?? 0;

  if (count === 0) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 1,
      details: { skipped: true, reason: "no_photos_handled_elsewhere" },
    };
  }

  if (!hasExterior) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: false,
      scoreDelta: -12,
      confidence: 0.9,
      details: { tags },
      signals: [
        {
          signalCode: "MISSING_EXTERIOR_PHOTO",
          signalName: "No exterior-tagged photo",
          category: "media",
          severity: "high",
          scoreImpact: -12,
          confidence: 0.9,
          evidence: { tags },
          message: "Tag at least one photo as Exterior (front / curb) for trust verification.",
        },
      ],
      recommendedActions: [
        {
          actionCode: "UPLOAD_EXTERIOR_FRONT_PHOTO",
          title: "Tag exterior photo",
          description: "Mark the primary exterior or street-facing image as Exterior.",
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
    scoreDelta: 6,
    confidence: 0.9,
    details: { hasExterior: true },
  };
}
