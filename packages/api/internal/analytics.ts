import type { AnalyticsInsight } from "./types";

export type AnalyticsServiceContext = {
  partnerId?: string;
};

/**
 * Aggregated insights for `/api/public/insights` — stub metrics.
 */
export async function getInsights(ctx: AnalyticsServiceContext): Promise<AnalyticsInsight[]> {
  return [
    {
      id: "insight_conversion",
      metric: "lead_to_tour_rate",
      value: 0.12,
      period: "30d",
      notes: "Illustrative — wire to warehouse / BI.",
    },
    {
      id: "insight_pipeline",
      metric: "active_deals",
      value: stubCount(ctx.partnerId),
      period: "current",
    },
  ];
}

function stubCount(partnerId?: string): number {
  return partnerId ? 7 : 3;
}
