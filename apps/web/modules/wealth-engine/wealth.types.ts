/**
 * Educational wealth-planning types — scenario-based only, not investment advice.
 * All weights are 0–1 fractions of total wealth unless noted.
 */

export const ALLOCATION_BUCKET_KEYS = [
  "CASH_RESERVE",
  "OPERATING_VENTURES",
  "PRIVATE_INVESTMENTS",
  "REAL_ESTATE",
  "PUBLIC_MARKETS",
  "OPPORTUNISTIC_CAPITAL",
] as const;

export type AllocationBucketKey = (typeof ALLOCATION_BUCKET_KEYS)[number];

export type RiskBand = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE" | "CUSTOM";

/** Single strategic bucket with optional user labels and book values. */
export type AllocationBucket = {
  key: AllocationBucketKey;
  /** UI label override; defaults come from bucket key. */
  label?: string;
  /** Target strategic weight (0–1). Configurable; engine may suggest alternatives. */
  targetWeight: number;
  /** Observed / self-reported current weight (0–1). */
  currentWeight: number;
  /** Optional book value in minor units (e.g. cents) for display. */
  currentAmountCents?: number;
  notes?: string;
};

export type LiquidityProfile = {
  /**
   * Months of essential spending the cash reserve could cover (self-reported denominator).
   * Educational metric only — not a recommendation.
   */
  monthsOfReserveCoverage: number;
  /** Share of total wealth considered realizable within ~30 days (0–1). */
  liquidFraction: number;
  liquidityNotes?: string;
};

export type ReinvestmentStep = {
  priority: number;
  bucketKey: AllocationBucketKey;
  /** Suggested flow toward this bucket from a hypothetical liquidity event (minor units). */
  suggestedAmountCents?: number;
  /** Illustrative shift in strategic weight (not a mandate). */
  suggestedWeightDelta?: number;
  label: string;
};

export type ReinvestmentPlan = {
  id: string;
  generatedAt: string;
  steps: ReinvestmentStep[];
  /** Plain-language, non-prescriptive notes. */
  rationaleNotes: string[];
};

export type WealthProfile = {
  id: string;
  label: string;
  riskBand: RiskBand;
  /** Self-reported total in minor units (e.g. cents). */
  totalWealthCents: number;
  buckets: AllocationBucket[];
  liquidity: LiquidityProfile;
  /** Optional: weight in one operating company / venture (0–1). */
  primaryVentureWeight?: number;
  /** Optional: region or market label for geographic concentration awareness. */
  primaryMarketRegion?: string;
  dependencyNotes?: string;
  /** When CUSTOM, these weights are authoritative targets for comparisons. */
  customTargetsByBucket?: Partial<Record<AllocationBucketKey, number>>;
};

export type AllocationComparisonRow = {
  bucketKey: AllocationBucketKey;
  targetWeight: number;
  currentWeight: number;
  gap: number;
};

export type OverconcentrationFlag = {
  bucketKey: AllocationBucketKey;
  severity: "WATCH" | "ELEVATED";
  message: string;
};

export type WealthScenarioMode = "CONSERVATIVE" | "BALANCED" | "AGGRESSIVE";

export type WealthScenario = {
  mode: WealthScenarioMode;
  /** Explicit scenario assumptions — illustrative only. */
  assumptions: string[];
  /** Describes how emphasis might shift vs baseline — not a forecast. */
  allocationImpacts: {
    bucketKey: AllocationBucketKey;
    illustrativeShiftDescription: string;
  }[];
  /** Qualitative resilience themes for discussion / planning. */
  resilienceNotes: string[];
};

export type PreservationSnapshot = {
  liquidityRunwayMonths: number;
  liquidFraction: number;
  concentrationFlags: OverconcentrationFlag[];
  /** Qualitative downside sensitivity tied to risk band + structure — not a stress-test result. */
  downsideSensitivityLabel: "LOWER" | "MODERATE" | "HIGHER";
  downsideSensitivityNotes: string[];
  dependencyOnSingleCompany: boolean;
  dependencyOnSingleMarket: boolean;
  dependencyNotes: string[];
};
