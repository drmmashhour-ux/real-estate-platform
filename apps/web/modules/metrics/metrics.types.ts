/**
 * Command Center metrics — all values are internal DB aggregates unless marked `estimate`.
 */

export type TimeWindowPreset = "daily" | "weekly" | "monthly" | "custom";

export type MetricsSegment = {
  city?: string;
  neighborhood?: string;
  propertyType?: string;
  priceMinCents?: number;
  priceMaxCents?: number;
  /** Narrow event/user queries where supported */
  userRole?: "guest" | "host" | "broker" | "investor" | "admin";
  /** Product slice */
  listingChannel?: "fsbo_sale" | "bnhub_stay" | "crm_listing";
};

export type MetricsDateRange = {
  from: Date;
  toExclusive: Date;
  preset?: TimeWindowPreset;
};

export type TrafficMetrics = {
  totalUsers: number;
  newUsersInRange: number;
  /** When null, sessions are not modeled separately from daily visitor rollup */
  returningUsersEstimate: number | null;
  returningUsersNote: string | null;
  /** Sum of `platform_analytics.visitors` for each UTC day in range */
  sessionDaysRollup: number;
  sessionDaysNote: string;
};

export type MarketplaceMetrics = {
  activeListingsTotal: number;
  activeFsbo: number;
  activeBnhubStays: number;
  activeCrmListings: number;
  newListingsInRange: number;
  listingGrowthRate: number | null;
  listingGrowthNote: string;
};

export type EngagementMetrics = {
  listingImpressions: number;
  listingClicks: number;
  listingSaves: number;
  shares: number;
  ctr: number;
  ctrNote: string;
};

export type ConversionMetrics = {
  inquiries: number;
  bookingStarts: number;
  bookingsCompleted: number;
  visitToClickRate: number | null;
  clickToInquiryRate: number | null;
  inquiryToBookingRate: number | null;
  conversionNote: string;
};

export type SupplyDemandAreaRow = {
  city: string;
  activeListings: number;
  views7d: number;
  saves7d: number;
  ratio: number;
  ratioNote: string;
};

export type SupplyDemandMetrics = {
  topAreas: SupplyDemandAreaRow[];
  supplyDemandNote: string;
  /** Alias for cards that expect a single headline area */
  note?: string;
};

export type RevenueMetrics = {
  platformFeesCents: number;
  featuredRevenueCents: number;
  subscriptionRevenueCents: number;
  bnhubCommissionCents: number;
  totalRevenueCents: number;
  revenueNote: string;
};

export type CoreMetricsBundle = {
  range: { from: string; toExclusive: string };
  segment: MetricsSegment;
  traffic: TrafficMetrics;
  marketplace: MarketplaceMetrics;
  engagement: EngagementMetrics;
  conversion: ConversionMetrics;
  supplyDemand: SupplyDemandMetrics;
  revenue: RevenueMetrics;
  dataQualityNotes: string[];
};

/** Chart point for Recharts executive surfaces */
export type MetricSeriesPoint = { date: string; value: number };

/** Narrow shape for `ExecutiveSummary` and legacy executive cards */
export type MetricsSnapshot = {
  traffic: { newUsers: number };
  revenue: { totalRealizedCents: number; currency: string };
  engagement: { listingImpressions: number };
};

export function toMetricsSnapshot(m: CoreMetricsBundle): MetricsSnapshot {
  return {
    traffic: { newUsers: m.traffic.newUsersInRange },
    revenue: { totalRealizedCents: m.revenue.totalRevenueCents, currency: "CAD" },
    engagement: { listingImpressions: m.engagement.listingImpressions },
  };
}
