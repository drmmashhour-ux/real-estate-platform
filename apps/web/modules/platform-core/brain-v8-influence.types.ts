/**
 * Brain V8 Phase C — presentation-layer influence only (not authoritative).
 */

export type BrainV8InfluenceTag = "boost" | "caution" | "monitor" | "none";

export type BrainV8ComparisonQuality = {
  weakComparison: boolean;
  sampleSize: number;
  meanAbsDelta: number;
  insufficientRatio: number;
  reviewRatio: number;
};

export type BrainV8InfluenceLayer = {
  enabled: boolean;
  applied: boolean;
  skippedReason?: string;
  tagsByDecisionId: Record<string, BrainV8InfluenceTag>;
  stats: {
    boosted: number;
    caution: number;
    monitor: number;
    skipped: number;
    influenced: number;
  };
  warnings: string[];
};
