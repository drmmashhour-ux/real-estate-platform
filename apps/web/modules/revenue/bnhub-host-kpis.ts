/**
 * Stable entrypoints for BNHub stay revenue KPIs (Booking-backed, UTC windows).
 * Implementation: `modules/bnhub-revenue/*`.
 */

export type {
  ListingRevenueMetrics,
  PortfolioRevenueMetrics,
} from "../bnhub-revenue/bnhub-revenue.types";

export {
  getListingRevenueMetrics,
  getPortfolioRevenueMetrics,
  getRevenueDashboardSummary,
  type RangeInput,
} from "../bnhub-revenue/bnhub-revenue-dashboard.service";

export { getDailyRevenueTrend, type DailyRevenueTrendRow } from "../bnhub-revenue/bnhub-revenue-trend.service";

export { getPricingImpactSummary } from "../bnhub-revenue/bnhub-pricing-impact.service";

export { createRevenueSnapshotsForHost } from "../bnhub-revenue/bnhub-revenue-snapshot.service";

export { detectRevenueAnomalies, type RevenueAnomalyEvent } from "../bnhub-revenue/bnhub-revenue-anomaly.service";

export {
  addUtcDays,
  bnhubUtcWindowInclusiveEnd,
  round2,
  safeDivide,
  startOfUtcDay,
} from "../bnhub-revenue/bnhub-revenue-math";
