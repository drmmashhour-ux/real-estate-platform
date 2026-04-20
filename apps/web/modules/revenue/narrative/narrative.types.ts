/**
 * Shapes for the rules-based (non-LLM) revenue narrative. Persisted as JSON on
 * `BnhubDashboardNarrativeSnapshot` (factsJson, risksJson, opportunitiesJson).
 */
export type NarrativeFact = {
  label: string;
  value: string;
  direction?: "up" | "down" | "flat";
  explanation?: string;
};

export type NarrativeRisk = {
  severity: "low" | "medium" | "high";
  message: string;
};

export type NarrativeOpportunity = {
  priority: "low" | "medium" | "high";
  message: string;
};

export type NarrativeSummary = {
  headline: string;
  overview: string;
  facts: NarrativeFact[];
  risks: NarrativeRisk[];
  opportunities: NarrativeOpportunity[];
  closing: string;
};

/** Numeric slice used by the rules engine (matches BNHub portfolio/listing aggregates). */
export type NarrativeMetricsSlice = {
  grossRevenue: number;
  bookingCount: number;
  occupancyRate: number;
  adr: number;
  revpar: number;
  occupiedNights?: number;
  availableNights?: number;
};
