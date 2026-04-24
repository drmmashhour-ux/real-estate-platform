/**
 * Green search & ranking (LECIPM) — types only.
 * Does not represent official Rénoclimat or government labels.
 */

export type GreenSearchFilters = {
  /** Minimum LECIPM / Québec-style performance band (GREEN = strongest). */
  minimumGreenLabel?: "GREEN" | "IMPROVABLE" | "LOW";
  /** Minimum current Québec-inspired score (0–100) when available. */
  minimumQuebecScore?: number;
  /** Meaningful projected uplift vs current when data exists. */
  hasUpgradePotential?: boolean;
  /** Minimum projected score after sensible upgrades. */
  minimumProjectedScore?: number;
  /** Minimum (projected − current) when both exist. */
  minimumScoreDelta?: number;
  /** At least one illustrative / matched incentive path. */
  hasPotentialIncentives?: boolean;
  /** Minimum **illustrative** total $ from matched grant hints (not a guarantee). */
  minimumEstimatedIncentives?: number;
  showOnlyEfficientHeating?: boolean;
  showOnlyHighInsulation?: boolean;
  showOnlyHighWindowPerformance?: boolean;
  showSolarOnly?: boolean;
  showGreenRoofOnly?: boolean;
};

/**
 * Per-listing search decoration — safe for null fields when data is missing.
 */
export type GreenSearchResultDecoration = {
  currentScore: number | null;
  projectedScore: number | null;
  scoreDelta: number | null;
  /** LECIPM performance band (not a government label). */
  label: "GREEN" | "IMPROVABLE" | "LOW" | null;
  /** Underlying factor-model label (Québec ESG) when available. */
  quebecLabel: string | null;
  improvementPotential: "high" | "medium" | "low" | null;
  hasPotentialIncentives: boolean;
  /** Illustrative total from grant hints; never a commitment. */
  estimatedIncentives: number | null;
  /** Suggested 1.x multiplier for internal ranking; assistive. */
  rankingBoostSuggestion: number | null;
  /** Broker / admin only — never shown verbatim on public cards without review. */
  brokerCallouts: string[];
  disclaimers: string[];
  rationale: string[];
  /** Derived flags for property-component filters. */
  efficientHeating: boolean | null;
  highInsulation: boolean | null;
  highWindowPerformance: boolean | null;
  hasSolar: boolean | null;
  hasGreenRoof: boolean | null;
  /** True when a persisted Québec ESG / metadata snapshot was read. */
  usedSnapshot: boolean;
  /** True when scores were filled via on-the-fly evaluation. */
  computedOnTheFly: boolean;
};

export type GreenOpportunityBucket = "top_current" | "upgrade" | "incentives" | "mixed" | "unknown";

export type GreenRankingSortMode =
  | "green_best_now"
  | "green_upgrade_potential"
  | "green_incentive_opportunity"
  | "standard_with_green_boost";

export type GreenRankingInput<T = unknown> = {
  items: T[];
  /** key -> decoration (or null) */
  decorationById: Map<string, GreenSearchResultDecoration | null>;
  /** get stable id from item */
  getId: (item: T) => string;
  /** 0..1 base relevance (optional) */
  getBaseScore?: (item: T) => number | null;
  sortMode: GreenRankingSortMode;
  /** Lighter public blending vs internal broker use. */
  audience: "public" | "internal";
};

export type GreenRankingSignal = {
  currentScore: number | null;
  projectedScore: number | null;
  scoreDelta: number | null;
  label: string | null;
  improvementPotential: "high" | "medium" | "low" | null;
  incentiveStrength: "high" | "medium" | "low" | null;
  rankingBoostSuggestion: number | null;
  rationale: string[];
};

export type PublicListingGreenPayload = {
  currentScore: number | null;
  projectedScore: number | null;
  scoreDelta: number | null;
  label: "GREEN" | "IMPROVABLE" | "LOW" | null;
  /** Québec factor-model label when available (not a government program label). */
  quebecLabel: string | null;
  improvementPotential: "high" | "medium" | "low" | null;
  /** Illustrative; verify with official programs. */
  estimatedIncentives: number | null;
  rationale: string[];
  /** Always include when any score is shown. */
  disclaimer: string;
};
