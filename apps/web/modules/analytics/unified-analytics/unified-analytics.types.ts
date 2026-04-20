import type { PlatformRole } from "@prisma/client";

/** Who is viewing — drives field visibility and filters. */
export type UnifiedAnalyticsView = "full" | "investor" | "operator";

export type UnifiedAnalyticsRangePreset = "7d" | "30d" | "90d";

export type TimeSeriesPoint = { date: string; value: number };

export type FunnelStep = { id: string; label: string; count: number };

export type UnifiedAnalyticsKpis = {
  totalUsers: number;
  activeUsers: number;
  leadsGenerated: number;
  conversionRate: number;
  /** 0–1 */
  revenueCents: number;
  revenuePerLeadCents: number | null;
  cacCents: number | null;
  ltvCents: number | null;
  churnRate: number | null;
  /** 0–100 aggregate */
  leadQualityScore: number | null;
};

export type UnifiedAnalyticsForecast = {
  revenueNext30DaysCents: number;
  growthTrendPct: number;
  demandSpikeRisk: "low" | "medium" | "high";
};

export type UnifiedAnalyticsAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
};

export type UnifiedAnalyticsInsight = {
  id: string;
  text: string;
  category: "conversion" | "geo" | "pricing" | "volume" | "health";
};

export type UnifiedAnalyticsPayload = {
  generatedAt: string;
  range: { preset: UnifiedAnalyticsRangePreset; from: string; toExclusive: string };
  view: UnifiedAnalyticsView;
  role: PlatformRole;
  kpis: UnifiedAnalyticsKpis;
  revenueSeries: TimeSeriesPoint[];
  growthSeries: TimeSeriesPoint[];
  /** Leads per day */
  leadSeries: TimeSeriesPoint[];
  funnel: FunnelStep[];
  forecast: UnifiedAnalyticsForecast;
  insights: UnifiedAnalyticsInsight[];
  alerts: UnifiedAnalyticsAlert[];
  notes: string[];
};
