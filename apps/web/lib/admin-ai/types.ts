import type {
  AdminAiEntityType,
  AdminAiInsightPriority,
  AdminAiInsightType,
} from "@prisma/client";

/**
 * Normalized platform signals for admin AI (ground-truth JSON).
 * All numbers must come from DB queries — generators must not invent metrics.
 */

export type AdminAiInsightPayload = {
  type: AdminAiInsightType;
  title: string;
  body: string;
  priority: AdminAiInsightPriority;
  entityType?: AdminAiEntityType | null;
  entityId?: string | null;
  metadataJson?: Record<string, unknown>;
};

export type PlatformSignalsWindow = {
  label: string;
  start: string;
  end: string;
};

export type PlatformSignalsTraffic = {
  visitors: number;
  visitorsPrevWeek: number;
  /** Distinct session_id on analytics_events in window (approx). */
  analyticsSessions: number;
  pageViews: number;
  sourceBreakdown: { source: string; count: number }[];
  /** Sum of listing analytics views or buyer listing views — best-effort. */
  listingViewsApprox: number;
};

export type PlatformSignalsConversion = {
  contactClicks: number;
  visitRequests: number;
  bookingStarts: number;
  paymentCompletions: number;
  savesApprox: number;
};

export type PlatformSignalsUsers = {
  newBuyers7d: number;
  newSellers7d: number;
  selfSellers: number;
  brokerAssisted: number;
  investors: number;
  shortStayHostsOrBnhub: number;
  documentHelpBnhub: number;
  documentHelpFsboListings: number;
  oaciqBrokerLicensePending: number;
  brokerTaxPending: number;
};

export type PlatformSignalsListings = {
  highTrafficLowConversion: {
    listingId: string;
    kind: "FSBO" | "CRM" | "BNHUB";
    views: number;
    contacts: number;
    demandScore?: number;
  }[];
  missingPhotos: { id: string; kind: "fsbo" | "crm" | "bnhub"; title: string | null }[];
  weakDescriptions: { id: string; kind: "fsbo" | "crm"; title: string | null; charCount: number }[];
  newlyActive7d: number;
  trendingByDemand: { listingId: string; kind: "FSBO" | "CRM" | "BNHUB"; demandScore: number }[];
};

export type PlatformSignalsRevenue = {
  totalCents7d: number;
  totalCentsPrev7d: number;
  byPaymentType7d: { paymentType: string; cents: number }[];
  /** Heuristic labels over payment_type strings. */
  bnhubBookingCents7d: number;
  listingFeesCents7d: number;
  brokerLeadFeesCents7d: number;
  featuredOrPromotionCents7d: number;
  topListingEarners: {
    key: string;
    listingId: string;
    kind: "crm" | "fsbo";
    label: string;
    cents: number;
  }[];
};

export type PlatformSignalsSupport = {
  paymentFailures7d: number;
  formSubmissions7d: number;
  formSubmissionsPrev7d: number;
};

export type PlatformSignalsFunnelStep = {
  name: string;
  count7d: number;
  countPrev7d: number;
};

export type PlatformSignals = {
  generatedAt: string;
  window: PlatformSignalsWindow;
  comparisonWindow: PlatformSignalsWindow;
  inventory: {
    fsboNonDraftCount: number;
  };
  traffic: PlatformSignalsTraffic;
  conversion: PlatformSignalsConversion;
  users: PlatformSignalsUsers;
  listings: PlatformSignalsListings;
  revenue: PlatformSignalsRevenue;
  support: PlatformSignalsSupport;
  funnel: PlatformSignalsFunnelStep[];
};
