/** UI-ready models for luxury / mobile dashboards — no Prisma types leak upward. */

export type RiskLevelLabel = "Low" | "Medium" | "High";

export interface InvestorLuxuryDashboardModel {
  stats: {
    portfolioValueDisplay: string;
    monthlyRevenueDisplay: string;
    roiDisplay: string;
    revenueAtRiskDisplay: string;
    protectedValueDisplay: string;
  };
  portfolio: Array<{
    id: string;
    name: string;
    location: string;
    revenueDisplay: string;
    occupancyDisplay: string;
    roiDisplay: string;
    risk: RiskLevelLabel;
  }>;
  opportunities: Array<{
    id: string;
    area: string;
    label: string;
    upsideDisplay: string;
  }>;
  alerts: string[];
  /** False when scenarios/items are empty — UI may show onboarding hints. */
  hasPortfolioData: boolean;
}

export interface RevenueDashboardData {
  todayRevenueCents: number;
  sevenDayAverageCents: number;
  highestHubLabel: string;
  transactions: number;
  revenueByHub: Array<{
    hubKey: string;
    hubLabel: string;
    amountCents: number;
    deltaPctVsPriorDay: number | null;
  }>;
  series: Array<{ date: string; revenueCents: number }>;
}

export interface MovementRowVm {
  id: string;
  timeLabel: string;
  typeLabel: string;
  hubLabel: string;
  detail: string;
  hubSlug: string | null;
  deepLink: string | null;
}

export interface MovementsDashboardData {
  movements: MovementRowVm[];
}

export interface BuyerDashboardData {
  savedHomesCount: number;
  savedSearchesCount: number;
  listingViewsLast30d: number;
  alertsEnabledCount: number;
}

/** Luxury Buyer Hub shell — curated cards from Prisma (no mock listings). */
export interface BuyerLuxuryDashboardData {
  stats: {
    savedHomesCount: number;
    savedSearchesCount: number;
    newMatchesWeek: number;
    priceAlertsWeek: number;
    visitsPlanned: number;
    discoveryAlertsActive: number;
    listingViewsLast30d: number;
  };
  recommendations: Array<{
    id: string;
    title: string;
    location: string;
    priceDisplay: string;
    imageUrl: string;
    listingHref: string;
  }>;
  savedHomes: Array<{
    id: string;
    title: string;
    statusLine: string;
    priceDisplay: string;
  }>;
  alerts: string[];
}

export interface SellerDashboardData {
  listingsOwned: number;
  publishedListings: number;
  pendingReview: number;
}

export interface SellerLuxuryDashboardData {
  stats: {
    listingsOwned: number;
    publishedListings: number;
    pendingReview: number;
    leadsTotal: number;
    viewsLast30d: number;
    documentsIncomplete: number;
  };
  listings: Array<{
    id: string;
    title: string;
    statusLabel: string;
    priceDisplay: string;
    views30d: number;
  }>;
  leads: Array<{
    id: string;
    listingId: string;
    contactName: string;
    interestLine: string;
    propertyTitle: string;
  }>;
}

export interface BrokerDashboardData {
  activeLeads: number;
  brokerClients: number;
  paidLeadUnlocksLifetime: number;
  /** Sum of unlocked lead ticket prices (BrokerLead.price) for open pipeline stages. */
  pipelineValueCents: number;
}

export interface AdminDashboardSummaryData {
  revenueTodayCents: number;
  bookingsToday: number;
  leadsToday: number;
  newUsersToday: number;
  riskAlertsApprox: number;
}
