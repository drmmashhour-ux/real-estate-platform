export type GeoKey = {
  country?: string;
  region?: string;
  city?: string;
};

export type GeoPerformance = {
  geo: GeoKey;
  impressions: number;
  clicks: number;
  leads: number;
  bookings: number;
  revenue: number;
  spend: number;

  ctr: number;
  conversionRate: number;
  roas: number;
};

export type BudgetAllocation = {
  campaignId: string;
  recommendedBudget: number;
  currentBudget: number;
  adjustment: number;
  confidence: number;
  reason: string;
  /** True when volume thresholds met and ROAS is from observed spend + attributed revenue. */
  trusted: boolean;
};

export type UserSegment =
  | "NEW_VISITOR"
  | "RETURNING_USER"
  | "HIGH_INTENT"
  | "ABANDONED_BOOKING"
  | "HIGH_VALUE";

export type PersonalizedOffer = {
  segment: UserSegment;
  headline: string;
  cta: string;
  incentive?: string;
};

/** Raw rows before ratio math (e.g. from SQL or Prisma aggregates). */
export type GeoPerformanceRowInput = {
  geo: GeoKey;
  impressions: number;
  clicks: number;
  leads: number;
  bookings: number;
  revenue: number;
  spend: number;
};

export type CampaignBudgetInput = {
  id: string;
  budget: number;
  roas: number;
  clicks: number;
  impressions: number;
};

export type UserSegmentSignals = {
  bookingStarted?: boolean;
  bookingCompleted?: boolean;
  totalBookings?: number;
  lastVisit?: number;
  pagesViewed?: number;
};
