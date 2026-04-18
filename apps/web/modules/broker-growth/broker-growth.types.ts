import type { BrokerKpiSnapshot, KpiWindow } from "../broker-kpis/broker-kpis.types";

export type GrowthWindow = KpiWindow;

export type BrokerGrowthListingMetrics = {
  activeResidentialListings: number;
  listingViews: number;
  listingSaves: number;
  listingInquiries: number;
  /** Inquiries / views when views &gt; 0; else null */
  listingInquiryRate: number | null;
  /** Saves / views when views &gt; 0; else null */
  listingSaveRate: number | null;
  /** Internal engagement index from `FsboListingMetrics` when rows exist (0–100 scale; not market performance). */
  listingMarketingEngagementIndexAvg: number | null;
  engagementSampleSize: number;
};

export type BrokerGrowthPipelineMetrics = {
  leadConversionRate: number | null;
  leadConversionSampleWon: number;
  leadConversionSampleLost: number;
  /** Negotiation proposals / max(active listings,1) in window — internal ratio, not a market claim */
  offerActivityRate: number | null;
};

export type BrokerGrowthVelocityMetrics = {
  avgTimeToFirstResponseHours: number | null;
  responseSampleSize: number;
  /**
   * Median days from deal creation to first `initial_offer` negotiation row in window (proxy for offer velocity; not legal acceptance timestamp).
   */
  avgTimeToAcceptedOfferDays: number | null;
  acceptedOfferSampleSize: number;
  /** From KPI closing group — days from deal open to close for deals closed in window */
  avgTimeToCloseDays: number | null;
  closeSampleSize: number;
  activeDealCount: number;
  blockedDealCount: number;
};

export type BrokerGrowthRevenueMetrics = {
  /** Sum of broker-share split lines on approved commission cases touched in window — estimate only */
  brokerRevenueEstimateCents: number | null;
  commissionCaseSampleSize: number;
};

export type BrokerGrowthReferralMetrics = {
  repeatClientLeadIndicator: number;
  referralAttributedLeads: number;
};

export type BrokerGrowthMetrics = {
  listings: BrokerGrowthListingMetrics;
  pipeline: BrokerGrowthPipelineMetrics;
  velocity: BrokerGrowthVelocityMetrics;
  revenue: BrokerGrowthRevenueMetrics;
  referral: BrokerGrowthReferralMetrics;
};

export type BrokerGrowthDashboardSnapshot = {
  kpi: BrokerKpiSnapshot;
  growth: BrokerGrowthMetrics;
  residentialScopeNote: string;
};

export type GrowthTimeseriesMetricId =
  | "new_leads"
  | "listing_views"
  | "listing_inquiries"
  | "closed_deals"
  | "broker_revenue_cents";

export type GrowthTimeseriesPayload = {
  metric: GrowthTimeseriesMetricId;
  window: GrowthWindow;
  points: { date: string; value: number }[];
  disclaimer: string;
};
