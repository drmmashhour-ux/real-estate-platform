export type HubKey =
  | "buyer"
  | "seller"
  | "rent"
  | "landlord"
  | "bnhub_guest"
  | "bnhub_host"
  | "broker"
  | "investor"
  | "admin";

export const HUB_KEYS: HubKey[] = [
  "buyer",
  "seller",
  "rent",
  "landlord",
  "bnhub_guest",
  "bnhub_host",
  "broker",
  "investor",
  "admin",
];

export function isHubKey(x: string): x is HubKey {
  return (HUB_KEYS as readonly string[]).includes(x);
}

export type HubJourneyStepStatus =
  | "locked"
  | "available"
  | "in_progress"
  | "completed"
  | "blocked";

export type HubJourneyStep = {
  id: string;
  hub: HubKey;
  order: number;
  title: string;
  description: string;
  why: string;
  status: HubJourneyStepStatus;
  route?: string;
  actionLabel?: string;
  prerequisites?: string[];
  blockers?: string[];
  completedAt?: string;
};

export type HubJourneyPlan = {
  hub: HubKey;
  title: string;
  description: string;
  steps: HubJourneyStep[];
  progressPercent: number;
  currentStepId?: string;
  nextStepId?: string;
  blockedStepIds: string[];
  createdAt: string;
};

export type HubCopilotSuggestion = {
  id: string;
  hub: HubKey;
  priority: "low" | "medium" | "high";
  title: string;
  explanation: string;
  suggestedAction: string;
  route?: string;
  basedOn: string[];
};

export type HubCopilotState = {
  hub: HubKey;
  currentStepTitle?: string;
  nextStepTitle?: string;
  suggestions: HubCopilotSuggestion[];
  blockers: string[];
  createdAt: string;
};

/** Read-only signals for journey resolution — no DB rows mutated. */
export type HubJourneyContext = {
  locale: string;
  country: string;
  userId?: string | null;
  /** Buyer */
  buyerCitySelected?: boolean;
  buyerBudgetSet?: boolean;
  buyerBrowseSessions?: number;
  buyerShortlistCount?: number;
  buyerContactedSeller?: boolean;
  buyerViewingScheduled?: boolean;
  buyerOfferStarted?: boolean;
  /** Seller */
  sellerListingStarted?: boolean;
  sellerDetailsComplete?: boolean;
  sellerPhotosCount?: number;
  sellerPricingViewed?: boolean;
  sellerPublished?: boolean;
  sellerInquiryCount?: number;
  sellerDealStage?: boolean;
  /** Rent (tenant) */
  rentCriteriaSet?: boolean;
  rentShortlistCount?: number;
  rentContacted?: boolean;
  rentVisitScheduled?: boolean;
  rentApplicationStarted?: boolean;
  /** Landlord */
  /** True when at least one long-term rental listing exists (any status). */
  landlordHasRentalListing?: boolean;
  landlordListingDraft?: boolean;
  landlordPhotosCount?: number;
  landlordPublished?: boolean;
  landlordLeadCount?: number;
  landlordResponded?: boolean;
  /** BNHub guest */
  bnGuestSearchDone?: boolean;
  bnGuestCompared?: boolean;
  bnGuestOpenedDetail?: boolean;
  bnGuestBookingStarted?: boolean;
  bnGuestBookingPaid?: boolean;
  bnGuestStayActive?: boolean;
  /** BNHub host */
  bnHostListingCreated?: boolean;
  bnHostPhotosCount?: number;
  bnHostPublished?: boolean;
  bnHostBookingCount?: number;
  bnHostLowConversion?: boolean;
  /** Broker */
  brokerProfileComplete?: boolean;
  brokerLeadsUnlocked?: number;
  brokerLeadsContacted?: number;
  brokerPipelineMoved?: boolean;
  brokerClosedCount?: number;
  /** Investor */
  investorGoalsSet?: boolean;
  investorBrowseCount?: number;
  investorInsightsViewed?: boolean;
  investorShortlistCount?: number;
  investorAnalysisRequested?: boolean;
  investorCompared?: boolean;
  /** Admin */
  adminDashboardVisited?: boolean;
  adminRevenueReviewed?: boolean;
  adminAlertsReviewed?: boolean;
  adminLeadQualityReviewed?: boolean;
  adminBnhubReviewed?: boolean;
  adminGrowthReviewed?: boolean;
  adminActionsExecuted?: boolean;
};
