/**
 * Scenario-based action simulation — advisory only; not factual forecasts.
 * No automation, messaging, or payment side effects.
 */

export type SimulationActionCategory =
  | "broker_acquisition"
  | "demand_generation"
  | "supply_growth"
  | "conversion_fix"
  | "routing_shift"
  | "timing_focus"
  | "city_domination"
  | "retention_focus";

export type SimulationIntensity = "low" | "medium" | "high";

export type SimulationConfidence = "low" | "medium" | "high";

export type SimulationActionInput = {
  id: string;
  title: string;
  category: SimulationActionCategory;
  targetCity?: string;
  /** Internal broker id — never exposed on public surfaces; optional hint for routing scenarios. */
  targetBrokerId?: string;
  /** e.g. crm, routing, landing — free text bucket for operator context */
  targetSystem?: string;
  intensity: SimulationIntensity;
  windowDays: number;
  rationale?: string;
};

export type SimulationBaseline = {
  leads: number;
  brokers: number;
  listings: number;
  /** Derived from pipeline where sample allows; undefined if not computable without guessing. */
  conversionRate?: number;
  unlockRate?: number;
  /** Won / qualified meetings proxy when rows exist — advisory. */
  closeRate?: number;
  /** Illustrative revenue band from forecast — not cash truth. */
  revenueEstimate?: number;
  confidence: SimulationConfidence;
  warnings: string[];
};

export type PredictedDirection = "up" | "flat" | "down" | "uncertain";

export type PredictedMagnitude = "low" | "medium" | "high" | "unknown";

export type SimulationEffectEstimate = {
  metric: string;
  baselineValue?: number | string;
  predictedDirection: PredictedDirection;
  predictedMagnitude: PredictedMagnitude;
  confidence: SimulationConfidence;
  explanation: string;
};

export type SimulationOverall = "favorable" | "mixed" | "weak" | "insufficient_data";

export type SimulationOutcome = {
  actionId: string;
  overallRecommendation: SimulationOverall;
  overallConfidence: SimulationConfidence;
  effects: SimulationEffectEstimate[];
  risks: string[];
  assumptions: string[];
  generatedAt: string;
};

export type SimulationComparisonWinner = "actionA" | "actionB" | "none" | "insufficient_data";

export type SimulationComparison = {
  actionA: SimulationActionInput;
  actionB: SimulationActionInput;
  winner: SimulationComparisonWinner;
  rationale: string;
  confidence: SimulationConfidence;
};

/** Optional shared window for baseline rebuilds. */
export type ActionSimulationContext = {
  windowDays: number;
};
