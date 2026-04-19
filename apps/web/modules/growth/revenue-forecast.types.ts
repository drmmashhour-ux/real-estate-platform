/**
 * Revenue forecast — illustrative ranges only; not bookings, not Stripe, not guarantees.
 */

export type ForecastConfidence = "low" | "medium" | "high";

export type ForecastMomentum = "up" | "flat" | "down";

export type RevenueForecastPipeline = {
  leads: number;
  qualified: number;
  meetings: number;
  /** Conservative joint probability estimate 0–1 when sample allows; otherwise null. */
  closingProbability: number | null;
};

export type RevenueForecastRevenue = {
  /** Central scenario in platform currency units (CAD where values exist). */
  expectedRevenue: number | null;
  conservativeEstimate: number | null;
  optimisticEstimate: number | null;
};

export type RevenueForecastTrend = {
  growthRate: number | null;
  momentum: ForecastMomentum;
};

export type RevenueForecastRisk = {
  dropOffRisk: "low" | "medium" | "high";
  executionRisk: "low" | "medium" | "high";
  dataRisk: "low" | "medium" | "high";
};

export type RevenueForecast = {
  windowDays: number;
  pipeline: RevenueForecastPipeline;
  revenue: RevenueForecastRevenue;
  trend: RevenueForecastTrend;
  risk: RevenueForecastRisk;
  meta: {
    confidence: ForecastConfidence;
    warnings: string[];
    insufficientData: boolean;
    avgDealValueSource: string;
  };
};
