/** Where the lead originated in the product surface area */
export type LeadSourceChannel =
  | "LISTING_PAGE"
  | "BNHUB_BOOKING"
  | "MARKETING_CONTENT"
  | "LANDING_PAGE"
  | "FORM";

/** Declared or inferred primary intent */
export type LeadIntent = "BUYER" | "BROKER" | "INVESTOR" | "RENT";

/** Aggregated behavioral signals used for scoring */
export type BehaviorSignals = {
  listingViews?: number;
  listingIdsViewed?: string[];
  clickedCta?: boolean;
  marketingClick?: boolean;
  timeOnSiteSeconds?: number;
  repeatSession?: boolean;
};

/** Normalized intent strength */
export type IntentLevel = "LOW" | "MEDIUM" | "HIGH";

/** Routing destination bucket */
export type RouteTarget =
  | "BROKER"
  | "INTERNAL_SALES"
  | "INVESTOR_PIPELINE"
  | "AUTOMATED_FOLLOWUP";

export type RouteDecision = {
  target: RouteTarget;
  priority: "standard" | "high";
  /** When routing to brokers */
  brokerTier?: "top" | "pool";
  notes?: string;
};

/** Simple funnel stage for dashboard conversion metrics */
export type LeadLifecycle = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";

export type LeadRecord = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  intent: LeadIntent;
  source: LeadSourceChannel;
  /** e.g. listing id, campaign id, form id */
  sourceDetail?: string;
  capturedAtIso: string;
  lifecycle: LeadLifecycle;
  intentLevel: IntentLevel;
  route: RouteDecision;
  behaviors?: BehaviorSignals;
};

export type LeadDashboardStats = {
  totalLeads: number;
  newLeads: number;
  /** counts per channel */
  sourceBreakdown: Partial<Record<LeadSourceChannel, number>>;
  /** CONVERTED / total with terminal outcomes (CONVERTED + LOST), or 0 */
  conversionRate: number;
  /** CONVERTED / totalLeads — common marketing definition */
  winRateVsAll: number;
};
