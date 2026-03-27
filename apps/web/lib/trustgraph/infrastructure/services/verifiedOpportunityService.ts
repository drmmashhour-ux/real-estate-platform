import type { ReadinessLevel, TrustLevel } from "@prisma/client";
import { getPhase5GrowthConfig } from "@/lib/trustgraph/config/phase5-growth";

const TL_ORDER: Record<TrustLevel, number> = {
  low: 0,
  medium: 1,
  high: 2,
  verified: 3,
};

export type VerifiedOpportunityClassification = {
  isVerifiedOpportunity: boolean;
  /** Safe investor-facing labels only */
  filterTags: string[];
  /** Internal-only codes for admin dashboards */
  internalCodes: string[];
};

export function classifyVerifiedOpportunity(args: {
  caseRow: {
    overallScore: number | null;
    trustLevel: TrustLevel | null;
    readinessLevel: ReadinessLevel | null;
  } | null;
}): VerifiedOpportunityClassification {
  const cfg = getPhase5GrowthConfig().investorOpportunity;
  const c = args.caseRow;
  if (!c) {
    return {
      isVerifiedOpportunity: false,
      filterTags: [],
      internalCodes: ["no_case"],
    };
  }

  const scoreOk = (c.overallScore ?? 0) >= cfg.minTrustScoreForVerifiedOpportunity;
  const minTl = cfg.minTrustLevel;
  const tlOk = c.trustLevel != null && TL_ORDER[c.trustLevel] >= TL_ORDER[minTl];
  const readinessOk =
    !cfg.requireNoActionRequiredReadiness || c.readinessLevel !== "action_required";

  const isVerifiedOpportunity = scoreOk && tlOk && readinessOk;

  const filterTags: string[] = [];
  if (isVerifiedOpportunity) filterTags.push("Verified Opportunity");
  if (c.trustLevel === "verified" || c.trustLevel === "high") filterTags.push("High Trust Listings");
  if (c.readinessLevel === "ready" || c.readinessLevel === "partial") filterTags.push("Complete Documentation");
  if (c.readinessLevel === "ready") filterTags.push("Ready for Review");

  const internalCodes: string[] = [];
  if (scoreOk) internalCodes.push("score_threshold");
  if (tlOk) internalCodes.push("trust_level_threshold");
  if (readinessOk) internalCodes.push("readiness_gate");

  return {
    isVerifiedOpportunity,
    filterTags: [...new Set(filterTags)],
    internalCodes,
  };
}
