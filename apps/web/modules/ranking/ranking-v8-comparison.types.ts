/**
 * V8 live vs shadow ranking comparison — read-only analytics types.
 */

export type RankingV8RankShiftRow = {
  listingId: string;
  liveRankIndex: number;
  shadowRankIndex: number;
  /** shadowRankIndex - liveRankIndex (positive ⇒ worse position if index 0 = top). */
  rankShift: number;
  absRankShift: number;
};

export type RankingV8ComparisonQualitySignals = {
  /** Shadow top-10 contains listings live ranked below this threshold (0-based index). */
  shadowPromotesBeyondLiveRank: string[];
  /** Live top-5 listings shadow ranks below this threshold (0-based index). */
  shadowDemotesLiveTop: string[];
  /** Heuristic: high average displacement or discordant pairs. */
  orderingInstabilityHint: boolean;
};

export type RankingV8ComparisonSummary = {
  overlapTop3: number;
  overlapTop5: number;
  overlapTop10: number;
  avgRankShift: number;
  /** Count of listings with |shift| ≥ significance threshold. */
  majorMovements: number;
  /** 0–1 (higher = closer orderings). */
  stabilityScore: number;
};

export type RankingV8ComparisonResult = {
  comparedCount: number;
  /** When live and shadow lists differ in membership, only common ids are compared. */
  intersectionSize: number;
  perListing: RankingV8RankShiftRow[];
  overlapTop3: number;
  overlapTop5: number;
  overlapTop10: number;
  agreementRateTop3: number;
  agreementRateTop5: number;
  agreementRateTop10: number;
  avgRankShift: number;
  maxAbsRankShift: number;
  /** Percent 0–100 of compared items with |shift| ≥ threshold. */
  pctMovedSignificantly: number;
  /** Kendall-like correlation in [-1, 1] on the common set (no ties handling). */
  kendallTauLike: number;
  qualitySignals: RankingV8ComparisonQualitySignals;
  summary: RankingV8ComparisonSummary;
};
