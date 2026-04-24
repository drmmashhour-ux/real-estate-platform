/**
 * Post-exit capital overview — educational / planning only. No performance guarantees.
 */

export const ALLOCATION_CATEGORIES = ["startups", "real_estate", "public_markets", "cash_reserve"] as const;

export type AllocationCategory = (typeof ALLOCATION_CATEGORIES)[number];

export type WealthRiskProfile = "conservative" | "balanced" | "aggressive";

/**
 * All amounts in major currency units (e.g. USD) unless you standardize elsewhere.
 * `allocatedCapital` = capital already deployed across tracked sleeves (subset of total).
 */
export type CapitalProfile = {
  currency: string;
  totalCapital: number;
  liquidCapital: number;
  allocatedCapital: number;
  riskProfile: WealthRiskProfile;
  notes?: string;
};

export type TrackedInvestment = {
  id: string;
  /**
   * Optional venture / holding label to group multiple positions (e.g. “StudioCo”, “PropCo Alpha”).
   * Empty = unassigned — still tracked at portfolio level.
   */
  ventureName?: string;
  label: string;
  category: AllocationCategory;
  /** Committed or marked value in same units as `CapitalProfile`. */
  amountCommitted: number;
  /**
   * Illustrative cumulative return % (user-entered for learning scenarios only).
   * Not audited, not guaranteed, not advice.
   */
  illustrativeReturnPct?: number;
  asOf?: string;
};

export type CategoryAllocationPct = Record<AllocationCategory, number>;

export type AllocationSuggestion = {
  /** Target weights (0–1) summing to ~1 — customizable baseline by risk band. */
  targetWeights: CategoryAllocationPct;
  /** Plain-language themes for discussion, not instructions to buy/sell. */
  themes: string[];
};

export type RedeploymentSuggestion = {
  title: string;
  detail: string;
  relatedCategories: AllocationCategory[];
};

/** Roll-up for multi-venture portfolio views (informational). */
export type VentureRollup = {
  ventureName: string;
  positionCount: number;
  totalCommitted: number;
  /** Amount-weighted illustrative return when any row has `illustrativeReturnPct`. */
  illustrativeReturnPct: number | null;
  /** Committed amount per allocation category within this venture. */
  byCategory: Record<AllocationCategory, number>;
};
