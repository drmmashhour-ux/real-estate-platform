import type { ReadinessLevel, TrustLevel } from "@prisma/client";
import type { Phase5GrowthConfig } from "@/lib/trustgraph/config/phase5-growth";
import { getPhase5GrowthConfig } from "@/lib/trustgraph/config/phase5-growth";

export type ListingRankingInputs = {
  /** Normalized 0–1 score from existing ordering (featured + recency). */
  baseRankingScore: number;
  trustLevel: TrustLevel | null;
  readinessLevel: ReadinessLevel | null;
  /** 0–1 media completeness proxy (photos present). */
  mediaCompleteness: number;
  /** Seller declaration sections satisfied (0–1). */
  declarationCompleteness: number;
  /** Broker/co-list verification satisfied for listing (0–1). */
  brokerVerificationCompleteness: number;
};

export type ListingRankingResult = {
  baseRankingScore: number;
  trustBoostScore: number;
  finalRankingScore: number;
  rankingReasons: string[];
  publicBadgeReasons: string[];
};

function trustLevelFactor(tl: TrustLevel | null, w: Phase5GrowthConfig["ranking"]["trustLevelWeight"]): number {
  if (!tl) return w.low;
  switch (tl) {
    case "verified":
      return w.verified;
    case "high":
      return w.high;
    case "medium":
      return w.medium;
    default:
      return w.low;
  }
}

function readinessFactor(rl: ReadinessLevel | null, w: Phase5GrowthConfig["ranking"]["readinessWeight"]): number {
  if (!rl) return w.not_ready;
  switch (rl) {
    case "ready":
      return w.ready;
    case "partial":
      return w.partial;
    case "action_required":
      return w.action_required;
    default:
      return w.not_ready;
  }
}

/**
 * Conservative, explainable boost — linear blend capped by `maxTrustBoost`.
 */
export function computeListingRankingResult(input: ListingRankingInputs): ListingRankingResult {
  const cfg = getPhase5GrowthConfig().ranking;
  const tl = trustLevelFactor(input.trustLevel, cfg.trustLevelWeight);
  const rd = readinessFactor(input.readinessLevel, cfg.readinessWeight);
  const raw =
    tl * 0.55 +
    rd * 0.25 +
    input.mediaCompleteness * 0.1 +
    input.declarationCompleteness * 0.05 +
    input.brokerVerificationCompleteness * 0.05;

  const trustBoostScore = Math.min(cfg.maxTrustBoost, raw * cfg.maxTrustBoost);
  const finalRankingScore = input.baseRankingScore + trustBoostScore;

  const rankingReasons: string[] = [];
  if (input.trustLevel) rankingReasons.push(`trust_level:${input.trustLevel}`);
  if (input.readinessLevel) rankingReasons.push(`readiness:${input.readinessLevel}`);
  if (input.mediaCompleteness >= 0.9) rankingReasons.push("media_complete");
  if (input.declarationCompleteness >= 0.9) rankingReasons.push("declaration_complete");
  if (input.brokerVerificationCompleteness >= 0.9) rankingReasons.push("broker_profile_complete");

  const publicBadgeReasons: string[] = [];
  const copy = getPhase5GrowthConfig().publicBadgeCopy;
  if (input.trustLevel === "verified") publicBadgeReasons.push(copy.verifiedListing);
  else if (input.trustLevel === "high") publicBadgeReasons.push(copy.highTrust);
  if (input.mediaCompleteness >= 0.85 && input.declarationCompleteness >= 0.85) {
    publicBadgeReasons.push(copy.completeListing);
  }

  return {
    baseRankingScore: input.baseRankingScore,
    trustBoostScore,
    finalRankingScore,
    rankingReasons,
    publicBadgeReasons: [...new Set(publicBadgeReasons)],
  };
}
