/**
 * Expansion market inputs — **optional fields are never invented**; omit or null when unknown.
 * Numeric 0–1 fields are normalized **internal telemetry** (see builder), not census or third-party TAM.
 */

export type MarketRiskLevel = "low" | "medium" | "high" | "critical";

/** Single candidate market for scoring. */
export type Market = {
  /** Display name (e.g. from `City.name`). */
  city: string;
  /** ISO country hint (e.g. `City.country`). */
  country: string;
  /** LECIPM city slug when sourced from `lecipm_cities`. */
  citySlug?: string;
  /** Platform city row id when available. */
  cityId?: string;
  /** Population — only when supplied via config/override; never estimated here. */
  population?: number | null;
  /**
   * Short-term stay **booking velocity** proxy (0–1), from BNHub `booking` 90d counts — not literal “tourism”.
   */
  tourismDemand?: number | null;
  /** Lead + listing activity proxy (0–1), from platform counts. */
  realEstateActivity?: number | null;
  /**
   * Competitive saturation proxy (0–1), **higher = more crowded** (more hosts/listings per heuristic).
   */
  competitionLevel?: number | null;
  /**
   * Regulatory / launch-friction proxy (0–1), **higher = harder** (staged launch, profile flags).
   */
  regulatoryComplexity?: number | null;
  /** Revenue traction proxy (0–1), from confirmed booking totals 90d. */
  revenuePotential?: number | null;
  /** Traceability — which internal tables/metrics fed each field. */
  dataProvenance: string[];
  /** LECIPM city `status` when known: testing | active. */
  launchStatus?: string | null;
};

/** Configurable weights (must sum to 1 when all factors used; partial inputs renormalize). */
export type ExpansionScoringWeights = {
  demand: number;
  competition: number;
  regulation: number;
  revenuePotential: number;
};

export type MarketFactorBreakdown = {
  label: string;
  weightNominal: number;
  weightEffective: number;
  /** Raw 0–1 input used (null = missing, excluded from denominator). */
  input: number | null;
  /** Contribution to weighted sum before final scale. */
  contribution: number;
  note: string;
};

export type MarketScoreResult = {
  /** 0–100 opportunity score; null if no usable inputs. */
  score: number | null;
  breakdown: MarketFactorBreakdown[];
  dataCoverage: number;
  weightsApplied: ExpansionScoringWeights;
};

export type RankedMarket = {
  market: Market;
  score: MarketScoreResult;
  rank: number;
};

export type ExpansionRecommendation = {
  /** Highest-scoring market with sufficient coverage; null if none. */
  bestCity: Market | null;
  reasoning: string[];
  riskLevel: MarketRiskLevel;
  ranked: RankedMarket[];
  weights: ExpansionScoringWeights;
  advisoryOnly: true;
  generatedAt: string;
};
