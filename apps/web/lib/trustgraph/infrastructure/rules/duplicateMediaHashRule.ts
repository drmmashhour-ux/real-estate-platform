import type { FsboListingRuleContext, RuleEvaluationResult } from "@/lib/trustgraph/domain/types";
import { TRUSTGRAPH_RULE_VERSION } from "@/lib/trustgraph/config";

const CODE = "DUPLICATE_MEDIA_HASH_RULE";

export function evaluateDuplicateMediaHashRule(
  _ctx: FsboListingRuleContext,
  opts: {
    duplicateSha256AcrossOtherListings: string[];
    duplicateSha256WithinListing: string[];
    /** Same gallery URL repeated (deterministic when fingerprints are unique per row). */
    duplicateImageUrlsWithinListing?: string[];
  }
): RuleEvaluationResult {
  const cross = opts.duplicateSha256AcrossOtherListings ?? [];
  const within = opts.duplicateSha256WithinListing ?? [];
  const urlDupes = (opts.duplicateImageUrlsWithinListing ?? []).filter((u) => (u ?? "").trim().length > 0);

  if (cross.length === 0 && within.length === 0 && urlDupes.length === 0) {
    return {
      ruleCode: CODE,
      ruleVersion: TRUSTGRAPH_RULE_VERSION,
      passed: true,
      scoreDelta: 0,
      confidence: 1,
      details: { checked: true },
    };
  }

  const severity = cross.length > 0 ? ("critical" as const) : ("medium" as const);
  const score = cross.length > 0 ? -22 : -6;

  const crossListing = cross.length > 0;
  const sameListingIssue = !crossListing && (within.length > 0 || urlDupes.length > 0);

  return {
    ruleCode: CODE,
    ruleVersion: TRUSTGRAPH_RULE_VERSION,
    passed: false,
    scoreDelta: score,
    confidence: crossListing ? 0.95 : 0.75,
    details: {
      crossListingHashes: cross,
      withinListingHashes: within,
      duplicateImageUrlsWithinListing: urlDupes,
    },
    signals: [
      {
        signalCode: crossListing
          ? "DUPLICATE_MEDIA_ACROSS_LISTINGS"
          : sameListingIssue
            ? "DUPLICATE_MEDIA_SAME_LISTING"
            : "DUPLICATE_MEDIA_SAME_LISTING",
        signalName: crossListing
          ? "Duplicate media across listings"
          : "Duplicate media in same listing",
        category: crossListing ? "fraud" : "quality",
        severity,
        scoreImpact: score,
        confidence: crossListing ? 0.95 : 0.75,
        evidence: { cross, within, urlDupes },
        message: crossListing
          ? "One or more photos match media used on another listing — verify authenticity."
          : within.length > 0
            ? "Duplicate image fingerprints detected within this listing gallery."
            : "The same image URL appears more than once in the gallery — remove duplicates.",
      },
    ],
    recommendedActions: crossListing
      ? [
          {
            actionCode: "ADMIN_REVIEW_DUPLICATE_MEDIA",
            title: "Review duplicate media",
            description: "Replace duplicate photos with originals of this property.",
            priority: "urgent",
            actorType: "admin",
          },
        ]
      : [
          {
            actionCode: "REMOVE_DUPLICATE_UPLOADS",
            title: "Remove duplicate uploads",
            description: "Avoid uploading the same file multiple times.",
            priority: "medium",
            actorType: "user",
          },
        ],
  };
}
