/**
 * Unified analytics engine — re-exports for stable import path (`@/modules/analytics/analytics.service`).
 */

export { computeUnifiedAnalytics, parseUnifiedRange } from "./unified-analytics/analytics.service";
export type {
  UnifiedAnalyticsPayload,
  UnifiedAnalyticsRangePreset,
  UnifiedAnalyticsView,
  UnifiedAnalyticsKpis,
  UnifiedAnalyticsForecast,
  UnifiedAnalyticsInsight,
  UnifiedAnalyticsAlert,
  TimeSeriesPoint,
  FunnelStep,
} from "./unified-analytics/unified-analytics.types";
