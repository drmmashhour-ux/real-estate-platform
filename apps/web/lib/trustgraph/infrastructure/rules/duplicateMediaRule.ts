import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";

const CODE = "duplicate_media";
const VERSION = "1";

/** Repository injects duplicate hashes found for this listing (cross-listing). */
export function evaluateDuplicateMediaRule(
  ctx: FsboListingRuleContext,
  opts?: { duplicateSha256AcrossOtherListings: string[] }
): RuleEvaluationResult {
  const dups = opts?.duplicateSha256AcrossOtherListings ?? [];
  if (dups.length === 0) {
    return {
      ruleCode: CODE,
      ruleVersion: VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 1,
      details: { checked: true, duplicates: 0 },
    };
  }

  return {
    ruleCode: CODE,
    ruleVersion: VERSION,
    passed: false,
    scoreDelta: -25,
    confidence: 0.95,
    details: { duplicateHashes: dups },
    signals: [
      {
        signalCode: `${CODE}_reuse`,
        signalName: "Duplicate media detected across listings",
        category: "fraud",
        severity: "critical",
        scoreImpact: -25,
        confidence: 0.95,
        evidence: { hashes: dups },
        message: "One or more photos match media used on another listing. Please verify authenticity.",
      },
    ],
    recommendedActions: [
      {
        actionCode: "replace_duplicate_media",
        title: "Replace duplicate photos",
        description: "Upload original photos of this property.",
        priority: "urgent",
        actorType: "user",
      },
    ],
  };
}
