import type { GrowthSignal, GrowthSignalType, GrowthSnapshot } from "../growth.types";

export type GrowthDetectorId =
  | "seo_gap"
  | "content_gap"
  | "low_conversion_page"
  | "high_intent_search"
  | "underexposed_cluster"
  | "high_performing_region"
  | "demand_supply"
  | "lead_dropoff"
  | "campaign_efficiency"
  | "trust_conversion"
  | "trend_reversal"
  | "stalled_funnel"
  | "repeat_dropoff_pattern";

export type GrowthDetector = {
  id: GrowthDetectorId;
  signalTypes: GrowthSignalType[];
  run: (snapshot: GrowthSnapshot) => GrowthSignal[];
};

export type GrowthDetectorContext = {
  snapshot: GrowthSnapshot;
};
