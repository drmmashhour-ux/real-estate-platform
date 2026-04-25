/**
 * BNHub host growth — re-exports for dashboards and experiments.
 * Advisory only; never auto-applies listing or pricing changes.
 */

export {
  aggregateMonthlyBookingMetrics,
  averageOccupancyHighPercent,
  buildGrowthAlerts,
  buildGrowthInsightsForListing,
  computeHostGrowthLevel,
  estimatePortfolioOccupancyPercent,
  growthInsightActionHref,
  hostGrowthLevelCopy,
  medianPeerNightPriceCents,
  pickPerformanceRow,
  revenueTrendDirection,
  type CompetitorSnapshot,
  type GrowthAlert,
  type GrowthInsight,
  type HostGrowthLevel,
  type HostGrowthListingInput,
  type MonthlyBookingMetric,
} from "@/lib/bnhub/host-growth-engine";
