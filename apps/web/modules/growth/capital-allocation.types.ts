/**
 * Capital allocation — advisory prioritization only; no payments or automated spend.
 */

export type CapitalAllocationBucketId =
  | "city_execution"
  | "city_expansion"
  | "broker_acquisition"
  | "conversion_optimization"
  | "hold";

export type CapitalAllocationBucket = {
  id: CapitalAllocationBucketId;
  label: string;
  description: string;
};

export type EffortLevel = "low" | "medium" | "high";

export type CapitalAllocationRecommendation = {
  bucket: CapitalAllocationBucket;
  /** City name or system anchor e.g. `system:brokers`, `system:conversion`. */
  target: string;
  priorityScore: number;
  /** Relative share across this plan’s recommendations (sums ≈ 1 when present). */
  allocationShare?: number;
  effortLevel: EffortLevel;
  confidence: "low" | "medium" | "high";
  rationale: string;
  supportingSignals: string[];
  risks: string[];
  warnings: string[];
};

export type CapitalAllocationPlan = {
  recommendations: CapitalAllocationRecommendation[];
  topFocusAreas: string[];
  deprioritizedAreas: string[];
  insights: string[];
  generatedAt: string;
};
