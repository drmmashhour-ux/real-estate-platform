export type ScenarioKind = "optimistic" | "baseline" | "conservative";

export type ForecastMetricEstimate = {
  metric: string;
  baselineEstimate: number | null;
  optimisticEstimate: number | null;
  conservativeEstimate: number | null;
  unit: "count" | "cad_cents" | "hours" | "score";
  assumptions: string[];
  confidenceNotes: string[];
};

export type CompanyForecastPayload = {
  generatedAt: string;
  windowDays: number;
  isEstimate: true;
  metrics: ForecastMetricEstimate[];
  disclaimer: string;
};
