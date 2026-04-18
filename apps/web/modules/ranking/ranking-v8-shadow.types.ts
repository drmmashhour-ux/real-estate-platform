/**
 * V8 shadow ranking — types only. Live ordering and production scores are unchanged.
 */

export type RankingV8ShadowDiffRow = {
  listingId: string;
  liveRankIndex: number;
  /** Production ranking score (0–100 scale when present). */
  liveScore: number | null;
  /** Parallel shadow formula score (same scale). */
  shadowScore: number | null;
  /** shadowScore - liveScore when both finite. */
  delta: number | null;
  /** 0–1 heuristic agreement signal (higher = closer scores). */
  confidence: number;
  reasons: string[];
};

/** Phase C influence snapshot (no listing payloads). */
export type RankingV8ShadowInfluenceMeta = {
  applied: boolean;
  monitorOnly: boolean;
  skippedReason?: string;
  boostsApplied: number;
  downranksApplied: number;
  swapsSkipped: number;
  observationalWarnings: string[];
  reasonSummary: string;
};

export type RankingV8ShadowEvaluationSummary = {
  evaluatedAt: string;
  queryFingerprint: string;
  listingCount: number;
  cappedTo: number;
  rows: RankingV8ShadowDiffRow[];
  aggregate: {
    meanAbsDelta: number;
    maxAbsDelta: number;
  };
  influence?: RankingV8ShadowInfluenceMeta;
};
